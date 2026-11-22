/* SPOS Net — application controller */

import { getLang, setLang, t } from './i18n.js';
import { Engine } from './engine.js';
import { Gauge } from './gauge.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const SITE_URL = 'https://spos-systems.github.io/SPOS-Net/';
const VERSION = '2.0.0';

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
  try { localStorage.setItem('sposnet.history', JSON.stringify(list.slice(0, 10))); } catch { /* ignore */ }
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

function setState(mode) {
  state.mode = mode;
  html.dataset.state = mode;
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2600);
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
  $$('.metric').forEach((m) => { m.classList.remove('on'); m.querySelector('.num').textContent = '—'; });
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
    phase: phaseUI,
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

  $('#m-ping .num').textContent = fmtMs(result.ping.med);
  $('#m-jitter .num').textContent = fmtMs(result.ping.jitter);
  const lossEl = $('#m-loss');
  lossEl.querySelector('.num').textContent = result.loss.pct == null ? '—' : result.loss.pct.toFixed(1);
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
  const loss = r.loss.pct == null
    ? `<small>${d.loadedNo}</small>`
    : `${r.loss.pct.toFixed(1)}% <small>(${r.loss.lost} ${d.failed} ${d.of} ${r.loss.sent})</small>`;
  const meta = r.meta || {};
  const server = `Cloudflare${meta.colo ? ' · ' + meta.colo : ''}${meta.coloCity ? ' — ' + meta.coloCity : ''}`;
  const conn = [meta.ip, meta.org || (meta.asn ? 'AS' + meta.asn : '')].filter(Boolean).join(' · ');

  const rows = [
    statRow(d.dlAvg, `${fmtSpeed(r.download.avg)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.dlPeak, `${fmtSpeed(r.download.peak)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.ulAvg, `${fmtSpeed(r.upload.avg)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.ulPeak, `${fmtSpeed(r.upload.peak)} <small>${t(`u.${settings.unit}`)}</small>`),
    statRow(d.vol, `${MB(r.download.bytes + r.upload.bytes)} MB`),
    statRow(d.dur, `~${Math.round((r.download.ms + r.upload.ms) / 1000)}s + ${L === 'ar' ? 'الاستجابة' : 'ping'}`),
    statRow(d.pingMin, `${fmtMs(r.ping.min)} ms`),
    statRow(d.pingMed, `${fmtMs(r.ping.med)} ms`),
    statRow(d.pingAvg, `${fmtMs(r.ping.avg)} ms`),
    statRow(d.pingMax, `${fmtMs(r.ping.max)} ms`),
    statRow(d.jitter, `${fmtMs(r.ping.jitter)} ms`),
    statRow(d.loss, loss),
    statRow(d.loaded, loaded),
    statRow(d.server, server),
    statRow(d.proto, meta.proto || '—'),
    statRow(d.conn, conn || '—'),
    statRow(d.date, dateStr),
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
      <div class="d-sec-title" style="margin-bottom:4px">${d.history}</div>
      <div class="history">${histHtml}</div>
      ${hist.length ? `<button class="btn btn-ghost" id="btn-clearhist" style="margin-top:8px">${d.clearHistory}</button>` : ''}
    </div>
    <div class="drawer-actions">
      <button class="btn" id="d-share">${t('a.share')}</button>
      <button class="btn" id="d-png">${t('sh.png')}</button>
      <button class="btn" id="d-json">${t('sh.json')}</button>
    </div>`;

  $('#d-share').onclick = () => { closeDrawers(); openShareMenu(); };
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

function compact(r) {
  return {
    ts: r.ts, dl: +r.download.avg.toFixed(2), ul: +r.upload.avg.toFixed(2),
    pg: +r.ping.med.toFixed(1), jt: +r.ping.jitter.toFixed(1),
    ls: r.loss.pct == null ? null : +r.loss.pct.toFixed(1),
    sc: scoreOf(r).score,
    org: r.meta?.org || '', city: r.meta?.city || '', colo: r.meta?.colo || '', v: 2,
  };
}
function expand(c) {
  return {
    ts: c.ts, meta: { org: c.org, city: c.city, colo: c.colo, proto: '' },
    ping: { med: c.pg, min: c.pg, avg: c.pg, max: c.pg, jitter: c.jt, samples: [] },
    loss: { pct: c.ls, sent: 0, lost: 0 },
    loaded: { samples: [] },
    download: { avg: c.dl, peak: c.dl, bytes: 0, ms: 0 },
    upload: { avg: c.ul, peak: c.ul, bytes: 0, ms: 0 },
    sharedCompact: c,
  };
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

async function exportPng() {
  const r = state.result;
  if (!r) return;
  const c = r.sharedCompact || compact(r);
  const L = getLang();
  await document.fonts.ready;

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

  /* left mini logo arc (language-agnostic corner) */
  const cx = RTL ? pad + 22 : W - pad - 22, cy = 84;
  x.lineWidth = 5; x.lineCap = 'round';
  const grad2 = x.createLinearGradient(cx - 20, 0, cx + 20, 0);
  grad2.addColorStop(0, '#3d7fd6'); grad2.addColorStop(1, '#a48ffc');
  x.strokeStyle = grad2;
  x.beginPath(); x.arc(cx, cy, 19, Math.PI * 0.75, Math.PI * 2.25); x.stroke();
  x.strokeStyle = '#e9edf5'; x.lineWidth = 4;
  x.beginPath(); x.moveTo(cx - 5, cy + 12); x.lineTo(cx + 9, cy - 16); x.stroke();
  x.fillStyle = '#e9edf5';
  x.beginPath(); x.arc(cx, cy, 3.6, 0, 7); x.fill();

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

  /* needle */
  const na = a0 + Math.PI * 1.5 * frac - Math.PI / 2;
  x.strokeStyle = '#dfe6f2'; x.lineWidth = 5;
  x.beginPath(); x.moveTo(gx, gy);
  x.lineTo(gx + Math.cos(na) * (gr - 30), gy + Math.sin(na) * (gr - 30)); x.stroke();
  x.fillStyle = '#141926'; x.strokeStyle = '#2a3347'; x.lineWidth = 2;
  x.beginPath(); x.arc(gx, gy, 10, 0, 7); x.fill(); x.stroke();

  /* center value */
  x.textAlign = 'center';
  x.fillStyle = '#e9edf5';
  x.font = `500 64px ${MONO}`;
  x.fillText(fmtSpeed(c.dl), gx, gy - 26);
  x.fillStyle = '#9aa4b8';
  x.font = `500 20px ${SANS}`;
  x.fillText('Mbps  ·  ' + (RTL ? 'التنزيل' : 'Download'), gx, gy + 22);

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
  x.fillText('spos-systems.github.io/SPOS-Net', RTL ? pad : W - pad, 524);

  cv.toBlob((b) => downloadBlob(b, `sposnet-result-${c.ts}.png`), 'image/png');
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

function boot() {
  setLang(settings.lang);
  gauge = new Gauge($('#gauge-svg'));
  engine = new Engine({});
  applyLang();
  reflectSettings();
  bindSettings();
  resetUI();

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
  $('#mi-text').addEventListener('click', () => { closeShareMenu(); if (state.result) copyText(summaryText(state.result)); });
  $('#mi-png').addEventListener('click', () => { closeShareMenu(); exportPng(); });
  $('#mi-json').addEventListener('click', () => { closeShareMenu(); exportJson(); });
  if (navigator.share) {
    $('#mi-native').hidden = false;
    $('#mi-native').addEventListener('click', () => { closeShareMenu(); if (state.result) nativeShare(state.result); });
  }

  $('#scrim').addEventListener('click', closeDrawers);
  $$('[data-close]').forEach((b) => b.addEventListener('click', closeDrawers));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDrawers(); closeShareMenu(); }
  });

  window.addEventListener('hashchange', () => {
    if (location.hash.includes('r=') && state.mode !== 'running') location.reload();
  });

  initMeta();
  trySharedView();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
