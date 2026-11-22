/* SPOS Net — application controller */

import { getLang, setLang, t } from './i18n.js';
import { Engine } from './engine.js';
import { Gauge } from './gauge.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const SITE_URL = 'https://spos-systems.github.io/SPOS-Net/';
const VERSION = '2.2.0';

const DEFAULTS = { lang: 'ar', unit: 'mbps', duration: 12, streams: 8, loaded: true, loss: true };

const html = document.documentElement;
const state = { mode: 'idle', result: null, shared: null, meta: null, titleTimer: 0 };

let settings = loadSettings();
let gauge = null;
let engine = null;

/* ── helpers ─────────────────────────────────────────────── */

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('sposnet.settings') || '{}');
    return { ...DEFAULTS, ...s };
  } catch { return { ...DEFAULTS }; }
}
function saveSettings() {
  try { localStorage.setItem('sposnet.settings', JSON.stringify(settings)); } catch { /* private mode */ }
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('sposnet.history') || '[]'); } catch { return []; }
}
function saveHistory(list) {
  try { localStorage.setItem('sposnet.history', JSON.stringify(list.slice(0, 20))); } catch { /* ignore */ }
}

/* unit conversion: value in Mbps → display pieces */
function conv(mbps) {
  if (settings.unit === 'mbytes') return { v: mbps / 8, max: 2 };
  if (settings.unit === 'kbps') return { v: mbps * 1000, max: 0 };
  return { v: mbps, max: mbps < 10 ? 2 : mbps < 100 ? 1 : 0 };
}
function fmtSpeed(mbps) {
  const { v, max } = conv(mbps);
  return v >= 1000 ? Math.round(v).toLocaleString('en-US') : v.toFixed(max);
}
const fmtMs = (v) => (v == null ? '—' : v < 10 ? v.toFixed(1) : Math.round(v).toString());

/* human duration for real-world estimates (seconds → "45 ث" / "3.2 د") */
function fmtDur(sec) {
  if (!isFinite(sec) || sec <= 0) return '—';
  if (sec < 90) return `${Math.round(sec)} ${t('d.sec')}`;
  const m = sec / 60;
  if (m < 90) return `${m < 10 ? (Math.round(m * 10) / 10).toFixed(1) : Math.round(m)} ${t('d.min')}`;
  return `${(sec / 3600).toFixed(1)} ${t('d.hr')}`;
}

function setState(mode) {
  state.mode = mode;
  html.dataset.state = mode;
}

function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, ms);
}

/* ── i18n rendering ──────────────────────────────────────── */

