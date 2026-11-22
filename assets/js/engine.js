/* SPOS Net — measurement engine (zero dependencies)
 *
 * Backend: public Cloudflare speed endpoints (CORS-enabled, anycast):
 *   GET  https://speed.cloudflare.com[__down]?bytes=N
 *   POST https://speed.cloudflare.com[__up]
 *   GET  https://speed.cloudflare.com/meta
 *
 * Accuracy model (v2.2 — multi-connection, same approach as leading test apps):
 *   Browsers multiplex same-origin requests over ONE HTTP/2 connection, so all
 *   streams share a single TCP congestion window — on long or lossy paths that
 *   caps throughput far below the line's real capacity. Cloudflare also serves
 *   the same endpoints on alternate HTTPS ports (2053/2083/2087/2096/8443).
 *   Each (host, port) pair is a separate origin for the browser's connection
 *   pool, so spreading streams across ports gives us up to 6 independent TCP
 *   connections — like opening several connections to a test server.
 *
 *   Download: parallel fetch readers (byte-accurate streaming), 25 MiB chunks.
 *   Upload: parallel XHRs with upload.onprogress — bytes are counted the
 *   moment they hit the wire, not when the request completes.
 *   Both phases: clock starts at the FIRST byte, ramp-up excluded, sustained
 *   average over the stable window, best 500 ms window as peak.
 *   Connections are warmed (TLS) during the latency phase.
 */

const BASE = 'https://speed.cloudflare.com';
const PORTS = [443, 2053, 2083, 2087, 2096, 8443];
const PORT_TIMEOUT = 3200;

const PING_SAMPLES = 12;
const PING_GAP_MS = 150;
const PING_TIMEOUT = 3500;

const LOSS_PROBES = 24;
const LOSS_CONCURRENCY = 6;
const LOSS_TIMEOUT = 2800;

const DL_CHUNK = 26214400;              // 25 MiB per request
const UL_START = 4 << 20;               // 4 MiB, adaptive
const UL_MAX = 16 << 20;                // 16 MiB
const UL_MIN = 512 << 10;               // 512 KiB
const UL_PORT_SPAN = 4;                 // upload streams spread across ≤ 4 ports

