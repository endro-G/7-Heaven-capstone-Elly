/* ============================================================
   THE ELLY STORE — revamp prototype · tiny SVG chart toolkit
   (used by the Growth & Pre-Order dashboard, PRD §13)

   Deliberately NOT a charting library. The prototype ships with no dependencies
   and no build step, and every graphic in it is already hand-built SVG (the
   placement diagrams, the mini-bars, the FurKids concept art), so the dashboard
   draws its own charts the same way: string in, `<svg>` out.

   Everything here is pure — a function of numbers in, a string (or a value) out —
   so the smoke suite can assert the actual geometry instead of eyeballing it.
   ============================================================ */
(function () {
  'use strict';

  function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : 0; }
  function round2(v) { return Math.round(num(v) * 100) / 100; }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n) { return String(Math.round(num(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* linear scale: domain [d0,d1] -> range [r0,r1] */
  function scaleLinear(d0, d1, r0, r1) {
    var span = (d1 - d0) || 1;
    return function (v) { return r0 + (num(v) - d0) * (r1 - r0) / span; };
  }

  /* a "nice" axis step — 1 / 2 / 2.5 / 5 / 10 × 10^k — so ticks read as round numbers */
  function niceStep(span, count) {
    var raw = Math.abs(num(span)) / Math.max(1, count || 4);
    if (!(raw > 0)) return 1;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var mult = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    return mult * mag;
  }
  function niceCeil(v, step) {
    var s = step || niceStep(v, 4);
    return Math.ceil(num(v) / s) * s;
  }
  /* the tick values an axis should carry, snapped to that nice step */
  function axisTicks(min, max, count) {
    var step = niceStep(num(max) - num(min), count);
    var out = [];
    for (var v = Math.ceil(num(min) / step) * step; v <= num(max) + step * 0.001 && out.length < 200; v += step) {
      out.push(Math.round(v * 1e6) / 1e6);
    }
    return out;
  }

  function pairs(list) {
    return (list || []).map(function (p) { return [num(p[0]), num(p[1])]; });
  }

  /* "M x y L x y …" — the one shape every line chart needs */
  function linePath(list) {
    var p = pairs(list);
    if (!p.length) return '';
    return 'M' + p.map(function (q, i) {
      return (i ? 'L' : '') + round2(q[0]) + ' ' + round2(q[1]);
    }).join('');
  }

  /* the same line, closed down to a baseline — for area fills */
  function areaPath(list, yBase) {
    var p = pairs(list);
    if (!p.length) return '';
    return linePath(p) +
      'L' + round2(p[p.length - 1][0]) + ' ' + round2(yBase) +
      'L' + round2(p[0][0]) + ' ' + round2(yBase) + 'Z';
  }

  /* a wedge between an upper and a lower edge sharing the same x's — the
     forecast band. Both edges must have the same length. */
  function bandPath(upper, lower) {
    var u = pairs(upper), l = pairs(lower);
    if (!u.length || u.length !== l.length) return '';
    var up = u.map(function (q, i) { return (i ? 'L' : 'M') + round2(q[0]) + ' ' + round2(q[1]); }).join('');
    var down = l.slice().reverse().map(function (q) { return 'L' + round2(q[0]) + ' ' + round2(q[1]); }).join('');
    return up + down + 'Z';
  }

  function line(list, attrs) {
    var d = linePath(list);
    return d ? '<path d="' + d + '"' + attrs + '/>' : '';
  }
  function band(upper, lower, attrs) {
    var d = bandPath(upper, lower);
    return d ? '<path d="' + d + '"' + attrs + '/>' : '';
  }
  function circle(p, r, attrs) {
    return '<circle cx="' + round2(p[0]) + '" cy="' + round2(p[1]) + '" r="' + round2(r) + '"' + attrs + '/>';
  }
  function text(p, str, attrs) {
    return '<text x="' + round2(p[0]) + '" y="' + round2(p[1]) + '"' + attrs + '>' + esc(str) + '</text>';
  }
  /* a transparent, fat stroke that makes a thin line hoverable/focusable */
  function hit(list, tip, label) {
    var d = linePath(list);
    if (!d) return '';
    return '<g class="ct-hit" tabindex="0" role="img" aria-label="' + esc(label) + '"' +
      ' data-tip="' + esc(tip) + '"><path d="' + d + '" fill="none" stroke="transparent" stroke-width="20"/></g>';
  }
  function svg(w, h, body, cls) {
    return '<svg class="' + (cls || 'ct') + '" viewBox="0 0 ' + w + ' ' + h + '"' +
      ' preserveAspectRatio="xMidYMid meet" role="img">' + body + '</svg>';
  }

  window.EL_CHARTS = {
    num: num, round2: round2, esc: esc, fmt: fmt,
    scaleLinear: scaleLinear, niceStep: niceStep, niceCeil: niceCeil, axisTicks: axisTicks,
    linePath: linePath, areaPath: areaPath, bandPath: bandPath,
    line: line, band: band, circle: circle, text: text, hit: hit, svg: svg
  };
})();