function applyLang() {
  const l = getLang();
  html.lang = l;
  html.dir = l === 'ar' ? 'rtl' : 'ltr';
  document.title = t('title');
  $$('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  $$('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
  $('#btn-lang').textContent = l === 'ar' ? 'EN' : 'ع';
  const startBtn = $('#btn-start');
  startBtn.textContent = l === 'ar' ? 'ابدأ' : 'START';
  renderConnLine();
  if (state.result) {
    renderDetails(state.result);
    setGrade(scoreOf(state.result));
  }
  if (state.mode === 'done') setGaugeLabel(state.shared ? 'shared' : 'done');
}

/* ── connection line ─────────────────────────────────────── */

function renderConnLine() {
  const el = $('#conn-text');
  const m = state.meta;
  if (!m) { el.hidden = true; $('#conn-skel').hidden = state.mode !== 'idle' ? true : false; return; }
  $('#conn-skel').hidden = true;
  el.hidden = false;
  const sep = `<span class="sep">·</span>`;
  const loc = [m.city, m.country].filter(Boolean).join(', ');
  const parts = [];
  if (m.ip) parts.push(`<b><bdi>${m.ip}</bdi></b>`);
  if (m.org || m.asn) parts.push(`<b><bdi>${m.org || 'AS' + m.asn}</bdi></b>`);
  if (loc) parts.push(`<b><bdi>${loc}</bdi></b>`);
  const srv = `${getLang() === 'ar' ? 'الخادم' : 'Server'}: <bdi>Cloudflare${m.colo ? ' · ' + m.colo : ''}</bdi>`;
  parts.push(srv);
  el.innerHTML = parts.join(sep);
}

async function initMeta() {
  const probeCtrl = new AbortController();
  engine = new Engine({});
  const m = await engine.fetchMeta(probeCtrl.signal);
  if (m) {
    if (!m.org && m.asn) m.org = await engine.fetchAsnName(m.asn).catch(() => '');
    state.meta = m;
    renderConnLine();
  } else {
    $('#conn-skel').hidden = true;
    const el = $('#conn-text');
    el.hidden = false;
    el.textContent = t('conn.fail');
  }
}

/* ── gauge + readout ─────────────────────────────────────── */

const PHASE_COLORS = {
  ping: ['#4d5b7d', '#8b98b4', 'var(--steel-2)'],
  download: ['#3d7fd6', '#6fb5ff', 'var(--acc)'],
  upload: ['#7c66e0', '#a892ff', 'var(--vio)'],
  done: ['#3d7fd6', '#6fb5ff', 'var(--acc)'],
};

function setGaugeLabel(kind) {
  $('#g-label').textContent = t(`gauge.${kind}`);
}
function setReadout(valueText, unitText) {
  const ro = $('#g-readout');
  ro.hidden = false;
  $('#g-num').textContent = valueText;
  $('#g-unit').textContent = unitText;
}

/* ── live speed graph ───────────────────────────────────── */

function niceMax(v) {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

const SPARK = {
  cv: null, ctx: null, w: 0, h: 0, dpr: 1,
  t0: 0, samples: [], marks: [],

  init(cv) {
    this.cv = cv;
    this.ctx = cv.getContext('2d');
    addEventListener('resize', () => {
      if (!cv.hidden) { this.resize(); this.draw(); }
    });
  },
  reset() { this.samples = []; this.marks = []; this.cv.hidden = true; },
  begin() {
    this.t0 = performance.now();
    this.samples = [];
    this.marks = [];
    this.cv.hidden = false;
    this.resize();
    this.draw();
  },
  mark(kind) { this.marks.push([performance.now() - this.t0, kind]); },
  add(kind, v) { this.samples.push([performance.now() - this.t0, kind, v]); this.draw(); },

  resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = r.width;
    this.h = r.height;
    this.cv.width = Math.round(r.width * this.dpr);
    this.cv.height = Math.round(r.height * this.dpr);
  },

  draw() {
    const { ctx, w, h } = this;
    if (!ctx || !w) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!this.samples.length) return;

    const tEnd = Math.max(4000, this.samples[this.samples.length - 1][0]);
    let vMax = 0;
    for (const s of this.samples) if (s[2] > vMax) vMax = s[2];
    const max = niceMax(vMax * 1.12 || 1);
    const X = (t) => (t / tEnd) * w;
    const Y = (v) => h - (v / max) * (h - 8) - 3;

    /* faint grid */
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(233,237,245,.05)';
    for (const f of [0.25, 0.5, 0.75]) {
      const y = Y(max * f);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    /* download → upload divider */
    const up = this.marks.find((m) => m[1] === 'upload');
    if (up) {
      ctx.strokeStyle = 'rgba(233,237,245,.09)';
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(X(up[0]), 0); ctx.lineTo(X(up[0]), h); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* series: download (blue) then upload (violet) */
    for (const [kind, color, fill] of [
      ['down', '#4f9df0', 'rgba(79,157,240,.24)'],
      ['up', '#9d86f2', 'rgba(157,134,242,.22)'],
    ]) {
      const pts = this.samples.filter((s) => s[1] === kind);
      if (pts.length < 2) continue;
      /* area */
      ctx.beginPath();
      ctx.moveTo(X(pts[0][0]), Y(pts[0][2]));
      for (const p of pts) ctx.lineTo(X(p[0]), Y(p[2]));
      ctx.lineTo(X(pts[pts.length - 1][0]), h);
      ctx.lineTo(X(pts[0][0]), h);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, fill);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fill();
      /* line */
      ctx.beginPath();
      ctx.moveTo(X(pts[0][0]), Y(pts[0][2]));
      for (const p of pts) ctx.lineTo(X(p[0]), Y(p[2]));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    /* scale label (top-left, always LTR) */
    const unit = t(`u.${settings.unit}`);
    const disp = settings.unit === 'mbytes' ? max / 8 : settings.unit === 'kbps' ? max * 1000 : max;
    ctx.fillStyle = 'rgba(154,164,184,.75)';
    ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${Math.round(disp)} ${unit}`, 6, 12);
  },
};

/* ── run lifecycle ───────────────────────────────────────── */

function setGrade(score) {
  const g = $('#g-grade');
  g.hidden = false;
  g.className = 'g-grade ' + score.cls;
  g.textContent = `${t(`grade.${score.grade}`)} · ${score.score}/100`;
}

function resetUI() {
  setState('idle');
  html.dataset.ph = '';
  delete html.dataset.ph;
  $$('.ph').forEach((p) => p.classList.remove('active', 'done'));
  $$('.metric').forEach((m) => {
    m.classList.remove('on');
    const n = m.querySelector('.num');
    n.textContent = '—';
    n.classList.remove('good', 'mid', 'low');
  });
  SPARK.reset();
  $('#m-download .unit').textContent = t(`u.${settings.unit}`);
  $('#m-upload .unit').textContent = t(`u.${settings.unit}`);
  $('#g-readout').hidden = true;
  $('#g-grade').hidden = true;
  $('#btn-start').hidden = false;
  $('#btn-stop').hidden = true;
  $('#actions').setAttribute('aria-hidden', 'true');
  setGaugeLabel('idle');
  clearTimeout(state.titleTimer);
  $('#btn-again').querySelector('span').textContent = t('a.again');
  gauge.setColors(...PHASE_COLORS.download);
  gauge.restIdle();
  document.title = t('title');
}

function phaseUI(ph) {
  if (ph === 'done') {
    $$('.ph').forEach((p) => { p.classList.add('done'); p.classList.remove('active'); });
    return;
  }
  html.dataset.ph = ph;
  const order = ['ping', 'download', 'upload'];
  const idx = order.indexOf(ph);
  $$('.ph').forEach((p) => {
    const i = order.indexOf(p.dataset.ph);
    p.classList.toggle('active', i === idx);
    p.classList.toggle('done', i < idx);
  });
  gauge.setColors(...PHASE_COLORS[ph]);
  if (ph !== 'ping') setGaugeLabel(ph);
}

async function startTest() {
  if (state.mode === 'running') return;
  if (state.shared) clearShared();
  resetUI();
  setState('running');
  $('#btn-start').hidden = true;
  $('#btn-stop').hidden = false;
  setGaugeLabel('ping');

  const runSettings = { ...settings, meta: state.meta };
  const hooks = {
    phase: (ph) => {
      phaseUI(ph);
      if (ph === 'ping') SPARK.begin();
      else if (ph) SPARK.mark(ph);
    },
    pingSample: (done, total, ms, med) => {
      gauge.setProgress(done / total);
      setGaugeLabel('ping');
      setReadout(fmtMs(ms), 'ms');
      $('#m-ping .num').textContent = fmtMs(med);
      $('#m-ping').classList.add('on');
    },
    pingDone: (p) => {
      $('#m-ping .num').textContent = fmtMs(p.med);
      $('#m-jitter .num').textContent = fmtMs(p.jitter);
      $('#m-jitter').classList.add('on');
    },
    lossDone: (loss) => {
      const el = $('#m-loss');
      el.classList.add('on');
      el.querySelector('.num').textContent = loss ? (loss.lost ? loss.pct.toFixed(1) : '0.0') : '—';
    },
    loadedSample: () => { /* aggregated into details */ },
    sample: (kind, instant) => {
      SPARK.add(kind, instant);
      if (kind === 'down') {
        gauge.setValue(instant);
        setReadout(fmtSpeed(instant), t(`u.${settings.unit}`));
        $('#m-download .num').textContent = fmtSpeed(instant);
        $('#m-download').classList.add('on');
      } else {
        gauge.setValue(instant);
        setReadout(fmtSpeed(instant), t(`u.${settings.unit}`));
        $('#m-upload .num').textContent = fmtSpeed(instant);
        $('#m-upload').classList.add('on');
      }
      updateRunTitle(instant);
    },
    downloadDone: (d) => { $('#m-download .num').textContent = fmtSpeed(d.avg); },
    uploadDone: (u) => { $('#m-upload .num').textContent = fmtSpeed(u.avg); },
    done: (result) => finishTest(result),
    aborted: () => { toast(t('t.aborted')); resetUI(); },
    error: (code) => {
      toast(code === 'NO_DATA' ? t('t.noData') : t('t.netErr'));
      resetUI();
    },
  };
  engine = new Engine(hooks);
  await engine.run(runSettings);
}

function updateRunTitle(v) {
  clearTimeout(state.titleTimer);
  state.titleTimer = setTimeout(() => {
    document.title = t('docTitleRun').replace('{v}', fmtSpeed(v) + ' ' + t(`u.${settings.unit}`));
  }, 400);
}

/* quality tint for latency-family metrics */
function qCls(kind, v) {
  if (v == null || isNaN(v)) return '';
  if (kind === 'ping') return v <= 40 ? 'good' : v <= 90 ? 'mid' : 'low';
  if (kind === 'jitter') return v <= 10 ? 'good' : v <= 25 ? 'mid' : 'low';
  if (kind === 'loss') return v <= 0.5 ? 'good' : v <= 2 ? 'mid' : 'low';
  return '';
}

function finishTest(result) {
  state.result = result;
  setState('done');
  clearTimeout(state.titleTimer);
  $('#btn-stop').hidden = true;
  html.dataset.ph = 'download';
  $$('.ph').forEach((p) => p.classList.add('done'));
  setGaugeLabel('done');
  gauge.setColors(...PHASE_COLORS.done);
  gauge.setValue(result.download.avg);
  setReadout(fmtSpeed(result.download.avg), t(`u.${settings.unit}`));

  const setNum = (id, text, kind, v) => {
    const n = $(id + ' .num');
    n.textContent = text;
    n.className = 'num ' + qCls(kind, v);
  };
  setNum('#m-ping', fmtMs(result.ping.med), 'ping', result.ping.med);
  setNum('#m-jitter', fmtMs(result.ping.jitter), 'jitter', result.ping.jitter);
  setNum('#m-loss', result.loss.pct == null ? '—' : result.loss.pct.toFixed(1), 'loss', result.loss.pct);
  $('#m-download .num').textContent = fmtSpeed(result.download.avg);
  $('#m-upload .num').textContent = fmtSpeed(result.upload.avg);

  setGrade(scoreOf(result));
  $('#actions').setAttribute('aria-hidden', 'false');

  const hist = loadHistory();
  hist.unshift(compact(result));
  saveHistory(hist);
  document.title = t('title');
}

/* ── scoring & capabilities ──────────────────────────────── */

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const logScore = (v, lo, hi) => clamp01(Math.log10(Math.max(v, lo * 1.001) / lo) / Math.log10(hi / lo));

export function scoreOf(r) {
  const dl = logScore(r.download.avg, 0.5, 1000);
  const ul = logScore(r.upload.avg, 0.25, 500);
  const pg = clamp01(1 - (r.ping.med - 8) / 240);
  const jt = clamp01(1 - (r.ping.jitter - 4) / 90);
  const ls = r.loss.pct == null ? 0.9 : clamp01(1 - r.loss.pct / 5);
  const score = Math.round(100 * (0.42 * dl + 0.23 * ul + 0.20 * pg + 0.08 * jt + 0.07 * ls));
  const grade = score >= 85 ? 'exc' : score >= 70 ? 'vg' : score >= 55 ? 'good' : score >= 40 ? 'fair' : 'poor';
  const cls = score >= 70 ? 'good' : score >= 45 ? 'mid' : 'low';
  return { score, grade, cls };
}

export function capabilitiesOf(r) {
  const dl = r.download.avg, ul = r.upload.avg, pg = r.ping.med, jt = r.ping.jitter;
  const loss = r.loss.pct ?? 0;
  return [
    { k: 'stream4k', ok: dl >= 25, need: '≥ 25 Mbps' },
    { k: 'streamHD', ok: dl >= 5, need: '≥ 5 Mbps' },
    { k: 'calls', ok: dl >= 4 && ul >= 2.5 && pg <= 150, need: '↓4 ↑2.5 · ≤150ms' },
    { k: 'gameComp', ok: pg <= 60 && jt <= 15 && loss < 1, need: '≤60ms · ≤15ms' },
    { k: 'game', ok: pg <= 120, need: '≤ 120ms' },
    { k: 'bigDl', ok: dl >= 100, need: '≥ 100 Mbps' },
  ];
}

/* bufferbloat: latency increase under load → A+ … F */
export function bloatOf(r) {
  const s = r.loaded?.samples;
  if (!s || !s.length) return null;
  const avg = s.reduce((a, b) => a + b, 0) / s.length;
  const inc = Math.max(0, avg - (r.ping.med || 0));
  const grade = inc <= 5 ? 'A+' : inc <= 30 ? 'A' : inc <= 60 ? 'B' : inc <= 150 ? 'C' : inc <= 300 ? 'D' : 'F';
  return {
    avg, inc, grade,
    cls: grade.startsWith('A') ? 'good' : grade === 'B' || grade === 'C' ? 'mid' : 'low',
  };
}

/* one-line human verdict for the details drawer */
export function verdictOf(r) {
  const g = scoreOf(r).grade;
  let text = t(`v.${g === 'exc' || g === 'vg' ? 'exc' : g}`);
  const bl = bloatOf(r);
  if (bl && (bl.grade === 'D' || bl.grade === 'F')) text += ' ' + t('v.bloat');
  return text;
}

/* ── details drawer ──────────────────────────────────────── */

function statRow(k, v) {
  return `<div class="stat-row"><span class="k">${k}</span><span class="v">${v}</span></div>`;
}

function renderDetails(r) {
  const L = getLang();
  const d = t('d');
  const score = scoreOf(r);
  const caps = capabilitiesOf(r);
  const MB = (b) => (b / 1048576).toFixed(b < 10485760 ? 1 : 0);
  const date = new Date(r.ts);
  const dateStr = `${date.getDate()} ${t('monthNames')[date.getMonth()]} ${date.getFullYear()} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  const loaded = r.loaded.samples.length
    ? `${fmtMs(r.loaded.samples.reduce((a, b) => a + b, 0) / r.loaded.samples.length)} / ${fmtMs(Math.max(...r.loaded.samples))} ms <small>(${r.loaded.samples.length} ${d.samples})</small>`
    : `<small>${d.loadedNo}</small>`;
  const bl = bloatOf(r);
  const bloatVal = bl
    ? `<span style="color:var(--${bl.cls === 'good' ? 'ok' : bl.cls === 'mid' ? 'warn' : 'bad'})">${bl.grade}</span> <small>+${Math.round(bl.inc)} ms</small>`
    : `<small>${d.loadedNo}</small>`;
  const loss = r.loss.pct == null
    ? `<small>${d.loadedNo}</small>`
    : `${r.loss.pct.toFixed(1)}% <small>(${r.loss.lost} ${d.failed} ${d.of} ${r.loss.sent})</small>`;
  const consist = r.download.peak > 0
    ? `${Math.round((r.download.avg / r.download.peak) * 100)}%`
    : '—';
  const meta = r.meta || {};
  const server = `Cloudflare${meta.colo ? ' · ' + meta.colo : ''}${meta.coloCity ? ' — ' + meta.coloCity : ''}`;
  const conn = [meta.ip, meta.org || (meta.asn ? 'AS' + meta.asn : '')].filter(Boolean).join(' · ');
  const rid = (r.sharedCompact?.id) || r.id || resultId(compact(r));
  const connInfo = r.streams
    ? (L === 'ar'
        ? `${r.streams} تدفق متوازٍ · ${r.portsUsed || 1} اتصالات TCP`
        : `${r.streams} parallel streams · ${r.portsUsed || 1} TCP connections`)
    : '—';

  const rows = [
    statRow(d.dlAvg, `${fmtSpeed(r.download.avg)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.dlPeak, `${fmtSpeed(r.download.peak)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.ulAvg, `${fmtSpeed(r.upload.avg)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.ulPeak, `${fmtSpeed(r.upload.peak)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.consistency, consist),
    statRow(d.vol, `${MB(r.download.bytes + r.upload.bytes)} MB`),
    statRow(d.dur, `~${Math.round((r.download.ms + r.upload.ms) / 1000)}s + ${L === 'ar' ? 'الاستجابة' : 'ping'}`),
    statRow(d.pingMin, `${fmtMs(r.ping.min)} ms`),
    statRow(d.pingMed, `${fmtMs(r.ping.med)} ms`),
    statRow(d.pingAvg, `${fmtMs(r.ping.avg)} ms`),
    statRow(d.pingMax, `${fmtMs(r.ping.max)} ms`),
    statRow(d.jitter, `${fmtMs(r.ping.jitter)} ms`),
    statRow(d.loss, loss),
    statRow(d.loaded, loaded),
    statRow(d.bloat, bloatVal),
    statRow(d.server, server),
    statRow(d.proto, meta.proto || '—'),
    statRow(d.conn, conn || '—'),
    statRow(d.date, dateStr),
    statRow(d.connCount, connInfo),
    statRow(d.resultId, `<bdi>${rid}</bdi>`),
  ].join('');

  const capsHtml = caps.map((c) => `
    <li class="cap ${c.ok ? 'yes' : 'no'}">
      <span class="st">${c.ok
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'}</span>
      <span class="lbl">${t(`cap.${c.k}`)}</span>
      <span class="res">${c.need}</span>
    </li>`).join('');

  const hist = loadHistory().filter((h) => h.ts !== r.ts);
  const histHtml = hist.length ? hist.map((h) => `
    <div class="hrow">
      <span class="t">${histLabel(h.ts)}</span>
      <span class="x">↓ <b>${fmtSpeed(h.dl)}</b></span>
      <span class="x">↑ <b>${fmtSpeed(h.ul)}</b></span>
      <span class="x">${fmtMs(h.pg)}ms</span>
    </div>`).join('') : `<p class="h-empty">—</p>`;

  $('#details-body').innerHTML = `
    <div class="score-block">
      <div class="score-num" style="color:${score.cls === 'good' ? 'var(--ok)' : score.cls === 'mid' ? 'var(--warn)' : 'var(--bad)'}">${score.score}</div>
      <div class="score-side">
        <div class="score-grade">${t(`grade.${score.grade}`)}<span style="color:var(--txt-3);font-weight:400"> · 0–100</span></div>
        <div class="score-bar"><i style="width:${score.score}%"></i></div>
        <p class="verdict">${verdictOf(r)}</p>
      </div>
    </div>
    <div>
      <div class="d-sec-title" style="margin-bottom:8px">${d.stats}</div>
      <div class="stat-rows">${rows}</div>
    </div>
    <div>
      <div class="d-sec-title" style="margin-bottom:4px">${d.caps}</div>
      <ul class="caps">${capsHtml}</ul>
    </div>
    <div>
      <div class="d-sec-title" style="margin-bottom:8px">${d.realWorld}</div>
      <div class="stat-rows">
        ${statRow(d.file1gb, fmtDur(8192 / Math.max(r.download.avg, 0.01)))}
        ${statRow(d.file10gb, fmtDur(81920 / Math.max(r.download.avg, 0.01)))}
        ${statRow(d.film4k, fmtDur(57344 / Math.max(r.download.avg, 0.01)))}
        ${statRow(d.album, fmtDur(4096 / Math.max(r.upload.avg, 0.01)))}
      </div>
    </div>
    <div>
      <div class="d-sec-title" style="margin-bottom:4px">${d.history}</div>
      <div class="history">${histHtml}</div>
      ${hist.length ? `<button class="btn btn-ghost" id="btn-clearhist" style="margin-top:8px">${d.clearHistory}</button>` : ''}
    </div>
    <div class="drawer-actions">
      <button class="btn" id="d-share">${t('a.share')}</button>
      <button class="btn btn-accent" id="d-img">${t('sh.img')}</button>
      <button class="btn" id="d-png">${t('sh.png')}</button>
      <button class="btn" id="d-json">${t('sh.json')}</button>
    </div>`;

  $('#d-share').onclick = () => { closeDrawers(); openShareMenu(); };
  $('#d-img').onclick = () => { closeDrawers(); shareImage(); };
  $('#d-png').onclick = () => exportPng();
  $('#d-json').onclick = () => exportJson();
  const ch = $('#btn-clearhist');
  if (ch) ch.onclick = () => { saveHistory([]); renderDetails(r); toast(t('t.cleared')); };
}

function histLabel(ts) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.getDate()}/${d.getMonth() + 1}`;
}

/* ── drawers / menu ──────────────────────────────────────── */

function openDrawer(id) {
  closeDrawers();
  const dr = $(id);
  dr.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => dr.classList.add('open'));
  $('#scrim').hidden = false;
  document.body.style.overflow = 'hidden';
  dr.querySelector('[data-close]')?.focus();
}
function closeDrawers() {
  $$('.drawer').forEach((d) => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); });
  $('#scrim').hidden = true;
  document.body.style.overflow = '';
  closeShareMenu();
}
function openShareMenu() { $('#share-menu').hidden = false; }
function closeShareMenu() { $('#share-menu').hidden = true; }

/* ── share / export ──────────────────────────────────────── */

/* Ookla-style short result identifier, derived from the result itself */
function resultId(c) {
  let h = 0x811c9dc5;
  const s = `sp|${c.ts}|${c.dl}|${c.ul}|${c.pg}|${c.jt}`;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return 'SP-' + h.toString(36).toUpperCase().padStart(7, '0').slice(0, 10);
}

function compact(r) {
  const c = {
    ts: r.ts, dl: +r.download.avg.toFixed(2), ul: +r.upload.avg.toFixed(2),
    pg: +r.ping.med.toFixed(1), jt: +r.ping.jitter.toFixed(1),
    ls: r.loss.pct == null ? null : +r.loss.pct.toFixed(1),
    sc: scoreOf(r).score,
    org: r.meta?.org || '', city: r.meta?.city || '', colo: r.meta?.colo || '', v: 2,
  };
  c.id = r.id || resultId(c);
  return c;
}
function expand(c) {
  const r = {
    ts: c.ts, id: c.id, meta: { org: c.org, city: c.city, colo: c.colo, proto: '' },
    ping: { med: c.pg, min: c.pg, avg: c.pg, max: c.pg, jitter: c.jt, samples: [] },
    loss: { pct: c.ls, sent: 0, lost: 0 },
    loaded: { samples: [] },
    download: { avg: c.dl, peak: c.dl, bytes: 0, ms: 0 },
    upload: { avg: c.ul, peak: c.ul, bytes: 0, ms: 0 },
    sharedCompact: c,
  };
  return r;
}

function resultLink(r) {
  const c = compact(r);
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(c))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${location.origin}${location.pathname}#r=${payload}`;
}

function summaryText(r) {
  const c = compact(r);
  const L = getLang();
  const date = new Date(c.ts);
  const ds = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (L === 'ar') {
    return [
      'SPOS Net — نتيجة اختبار السرعة',
      `التنزيل: ${fmtSpeed(c.dl)} Mbps · الرفع: ${fmtSpeed(c.ul)} Mbps`,
      `الاستجابة: ${fmtMs(c.pg)} ms · التذبذب: ${fmtMs(c.jt)} ms · فقدان الحزم: ${c.ls == null ? '—' : c.ls + '%'}`,
      c.org ? `المزود: ${c.org}${c.city ? ' — ' + c.city : ''}` : '',
      `التقييم: ${t(`grade.${scoreOf(r).grade}`)} ${c.sc}/100`,
      `${ds} · ${SITE_URL}`,
    ].filter(Boolean).join('\n');
  }
  return [
    'SPOS Net — Speed Test Result',
    `Download: ${fmtSpeed(c.dl)} Mbps · Upload: ${fmtSpeed(c.ul)} Mbps`,
    `Ping: ${fmtMs(c.pg)} ms · Jitter: ${fmtMs(c.jt)} ms · Loss: ${c.ls == null ? '—' : c.ls + '%'}`,
    c.org ? `ISP: ${c.org}${c.city ? ' — ' + c.city : ''}` : '',
    `Grade: ${t(`grade.${scoreOf(r).grade}`)} ${c.sc}/100`,
    `${ds} · ${SITE_URL}`,
  ].filter(Boolean).join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('t.copied'));
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast(t('t.copied'));
    } catch { toast(t('t.copyFail')); }
  }
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(t('t.saved'));
}

