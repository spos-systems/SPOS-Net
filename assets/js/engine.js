/* SPOS Net — measurement engine (zero dependencies)
 *
 * Backend: public Cloudflare speed endpoints (CORS-enabled, anycast):
 *   GET  https://speed.cloudflare.com[__down]?bytes=N
 *   POST https://speed.cloudflare.com[__up]
 * plus fallback mirrors of an incompressible 16 MB test file hosted on
 * independent CDNs (own origin / jsDelivr / raw.githubusercontent) so the
 * download phase always gets several INDEPENDENT TCP connections even when
 * the alternate Cloudflare HTTPS ports are filtered.
 *
 * Accuracy model (v2.3 — Ookla-compatible):
 *   1. Parallel streams spread across independent connections (each
 *      host:port pair = its own TCP+TLS pipe, like Ookla's socket pool).
 *   2. The clock starts at the FIRST byte; the TCP ramp-up window
 *      (≥1.5 s / 18% of the phase) is excluded from every figure.
 *   3. Final speed = Ookla's documented trimmed mean: instantaneous
 *      samples are sorted, the two fastest are removed, the slowest ~22%
 *      are discarded, and the mean of the remainder is reported. This is
 *      why speedtest.net reads higher than plain-average tools — and why
 *      we now match it.
 *   4. Deadline enforcement: in-flight transfers are aborted exactly at
 *      the phase deadline (v2.2 could overrun by minutes on slow links).
 *   5. Latency = TTFB of empty downloads (median, min kept for details);
 *      jitter = mean consecutive delta.
 *   6. Packet loss (v5 estimator): browsers cannot send ICMP/UDP, so a
 *      pure timeout counter over TCP reads 0.0% on every healthy link.
 *      We now count HARD losses (probe timeouts) plus RETRANSMISSION
 *      indicators — probes that succeed but take > max(3× median,
 *      median + 250 ms), which is the classic signature of a packet
 *      that was lost and re-sent at the TCP layer. The figure is
 *      labelled “estimated” in the UI, as before.
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

const DL_CHUNK = 52428800;              // 50 MiB per Cloudflare request
const TEST_FILE = '/assets/testdata/spos-16mb.bin';
const MIRROR_JSD = 'https://cdn.jsdelivr.net/gh/spos-systems/SPOS-Net@main' + TEST_FILE;
const MIRROR_RAW = 'https://raw.githubusercontent.com/spos-systems/SPOS-Net/main' + TEST_FILE;

const UL_START = 4 << 20;               // 4 MiB, adaptive
const UL_MAX = 16 << 20;                // 16 MiB
const UL_MIN = 512 << 10;               // 512 KiB
const UL_PORT_SPAN = 4;                 // upload streams spread across ≤ 4 ports

const RAMP_MIN_MS = 1500;               // excluded after first byte
const RAMP_RATIO = 0.18;                // …or 18% of phase, whichever is larger
const OOKLA_SLOW_DROP = 0.22;           // slowest samples discarded (Ookla ~22%)
const OOKLA_FAST_KEEP_DROP = 2;         // …and the 2 fastest samples removed

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
    this.sources = [this.#cfSource(443)];
  }

  origin(port) { return port === 443 ? BASE : `${BASE}:${port}`; }

  #cfSource(port) {
    return {
      id: 'cf:' + port,
      url: () => `${this.origin(port)}/__down?bytes=${DL_CHUNK}&r=${Math.random()}`,
      check: (signal) => this.#tinyFetch(`${this.origin(port)}/__down?bytes=1&r=${Math.random()}`, signal),
    };
  }

  #fileSource(id, url, check) {
    return { id, url: () => `${url}${url.includes('?') ? '&' : '?'}r=${Math.random()}`, check };
  }

  stop() {
    if (this.ctrl) this.ctrl.abort();
    for (const x of this._xhrs) { try { x.abort(); } catch { /* noop */ } }
    this._xhrs.clear();
  }

  /* fetch, read one chunk, abort — minimal health probe for big static files */
  async #tinyFetch(url, signal, timeout = PORT_TIMEOUT) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    const relay = () => c.abort();
    signal.addEventListener('abort', relay, { once: true });
    try {
      const r = await fetch(url, { cache: 'no-store', signal: c.signal });
      if (!r.ok) return false;
      const rd = r.body.getReader();
      await rd.read();
      try { c.abort(); } catch { /* noop */ }
      return !signal.aborted;
    } catch { return false; }
    finally { clearTimeout(t); signal.removeEventListener('abort', relay); }
  }

  /* ── connection meta ─────────────────────────────────────── */
  /* sources are tried in order and MERGED, so the panel always shows as
     much as possible: Cloudflare /meta (colo + ISP + protocol), the __down
     response headers (IP at minimum), then ipwho.is (ISP/ASN/geo). */
  async fetchMeta(signal) {
    let m = null;

    try {
      const r = await fetch(`${BASE}/meta`, { cache: 'no-store', signal });
      if (r.ok) {
        const j = await r.json();
        if (j && j.clientIp) {
          const colo = typeof j.colo === 'object' ? j.colo : { iata: j.colo, city: j.city };
          m = {
            ip: j.clientIp, asn: j.asn, org: j.asOrganization,
            country: j.country, city: j.city, colo: colo?.iata || '',
            coloCity: colo?.city || j.city || '', proto: j.httpProtocol || '',
          };
        }
      }
    } catch { /* fall through */ }

    if (!m) {
      try {
        const r = await fetch(`${BASE}/__down?bytes=0&r=${Math.random()}`, { cache: 'no-store', signal });
        const h = (k) => r.headers.get(k) || '';
        if (h('cf-meta-ip')) {
          m = {
            ip: h('cf-meta-ip'), asn: Number(h('cf-meta-asn')) || null, org: '',
            country: h('cf-meta-country'), city: h('cf-meta-city'),
            colo: h('cf-meta-colo'), coloCity: h('cf-meta-city'), proto: '',
          };
        }
      } catch { /* fall through */ }
    }

    /* ISP / ASN / geo still missing → ipwho.is fills the gaps */
    if (!m || (!m.org && !m.asn)) {
      try {
        const r = await fetch('https://ipwho.is/', { cache: 'no-store', signal });
        if (r.ok) {
          const j = await r.json();
          if (j && j.ip) {
            const w = {
              ip: j.ip, asn: j.connection?.asn ?? null,
              org: j.connection?.isp || j.connection?.org || '',
              country: j.country || '', city: j.city || '', colo: '', coloCity: '', proto: '',
            };
            m = m
              ? { ...w, ...Object.fromEntries(Object.entries(m).filter(([, v]) => v)) }
              : w;
          }
        }
      } catch { /* ignore */ }
    }

    if (m && !m.proto) m.proto = this.#nextProto();
    return m;
  }

  /* negotiated HTTP protocol from Resource Timing (speed.cloudflare.com
     sends Timing-Allow-Origin: * so nextHopProtocol is readable) */
  #nextProto() {
    try {
      const es = performance.getEntriesByType('resource').filter((e) => e.name.includes('speed.cloudflare.com'));
      const p = es[es.length - 1]?.nextHopProtocol || '';
      if (p === 'h3') return 'HTTP/3';
      if (p === 'h2') return 'HTTP/2';
      if (p) return p.replace('http/', 'HTTP/').toUpperCase();
    } catch { /* not supported */ }
    return '';
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

  /* ── source health check + connection warm-up ──────────────
   * Runs in parallel with the latency phase. Cloudflare ports come
   * first; static-file mirrors are appended so the pool keeps several
   * independent TCP connections even when alternate ports are filtered. */
  async #prepareSources(signal) {
    const jobs = [];

    for (const port of PORTS) {
      jobs.push((async () => {
        try {
          const c = new AbortController();
          const t = setTimeout(() => c.abort(), PORT_TIMEOUT);
          const relay = () => c.abort();
          signal.addEventListener('abort', relay, { once: true });
          try {
            await fetch(`${this.origin(port)}/__down?bytes=1&r=${Math.random()}`, { cache: 'no-store', signal: c.signal });
            return signal.aborted ? null : this.#cfSource(port);
          } finally { clearTimeout(t); signal.removeEventListener('abort', relay); }
        } catch { return null; }
      })());
    }

    const selfUrl = `${location.origin}${TEST_FILE}`;
    if (/^https?:$/.test(location.protocol)) {
      jobs.push((async () => (await this.#tinyFetch(selfUrl, signal)) ? this.#fileSource('self', selfUrl, null) : null)());
    }
    jobs.push((async () => (await this.#tinyFetch(MIRROR_JSD, signal)) ? this.#fileSource('jsd', MIRROR_JSD, null) : null)());
    jobs.push((async () => (await this.#tinyFetch(MIRROR_RAW, signal, 4200)) ? this.#fileSource('raw', MIRROR_RAW, null) : null)());

    const ok = (await Promise.all(jobs)).filter(Boolean);
    /* order: CF 443 first, other CF ports, then mirrors */
    const cf = ok.filter((s) => s.id.startsWith('cf:'));
    const mirrors = ok.filter((s) => !s.id.startsWith('cf:'));
    this.ports = cf.length ? cf.map((s) => Number(s.id.slice(3))) : [443];
    this.sources = [...cf, ...mirrors].length ? [...cf, ...mirrors] : [this.#cfSource(443)];
    return this.sources.length;
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
      loaded: { samples: [], dl: [], ul: [], avg: null, max: null, dlAvg: null, ulAvg: null },
      download: { avg: 0, sustained: 0, peak: 0, bytes: 0, ms: 0 },
      upload: { avg: 0, sustained: 0, peak: 0, bytes: 0, ms: 0 },
      streams: Math.max(1, opts.streams | 0),
      dlConn: 1, ulConn: 1,
    };

    try {
      /* 1 ── idle latency + (concurrent) source warm-up */
      this.h.phase?.('ping');
      const sourcesReady = this.#prepareSources(signal);
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

      await sourcesReady;
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
      for (const tag of ['dl', 'ul']) {
        const a = res.loaded[tag];
        if (a && a.length) res.loaded[tag + 'Avg'] = a.reduce((x, y) => x + y, 0) / a.length;
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
    const rtts = [];
    const worker = async () => {
      while (index < LOSS_PROBES && !signal.aborted) {
        index++;
        sent++;
        try { rtts.push(await this.#probe(signal, LOSS_TIMEOUT)); }
        catch { if (signal.aborted) return; lost++; }
      }
    };
    await Promise.all(Array.from({ length: LOSS_CONCURRENCY }, worker));
    /* retransmission indicators: successes far above the baseline */
    const base = rtts.length ? median(rtts) : 0;
    const spikeAt = Math.max(base * 3, base + 250);
    const spikes = rtts.filter((r) => r > spikeAt).length;
    const events = lost + spikes;
    res.loss = {
      sent, lost, spikes,
      pct: sent ? Math.round((events / sent) * 1000) / 10 : null, /* 1 decimal */
      est: true,
    };
  }

  /* ── throughput phase ────────────────────────────────────── */
  async #throughput(kind, signal, opts, res) {
    const durationMs = opts.duration * 1000;
    const streams = Math.max(1, opts.streams | 0);

    let pool;
    if (kind === 'down') {
      pool = this.sources;
      res.dlConn = Math.min(streams, pool.length);
    } else {
      pool = this.ports.slice(0, Math.min(UL_PORT_SPAN, this.ports.length)).map((p) => this.#cfSource(p));
      res.ulConn = Math.min(streams, pool.length);
    }
    res.streams = streams;

    const started = performance.now();
    const deadline = started + durationMs;
    const st = { bytes: 0, firstAt: 0, timeline: [[started, 0]], aborters: new Set() };
    const inner = new AbortController();
    const relay = () => { inner.abort(); this.stop(); };
    signal.addEventListener('abort', relay, { once: true });

    /* register per-stream aborters so the deadline is EXACT (v2.2 fix) */
    const killAll = () => { for (const a of st.aborters) { try { a.abort(); } catch { /* noop */ } } };
    st.aborters.add(inner);
    const deadlineTimer = setTimeout(() => { killAll(); }, durationMs);

    /* live sampler — rolling windows for the gauge/graph */
    const sampler = setInterval(() => {
      const now = performance.now();
      st.timeline.push([now, st.bytes]);
      const w1 = windowSpeed(st.timeline, 1000);
      const w300 = windowSpeed(st.timeline, 350);
      if (w1 != null || w300 != null) {
        this.h.sample?.(kind, w1 ?? w300, w300 ?? w1);
      }
    }, 90);

    /* loaded-latency probes (primary port, not counted as throughput) —
       tagged per phase so the panel can show download-load vs upload-load */
    let loadedTimer = null;
    if (opts.loaded) {
      const tag = kind === 'down' ? 'dl' : 'ul';
      loadedTimer = setInterval(async () => {
        if (signal.aborted) return;
        try {
          const ms = await this.#probe(signal, 2600);
          if (!signal.aborted) { res.loaded.samples.push(ms); res.loaded[tag].push(ms); this.h.loadedSample?.(ms); }
        } catch { /* probe lost */ }
      }, 900);
    }

    const workers = Array.from({ length: streams }, (_, i) =>
      kind === 'down'
        ? this.#dlWorker(st, pool, i, deadline)
        : this.#ulWorker(st, pool, i, deadline),
    );

    await Promise.allSettled(workers);

    clearTimeout(deadlineTimer);
    killAll();
    clearInterval(sampler);
    if (loadedTimer) clearInterval(loadedTimer);
    signal.removeEventListener('abort', relay);
    st.timeline.push([performance.now(), st.bytes]);

    const out = this.#settle(st, started, durationMs);
    if (!(out.avg > 0)) throw new Error('NO_DATA');
    return out;
  }

  /* final figures from the timeline.
   * avg       — Ookla-style trimmed mean (headline number)
   * sustained — plain average over the stable window (details)
   * peak      — best 500 ms window (details) */
  #settle(st, started, durationMs) {
    const end = st.timeline[st.timeline.length - 1];
    const out = { avg: 0, sustained: 0, peak: 0, bytes: st.bytes, ms: end[0] - started };
    if (st.bytes === 0) throw new Error('NO_DATA');

    const base = st.firstAt || started;
    const cutT = base + Math.max(RAMP_MIN_MS, durationMs * RAMP_RATIO);
    const winEnd = Math.max(end[0], cutT + 600);

    /* cumulative bytes at time t (linear interpolation over the timeline) */
    const bytesAt = (tq) => {
      const tl = st.timeline;
      if (tq <= tl[0][0]) return tl[0][1];
      for (let i = 1; i < tl.length; i++) {
        if (tl[i][0] >= tq) {
          const [t0, b0] = tl[i - 1], [t1, b1] = tl[i];
          return b0 + (b1 - b0) * ((tq - t0) / Math.max(1, t1 - t0));
        }
      }
      return tl[tl.length - 1][1];
    };

    /* sustained: plain average over the stable window */
    out.sustained = ((bytesAt(winEnd) - bytesAt(cutT)) * 8) / 1e6 / Math.max((winEnd - cutT) / 1000, 0.05);

    /* Ookla-style: 300 ms instantaneous samples over the stable window */
    const samples = [];
    const WIN = 300;
    for (let t = cutT; t + WIN <= winEnd - 60; t += WIN) {
      const mbps = ((bytesAt(t + WIN) - bytesAt(t)) * 8) / 1e6 / (WIN / 1000);
      if (mbps >= 0) samples.push(mbps);
    }

    if (samples.length >= 6) {
      const s = [...samples].sort((a, b) => a - b);
      s.splice(Math.max(0, s.length - OOKLA_FAST_KEEP_DROP), OOKLA_FAST_KEEP_DROP);   // drop 2 fastest
      const dropSlow = Math.floor(s.length * OOKLA_SLOW_DROP);                        // drop slowest 22%
      const kept = s.slice(dropSlow);
      if (kept.length) out.avg = kept.reduce((a, b) => a + b, 0) / kept.length;
    }
    if (!(out.avg > 0) || !isFinite(out.avg)) out.avg = out.sustained;
    out.avg = Math.min(Math.max(out.avg, out.sustained), Math.max(out.sustained * 1.6, out.avg));

    /* peak = best 500 ms window */
    let peak = 0;
    for (let t = cutT; t + 500 <= winEnd - 60; t += 150) {
      const mbps = ((bytesAt(t + 500) - bytesAt(t)) * 8) / 1e6 / 0.5;
      if (mbps > peak) peak = mbps;
    }
    out.peak = Math.max(peak, out.avg);
    return out;
  }

  /* ── download stream ─────────────────────────────────────── */
  async #dlWorker(st, pool, i, deadline) {
    const src = pool[i % pool.length];
    let misses = 0;
    while (performance.now() < deadline) {
      const c = new AbortController();
      st.aborters.add(c);
      try {
        const r = await fetch(src.url(), { cache: 'no-store', signal: c.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const reader = r.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!st.firstAt) st.firstAt = performance.now();
          st.bytes += value.byteLength;
        }
        misses = 0;
      } catch {
        if (performance.now() >= deadline) return;
        if (++misses > 4) return;                          /* give this stream up */
        await sleep(250);
      } finally {
        st.aborters.delete(c);
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
   *     the moment they hit the wire, not on completion) ────── */
  #ulRequest(st, port, size, deadline) {
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

  async #ulWorker(st, pool, i, deadline) {
    const src = pool[i % pool.length];
    const port = Number(src.id.slice(3));
    let size = UL_START, misses = 0;
    while (performance.now() < deadline) {
      const t0 = performance.now();
      try {
        await this.#ulRequest(st, port, size, deadline);
      } catch {
        if (performance.now() >= deadline) return;
        if (++misses > 3) return;
        size = Math.max(size >> 1, UL_MIN);
        continue;
      }
      if (performance.now() >= deadline) return;
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
  if (span < 200) return null;
  return ((bEnd - start[1]) * 8) / 1e6 / (span / 1000);
}
