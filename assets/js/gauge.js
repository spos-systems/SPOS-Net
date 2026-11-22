/* SPOS Net — speed gauge
 * 270° dial, piecewise (Ookla-like) scale, tapered needle with
 * exponential smoothing, gradient value arc with a soft glow,
 * tip dot and a dim resting state for the pre-start screen.
 */

const NS = 'http://www.w3.org/2000/svg';
const CX = 200, CY = 200, R = 148;
const A0 = -135, SWEEP = 270;               // degrees, 0 = 12 o'clock
const SEGS = [0, 1, 5, 10, 50, 100, 250, 500, 1000];

const el = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};

const pt = (r, aDeg) => {
  const a = (aDeg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
};

export class Gauge {
  constructor(svg) {
    this.svg = svg;
    this.mode = 'value';          // 'value' | 'progress'
    this.display = 0;             // smoothed fraction 0..1
    this.target = 0;              // target fraction 0..1
    this.showNeedle = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#build();
  }

  /* value (Mbps) → fraction of the scale (piecewise, equal angular slices) */
  fracOf(v) {
    if (!(v > 0)) return 0;
    const S = SEGS, n = S.length - 1;
    if (v >= S[n]) return 1;
    let i = 0;
    while (v >= S[i + 1]) i++;
    return (i + (v - S[i]) / (S[i + 1] - S[i])) / n;
  }

  #build() {
    const s = this.svg;
    s.innerHTML = '';

    const defs = el('defs', {}, s);
    this.grad = el('linearGradient', { id: 'g-grad', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
    this.stopA = el('stop', { offset: '0', 'stop-color': '#22d3ee' }, this.grad);
    this.stopB = el('stop', { offset: '1', 'stop-color': '#3b82f6' }, this.grad);

    /* soft glow behind the value arc — tinted with the phase accent */
    const filter = el('filter', { id: 'g-glow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
    this.glow = el('feDropShadow', { dx: '0', dy: '0', stdDeviation: '7', 'flood-color': '#3b82f6', 'flood-opacity': '.55' }, filter);
    const shadow = el('filter', { id: 'g-shadow', x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs);
    el('feDropShadow', { dx: '0', dy: '1.5', stdDeviation: '2.2', 'flood-color': '#000', 'flood-opacity': '.45' }, shadow);

    /* track */
    const [sx, sy] = pt(R, A0), [ex, ey] = pt(R, A0 + SWEEP);
    const d = `M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}`;
    this.track = el('path', { d, fill: 'none', stroke: 'var(--gauge-track)', 'stroke-width': '12', 'stroke-linecap': 'round', class: 'g-track' }, s);

    /* ticks + labels */
    const tickG = el('g', { class: 'g-ticks' }, s);
    const step = SWEEP / (SEGS.length - 1);
    for (let i = 0; i < SEGS.length; i++) {
      const a = A0 + step * i;
      const [x1, y1] = pt(R + 9, a), [x2, y2] = pt(R + 17, a);
      el('line', { x1, y1, x2, y2, stroke: 'var(--tick)', 'stroke-width': '2.2', 'stroke-linecap': 'round' }, tickG);
      const [lx, ly] = pt(R + 32, a);
      const label = el('text', {
        x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: 'var(--tick-label)', 'font-size': '14',
        'font-family': "'IBM Plex Mono', monospace",
      }, tickG);
      label.textContent = String(SEGS[i]);
      /* minor ticks (4 per segment) */
      if (i < SEGS.length - 1) {
        for (let k = 1; k < 5; k++) {
          const am = a + (step * k) / 5;
          const [mx1, my1] = pt(R + 9, am), [mx2, my2] = pt(R + 13.5, am);
          el('line', { x1: mx1, y1: my1, x2: mx2, y2: my2, stroke: 'var(--tick-minor)', 'stroke-width': '1.3' }, tickG);
        }
      }
    }

    /* value arc (glowing) */
    this.arc = el('path', {
      d, fill: 'none', stroke: 'url(#g-grad)', 'stroke-width': '13',
      'stroke-linecap': 'round', 'stroke-dasharray': '0 99999',
      filter: 'url(#g-glow)',
    }, s);
    this.arcLen = this.arc.getTotalLength();

    /* tip dot */
    this.dot = el('circle', { r: '6.5', fill: '#fff', stroke: 'var(--bg)', 'stroke-width': '3.5', opacity: '0', filter: 'url(#g-shadow)' }, s);

    /* needle — floating segment (inner radius 74 → R-26), never crosses
       the center readout; no hub, the tip dot anchors the arc */
    this.needle = el('g', { opacity: '0' }, s);
    const [nx1, ny1] = pt(74, 0), [nx2, ny2] = pt(R - 26, 0);
    el('line', {
      x1: nx1, y1: ny1, x2: nx2, y2: ny2,
      stroke: '#eef2fa', 'stroke-width': '3.6', 'stroke-linecap': 'round',
      filter: 'url(#g-shadow)',
    }, this.needle);
    this.hubDot = el('circle', { cx: CX, cy: CY, r: '0', fill: '#3b82f6' }, this.needle);
  }

  /* set phase colors: [start, end, glowHex] */
  setColors(a, b, glow) {
    this.stopA.setAttribute('stop-color', a);
    this.stopB.setAttribute('stop-color', b);
    this.glow.setAttribute('flood-color', glow || b);
    this.hubDot.setAttribute('fill', glow || b);
  }

  /* drive by speed value (Mbps) */
  setValue(mbps) { this.mode = 'value'; this.target = this.fracOf(mbps); this.#needle(true); }

  /* rest state: everything dim — the start button owns the pre-start screen */
  restIdle() {
    this.mode = 'value';
    this.display = this.target = 0;
    this.showNeedle = false;
    this.needle.setAttribute('opacity', '0');
    this.dot.setAttribute('opacity', '0');
  }

  /* drive by progress 0..1 (latency phase) */
  setProgress(f) {
    this.mode = 'progress';
    this.target = Math.max(0, Math.min(1, f));
    this.needle.setAttribute('opacity', '0');
    this.showNeedle = false;
  }

  #needle(on) {
    if (on === this.showNeedle) return;
    this.showNeedle = on;
    this.needle.setAttribute('opacity', on ? '1' : '0');
    this.dot.setAttribute('opacity', on ? '1' : '0');
  }

  /* call every frame; now = performance.now() */
  tick(now, dtMs) {
    const k = this.reduced ? 1 : 1 - Math.exp(-dtMs / 190);
    this.display += (this.target - this.display) * k;
    if (Math.abs(this.target - this.display) < 0.0004) this.display = this.target;

    const frac = this.display;
    const a = A0 + SWEEP * frac;

    /* value arc — a zero-length dash with round caps would still paint a
       dot, so hide the arc entirely below the visibility threshold */
    const len = this.arcLen * frac;
    if (len < 1.5) {
      this.arc.setAttribute('visibility', 'hidden');
    } else {
      this.arc.setAttribute('visibility', 'visible');
      this.arc.setAttribute('stroke-dasharray', `${len} ${this.arcLen + 10}`);
    }

    /* needle + tip dot */
    this.needle.setAttribute('transform', `rotate(${a} ${CX} ${CY})`);
    const [dx, dy] = pt(R, a);
    this.dot.setAttribute('cx', dx);
    this.dot.setAttribute('cy', dy);
    this.dot.setAttribute('opacity', frac > 0.004 || this.showNeedle ? '1' : '0');

    return frac;
  }
}