function exportJson() {
  const r = state.result;
  if (!r) return;
  const out = r.sharedCompact || compact(r);
  downloadBlob(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }), `sposnet-${new Date(r.ts).toISOString().slice(0, 10)}.json`);
}

function loadLogo() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = 'assets/img/logo.png';
  });
}

async function buildCardBlob(r) {
  const c = r.sharedCompact || compact(r);
  const L = getLang();
  await document.fonts.ready;
  const logo = await loadLogo();

  const W = 1200, H = 630, S = 2;
  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const x = cv.getContext('2d');
  x.scale(S, S);
  x.direction = L === 'ar' ? 'rtl' : 'ltr';

  /* background */
  x.fillStyle = '#090b11';
  x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, 200, 40, W / 2, 200, 620);
  g.addColorStop(0, 'rgba(35,48,76,.55)');
  g.addColorStop(1, 'rgba(9,11,17,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);

  const SANS = "'IBM Plex Sans Arabic', sans-serif";
  const MONO = "'IBM Plex Mono', monospace";

  /* header */
  x.textBaseline = 'middle';
  x.textAlign = 'start';
  x.fillStyle = '#e9edf5';
  x.font = `600 30px ${SANS}`;
  const RTL = L === 'ar';
  const pad = 64;
  const put = (fn) => { RTL ? (x.textAlign = 'right', fn(W - pad)) : (x.textAlign = 'left', fn(pad)); };

  put((X) => x.fillText('SPOS Net', X, 66));
  x.fillStyle = '#5d6880';
  x.font = `400 17px ${SANS}`;
  const tagline = RTL ? 'اختبار سرعة الإنترنت — نتيجة مشارَكة' : 'Internet speed test — shared result';
  put((X) => x.fillText(tagline, X, 104));

  /* company logo (opposite corner of the wordmark) */
  if (logo) {
    const ls = 46, lx = RTL ? pad : W - pad - ls, ly = 62;
    const r0 = 12;
    x.save();
    x.beginPath();
    x.moveTo(lx + r0, ly);
    x.arcTo(lx + ls, ly, lx + ls, ly + ls, r0);
    x.arcTo(lx + ls, ly + ls, lx, ly + ls, r0);
    x.arcTo(lx, ly + ls, lx, ly, r0);
    x.arcTo(lx, ly, lx + ls, ly, r0);
    x.closePath();
    x.clip();
    x.drawImage(logo, lx, ly, ls, ls);
    x.restore();
  }

  /* gauge */
  const gx = W / 2, gy = 350, gr = 150;
  x.lineWidth = 13;
  x.strokeStyle = '#161c29';
  x.beginPath(); x.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 2.25); x.stroke();

  const frac = Math.max(0.004, Math.min(1, logScore(c.dl, 0.5, 1000)));
  const a0 = Math.PI * 0.75, a1 = a0 + Math.PI * 1.5 * frac;
  const grad = x.createLinearGradient(gx - gr, 0, gx + gr, 0);
  grad.addColorStop(0, '#3d7fd6'); grad.addColorStop(1, '#6fb5ff');
  x.strokeStyle = grad;
  x.beginPath(); x.arc(gx, gy, gr, a0, a1); x.stroke();

  /* value marker at the arc end (no center needle — keeps the big number clean) */
  const na = a0 + Math.PI * 1.5 * frac;
  x.fillStyle = '#e9edf5';
  x.beginPath(); x.arc(gx + Math.cos(na) * gr, gy + Math.sin(na) * gr, 7, 0, 7); x.fill();

  /* center value */
  x.textAlign = 'center';
  x.fillStyle = '#e9edf5';
  x.font = `500 64px ${MONO}`;
  x.fillText(fmtSpeed(c.dl), gx, gy - 26);
  x.fillStyle = '#9aa4b8';
  x.font = `500 20px ${SANS}`;
  x.fillText('Mbps  ·  ' + (RTL ? 'التنزيل' : 'Download'), gx, gy + 22);
  x.fillStyle = '#7f8ba3';
  x.font = `500 17px ${SANS}`;
  x.fillText(`${t(`grade.${scoreOf(r).grade}`)} · ${c.sc}/100`, gx, gy + 52);

  /* metric tiles */
  const tiles = [
    [(RTL ? 'الرفع' : 'Upload'), `${fmtSpeed(c.ul)}`, 'Mbps', '#a892ff'],
    [(RTL ? 'الاستجابة' : 'Ping'), `${fmtMs(c.pg)}`, 'ms', '#aeb9d2'],
    [(RTL ? 'التذبذب' : 'Jitter'), `${fmtMs(c.jt)}`, 'ms', '#aeb9d2'],
    [(RTL ? 'فقدان الحزم' : 'Loss'), `${c.ls == null ? '—' : c.ls}`, '%', '#aeb9d2'],
  ];
  const tw = (W - pad * 2) / 4;
  x.strokeStyle = '#1a2130';
  x.beginPath(); x.moveTo(pad, 528); x.lineTo(W - pad, 528); x.stroke();
  tiles.forEach(([label, val, unit, color], i) => {
    const tx = pad + tw * i + tw / 2;
    x.fillStyle = '#5d6880';
    x.font = `500 15px ${SANS}`;
    x.fillText(label, tx, 556);
    x.fillStyle = color;
    x.font = `500 30px ${MONO}`;
    x.fillText(`${val} ${unit}`, tx, 592);
    if (i) {
      x.strokeStyle = '#1a2130';
      x.beginPath(); x.moveTo(pad + tw * i, 540); x.lineTo(pad + tw * i, 606); x.stroke();
    }
  });

  /* footer */
  x.fillStyle = '#5d6880';
  x.font = `400 14px ${SANS}`;
  x.textAlign = RTL ? 'right' : 'left';
  const d = new Date(c.ts);
  const ds = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  x.fillText(`${ds}  ·  ${c.org || ''}`, RTL ? W - pad : pad, 606 - 82);
  x.textAlign = RTL ? 'left' : 'right';
  x.fillText(`${c.id ? c.id + '  ·  ' : ''}spos-systems.github.io/SPOS-Net`, RTL ? pad : W - pad, 524);

  return new Promise((resolve) => cv.toBlob(resolve, 'image/png'));
}

