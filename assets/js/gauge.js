/* SPOS Net — speed gauge (v9, dark "Clarity" theme)
 * 270° dial, piecewise scale, light ink needle with exponential
 * smoothing, flat gradient value arc (no glow — the dark theme
 * reads clean), tip dot and a dim resting state for the pre-start
 * screen. The dial is driven by the SAME smoothed figure the
 * readout and tiles show, so all three always agree.
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
    this.breathing = false;       // idle: gentle arc pulse so the dial feels alive
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
    this.stopA = el('stop', { offset: '0', 'stop-color': '#29b6f6' }, this.grad);
    this.stopB = el('stop', { offset: '1', 'stop-color': '#26c6da' }, this.grad);

    /* soft drop shadow under the needle only — flat design, no arc glow */
    const shadow = el('filter', { id: 'g-shadow', x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs);
    el('feDropShadow', { dx: '0', dy: '1', stdDeviation: '1.6', 'flood-color': '#101828', 'flood-opacity': '.28' }, shadow);

    /* track */
    const [sx, sy] = pt(R, A0), [ex, ey] = pt(R, A0 + SWEEP);
    const d = `M ${sx} ${sy} A ${R} ${R} 0 1 1 ${ex} ${ey}`;
    this.track = el('path', { d, fill: 'none', stroke: 'var(--gauge-track)', 'stroke-width': '14', 'stroke-linecap': 'round', class: 'g-track' }, s);

    /* ticks + labels — strong majors, faint minors */
    const tickG = el('g', { class: 'g-ticks' }, s);
    const step = SWEEP / (SEGS.length - 1);
    for (let i = 0; i < SEGS.length; i++) {
      const a = A0 + step * i;
      const [x1, y1] = pt(R + 8, a), [x2, y2] = pt(R + 19, a);
      el('line', { x1, y1, x2, y2, stroke: 'var(--tick)', 'stroke-width': '2.6', 'stroke-linecap': 'round' }, tickG);
      const [lx, ly] = pt(R + 34, a);
      const label = el('text', {
        x: lx, y: ly, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
        fill: 'var(--tick-label)', 'font-size': '15',
        'font-family': "'Noto Kufi Arabic', ui-monospace, monospace",
        'font-weight': '600',
      }, tickG);
      label.textContent = String(SEGS[i]);
      /* minor ticks (4 per segment) */
      if (i < SEGS.length - 1) {
        for (let k = 1; k < 5; k++) {
          const am = a + (step * k) / 5;
          const [mx1, my1] = pt(R + 8, am), [mx2, my2] = pt(R + 13, am);
          el('line', { x1: mx1, y1: my1, x2: mx2, y2: my2, stroke: 'var(--tick-minor)', 'stroke-width': '1.4' }, tickG);
        }
      }
    }

    /* value arc — flat gradient, no glow filter */
    this.arc = el('path', {
      d, fill: 'none', stroke: 'url(#g-grad)', 'stroke-width': '15',
      'stroke-linecap': 'round', 'stroke-dasharray': '0 99999',
    }, s);
    this.arcLen = this.arc.getTotalLength();

    /* tip dot — anchors the arc end, phase-hued ring */
    this.dot = el('circle', { r: '6', fill: '#fff', stroke: '#26b8d6', 'stroke-width': '3.2', opacity: '0', filter: 'url(#g-shadow)' }, s);

    /* needle — floating segment (inner radius 78 → R-16), never crosses
       the center readout; no hub, the tip dot anchors the arc.
       NOTE: no filter here — a straight line has a zero-width bounding
       box, so any percentage-based filter region collapses and the
       line would render invisible (the v5–v7 "missing needle" bug). */
    this.needle = el('g', { opacity: '0' }, s);
    const [nx1, ny1] = pt(78, 0), [nx2, ny2] = pt(R - 16, 0);
    el('line', {
      x1: nx1, y1: ny1, x2: nx2, y2: ny2,
      stroke: '#e8edf5', 'stroke-width': '4.4', 'stroke-linecap': 'round',
    }, this.needle);
    this.hubDot = el('circle', { cx: CX, cy: CY, r: '0', fill: '#26b8d6' }, this.needle);
  }

  /* set phase colors: [start, end, ringHex] */
  setColors(a, b, ring) {
    this.stopA.setAttribute('stop-color', a);
    this.stopB.setAttribute('stop-color', b);
    this.dot.setAttribute('stroke', ring || b);
    this.hubDot.setAttribute('fill', ring || b);
  }

  /* drive by speed value (Mbps) */
  setValue(mbps) { this.mode = 'value'; this.breathing = false; this.target = this.fracOf(mbps); this.#needle(true); }

  /* rest state: dial completely empty — the start button owns the pre-start
     screen; only the CSS track breathing keeps the dial alive */
  restIdle() {
    this.mode = 'value';
    this.display = this.target = 0;
    this.showNeedle = false;
    this.breathing = false;
    this.needle.setAttribute('opacity', '0');
    this.dot.setAttribute('opacity', '0');
  }

  /* drive by progress 0..1 (latency phase) */
  setProgress(f) {
    this.mode = 'progress';
    this.breathing = false;
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
    /* idle breathing — a soft arc pulsing around the low end of the dial */
    if (this.breathing) {
      this.target = 0.085 + 0.075 * (0.5 + 0.5 * Math.sin(now / 1700));
    }
    const k = this.reduced ? 1 : 1 - Math.exp(-dtMs / (this.breathing ? 900 : 190));
    this.display += (this.target - this.display) * k;
    if (!this.breathing && Math.abs(this.target - this.display) < 0.0004) this.display = this.target;

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
      this.arc.setAttribute('opacity', this.breathing ? '0.4' : '1');
    }

    /* needle + tip dot */
    this.needle.setAttribute('transform', `rotate(${a} ${CX} ${CY})`);
    const [dx, dy] = pt(R, a);
    this.dot.setAttribute('cx', dx);
    this.dot.setAttribute('cy', dy);
    this.dot.setAttribute('opacity', (frac > 0.004 || this.showNeedle) && !this.breathing ? '1' : '0');

    return frac;
  }
}
