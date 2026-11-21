'use strict';
/**
 * SPOS Net — application orchestration:
 * test flow, results, grading, history, sharing, theme & language.
 */
(() => {

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  /* ---------- Cloudflare colo (IATA) → Arabic city name ---------- */
  const COLO = {
    HKG: 'هونغ كونغ', SIN: 'سنغافورة', NRT: 'طوكيو', KIX: 'أوساكا', ICN: 'سول',
    PVG: 'شنغهاي', PEK: 'بكين', CAN: 'قوانغتشو', SZX: 'شنتشن', TPE: 'تايبيه',
    BKK: 'بانكوك', KUL: 'كوالالمبور', CGK: 'جاكرتا', MNL: 'مانيلا', SGN: 'هوشي منه',
    HAN: 'هانوي', CMB: 'كولومبو', DAC: 'دكا', KTM: 'كاتماندو', ISB: 'إسلام آباد',
    KHI: 'كراتشي', BOM: 'مومباي', DEL: 'دلهي', MAA: 'تشيناي', BLR: 'بنغالور',
    HYD: 'حيدر آباد', CCU: 'كلكتا', DXB: 'دبي', AUH: 'أبوظبي', SHJ: 'الشارقة',
    DOH: 'الدوحة', BAH: 'المنامة', KWI: 'الكويت', RUH: 'الرياض', JED: 'جدة',
    DMM: 'الدمام', MCT: 'مسقط', AMM: 'عمّان', BEY: 'بيروت', BGW: 'بغداد',
    EBL: 'أربيل', IKA: 'طهران', IST: 'إسطنبول', SAW: 'إسطنبول', FRA: 'فرانكفورت',
    MUC: 'ميونخ', DUS: 'دوسلدورف', HAM: 'هامبورغ', BER: 'برلين', STR: 'شتوتغارت',
    AMS: 'أمستردام', BRU: 'بروكسل', LHR: 'لندن', MAN: 'مانشستر', EDI: 'إدنبرة',
    DUB: 'دبلن', CDG: 'باريس', MRS: 'مارسيليا', LYS: 'ليون', NCE: 'نيس',
    ORY: 'باريس', MXP: 'ميلانو', FCO: 'روما', PMO: 'باليرمو', TRN: 'تورينو',
    NAP: 'نابولي', ZRH: 'زيوريخ', GVA: 'جنيف', VIE: 'فيينا', PRG: 'براغ',
    WAW: 'وارسو', BUD: 'بودابست', OTP: 'بوخارست', SOF: 'صوفيا', ATH: 'أثينا',
    SKG: 'سالونيك', MLA: 'مالطة', CPH: 'كوبنهاغن', ARN: 'ستوكهولم', OSL: 'أوسلو',
    HEL: 'هلسنكي', RIX: 'ريغا', TLL: 'تالين', VNO: 'فيلنيوس', KEF: 'ريكيافيك',
    CAI: 'القاهرة', ALY: 'الإسكندرية', TUN: 'تونس', MIR: 'المنستير', SFA: 'صفاقس',
    NBE: 'النفيضة', ALG: 'الجزائر', ORN: 'وهران', CMN: 'الدار البيضاء', RAK: 'مراكش',
    TNG: 'طنجة', FEZ: 'فاس', AGA: 'أكادير', LOS: 'لاغوس', ABV: 'أبوجا',
    ACC: 'أكرا', NBO: 'نيروبي', JNB: 'جوهانسبرغ', CPT: 'كيب تاون', DUR: 'ديربان',
    DAR: 'دار السلام', KGL: 'كيغالي', EBB: 'أنتيبي', ADD: 'أديس أبابا',
    LAX: 'لوس أنجلوس', SFO: 'سان فرانسيسكو', SEA: 'سياتل', ORD: 'شيكاغو',
    DFW: 'دالاس', IAH: 'هيوستن', ATL: 'أطلانطا', MIA: 'ميامي', JFK: 'نيويورك',
    EWR: 'نيويورك', BOS: 'بوسطن', IAD: 'واشنطن', PHX: 'فينيكس', DEN: 'دنفر',
    MSP: 'مينيابوليس', DTW: 'ديترويت', PHL: 'فيلادلفيا', CLT: 'شارلوت',
    LAS: 'لاس فيغاس', SAN: 'سان دييغو', YYZ: 'تورونتو', YVR: 'فانكوفر',
    YUL: 'مونتريال', GRU: 'ساو باولو', GIG: 'ريو دي جانيرو', EZE: 'بوينس آيرس',
    SCL: 'سانتياغو', BOG: 'بوغوتا', LIM: 'ليما', MEX: 'مكسيكو سيتي', UIO: 'كيتو',
    SYD: 'سيدني', MEL: 'ملبورن', BNE: 'بريزبن', PER: 'بيرث', AKL: 'أوكلاند',
    DME: 'موسكو', LED: 'سان بطرسبرغ', ALA: 'ألماتي', TAS: 'طشقند', TAS2: 'طشقند',
  };

  /* ---------- grading ---------- */
  const gradeDown = (v) => v >= 300 ? 5 : v >= 100 ? 4 : v >= 50 ? 3 : v >= 25 ? 2 : v >= 10 ? 1 : 0;
  const gradeUp = (v) => v >= 100 ? 5 : v >= 40 ? 4 : v >= 20 ? 3 : v >= 10 ? 2 : v >= 3 ? 1 : 0;
  const gradePing = (v) => v <= 20 ? 5 : v <= 40 ? 4 : v <= 70 ? 3 : v <= 120 ? 2 : v <= 200 ? 1 : 0;
  const gradeJitter = (v) => v <= 5 ? 5 : v <= 10 ? 4 : v <= 20 ? 3 : v <= 35 ? 2 : v <= 60 ? 1 : 0;
  const gradeLoss = (v) => v <= 0.01 ? 5 : v <= 1 ? 4 : v <= 3 ? 3 : v <= 6 ? 2 : v <= 12 ? 1 : 0;
  const gradeLoaded = (v) => v <= 60 ? 5 : v <= 100 ? 4 : v <= 150 ? 3 : v <= 250 ? 2 : v <= 400 ? 1 : 0;

  const SUIT = [
    { key: 'browsing', down: 10 },
    { key: 'hd', down: 10 },
    { key: 'uhd', down: 35 },
    { key: 'gaming', down: 15, ping: 70, loss: 2 },
    { key: 'calls', down: 5, up: 3, ping: 150 },
    { key: 'meetings', down: 20, up: 5 },
    { key: 'streaming', down: 40, up: 10 },
    { key: 'remote', down: 25, up: 8 },
  ];

  const REQ_TABLE = [
    { t: 'guide.r1t', d: '10', u: '2', n: 'guide.r1n' },
    { t: 'guide.r2t', d: '10', u: '2', n: 'guide.r2n' },
    { t: 'guide.r3t', d: '35', u: '3', n: 'guide.r3n' },
    { t: 'guide.r4t', d: '15', u: '3', n: 'guide.r4n' },
    { t: 'guide.r5t', d: '5', u: '3', n: 'guide.r5n' },
    { t: 'guide.r6t', d: '20', u: '5', n: 'guide.r6n' },
    { t: 'guide.r7t', d: '40', u: '10', n: 'guide.r7n' },
    { t: 'guide.r8t', d: '25', u: '8', n: 'guide.r8n' },
  ];

  /* ---------- formatting helpers ---------- */
  const fmtSpeed = (v) => v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  const fmtInt = (v) => Math.round(v).toString();
  const t = (k) => i18n.t(k);

  /* ---------- element refs ---------- */
  const startBtn = $('#startBtn');
  const startLabel = startBtn.querySelector('.start-label');
  const gaugeIdle = $('#gaugeIdle');
  const gaugeLive = $('#gaugeLive');
  const speedVal = $('#speedVal');
  const speedUnit = document.querySelector('.gauge-unit');
  const phaseLabel = $('#phaseLabel');
  const liveRegion = $('#liveRegion');
  const testError = $('#testError');
  const results = $('#results');
  const steps = $$('#steps li');

  const state = { running: false, results: null, meta: null };

  /* ---------- steps / phase helpers ---------- */
  function setPhase(name) {
    steps.forEach(li => {
      const s = li.dataset.step;
      li.classList.toggle('active', s === name);
      li.classList.toggle('done', order(s) < order(name));
    });
    const label = t(`phase.${name}`);
    phaseLabel.textContent = label;
    liveRegion.textContent = label;
    function order(s) { return ['ping', 'loss', 'down', 'up'].indexOf(s); }
  }

  function allStepsDone() {
    steps.forEach(li => { li.classList.remove('active'); li.classList.add('done'); });
  }

  function setGaugeMode(unit, phaseText) {
    speedUnit.textContent = unit;
    phaseLabel.textContent = phaseText;
  }

  /* ---------- the test flow ---------- */
  async function startTest() {
    if (state.running) return;
    state.running = true;
    state.results = null;

    document.body.classList.add('testing', 'running');
    startBtn.disabled = true;
    startLabel.textContent = t('live.phase');
    gaugeIdle.hidden = true;
    gaugeLive.hidden = false;
    testError.hidden = true;
    results.hidden = true;
    results.classList.remove('shown');
    Gauge.reset();
    Graph.clearData();
    Gauge.setPhaseLabel('');

    let meta = null, lat = null, loss = null, down = null, up = null;

    try {
      // 1) connection info (quick)
      setPhase('ping');
      setGaugeMode('ms', t('phase.ping'));
      meta = await SposEngine.getMeta();
      state.meta = meta;

      // 2) latency & jitter
      let shownPing = 0;
      lat = await SposEngine.runLatency({
        onSample: (ms) => {
          shownPing = shownPing ? shownPing * 0.7 + ms * 0.3 : ms;
          speedVal.textContent = fmtInt(shownPing);
        },
      });
      speedVal.textContent = fmtInt(lat.avg);

      // 3) packet loss (HTTP-based estimate)
      setPhase('loss');
      setGaugeMode('%', t('phase.loss'));
      loss = await SposEngine.runLoss({
        onProgress: (sent, failed) => { speedVal.textContent = ((failed / sent) * 100).toFixed(1); },
      });
      speedVal.textContent = loss.loss.toFixed(1);

      // 4) download
      setPhase('down');
      setGaugeMode('Mbps', t('phase.down'));
      Gauge.setSpeed(0);
      let lastAria = 0;
      down = await SposEngine.runDownload({
        onTick: (mbps, ms) => {
          Gauge.setSpeed(mbps);
          Graph.add(ms / 1000, mbps, 'down');
          if (ms - lastAria > 1200) { lastAria = ms; liveRegion.textContent = `${t('phase.down')}: ${fmtSpeed(mbps)} Mbps`; }
        },
      });

      // 5) upload
      setPhase('up');
      setGaugeMode('Mbps', t('phase.up'));
      Graph.markPhase(down.durationMs / 1000);
      Gauge.setSpeed(0);
      await new Promise(r => setTimeout(r, 350));
      up = await SposEngine.runUpload({
        onTick: (mbps, ms) => {
          Gauge.setSpeed(mbps);
          Graph.add(down.durationMs / 1000 + ms / 1000, mbps, 'up');
        },
      });

      // 6) finish
      allStepsDone();
      Gauge.setSpeed(down.mbps);
      setGaugeMode('Mbps', t('live.done'));
      liveRegion.textContent = `${t('metric.down')}: ${fmtSpeed(down.mbps)} Mbps, ${t('metric.up')}: ${fmtSpeed(up.mbps)} Mbps`;

      state.results = { meta, lat, loss, down, up };
      renderResults(state.results);
      saveHistory(state.results);
    } catch (err) {
      testError.hidden = false;
      gaugeIdle.hidden = false;
      gaugeLive.hidden = true;
      Gauge.reset();
      steps.forEach(li => li.classList.remove('active', 'done'));
      document.body.classList.remove('running');
    } finally {
      state.running = false;
      document.body.classList.remove('testing');
      startBtn.disabled = false;
      startLabel.textContent = t('cta.start');
    }
  }

  /* ---------- results rendering ---------- */
  function renderResults(r) {
    const { meta, lat, loss, down, up } = r;

    $('#rDown').textContent = fmtSpeed(down.mbps);
    $('#rUp').textContent = fmtSpeed(up.mbps);
    $('#rPing').textContent = fmtInt(lat.avg);
    $('#rJitter').textContent = lat.jitter.toFixed(1);
    $('#rLoss').textContent = loss.loss <= 0.05 ? '0.0' : loss.loss.toFixed(1);
    $('#rLoaded').textContent = down.loadedLatency != null ? fmtInt(down.loadedLatency) : '—';

    setGrade('#gDown', gradeDown(down.mbps));
    setGrade('#gUp', gradeUp(up.mbps));
    setGrade('#gPing', gradePing(lat.avg));
    setGrade('#gJitter', gradeJitter(lat.jitter));
    setGrade('#gLoss', gradeLoss(loss.loss));
    setGrade('#gLoaded', down.loadedLatency != null ? gradeLoaded(down.loadedLatency) : null);

    // verdict
    const v = down.mbps >= 100 && lat.avg <= 60 && loss.loss <= 2 ? 'strong'
      : down.mbps >= 35 ? 'good'
      : down.mbps >= 10 ? 'ok' : 'weak';
    $('#verdict').textContent = t(`verdict.${v}`);

    renderSuitability(r);
    renderConn(r);

    results.hidden = false;
    requestAnimationFrame(() => results.classList.add('shown'));
    results.setAttribute('tabindex', '-1');
    results.focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function setGrade(sel, g) {
    const p = $(sel);
    if (g == null) { p.innerHTML = ''; p.className = 'm-grade'; return; }
    p.className = `m-grade grade-${g}`;
    p.innerHTML = `<span>${t(`grade.${g}`)}</span>`;
  }

  const OK_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12.5l5 5L20 7"/></svg>';
  const NO_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  function renderSuitability(r) {
    const { down, up, lat, loss } = r.results || r;
    const box = $('#suitability');
    box.innerHTML = '';
    for (const s of SUIT) {
      let ok = true;
      if (s.down != null && down.mbps < s.down) ok = false;
      if (s.up != null && up.mbps < s.up) ok = false;
      if (s.ping != null && lat.avg > s.ping) ok = false;
      if (s.loss != null && loss.loss > s.loss) ok = false;
      const chip = document.createElement('span');
      chip.className = 'chip' + (ok ? '' : ' no');
      chip.innerHTML = `${ok ? OK_ICON : NO_ICON}${t('suit.' + s.key)}`;
      box.appendChild(chip);
    }
  }

  function renderConn(r) {
    const meta = r.meta;
    const u = t('conn.unknown');
    $('#cIp').textContent = (meta && meta.clientIp) || u;
    if (meta && meta.asOrganization) $('#cIsp').textContent = meta.asOrganization;
    else if (meta && meta.asn) $('#cIsp').textContent = 'AS' + meta.asn;
    else $('#cIsp').textContent = u;
    const iata = coloIata(meta);
    const cityName = (iata && COLO[iata]) || (meta && meta.city) || u;
    $('#cServer').textContent = iata ? `${cityName} (${iata})` : cityName;
    $('#cProto').textContent = (meta && meta.httpProtocol) || u;
  }

  // Cloudflare's meta returns colo either as an IATA string or as an object
  function coloIata(meta) {
    if (!meta || !meta.colo) return null;
    const c = meta.colo;
    if (typeof c === 'string') return c;
    return c.iata || c.code || c.id || null;
  }

  /* ---------- history ---------- */
  const HKEY = 'sposnet_history';
  const readHist = () => { try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch (e) { return []; } };

  function saveHistory(r) {
    const rows = readHist();
    rows.unshift({
      ts: Date.now(),
      down: +r.down.mbps.toFixed(2),
      up: +r.up.mbps.toFixed(2),
      ping: Math.round(r.lat.avg),
      loss: +r.loss.loss.toFixed(1),
    });
    try { localStorage.setItem(HKEY, JSON.stringify(rows.slice(0, 20))); } catch (e) { /* full */ }
    renderHistory();
  }

  function renderHistory() {
    const rows = readHist();
    const box = $('#history');
    box.classList.toggle('has-data', rows.length > 0);
    const body = $('#histBody');
    body.innerHTML = '';
    const locale = i18n.get() === 'ar' ? 'ar-LY' : 'en-GB';
    rows.slice(0, 12).forEach(row => {
      const tr = document.createElement('tr');
      const d = new Date(row.ts);
      tr.innerHTML =
        `<td>${d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' })}</td>` +
        `<td>${fmtSpeed(row.down)}</td><td>${fmtSpeed(row.up)}</td>` +
        `<td>${Math.round(row.ping)}</td><td>${row.loss.toFixed(1)}%</td>`;
      body.appendChild(tr);
    });
  }

  /* ---------- sharing ---------- */
  function shareText() {
    const r = state.results;
    if (!r) return '';
    return i18n.fill(t('share.text'), {
      down: fmtSpeed(r.down.mbps), up: fmtSpeed(r.up.mbps),
      ping: fmtInt(r.lat.avg), loss: r.loss.loss.toFixed(1),
    }) + ' https://spos-systems.github.io/SPOS-Net/';
  }

  async function copyResult() {
    const txt = shareText();
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    const b = $('#btnCopy');
    const old = b.textContent;
    b.textContent = t('cta.copied');
    setTimeout(() => { b.textContent = old; }, 1800);
  }

  async function shareResult() {
    const txt = shareText();
    if (!txt) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'SPOS Net', text: txt }); } catch (e) { /* cancelled */ }
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    }
  }

  /* ---------- recommended-speeds table ---------- */
  function renderReqTable() {
    const body = $('#reqTable');
    body.innerHTML = REQ_TABLE.map(r =>
      `<tr><td>${t(r.t)}</td><td>${r.d}</td><td>${r.u}</td><td>${t(r.n)}</td></tr>`
    ).join('');
  }

  /* ---------- theme ---------- */
  function initTheme() {
    let theme = null;
    try { theme = localStorage.getItem('sposnet_theme'); } catch (e) { /* noop */ }
    if (!theme) {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    applyTheme(theme);
    $('#themeToggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try { localStorage.setItem('sposnet_theme', next); } catch (e) { /* noop */ }
    });
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
  }

  /* ---------- language ---------- */
  function initLang() {
    let lang = null;
    try { lang = localStorage.getItem('sposnet_lang'); } catch (e) { /* noop */ }
    const urlLang = new URLSearchParams(location.search).get('lang');
    if (urlLang === 'en' || urlLang === 'ar') lang = urlLang;
    i18n.set(lang || 'ar');

    $('#langToggle').addEventListener('click', () => {
      i18n.set(i18n.get() === 'ar' ? 'en' : 'ar');
    });

    document.addEventListener('sposnet:lang', () => {
      $('#langToggle').textContent = i18n.get() === 'ar' ? 'EN' : 'عربي';
      if (state.running) startLabel.textContent = t('live.phase');
      renderReqTable();
      renderHistory();
      if (state.results) {
        renderSuitability(state.results);
        const v = state.results.down.mbps >= 100 ? 'strong' : state.results.down.mbps >= 35 ? 'good' : state.results.down.mbps >= 10 ? 'ok' : 'weak';
        $('#verdict').textContent = t(`verdict.${v}`);
        renderConn(state.results);
      }
    });
    $('#langToggle').textContent = i18n.get() === 'ar' ? 'EN' : 'عربي';
  }

  /* ---------- boot ---------- */
  function boot() {
    Gauge.build($('#gauge'));
    Gauge.bind(speedVal, phaseLabel);
    Graph.init($('#graph'));

    initTheme();
    initLang();
    renderReqTable();
    renderHistory();

    startBtn.addEventListener('click', startTest);
    $('#btnAgain').addEventListener('click', startTest);
    $('#btnShare').addEventListener('click', shareResult);
    $('#btnCopy').addEventListener('click', copyResult);
    $('#btnClearHist').addEventListener('click', () => {
      try { localStorage.removeItem(HKEY); } catch (e) { /* noop */ }
      renderHistory();
    });

    window.addEventListener('pagehide', () => SposEngine.abortAll());

    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('./sw.js').catch(() => { /* offline mode optional */ });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