function exportPng() {
  const r = state.result;
  if (!r) return;
  const c = r.sharedCompact || compact(r);
  buildCardBlob(r).then((b) => { if (b) downloadBlob(b, `sposnet-${c.id || c.ts}.png`); });
}

/* share the rendered result card straight into the phone's share sheet */
async function shareImage() {
  const r = state.result;
  if (!r) return;
  const c = r.sharedCompact || compact(r);
  try {
    const blob = await buildCardBlob(r);
    if (!blob) return;
    const file = new File([blob], `sposnet-${c.id || c.ts}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'SPOS Net', text: shortText(r) });
      return;
    }
    downloadBlob(blob, `sposnet-${c.id || c.ts}.png`);
    toast(t('t.imgFallback'));
  } catch { /* user dismissed the share sheet */ }
}

async function nativeShare(r) {
  const c = compact(r);
  try {
    await navigator.share({
      title: 'SPOS Net',
      text: summaryText(r),
      url: resultLink(r),
    });
  } catch { /* user cancelled */ }
}

/* compact one-liner for character-limited share targets */
function shortText(r) {
  const c = r.sharedCompact || compact(r);
  return `\u200ESPOS Net — \u2193${fmtSpeed(c.dl)} \u2191${fmtSpeed(c.ul)} Mbps · Ping ${fmtMs(c.pg)} ms · ${c.sc}/100`;
}

function openShare(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/* ── shared-result view ──────────────────────────────────── */

function clearShared() {
  state.shared = null;
  history.replaceState(null, '', location.pathname + location.search);
}

function trySharedView() {
  const m = location.hash.match(/[#&]r=([\w-]+)/);
  if (!m) return false;
  try {
    const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))));
    const c = JSON.parse(json);
    if (!c || typeof c.dl !== 'number' || c.v !== 2) return false;
    const r = expand(c);
    state.shared = r;
    state.result = r;
    setState('done');
    html.dataset.ph = 'download';
    setGaugeLabel('shared');
    gauge.setColors(...PHASE_COLORS.done);
    gauge.setValue(r.download.avg);
    setReadout(fmtSpeed(r.download.avg), t(`u.${settings.unit}`));
    $('#btn-start').hidden = true;
    $('#g-readout').hidden = false;

    $('#m-ping .num').textContent = fmtMs(r.ping.med);
    $('#m-jitter .num').textContent = fmtMs(r.ping.jitter);
    $('#m-loss .num').textContent = c.ls == null ? '—' : c.ls.toFixed(1);
    $('#m-ping .num').className = 'num ' + qCls('ping', r.ping.med);
    $('#m-jitter .num').className = 'num ' + qCls('jitter', r.ping.jitter);
    $('#m-loss .num').className = 'num ' + qCls('loss', c.ls);
    $('#m-download .num').textContent = fmtSpeed(r.download.avg);
    $('#m-upload .num').textContent = fmtSpeed(r.upload.avg);
    $$('.metric').forEach((el) => el.classList.add('on'));

    setGrade(scoreOf(r));
    $('#actions').setAttribute('aria-hidden', 'false');

    const again = $('#btn-again');
    again.querySelector('span').textContent = t('t.runYours');
    toast(t('t.sharedNote'));
    return true;
  } catch { return false; }
}

/* ── settings UI ─────────────────────────────────────────── */

function reflectSettings() {
  $$('.seg').forEach((seg) => {
    const key = seg.dataset.setting;
    const val = String(settings[key]);
    $$('button', seg).forEach((b) => {
      b.classList.toggle('on', b.dataset.val === val);
      b.setAttribute('aria-checked', String(b.dataset.val === val));
    });
  });
  $$('.switch').forEach((sw) => {
    sw.setAttribute('aria-checked', String(!!settings[sw.dataset.setting]));
  });
}

function bindSettings() {
  $$('.seg button').forEach((b) => {
    b.addEventListener('click', () => {
      const seg = b.closest('.seg');
      const key = seg.dataset.setting;
      let val = b.dataset.val;
      if (key === 'duration' || key === 'streams') val = Number(val);
      if (key === 'lang') {
        settings.lang = val;
        setLang(val);
        saveSettings();
        applyLang();
        reflectSettings();
        return;
      }
      settings[key] = val;
      saveSettings();
      reflectSettings();
      if (state.mode === 'running') $('#set-note').hidden = false;
      if (key === 'unit') {
        $('#m-download .unit').textContent = t(`u.${settings.unit}`);
        $('#m-upload .unit').textContent = t(`u.${settings.unit}`);
        if (state.result) {
          $('#m-download .num').textContent = fmtSpeed(state.result.download.avg);
          $('#m-upload .num').textContent = fmtSpeed(state.result.upload.avg);
          if (state.mode === 'done') setReadout(fmtSpeed(state.result.download.avg), t(`u.${settings.unit}`));
        }
      }
    });
  });
  $$('.switch').forEach((sw) => {
    sw.addEventListener('click', () => {
      const key = sw.dataset.setting;
      settings[key] = !settings[key];
      saveSettings();
      reflectSettings();
      if (state.mode === 'running') $('#set-note').hidden = false;
    });
  });
  $('#btn-reset').addEventListener('click', () => {
    settings = { ...DEFAULTS, lang: settings.lang };
    saveSettings();
    reflectSettings();
    toast(t('t.resetDone'));
  });
}

/* ── boot ────────────────────────────────────────────────── */

/* first visit: follow the browser language (saved choice wins) */
function detectLang() {
  try { if (localStorage.getItem('sposnet.settings')) return null; } catch { /* private mode */ }
  const ls = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'ar'];
  return ls.some((l) => l && l.toLowerCase().startsWith('ar')) ? 'ar' : 'en';
}

function toggleDrawer(id) {
  const dr = $(id);
  dr.classList.contains('open') ? closeDrawers() : openDrawer(id);
}

function boot() {
  /* URL params: ?lang=ar|en · ?auto=1 (kiosk/embed autostart) */
  const qp = new URLSearchParams(location.search);
  const qLang = qp.get('lang');
  const detected = detectLang();
  if (qLang === 'ar' || qLang === 'en') settings.lang = qLang;
  else if (detected) settings.lang = detected;
  if (qLang || detected) saveSettings();

  setLang(settings.lang);
  gauge = new Gauge($('#gauge-svg'));
  SPARK.init($('#spark'));
  engine = new Engine({});
  applyLang();
  reflectSettings();
  bindSettings();
  resetUI();
  $('#ver-tag').textContent = `SPOS Net v${VERSION}`;

  /* PWA: register the service worker (offline app shell) */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  addEventListener('online', () => toast(t('t.online')));
  addEventListener('offline', () => toast(t('t.offline')));

  /* single rAF loop for the gauge */
  let last = performance.now();
  const loop = (now) => {
    const dt = now - last;
    last = now;
    gauge.tick(now, dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  $('#btn-start').addEventListener('click', startTest);
  $('#btn-again').addEventListener('click', startTest);
  $('#btn-stop').addEventListener('click', () => engine.stop());
  $('#btn-settings').addEventListener('click', () => openDrawer('#dr-settings'));
  $('#btn-details').addEventListener('click', () => {
    if (state.result) { renderDetails(state.result); openDrawer('#dr-details'); }
  });
  $('#btn-lang').addEventListener('click', () => {
    settings.lang = getLang() === 'ar' ? 'en' : 'ar';
    setLang(settings.lang);
    saveSettings();
    applyLang();
    reflectSettings();
  });

  $('#btn-share').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#share-menu').hidden ? openShareMenu() : closeShareMenu();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-anchor')) closeShareMenu();
  });
  $('#mi-link').addEventListener('click', () => { closeShareMenu(); if (state.result) copyText(resultLink(state.result)); });
  $('#mi-img').addEventListener('click', () => { closeShareMenu(); shareImage(); });
  $('#mi-text').addEventListener('click', () => { closeShareMenu(); if (state.result) copyText(summaryText(state.result)); });
  $('#mi-png').addEventListener('click', () => { closeShareMenu(); exportPng(); });
  $('#mi-json').addEventListener('click', () => { closeShareMenu(); exportJson(); });
  $('#mi-wa').addEventListener('click', () => {
    closeShareMenu();
    if (!state.result) return;
    openShare(`https://wa.me/?text=${encodeURIComponent(shortText(state.result) + '\n' + resultLink(state.result))}`);
  });
  $('#mi-x').addEventListener('click', () => {
    closeShareMenu();
    if (!state.result) return;
    openShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText(state.result))}&url=${encodeURIComponent(resultLink(state.result))}`);
  });
  $('#mi-tg').addEventListener('click', () => {
    closeShareMenu();
    if (!state.result) return;
    openShare(`https://t.me/share/url?url=${encodeURIComponent(resultLink(state.result))}&text=${encodeURIComponent(shortText(state.result))}`);
  });
  if (navigator.share) {
    $('#mi-native').hidden = false;
    $('#mi-native').addEventListener('click', () => { closeShareMenu(); if (state.result) nativeShare(state.result); });
  }

  /* PWA install */
  let installEvt = null;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isIOS && !isStandalone) $('#btn-install').hidden = false;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvt = e;
    $('#btn-install').hidden = false;
  });
  $('#btn-install').addEventListener('click', async () => {
    if (!installEvt) {
      if (isIOS) toast(t('t.iosInstall'), 5600);   /* Safari: Share → Add to Home Screen */
      return;
    }
    installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    installEvt = null;
    $('#btn-install').hidden = true;
  });
  window.addEventListener('appinstalled', () => {
    installEvt = null;
    $('#btn-install').hidden = true;
    toast(t('t.installed'));
  });

  /* keyboard shortcuts: Space · S · D (ignored while typing or in dialogs) */
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    const anyOpen = $$('.drawer').some((d) => d.classList.contains('open'));
    if (e.code === 'Space') {
      if (anyOpen || e.target.closest('button, a, [role="switch"]')) return;
      e.preventDefault();
      state.mode === 'running' ? engine.stop() : startTest();
    } else if (e.key === 's' || e.key === 'S') {
      toggleDrawer('#dr-settings');
    } else if (e.key === 'd' || e.key === 'D') {
      if (!state.result) return;
      if (anyOpen && !$('#dr-details').classList.contains('open')) closeDrawers();
      renderDetails(state.result);
      toggleDrawer('#dr-details');
    }
  });

  $('#scrim').addEventListener('click', closeDrawers);
  $$('[data-close]').forEach((b) => b.addEventListener('click', closeDrawers));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDrawers(); closeShareMenu(); }
  });

  window.addEventListener('hashchange', () => {
    if (location.hash.includes('r=') && state.mode !== 'running') location.reload();
  });

  initMeta();
  const shared = trySharedView();
  if (!shared && qp.get('auto') === '1') {
    setTimeout(() => { if (state.mode === 'idle') startTest(); }, 900);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
