'use strict';
/**
 * SPOS Net — visualization module:
 *  - Gauge: SVG speedometer with a non-linear (Ookla-style) scale.
 *  - Graph: live canvas chart of download/upload throughput.
 */
const Gauge = (() => {
  const TICKS = [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000];
  const A0 = 135;      // start angle (SVG degrees, y-down): bottom-left
  const SWEEP = 270;   // total sweep clockwise through the top
  const CX = 160, CY = 160;
  const R_TRACK = 132, R_TICK_OUT = 132, R_TICK_IN = 122, R_LABEL = 104;

  let svg, progressEl, valueEl, phaseEl;
  let display = 0, target = 0, raf = null;

  const polar = (r, deg) => {
    const a = (deg * Math.PI) / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  };

  function valueToFraction(v) {
    const n = TICKS.length - 1;
    v = Math.max(0, +v || 0);
    if (v >= TICKS[n]) return 1;
    for (let i = 0; i < n; i++) {
      if (v <= TICKS[i + 1]) {
        const f = (v - TICKS[i]) / (TICKS[i + 1] - TICKS[i]);
        return (i + f) / n;
      }
    }
    return 1;
  }

  function arcPath(r, a0, a1) {
    const [x0, y0] = polar(r, a0);
    const [x1, y1] = polar(r, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(name, attrs) {
    const node = document.createElementNS(SVGNS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  }

  function build(svgEl) {
    svg = svgEl;
    svg.innerHTML = '';

    const defs = el('defs', {});
    const grad = el('linearGradient', { id: 'gaugeGrad', x1: '0%', y1: '100%', x2: '100%', y2: '0%' });
    [
      ['0%', '#2dd4ff'], ['45%', '#1890d8'], ['100%', '#0060a8'],
    ].forEach(([off, color]) => grad.appendChild(el('stop', { offset: off, 'stop-color': color })));
    defs.appendChild(grad);
    svg.appendChild(defs);

    // full sweep track
    svg.appendChild(el('path', { class: 'track', d: arcPath(R_TRACK, A0, A0 + SWEEP) }));

    // progress arc (pathLength normalized to 100)
    progressEl = el('path', {
      class: 'progress', d: arcPath(R_TRACK, A0, A0 + SWEEP),
      pathLength: '100', 'stroke-dasharray': '0 100', stroke: 'url(#gaugeGrad)',
    });
    svg.appendChild(progressEl);

    // ticks + labels (major at TICKS, 4 minors between)
    const n = TICKS.length;
    for (let i = 0; i < n; i++) {
      const a = A0 + (SWEEP * i) / (n - 1);
      const [x1, y1] = polar(R_TICK_OUT, a);
      const [x2, y2] = polar(R_TICK_IN, a);
      svg.appendChild(el('line', {
        class: 'tick-line tick-major', x1: x1.toFixed(2), y1: y1.toFixed(2),
        x2: x2.toFixed(2), y2: y2.toFixed(2),
      }));
      const [lx, ly] = polar(R_LABEL, a);
      const label = el('text', {
        class: 'tick-label', x: lx.toFixed(2), y: (ly + 4).toFixed(2), 'text-anchor': 'middle',
      });
      label.textContent = String(TICKS[i]);
      svg.appendChild(label);

      if (i < n - 1) {
        for (let m = 1; m <= 4; m++) {
          const am = A0 + (SWEEP * (i + m / 5)) / (n - 1);
          const [mx1, my1] = polar(R_TICK_OUT, am);
          const [mx2, my2] = polar(R_TICK_OUT - 5, am);
          svg.appendChild(el('line', {
            class: 'tick-line', x1: mx1.toFixed(2), y1: my1.toFixed(2),
            x2: mx2.toFixed(2), y2: my2.toFixed(2),
          }));
        }
      }
    }
  }

  function fmt(v) {
    if (v >= 100) return v.toFixed(0);
    if (v >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  function paint() {
    const f = valueToFraction(display);
    progressEl.setAttribute('stroke-dasharray', `${(f * 100).toFixed(2)} 100`);
    if (valueEl) valueEl.textContent = fmt(display);
  }

  function loop() {
    display += (target - display) * 0.14;
    if (Math.abs(target - display) < 0.004) display = target;
    paint();
    if (display === target) { raf = null; return; }
    raf = requestAnimationFrame(loop);
  }

  function setSpeed(mbps) {
    target = Math.max(0, +mbps || 0);
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function reset() {
    target = 0; display = 0;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    paint();
  }

  function bind(valueSpan, phaseDiv) { valueEl = valueSpan; phaseEl = phaseDiv; }
  function setPhaseLabel(txt) { if (phaseEl) phaseEl.textContent = txt; }

  return { build, setSpeed, reset, bind, setPhaseLabel, valueToFraction };
})();

/**
 * Live throughput chart on a canvas.
 */
const Graph = (() => {
  let canvas, ctx, dpr = 1;
  let down = [];  // { t, mbps }
  let up = [];
  let phaseMark = null; // time when upload phase started
  let raf = null;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    if (!canvas) return;
    dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 600;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(150 * dpr);
    draw();
  }

  const cssVar = (name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#1890d8';

  function add(mbps, tSec, phase) { (phase === 'up' ? up : down).push({ t: tSec, mbps }); requestDraw(); }
  function markPhase(tSec) { phaseMark = tSec; }
  function clearData() { down = []; up = []; phaseMark = null; draw(); }
  function requestDraw() { if (!raf) raf = requestAnimationFrame(() => { raf = null; draw(); }); }

  function niceMax(v) {
    if (v <= 5) return 5;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 5, 10]) if (v <= m * pow) return m * pow;
    return 10 * pow;
  }

  function draw() {
    if (!ctx || !canvas) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const all = down.concat(up);
    if (!all.length) return;
    const tMax = Math.max(3, ...all.map(p => p.t));
    const yMax = niceMax(Math.max(1, ...all.map(p => p.mbps)) * 1.15);

    const padL = 8 * dpr, padR = 42 * dpr, padT = 10 * dpr, padB = 16 * dpr;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const X = (t) => padL + (t / tMax) * plotW;
    const Y = (v) => padT + plotH - (v / yMax) * plotH;

    const muted = cssVar('--muted');
    const bgLine = muted + '55';

    // horizontal grid + labels
    ctx.font = `${10 * dpr}px Cairo, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const v = (yMax / 4) * i;
      const y = Y(v);
      ctx.strokeStyle = bgLine;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = muted;
      ctx.fillText(String(Math.round(v)), W - padR + 6 * dpr, y);
    }

    // phase separator
    if (phaseMark != null && up.length) {
      const x = X(phaseMark);
      ctx.strokeStyle = bgLine;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();
      ctx.setLineDash([]);
    }

    const drawSeries = (series, color, fillTo) => {
      if (series.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2 * dpr;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      series.forEach((p, i) => (i ? ctx.lineTo(X(p.t), Y(p.mbps)) : ctx.moveTo(X(p.t), Y(p.mbps))));
      ctx.stroke();
      // area fill
      const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
      grad.addColorStop(0, color + '40');
      grad.addColorStop(1, color + '05');
      ctx.lineTo(X(series[series.length - 1].t), H - padB);
      ctx.lineTo(X(series[0].t), H - padB);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    };

    drawSeries(down, '#30a8f0');
    drawSeries(up, '#2dd4bf');
  }

  return { init, add, markPhase, clearData, draw };
})();