const RAMP_MIN_MS = 1100;               // excluded after first byte
const RAMP_RATIO = 0.16;                // …or 16% of phase, whichever is larger

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export class Engine {
  constructor(hooks = {}) {
    this.h = hooks;
    this.ctrl = null;
    this.running = false;
    this._payload = null;
    this._xhrs = new Set();
    this.ports = [443];
  }

  origin(port) { return port === 443 ? BASE : `${BASE}:${port}`; }

  stop() {
    if (this.ctrl) this.ctrl.abort();
    for (const x of this._xhrs) { try { x.abort(); } catch { /* noop */ } }
    this._xhrs.clear();
  }

  /* ── connection meta ─────────────────────────────────────── */
  async fetchMeta(signal) {
    try {
      const r = await fetch(`${BASE}/meta`, { cache: 'no-store', signal });
      if (r.ok) {
        const j = await r.json();
        if (j && j.clientIp) {
          const colo = typeof j.colo === 'object' ? j.colo : { iata: j.colo, city: j.city };
          return {
            ip: j.clientIp, asn: j.asn, org: j.asOrganization,
            country: j.country, city: j.city, colo: colo?.iata || '',
            coloCity: colo?.city || j.city || '', proto: j.httpProtocol || '',
          };
        }
      }
    } catch { /* fall through */ }
    try {
      const r = await fetch(`${BASE}/__down?bytes=0&r=${Math.random()}`, { cache: 'no-store', signal });
      const h = (k) => r.headers.get(k) || '';
      if (h('cf-meta-ip')) {
        return {
          ip: h('cf-meta-ip'), asn: Number(h('cf-meta-asn')) || null, org: '',
          country: h('cf-meta-country'), city: h('cf-meta-city'),
          colo: h('cf-meta-colo'), coloCity: h('cf-meta-city'), proto: '',
        };
      }
    } catch { /* ignore */ }
    return null;
  }

  async fetchAsnName(asn) {
    if (!asn) return '';
    try {
      const r = await fetch(`https://stat.ripe.net/data/as-overview/data.json?resource=AS${asn}`, { cache: 'force-cache' });
      const j = await r.json();
      return j?.data?.holder || '';
    } catch { return ''; }
  }

  /* ── single latency probe (TTFB of an empty download) ────── */
  async #probe(signal, timeout = PING_TIMEOUT) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    const relay = () => c.abort();
    signal.addEventListener('abort', relay, { once: true });
    const t0 = performance.now();
    try {
      await fetch(`${BASE}/__down?bytes=0&r=${Math.random()}`, { cache: 'no-store', signal: c.signal });
      return performance.now() - t0;
    } finally {
      clearTimeout(t);
      signal.removeEventListener('abort', relay);
    }
  }

  /* ── port health check + connection warm-up ────────────────
   * Fired in parallel with the latency phase: opens one tiny request per
   * port. Working ports (DNS + TCP + TLS OK) are kept; failing ones fall
   * back to 443. The connections stay warm for the download phase. */
  async #preparePorts(signal) {
    const check = async (port) => {
      try {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), PORT_TIMEOUT);
        const relay = () => c.abort();
        signal.addEventListener('abort', relay, { once: true });
        try {
          await fetch(`${this.origin(port)}/__down?bytes=1&r=${Math.random()}`, { cache: 'no-store', signal: c.signal });
          return signal.aborted ? null : port;
        } finally {
          clearTimeout(t);
          signal.removeEventListener('abort', relay);
        }
      } catch { return null; }
    };
    const ok = (await Promise.all(PORTS.map(check))).filter(Boolean);
    /* keep 443 first so latency probes & fallbacks always use the primary */
    this.ports = ok.length ? [...new Set([443, ...ok.filter((p) => p !== 443)])] : [443];
    return this.ports.length;
  }

  /* ── run the full test ───────────────────────────────────── */
  async run(opts) {
    if (this.running) return;
    this.running = true;
    const ctrl = (this.ctrl = new AbortController());
    const signal = ctrl.signal;
    const aborted = () => signal.aborted;

    const res = {
      ts: Date.now(),
      settings: { ...opts },
      meta: opts.meta || null,
      ping: { samples: [], min: 0, med: 0, avg: 0, max: 0, jitter: 0 },
      loss: { sent: 0, lost: 0, pct: null },
      loaded: { samples: [], avg: null, max: null },
      download: { avg: 0, peak: 0, bytes: 0, ms: 0 },
      upload: { avg: 0, peak: 0, bytes: 0, ms: 0 },
      streams: Math.max(1, opts.streams | 0),
      portsUsed: 1,
    };

    try {
      /* 1 ── idle latency + (concurrent) port warm-up */
      this.h.phase?.('ping');
      const portsReady = this.#preparePorts(signal);
      const warm = await this.#probe(signal, 4500).catch(() => null);
      if (aborted()) return this.#abort();
      const samples = res.ping.samples;
      for (let i = 0; i < PING_SAMPLES; i++) {
        let ms = null;
        try {
          ms = await this.#probe(signal);
          samples.push(ms);
        } catch { ms = null; }
        if (aborted()) return this.#abort();
        if (ms != null) this.h.pingSample?.(samples.length, PING_SAMPLES, ms, median(samples));
        if (i < PING_SAMPLES - 1) await sleep(PING_GAP_MS);
      }
      if (samples.length < 3) throw new Error('NO_DATA');
      const p = res.ping;
      p.min = Math.min(...samples);
      p.max = Math.max(...samples);
      p.avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      p.med = median(samples);
      let jSum = 0;
      for (let i = 1; i < samples.length; i++) jSum += Math.abs(samples[i] - samples[i - 1]);
      p.jitter = jSum / (samples.length - 1);
      this.h.pingDone?.(p);

      res.portsUsed = await portsReady;
      if (aborted()) return this.#abort();

      /* 2 ── loss burst (estimated) */
      if (opts.loss) {
        await this.#lossBurst(res, signal);
        if (aborted()) return this.#abort();
        this.h.lossDone?.(res.loss);
      } else {
        this.h.lossDone?.(null);
      }

      /* 3 ── download */
      this.h.phase?.('download');
      res.download = await this.#throughput('down', signal, opts, res);
      if (aborted()) return this.#abort();
      this.h.downloadDone?.(res.download);

      /* 4 ── upload */
      this.h.phase?.('upload');
      res.upload = await this.#throughput('up', signal, opts, res);
      if (aborted()) return this.#abort();
      this.h.uploadDone?.(res.upload);

      this.h.phase?.('done');
      if (res.loaded.samples.length) {
        const s = res.loaded.samples;
        res.loaded.avg = s.reduce((a, b) => a + b, 0) / s.length;
        res.loaded.max = Math.max(...s);
      }
      this.h.done?.(res);
    } catch (e) {
      if (signal.aborted || e?.name === 'AbortError') return this.#abort();
      this.h.error?.(e?.message === 'NO_DATA' ? 'NO_DATA' : 'NET');
    } finally {
      this.running = false;
      this.ctrl = null;
    }
  }

  #abort() { this.h.aborted?.(); }

  async #lossBurst(res, signal) {
    let sent = 0, lost = 0, index = 0;
    const worker = async () => {
      while (index < LOSS_PROBES && !signal.aborted) {
        const i = index++;
        sent++;
        try { await this.#probe(signal, LOSS_TIMEOUT); }
        catch { if (signal.aborted) return; lost++; }
        void i;
      }
    };
    await Promise.all(Array.from({ length: LOSS_CONCURRENCY }, worker));
    res.loss = { sent, lost, pct: sent ? (lost / sent) * 100 : null };
  }

  /* ── throughput phase ────────────────────────────────────── */
  async #throughput(kind, signal, opts, res) {
    const durationMs = opts.duration * 1000;
    const streams = Math.max(1, opts.streams | 0);

    /* origin spread: one connection per (host, port); extra streams share them */
    const ports = kind === 'up'
      ? this.ports.slice(0, Math.min(UL_PORT_SPAN, this.ports.length))
      : this.ports;
    res.streams = streams;
    res.portsUsed = Math.max(res.portsUsed || 1, kind === 'up' ? ports.length : Math.min(streams, ports.length));
    if (kind === 'down') res.dlConnections = Math.min(streams, ports.length);

    const started = performance.now();
    const st = { bytes: 0, firstAt: 0, timeline: [[started, 0]] };
    const inner = new AbortController();
    const relay = () => { inner.abort(); this.stop(); };
    signal.addEventListener('abort', relay, { once: true });

    /* live sampler — rolling 1 s window for the gauge/graph */
    const sampler = setInterval(() => {
      const now = performance.now();
      st.timeline.push([now, st.bytes]);
      const w = windowSpeed(st.timeline, 1000);
      if (w != null) this.h.sample?.(kind, w, (st.bytes * 8) / 1e6 / ((now - (st.firstAt || started)) / 1000));
    }, 90);

    /* loaded-latency probes (primary port, not counted as throughput) */
    let loadedTimer = null;
    if (opts.loaded) {
      loadedTimer = setInterval(async () => {
        if (signal.aborted) return;
        try {
          const ms = await this.#probe(signal, 2600);
          if (!signal.aborted) { res.loaded.samples.push(ms); this.h.loadedSample?.(ms); }
        } catch { /* probe lost */ }
      }, 900);
    }

    /* deadline watchdog: aborts in-flight upload XHRs exactly on time */
    let watchdog = null;
    const deadline = started + durationMs;

    const workers = Array.from({ length: streams }, (_, i) =>
      kind === 'down'
        ? this.#dlWorker(st, ports, i, inner.signal, deadline)
        : this.#ulWorker(st, ports, i, inner.signal, deadline),
    );

    if (kind === 'up') {
      watchdog = setInterval(() => {
        if (performance.now() >= deadline) {
          clearInterval(watchdog);
          for (const x of this._xhrs) { try { x.abort(); } catch { /* noop */ } }
          this._xhrs.clear();
        }
      }, 60);
    }

    await Promise.allSettled(workers);

    clearInterval(sampler);
    if (loadedTimer) clearInterval(loadedTimer);
    if (watchdog) clearInterval(watchdog);
    signal.removeEventListener('abort', relay);
    st.timeline.push([performance.now(), st.bytes]);

    const out = this.#settle(st, started, durationMs);
    if (!(out.avg > 0)) throw new Error('NO_DATA');
    return out;
  }

  /* final figures from the timeline: sustained avg (ramp excluded) + peak */
  #settle(st, started, durationMs) {
    const end = st.timeline[st.timeline.length - 1];
    const out = { avg: 0, peak: 0, bytes: st.bytes, ms: end[0] - started };
    if (st.bytes === 0) throw new Error('NO_DATA');

    const base = st.firstAt || started;                    /* clock: first byte */
    const skipTo = base + Math.max(RAMP_MIN_MS, durationMs * RAMP_RATIO);
    let a = st.timeline.find((p) => p[0] >= skipTo)
      || st.timeline.find((p) => p[0] >= base)
      || st.timeline[0];
    if (end[0] - a[0] < 500) a = st.timeline[0];           /* very short run */
    out.avg = ((end[1] - a[1]) * 8) / 1e6 / Math.max((end[0] - a[0]) / 1000, 0.05);
    if (!(out.avg > 0) || !isFinite(out.avg)) out.avg = (st.bytes * 8) / 1e6 / Math.max(out.ms / 1000, 0.05);

    /* peak = best 500 ms window */
    let peak = 0;
    for (let i = 0; i < st.timeline.length; i++) {
      for (let j = i + 1; j < st.timeline.length; j++) {
        if (st.timeline[j][0] - st.timeline[i][0] >= 500) {
          const mbps = ((st.timeline[j][1] - st.timeline[i][1]) * 8) / 1e6 / 0.5;
          if (mbps > peak) peak = mbps;
          break;
        }
      }
    }
    out.peak = Math.max(peak, out.avg);
    return out;
  }

  /* ── download stream: byte-accurate streaming reads ─────── */
  async #dlWorker(st, ports, i, signal, deadline) {
    const base = this.origin(ports[i % ports.length]);
    let misses = 0;
    while (!signal.aborted && performance.now() < deadline) {
      try {
        const r = await fetch(`${base}/__down?bytes=${DL_CHUNK}&r=${Math.random()}`, {
          cache: 'no-store', signal,
        });
        const reader = r.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!st.firstAt) st.firstAt = performance.now();
          st.bytes += value.byteLength;
        }
        misses = 0;
      } catch {
        if (signal.aborted) return;
        if (++misses > 4) return;                          /* give this stream up */
        await sleep(200);
      }
    }
  }

  /* ── upload payload (random, reusable) ───────────────────── */
  #payload() {
    if (this._payload) return this._payload;
    const a = new Uint8Array(UL_MAX);
    for (let o = 0; o < UL_MAX; o += 65536) {
      crypto.getRandomValues(a.subarray(o, Math.min(o + 65536, UL_MAX)));
    }
    return (this._payload = a);
  }

  /* ── upload stream: XHR + upload.onprogress (bytes counted
   *     as they leave the wire, not on completion) ─────────── */
  #ulRequest(st, port, size) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      let last = 0;
      const onProg = (e) => {
        const d = e.loaded - last;
        last = e.loaded;
        if (d > 0) {
          if (!st.firstAt) st.firstAt = performance.now();
          st.bytes += d;
        }
      };
      xhr.upload.addEventListener('progress', onProg);
      xhr.addEventListener('loadend', () => {
        this._xhrs.delete(xhr);
        resolve();
      });
      this._xhrs.add(xhr);
      xhr.open('POST', `${this.origin(port)}/__up?r=${Math.random()}`, true);
      try {
        xhr.send(new Blob([this.#payload().subarray(0, size)]));
      } catch { /* sync send failure — settle quietly */
        this._xhrs.delete(xhr);
        resolve();
      }
    });
  }

  async #ulWorker(st, ports, i, signal, deadline) {
    const port = ports[i % ports.length];
    let size = UL_START, misses = 0;
    while (!signal.aborted && performance.now() < deadline) {
      const t0 = performance.now();
      try {
        await this.#ulRequest(st, port, size);
      } catch {
        if (signal.aborted) return;
        if (++misses > 3) return;
        size = Math.max(size >> 1, UL_MIN);
        continue;
      }
      const dt = performance.now() - t0;
      if (dt < 1200 && size < UL_MAX) size = Math.min(size * 2, UL_MAX);
      else if (dt > 6000 && size > (1 << 20)) size = Math.max(size >> 1, 1 << 20);
    }
  }
}

/* rolling-window speed in Mbps; null when not enough span yet */
function windowSpeed(timeline, windowMs) {
  const last = timeline[timeline.length - 1];
  const [tEnd, bEnd] = last;
  let start = timeline[0];
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (tEnd - timeline[i][0] >= windowMs) { start = timeline[i]; break; }
  }
  const span = tEnd - start[0];
  if (span < 250) return null;
  return ((bEnd - start[1]) * 8) / 1e6 / (span / 1000);
}
