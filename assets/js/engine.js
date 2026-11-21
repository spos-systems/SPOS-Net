'use strict';
/**
 * SPOS Net — measurement engine (zero dependencies).
 *
 * All measurements run inside the browser against Cloudflare's public,
 * CORS-enabled speed endpoints:
 *   GET  https://speed.cloudflare.com/__down?bytes=N   (download)
 *   POST https://speed.cloudflare.com/__up             (upload)
 *   GET  https://speed.cloudflare.com/meta             (server/client info)
 *
 * Methodology (similar to mainstream speed tests):
 *  - Latency/jitter: sequential tiny requests, first probe used as warm-up.
 *  - Packet loss: batches of concurrent tiny requests; failure/timeout = lost.
 *  - Download/upload: parallel adaptive streams; final speed is computed over
 *    the measurement window with the connection ramp-up discarded.
 *  - Latency under load: small probes fired while the line is saturated.
 */
const SposEngine = (() => {

  const BASE = 'https://speed.cloudflare.com';
  const downUrl = (bytes) => `${BASE}/__down?bytes=${bytes}&r=${Math.random().toFixed(10)}`;
  const UP_URL = `${BASE}/__up`;

  const MAX_DOWN_CHUNK = 50e6;   // 50 MB per request
  const MAX_UP_CHUNK = 20e6;     // 20 MB per request
  const DISCARD_MS = 1500;       // ramp-up discarded from the average

  /* ---------- plumbing ---------- */

  const controllers = new Set();

  function newController() {
    const c = new AbortController();
    controllers.add(c);
    c.signal.addEventListener('abort', () => controllers.delete(c));
    return c;
  }

  function abortAll() {
    for (const c of [...controllers]) { try { c.abort(); } catch (e) { /* noop */ } }
    controllers.clear();
  }

  async function fetchWithTimeout(url, opts = {}, ms = 8000) {
    const c = newController();
    const timer = setTimeout(() => c.abort(), ms);
    try {
      return await fetch(url, { ...opts, signal: c.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const median = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };

  /* ---------- meta / connection info ---------- */

  async function getMeta() {
    // Primary: the meta endpoint (may answer {} for datacenter IPs)
    try {
      const r = await fetchWithTimeout(`${BASE}/meta`, { cache: 'no-store' }, 5000);
      const j = await r.json();
      if (j && (j.clientIp || j.colo)) return j;
    } catch (e) { /* fall through */ }
    // Fallback: exposed cf-meta-* headers of a tiny download
    try {
      const r = await fetchWithTimeout(downUrl(10), { cache: 'no-store' }, 5000);
      const h = (k) => r.headers.get(k);
      const meta = {
        clientIp: h('cf-meta-ip'),
        colo: h('cf-meta-colo'),
        city: h('cf-meta-city'),
        country: h('cf-meta-country'),
        asn: h('cf-meta-asn'),
        httpProtocol: 'HTTPS',
      };
      return meta.clientIp ? meta : null;
    } catch (e) {
      return null;
    }
  }

  /* ---------- latency & packet loss ---------- */

  async function probeRTT(timeout = 5000) {
    const t0 = performance.now();
    const r = await fetchWithTimeout(downUrl(0), { cache: 'no-store' }, timeout);
    await r.arrayBuffer(); // consume body
    return performance.now() - t0;
  }

  async function runLatency({ samples = 12, gap = 90, onSample } = {}) {
    await probeRTT().catch(() => {}); // warm-up: DNS + TLS + congestion window
    const rtts = [];
    for (let i = 0; i < samples; i++) {
      try {
        const ms = await probeRTT();
        rtts.push(ms);
        if (onSample) onSample(ms, rtts);
      } catch (e) { /* a lost probe counts in packet loss, not latency */ }
      await sleep(gap);
    }
    if (!rtts.length) throw new Error('LATENCY_FAILED');
    const sorted = [...rtts].sort((a, b) => a - b);
    const avg = rtts.reduce((s, v) => s + v, 0) / rtts.length;
    let jit = 0;
    for (let i = 1; i < rtts.length; i++) jit += Math.abs(rtts[i] - rtts[i - 1]);
    jit = rtts.length > 1 ? jit / (rtts.length - 1) : 0;
    return { min: sorted[0], max: sorted[sorted.length - 1], avg, jitter: jit, samples: rtts };
  }

  async function runLoss({ batches = 6, perBatch = 10, batchGap = 260, timeout = 4000, onProgress } = {}) {
    let sent = 0, failed = 0;
    for (let b = 0; b < batches; b++) {
      const jobs = [];
      for (let i = 0; i < perBatch; i++) {
        jobs.push(
          fetchWithTimeout(downUrl(0), { cache: 'no-store' }, timeout)
            .then(r => { r.arrayBuffer().catch(() => {}); sent++; })
            .catch(() => { sent++; failed++; })
        );
      }
      await Promise.all(jobs);
      if (onProgress) onProgress(sent, failed);
      if (b < batches - 1) await sleep(batchGap);
    }
    return { sent, failed, loss: sent ? (failed / sent) * 100 : 0 };
  }

  /* ---------- transfer core (download & upload) ---------- */

  // 1 MB of real random data, reused to build larger payloads cheaply.
  const POOL = (() => {
    const buf = new Uint8Array(1 << 20);
    for (let i = 0; i < buf.length; i += 65536) {
      crypto.getRandomValues(buf.subarray(i, Math.min(i + 65536, buf.length)));
    }
    return buf;
  })();

  function uploadPayload(size) {
    const parts = [];
    let remaining = size;
    while (remaining > 0) {
      const n = Math.min(remaining, POOL.length);
      parts.push(POOL.subarray(0, n));
      remaining -= n;
    }
    // text/plain keeps the request "simple" (no CORS preflight needed)
    return new Blob(parts, { type: 'text/plain' });
  }

  async function transfer({ duration, streams, onTick, onLatency, mode }) {
    const t0 = performance.now();
    let bytes = 0;
    const marks = [{ t: 0, b: 0 }];
    let peakBps = 0;
    const loadRtts = [];
    let stopped = false;

    const stop = () => { stopped = true; abortAll(); };
    const timer = setTimeout(stop, duration);

    // Latency probes while the line is saturated (bufferbloat view)
    const latLoop = (async () => {
      while (!stopped) {
        await sleep(800);
        if (stopped) break;
        try { loadRtts.push(await probeRTT(4000)); if (onLatency) onLatency(loadRtts); } catch (e) { /* aborted */ }
      }
    })();

    const speedNow = () => {
      const now = performance.now() - t0;
      let i = marks.length - 1;
      while (i > 0 && now - marks[i - 1].t < 1000) i--;
      const dt = (now - marks[i].t) / 1000 || 1e-6;
      return ((bytes - marks[i].b) * 8) / dt;
    };

    const ticker = setInterval(() => {
      const now = performance.now() - t0;
      marks.push({ t: now, b: bytes });
      if (marks.length > 700) marks.splice(0, 350);
      const bps = speedNow();
      if (bps > peakBps) peakBps = bps;
      if (onTick) onTick(bps / 1e6, now);
    }, 120);

    let downChunk = 2e6;   // start small, adapt per stream
    let upChunk = 1.5e6;

    async function downWorker() {
      while (!stopped) {
        const size = downChunk;
        try {
          const r = await fetchWithTimeout(downUrl(size), { cache: 'no-store' }, 45000);
          if (!r.ok) throw new Error('HTTP_' + r.status);
          const tReq = performance.now();
          if (r.body && r.body.getReader) {
            const reader = r.body.getReader();
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              bytes += value.length;
            }
          } else {
            const buf = await r.arrayBuffer();
            bytes += buf.byteLength;
          }
          const elapsed = (performance.now() - tReq) / 1000;
          if (elapsed > 0.2) {
            const streamBps = (size * 8) / elapsed;
            downChunk = Math.max(2e6, Math.min(MAX_DOWN_CHUNK, (streamBps * 4) / 8));
          }
        } catch (e) {
          if (stopped) break;
          downChunk = Math.max(5e5, downChunk / 2);
          await sleep(250);
        }
      }
    }

    function upWorker() {
      return new Promise((resolveWorker) => {
        const step = () => {
          if (stopped) return resolveWorker();
          const size = Math.round(upChunk);
          const xhr = new XMLHttpRequest();
          const c = newController();
          const tReq = performance.now();
          let last = 0;
          const cleanup = () => { clearTimeout(hardTimer); try { controllers.delete(c); } catch (e) {} };
          const hardTimer = setTimeout(() => { try { xhr.abort(); } catch (e) {} }, 45000);

          xhr.open('POST', UP_URL + '?r=' + Math.random().toFixed(10), true);
          xhr.timeout = 45000;
          const onAbort = () => { try { xhr.abort(); } catch (e) {} };
          c.signal.addEventListener('abort', onAbort);

          xhr.upload.onprogress = (e) => { bytes += e.loaded - last; last = e.loaded; };
          xhr.onload = () => {
            bytes += Math.max(0, size - last);
            cleanup();
            const elapsed = (performance.now() - tReq) / 1000;
            if (elapsed > 0.2 && xhr.status >= 200 && xhr.status < 300) {
              const streamBps = (size * 8) / elapsed;
              upChunk = Math.max(5e5, Math.min(MAX_UP_CHUNK, (streamBps * 4) / 8));
            }
            step();
          };
          const fail = () => { cleanup(); upChunk = Math.max(3e5, upChunk / 2); if (stopped) return resolveWorker(); setTimeout(step, 250); };
          xhr.onerror = fail;
          xhr.ontimeout = fail;
          xhr.onabort = () => { cleanup(); resolveWorker(); };

          xhr.send(uploadPayload(size));
        };
        step();
      });
    }

    const workers = [];
    for (let i = 0; i < streams; i++) {
      workers.push(mode === 'down' ? downWorker() : upWorker());
    }
    await Promise.all(workers);
    stopped = true;
    clearTimeout(timer);
    clearInterval(ticker);
    await sleep(150); // let final progress events land

    const endT = (performance.now() - t0);
    marks.push({ t: endT, b: bytes });

    // Discard the ramp-up window for the final average
    let base = null;
    for (const m of marks) { if (m.t >= DISCARD_MS) { base = m; break; } }
    if (!base || (endT - base.t) < 400) base = marks[0];

    const dtSec = Math.max(0.001, (endT - base.t) / 1000);
    const avgBps = ((bytes - base.b) * 8) / dtSec;

    if (bytes === 0) throw new Error('TRANSFER_FAILED');

    return {
      mbps: avgBps / 1e6,
      peakMbps: peakBps / 1e6,
      loadedLatency: median(loadRtts),
      transferredMB: bytes / 1e6,
      durationMs: endT,
    };
  }

  function runDownload(opts = {}) {
    return transfer({ duration: 9000, streams: 5, mode: 'down', ...opts });
  }

  function runUpload(opts = {}) {
    return transfer({ duration: 8000, streams: 3, mode: 'up', ...opts });
  }

  return { getMeta, runLatency, runLoss, runDownload, runUpload, abortAll, downUrl };
})();
