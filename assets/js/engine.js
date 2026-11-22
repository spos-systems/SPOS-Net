/* SPOS Net — measurement engine (zero dependencies)
 *
 * Backend: public Cloudflare speed endpoints (CORS-enabled, anycast):
 *   GET  https://speed.cloudflare.com/__down?bytes=N
 *   POST https://speed.cloudflare.com/__up
 *   GET  https://speed.cloudflare.com/meta
 * Fallback for meta: exposed cf-meta-* headers on __down responses.
 *
 * Phases: idle latency → (loss burst) → download → upload.
 * Throughput: parallel streams, rolling 1 s window for live display,
 * ramp-up excluded, stable-window average for the final figure.
 */

const BASE = 'https://speed.cloudflare.com';

const PING_SAMPLES = 12;
const PING_GAP_MS = 170;
const PING_TIMEOUT = 3500;

const LOSS_PROBES = 24;
const LOSS_CONCURRENCY = 6;
const LOSS_TIMEOUT = 2800;

const DL_CHUNK = 26214400;              // 25 MiB per request
const UL_START = 1 << 20;               // 1 MiB, adaptive
const UL_MAX = 1 << 24;                 // 16 MiB
const UL_MIN = 1 << 18;                 // 256 KiB

const RAMP_SKIP_RATIO = 0.22;           // fraction of the phase excluded from the average
const RAMP_SKIP_MIN_MS = 1200;

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
  }

  stop() { if (this.ctrl) this.ctrl.abort(); }

  /* ── connection meta ─────────────────────────────────────── */
  async fetchMeta(signal) {
    /* primary: /meta (browser fetch sends Referer → full JSON) */
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

    /* fallback: cf-meta-* headers of a tiny download */
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

  /* optional: resolve ASN organization name (RIPEstat, CORS-enabled) */
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
    };

    try {
      /* 1 ── idle latency */
      this.h.phase?.('ping');
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
      }
    };
    await Promise.all(Array.from({ length: LOSS_CONCURRENCY }, worker));
    res.loss = { sent, lost, pct: sent ? (lost / sent) * 100 : null };
  }

  /* ── throughput phase ────────────────────────────────────── */
  async #throughput(kind, signal, opts, res) {
    const durationMs = opts.duration * 1000;
    const streams = Math.max(1, opts.streams | 0);
    const started = performance.now();
    const st = { bytes: 0, timeline: [[started, 0]], errors: 0 };
    const inner = new AbortController();
    const relay = () => inner.abort();
    signal.addEventListener('abort', relay, { once: true });

    /* live sampler — rolling 1 s window */
    const sampler = setInterval(() => {
      const now = performance.now();
      st.timeline.push([now, st.bytes]);
      const w = windowSpeed(st.timeline, 1000);
      if (w != null) this.h.sample?.(kind, w, (st.bytes * 8) / 1e6 / ((now - started) / 1000));
    }, 90);

    /* loaded-latency probes */
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

    const deadline = started + durationMs;
    const workers = Array.from({ length: streams }, () =>
      kind === 'down' ? this.#dlWorker(st, inner.signal, deadline) : this.#ulWorker(st, inner.signal, deadline),
    );
    await Promise.allSettled(workers);

    clearInterval(sampler);
    if (loadedTimer) clearInterval(loadedTimer);
    signal.removeEventListener('abort', relay);
    st.timeline.push([performance.now(), st.bytes]);

    const out = { avg: 0, peak: 0, bytes: st.bytes, ms: 0 };
    const end = st.timeline[st.timeline.length - 1];
    out.ms = end[0] - started;

    if (st.bytes === 0) throw new Error('NO_DATA');

    /* exclude ramp-up */
    const skipTo = started + Math.max(RAMP_SKIP_MIN_MS, durationMs * RAMP_SKIP_RATIO);
    let a = st.timeline[0];
    for (const p of st.timeline) { if (p[0] >= skipTo) { a = p; break; } }
    if (end[0] - a[0] < 600) a = st.timeline[0];      // very short run — use everything
    out.avg = ((end[1] - a[1]) * 8) / 1e6 / ((end[0] - a[0]) / 1000);

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

    if (!(out.avg > 0)) throw new Error('NO_DATA');
    return out;
  }

  async #dlWorker(st, signal, deadline) {
    let misses = 0;
    while (!signal.aborted && performance.now() < deadline) {
      try {
        const r = await fetch(`${BASE}/__down?bytes=${DL_CHUNK}&r=${Math.random()}`, {
          cache: 'no-store', signal,
        });
        const reader = r.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          st.bytes += value.byteLength;
          if (signal.aborted) { try { reader.cancel(); } catch {} return; }
        }
        misses = 0;
      } catch {
        if (signal.aborted) return;
        if (++misses > 4) return;                      // give this stream up
        await sleep(160);
      }
    }
  }

  #payload() {
    if (this._payload) return this._payload;
    const n = UL_MAX;
    const a = new Uint8Array(n);
    for (let o = 0; o < n; o += 65536) {
      crypto.getRandomValues(a.subarray(o, Math.min(o + 65536, n)));
    }
    return (this._payload = a);
  }

  async #ulWorker(st, signal, deadline) {
    const payload = this.#payload();
    let size = UL_START, misses = 0;
    while (!signal.aborted && performance.now() < deadline) {
      try {
        const body = new Blob([payload.subarray(0, size)]);
        const t0 = performance.now();
        await fetch(`${BASE}/__up?r=${Math.random()}`, { method: 'POST', body, cache: 'no-store', signal });
        const dt = performance.now() - t0;
        st.bytes += size;
        if (dt < 1100) size = Math.min(size * 2, UL_MAX);       // adapt chunk size
        else if (dt > 4200) size = Math.max(size >> 1, UL_MIN);
        misses = 0;
      } catch {
        if (signal.aborted) return;
        if (++misses > 4) return;
        size = Math.max(size >> 1, UL_MIN);
        await sleep(160);
      }
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
