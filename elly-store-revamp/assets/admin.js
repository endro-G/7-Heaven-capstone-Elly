/* ============================================================
   THE ELLY STORE — revamp prototype · Growth & Pre-Order Admin Dashboard
   (PRD §13)

   Shopify's native Admin/Analytics is a system of RECORD: it reports what already
   sold. This page is the decision layer on top of it — the questions a merchant
   actually asks before committing a production run:

     · Are we on pace to clear the factory MOQ before the window closes?
     · WHY is a design pacing the way it is — which customers, which channel?
     · Which design earns the most per unit at the quantity we'd actually run?
     · How does this window compare with what we have run before?
     · And what happens if demand moves? (the scenario controls)

   Nothing here is invented at render time. The demand each design shows is the
   REAL orders-to-date tally the storefront writes at checkout
   (window.EL.preOrders — PRD §13) plus the illustrative seed below, and every
   derived number — pace projection, status flag, reason line, margin,
   contribution and every plotted point — is recomputed from it.

   Mock data is deliberately rich, because the point of the demo is watching the
   controls move the charts: each design carries a 21-day order RHYTHM (slow start,
   weekend lift, and for one design the press-feature spike it is tagged with), a
   deeper set of past runs, and 52 weeks of store-wide tile trends.

   Illustrative (PRD §9 / §14 Open Items): the seed orders-to-date, the daily
   rhythms, the segment/channel splits, the landed costs, the past-run history and
   the tile trends. No live Shopify API and no statistical model — the projection is
   a trailing average and the band around it is an illustrative spread, not a
   confidence interval. Charts are hand-built SVG (assets/charts.js), not a library.

   Design names come from the catalogue's own `designs[]` (products.js), so this
   dashboard and the Pre-Order PDP can never disagree about what a design is called.
   ============================================================ */
(function () {
  'use strict';

  var MOQ = 1000;             /* §5.3 assumption — factory minimum order quantity */
  var WINDOW_DAYS = 21;       /* the pre-order window is 21 days long */
  var WINDOW_DAY = 12;        /* illustrative default: partway through the window */
  var CLOSES = '18 Sep 2026'; /* matches the Pre-Order PDP's stated close */
  /* Decision-economics constants. The TIMELINE facts come straight from the
     Pre-Order PDP (pre-order.html): the window closes 18 Sep 2026, production
     takes up to 8 weeks after close, full payment is taken upfront, and the PDP
     promises shoppers their design is never cancelled for lack of numbers — so
     the admin decisions below are how much to commit above the floor, never
     whether to run, and cancellation exposure exists only INSIDE the window.
     The push cost/lift, the cancellation cap and the slip length are illustrative (§14). */
  var CLOSE_DATE = new Date(2026, 8, 18);  /* 18 Sep 2026 — PDP step 02 */
  var OPEN_DATE = new Date(2026, 7, 29);   /* 29 Aug 2026 — day 1 of the window */
  var LEAD_WEEKS = 8;      /* PDP step 04: production up to 8 weeks after close */
  var PUSH_HORIZON = 7;    /* days before close a push can still change the tail */
  var PUSH_COST = 800;     /* illustrative cost of a promo push (§14) */
  var PUSH_LIFT = 0.10;    /* illustrative lift on the projected tail (§14) */
  var CANCEL_CAP = 20;     /* cancellation stress slider cap, % (§14) */
  var DELAY_WEEKS = 2;     /* production-slip stress: +2 weeks on the promise */
  var WINDOW_OPENS_DOW = 6;   /* 0=Sun — the window opens on a Saturday (29 Aug 2026) */
  var THIN_SPREAD = 35;       /* below this, no channel is really "driving" demand */

  var DESIGN_COLORS = ['#4D6EB5', '#FF6070', '#178a54'];
  var DESIGN_SHORT = ['Heritage', 'Gardens', 'Marina Bay'];
  var TILE_COLORS = { conv: '#4D6EB5', aov: '#FF6070', match: '#178a54' };

  var SEG_ORDER = ['new', 'repeat', 'tourist'];
  var CH_ORDER = ['qr', 'email', 'social', 'organic'];
  var SEG_LABEL = { 'new': 'new customers', repeat: 'repeat customers', tourist: 'tourist shoppers' };
  var SEG_SHORT = { 'new': 'New', repeat: 'Repeat', tourist: 'Tourist' };
  var CH_LABEL = { qr: 'walk-in QR', email: 'email', social: 'social', organic: 'organic search' };
  var CH_SHORT = { qr: 'Walk-in QR', email: 'Email', social: 'Social', organic: 'Organic search' };

  /* a 21-day order rhythm — illustrative, but shaped like real demand: a slow
     start, a weekend lift, and (for one design) the press-feature spike it is
     tagged with. Deterministic, so the smoke suite can assert on it. */
  function buildShape(o) {
    var w = [], d;
    for (d = 0; d < WINDOW_DAYS; d++) {
      var v = o.start + o.trend * d;
      var dow = (WINDOW_OPENS_DOW + d) % 7;
      if (dow === 0 || dow === 6) v *= o.weekend;
      (o.spikes || []).forEach(function (s) { if (s[0] === d) v *= s[1]; });
      w.push(Math.round(v * 1000) / 1000);
    }
    return w;
  }
  /* 52 weeks of store-wide trend — deterministic trend + wiggle */
  function buildTrend(start, end, wobble) {
    var out = [], n = 52, i;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1);
      out.push(Math.round((start + (end - start) * t + Math.sin(i * 1.7) * wobble +
        Math.sin(i * 0.6) * wobble * 0.6) * 100) / 100);
    }
    out[n - 1] = end;
    return out;
  }

  /* The illustrative "orders already placed this window" seed, and the
     deliberately DIFFERENT profiles the PRD asks the demo to show: one on pace
     and tourist-led, one clearly ahead and repeat/local-driven, one behind pace
     with a thin channel spread (PRD §13, Prototype demonstration).
     `vol` is an illustrative spread for the forecast band — the thin design is
     naturally the least predictable. */
  var DESIGNS = [
    {
      name: 'Heritage Shophouse',
      seed: 820,
      cost: 21,
      vol: 0.14,
      signal: 'Press coverage \u2014 5 Sep',
      segments: { 'new': 30, repeat: 25, tourist: 45 },
      channels: { qr: 45, email: 18, social: 22, organic: 15 },
      shape: buildShape({ start: 0.6, trend: 0.055, weekend: 1.35, spikes: [[7, 2.4]] })
    },
    {
      name: 'Gardens by the Bay',
      seed: 1275,
      cost: 19,
      vol: 0.10,
      signal: '',
      segments: { 'new': 20, repeat: 55, tourist: 25 },
      channels: { qr: 18, email: 40, social: 12, organic: 30 },
      shape: buildShape({ start: 0.95, trend: 0.045, weekend: 1.12 })
    },
    {
      name: 'Marina Bay Night Skyline',
      seed: 430,
      cost: 24,
      vol: 0.22,
      signal: '',
      segments: { 'new': 40, repeat: 28, tourist: 32 },
      channels: { qr: 30, email: 25, social: 20, organic: 25 },
      shape: buildShape({ start: 0.8, trend: 0.005, weekend: 1.55, spikes: [[9, 0.55], [15, 0.7]] })
    }
  ];

  /* Past runs — the reference point that turns "1,275 units" into a judgement.
     Past runs also have sell-through; an OPEN window does not yet, and the chart
     and table say so rather than inventing one. */
  var HISTORY = [
    { short: 'Orchard', name: 'Orchard Bloom', when: 'Feb 2026', qty: 1000, sellThrough: 96, margin: 58 },
    { short: 'Sentosa', name: 'Sentosa Sunset', when: 'Nov 2025', qty: 1400, sellThrough: 88, margin: 61 },
    { short: 'Changi', name: 'Changi Jewel', when: 'Aug 2025', qty: 1000, sellThrough: 72, margin: 55 },
    { short: 'Botanic', name: 'Botanic Gardens', when: 'May 2025', qty: 1200, sellThrough: 91, margin: 57 },
    { short: 'Kampong', name: 'Kampong Glam', when: 'Jan 2025', qty: 800, sellThrough: 68, margin: 51 },
    { short: 'River', name: 'River Wonders', when: 'Oct 2024', qty: 1600, sellThrough: 97, margin: 64 },
    { short: 'Chinatown', name: 'Chinatown Lights', when: 'Feb 2024', qty: 900, sellThrough: 74, margin: 53 }
  ];

  /* illustrative 52-week trends behind the store-wide tiles (+ the range control) */
  var TILE_SERIES = {
    conv: buildTrend(2.4, 3.4, 0.09),
    aov: buildTrend(76, 86.4, 1.6),
    match: buildTrend(49, 61, 1.1)
  };
  var TILE_META = {
    conv: { spark: 'sparkConv', delta: 'deltaConv', money: false, unit: ' pts' },
    aov: { spark: 'sparkAov', delta: 'deltaAov', money: true, unit: '' },
    match: { spark: 'sparkMatch', delta: 'deltaMatch', money: false, unit: ' pts' }
  };
  var RANGES = [{ k: '4w', n: 4 }, { k: '12w', n: 12 }, { k: '26w', n: 26 }, { k: '52w', n: 52 }];

  /* The external signal is a manual tag: an owner knows about a press feature or
     an event, and Shopify's checkout data cannot. Each one also carries the
     consequence for the next decision — a one-off press lift must not be mistaken
     for a run rate — which is what makes the tag worth setting (PRD §13). */
  var SIGNALS = [
    { v: '', l: 'No external signal',
      why: 'read this pace as underlying demand, not a one-off lift from a tag' },
    /* the consequences are kept to a similar length on purpose: the card renders
       them in a fixed two-line slot, and equal lengths keep that slot honest */
    { v: 'Press coverage \u2014 5 Sep', l: 'Press coverage',
      why: 'a press feature lifts demand once \u2014 do not bank a second run on it' },
    { v: 'Event or season \u2014 F1 weekend', l: 'Event or season',
      why: 'an event spike leaves with the event \u2014 treat the lift as temporary' },
    { v: 'Own campaign \u2014 IG push', l: 'Own campaign',
      why: 'your own push is repeatable \u2014 the same spend should lift it again' }
  ];
  var SIGNAL_KEY = 'elly-signals';

  var CHART = { w: 720, h: 320, pad: { l: 58, r: 18, t: 18, b: 38 } };
  var MINI = { w: 300, h: 76, pad: { l: 6, r: 6, t: 8, b: 8 } };
  var DAILY = { w: 300, h: 132, pad: { l: 26, r: 8, t: 10, b: 22 } };

  /* ---------- the scenario (a what-if layer over the real numbers) ---------- */
  var SCENARIO = {
    day: WINDOW_DAY,
    moq: MOQ,
    demand: {},
    cancel: 0,                  /* cancellation stress, % of orders — pre-close only */
    delay: false,               /* production overrun stress: +2w on the ship promise */
    push: {},                   /* design name -> true: model the promo push on the tail */
    overlays: { moq: true, pace: true, band: true },
    attr: 'share',
    range: '12w'
  };

  /* ---------- small helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function $$(sel, ctx) {
    try { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
    catch (e) { return []; }
  }
  function setHTML(id, html) { var el = $(id); if (el) el.innerHTML = html; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function money(n) { return 'S$' + (Math.round(n * 100) / 100).toFixed(2); }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }
  function slug(name) { return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function sum(list, n) { var s = 0; for (var i = 0; i < (n === undefined ? list.length : n); i++) s += list[i]; return s; }
  function C() { return window.EL_CHARTS; }

  /* ---------- the catalogue tie-in ---------- */
  function preOrderProduct() {
    var list = window.EL_PRODUCTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].availability === 'pre-order') return list[i];
    }
    return null;
  }
  function price() {
    var p = preOrderProduct();
    return (p && p.price) ? p.price : 59;
  }

  /* ---------- the model (pure — the smoke suite calls these directly) ---------- */

  function preOrders() {
    try {
      return (window.EL && window.EL.preOrders && window.EL.preOrders.read()) || {};
    } catch (e) { return {}; }
  }
  function demandFor(design) { return design.seed + (preOrders()[design.name] || 0); }
  function demandOf(design) {
    var o = SCENARIO.demand[design.name];
    return (typeof o === 'number' && !isNaN(o)) ? o : demandFor(design);
  }

  /* Trailing-average projection: where demand lands by window close if the pace
     of the days so far holds (PRD §9 explicitly rules out a real model). */
  function projection(demand, day, days) {
    var d = day || SCENARIO.day, t = days || WINDOW_DAYS;
    return Math.round(demand * t / Math.max(1, d));
  }

  /* ---------- decision economics (stress + push + commit options) ---------- */

  /* Full payment is final the day the window closes (PDP: "changes are welcome
     before the order window closes"), so cancellation exposure exists only
     INSIDE the window — on close day it zeroes out. At the default 0% the
     factor is 1 and every existing number on the page is unchanged. */
  function netFactor() {
    if (SCENARIO.day >= WINDOW_DAYS) return 1;
    var c = Math.max(0, Math.min(CANCEL_CAP, SCENARIO.cancel || 0));
    return 1 - c / 100;
  }
  function netDemandOf(design) { return Math.round(demandOf(design) * netFactor()); }
  function refundCash(rawDemand) {
    /* everything is paid in full, so cancelled units are cash owed back */
    return Math.round(Math.max(0, rawDemand - Math.round(rawDemand * netFactor())) * price());
  }
  function pushByDay() { return WINDOW_DAYS - PUSH_HORIZON; }
  function canPush() { return SCENARIO.day <= pushByDay(); }
  function isPushed(name) { return canPush() && !!SCENARIO.push[name]; }
  function pushedProjection(st) {
    /* the push lifts the projected TAIL only — orders already placed cannot be
       lifted — and only while the window is still open long enough to matter */
    return st.projected + Math.round(Math.max(0, st.projected - st.demand) * PUSH_LIFT);
  }
  function sgd(n) { return 'S$' + fmt(Math.round(n)); }

  /* The 21-day cumulative curve for one design: orders to date distributed over
     the days so far by that design's rhythm, so the line has the shape of real
     demand instead of a straight ramp — and so changing demand visibly lifts it. */
  function actualPoints(st) {
    var w = st.design.shape, day = Math.max(1, Math.min(WINDOW_DAYS, st.day));
    var past = sum(w, day) || 1;
    var pts = [], run = 0, d;
    for (d = 0; d < day; d++) {
      run += w[d];
      pts.push([d + 1, st.demand * run / past]);
    }
    return pts;
  }
  /* the same rhythm continued to close, spreading the projected remainder */
  function projectedPoints(st) {
    var w = st.design.shape, day = Math.max(1, Math.min(WINDOW_DAYS, st.day));
    var fut = sum(w.slice(day)) || 1;
    var remainder = Math.max(0, st.projected - st.demand);
    var pts = [], run = 0, d;
    for (d = day; d < WINDOW_DAYS; d++) {
      run += w[d];
      pts.push([d + 1, st.demand + remainder * run / fut]);
    }
    return pts;
  }
  /* the two edges of the forecast band: the realised curve, then the projected
     tail flared by the design's illustrative spread */
  function bandEdges(st) {
    var actual = actualPoints(st), future = projectedPoints(st);
    var up = actual.concat(future.map(function (p) { return [p[0], p[1] * (1 + st.design.vol)]; }));
    var down = actual.concat(future.map(function (p) { return [p[0], Math.max(0, p[1] * (1 - st.design.vol))]; }));
    return { upper: up, lower: down };
  }

  /* daily bars: what sold on each day to date, and what the projection implies
     for the days left — the clearest place to watch a scenario move the data */
  function dailyBars(st) {
    var w = st.design.shape, day = Math.max(1, Math.min(WINDOW_DAYS, st.day));
    var past = sum(w, day) || 1;
    var fut = sum(w.slice(day)) || 1;
    var remainder = Math.max(0, st.projected - st.demand);
    var bars = [], d;
    for (d = 0; d < WINDOW_DAYS; d++) {
      bars.push(d < day
        ? { day: d + 1, v: st.demand * w[d] / past, future: false }
        : { day: d + 1, v: remainder * w[d] / fut, future: true });
    }
    return bars;
  }

  /* The §13 status flag. "Ahead" is called out separately from "on pace" so the
     owner can tell a design that needs a second run from one that just clears. */
  function statusOf(projected, moq) {
    var m = (typeof moq === 'number' && isFinite(moq)) ? moq : SCENARIO.moq;
    if (projected >= m * 1.5) return { key: 'ahead', label: 'Clearly ahead of pace' };
    if (projected >= m * 1.15) return { key: 'pace', label: 'On pace to clear MOQ' };
    if (projected >= m) return { key: 'floor', label: 'Tracking to the MOQ floor' };
    return { key: 'risk', label: 'At risk of falling short' };
  }

  function dominant(weights, order) {
    var best = order[0];
    order.forEach(function (k) {
      if ((weights[k] || 0) > (weights[best] || 0)) best = k;
    });
    return { key: best, pct: weights[best] || 0 };
  }

  function marginOf(cost, p) {
    var pr = p || price();
    var unit = pr - cost;
    return { cost: cost, price: pr, unit: unit, pct: unit / pr * 100 };
  }

  /* what a manual signal tag implies for the decision — matched against the
     fixed option list, so a stray stored value can never inject copy */
  function signalWhy(v) {
    for (var i = 0; i < SIGNALS.length; i++) if (SIGNALS[i].v === v) return SIGNALS[i].why || '';
    return '';
  }

  /* The decision-rationale line: WHY a design is pacing the way it is, plus the
     next action. This is the single feature native Shopify cannot give — it
     reports a number swing but never attributes it to a cause (PRD §13).
     `signal` is passed in when the caller already knows it (the smoke suite does),
     otherwise it is read from the stored tags. */
  function reasonParts(design, projected, signal) {
    var st = statusOf(projected);
    var seg = dominant(design.segments, SEG_ORDER);
    var ch = dominant(design.channels, CH_ORDER);
    var thin = ch.pct < THIN_SPREAD;
    var base;
    if (st.key === 'ahead') {
      base = 'Ahead of pace, driven by ' + SEG_LABEL[seg.key] + ' via ' + CH_LABEL[ch.key] +
        ' \u2014 consider a second production run.';
    } else if (st.key === 'pace') {
      base = 'On pace to clear MOQ, led by ' + SEG_LABEL[seg.key] + ' through ' + CH_LABEL[ch.key] +
        ' \u2014 hold the plan and let the window close.';
    } else if (st.key === 'floor') {
      base = 'Tracking to the MOQ floor, with ' + CH_LABEL[ch.key] +
        ' carrying most of it \u2014 production still runs at MOQ.';
    } else {
      base = thin
        ? 'Behind pace with no dominant channel \u2014 flag for a promo push before the window closes.'
        : 'Behind pace despite ' + CH_LABEL[ch.key] + ' \u2014 flag for a promo push before the window closes.';
    }
    var sig = (signal === undefined) ? signalFor(design) : signal;
    return { base: base, note: signalWhy(sig), signal: sig, tagged: !!sig };
  }

  function reasonFor(design, projected, signal) {
    var parts = reasonParts(design, projected, signal);
    return (parts.tagged && parts.note) ? parts.base + ' External signal: ' + parts.note + '.' : parts.base;
  }

  /* The one-line answer at the top of the page. A dashboard that only reports
     leaves the owner to work out what to do; this says which design needs
     action, by how much, and what the action is — computed from the same model
     as every chart, so it can never disagree with them. */
  function verdictFor(states) {
    var left = Math.max(0, WINDOW_DAYS - SCENARIO.day);
    var days = left + ' day' + (left === 1 ? '' : 's') + ' left';
    var risk = states.filter(function (s) { return s.status.key === 'risk'; });
    var floor = states.filter(function (s) { return s.status.key === 'floor'; });
    var worst = null;
    risk.concat(floor).forEach(function (s) {
      if (!worst || (s.projected - s.moq) < (worst.projected - worst.moq)) worst = s;
    });
    if (risk.length && worst) {
      var gap = Math.max(0, Math.round(worst.moq - worst.projected));
      var dom = dominant(worst.design.channels, CH_ORDER);
      var ch = dom.pct >= THIN_SPREAD ? CH_LABEL[dom.key] : 'no single channel';
      var others = risk.length > 1
        ? ' ' + (risk.length - 1) + ' other design' + (risk.length > 2 ? 's are' : ' is') + ' behind pace too.'
        : '';
      return {
        key: 'act',
        lead: 'Act now',
        text: esc(worst.design.name) + ' is projected to close at <b>' + fmt(worst.projected) +
          '</b> against an MOQ of ' + fmt(worst.moq) + ' \u2014 <b>' + fmt(gap) + ' units short</b> with ' + days + '.' + others +
          ' It does not earn a second run either way, so the move before the window closes is demand through ' +
          ch + ', not a bigger production order.'
      };
    }
    if (floor.length && worst) {
      return {
        key: 'watch',
        lead: 'Watch',
        text: fmt(floor.length) + ' of ' + states.length + ' designs only just cover the MOQ \u2014 ' +
          esc(worst.design.name) + ' is \u201c' + esc(String(worst.status.label).toLowerCase()) +
          '\u201d. Production still clears the factory minimum but leaves no room for a second run, and there are ' +
          days + ' to change it.'
      };
    }
    return {
      key: 'ok',
      lead: 'On track',
      text: 'Every design is projected to land at or above the MOQ with ' + days +
        '. Nothing needs intervention yet \u2014 the open decision is which run earns the most (Question 4).'
    };
  }

  /* ---------- the decision clock (dates from the Pre-Order PDP) ----------
     The PDP pins the timeline: the window closes 18 Sep 2026, production takes
     up to 8 weeks after close, full payment is final at close (cancels only
     before close). Three chips follow the window-day slider. The PDP promises
     "never cancelled for lack of numbers", so there is no run/cancel chip — the
     factory commitment happens at close, all together. */
  function fmtDate(d) {
    var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear();
  }
  function dayToDate(day) {
    var d = new Date(OPEN_DATE.getTime());
    d.setDate(d.getDate() + Math.max(0, Math.min(WINDOW_DAYS, day) - 1));
    return d;
  }
  function addDays(d, n) {
    var c = new Date(d.getTime());
    c.setDate(c.getDate() + n);
    return c;
  }
  function decisionClock() {
    var shipBy = addDays(CLOSE_DATE, LEAD_WEEKS * 7 + (SCENARIO.delay ? DELAY_WEEKS * 7 : 0));
    var pushBy = addDays(CLOSE_DATE, -PUSH_HORIZON);
    return {
      push: { label: 'Last useful push', date: pushBy, day: pushByDay(), late: SCENARIO.day > pushByDay() },
      close: { label: 'Cancels end · production begins', date: CLOSE_DATE, day: WINDOW_DAYS, late: SCENARIO.day >= WINDOW_DAYS },
      ship: { label: SCENARIO.delay ? 'Ships by (with +2w slip)' : 'Ships by', date: shipBy, day: null, late: false }
    };
  }
  function clockHTML() {
    var clock = decisionClock();
    var chip = function (c) {
      return '<span class="clock-chip' + (c.late ? ' is-late' : '') + '">' +
        '<b>' + esc(c.label) + '</b> <span>' + fmtDate(c.date) + '</span>' +
        (c.late ? ' <i>passed</i>' : '') + '</span>';
    };
    return '<span class="clock-chip clock-chip--today"><b>Today</b> <span>' +
      fmtDate(dayToDate(SCENARIO.day)) + '</span></span>' +
      chip(clock.push) + chip(clock.close) + chip(clock.ship);
  }

  /* ---------- the costed decision table (Question 6) ----------
     The PDP guarantees production ("demand or minimum, whichever is higher —
     never cancelled"), so the choice is never run vs cancel: it is how much to
     COMMIT above the floor, and whether to push demand before close. Every row
     is priced off the same model as the charts. */
  function commitOptions(st) {
    var unit = st.margin.unit, cost = st.margin.cost;
    var canPushHere = canPush();
    /* The push preview is built on the UNPUSHED base: st.projected already carries
       the modelled lift (st.pushTail) once a push is on, so adding a fresh lift to
       it would compound the same push and overstate this row's quantity. */
    var baseProjected = st.projected - (st.pushTail || 0);
    var tail = Math.max(0, baseProjected - st.rawDemand);
    var pushTail = Math.round(tail * PUSH_LIFT);
    var pushedProj = canPushHere ? baseProjected + pushTail : st.projected;
    /* Production never runs below the MOQ (factory minimum), so every commit is
       >= moq. Bands: floor of the band = the tail does NOT materialise (sell
       only what was ordered), ceiling = the tail sells out. Push rows deduct
       the push cost from both ends. */
    var sellCon = function (q) {
      var sold = Math.min(q, st.demand + Math.max(0, q - st.moq));
      return Math.max(0, sold * unit);
    };
    var floorCon = (function () {
      var lo = sellCon(st.moq), hi = sellCon(st.moq);
      return { lo: lo, hi: hi };
    })();
    var upCon = (function () {
      var q = Math.max(st.moq, st.netProjected);
      return { lo: sellCon(q), hi: q * unit };
    })();
    var pushCon = (canPushHere && pushTail > 0)
      ? (function () {
          var q = Math.max(st.moq, pushedProj);
          return { lo: Math.max(0, sellCon(q) - PUSH_COST), hi: Math.max(0, q * unit - PUSH_COST) };
        })()
      : null;
    var gap = Math.max(0, st.moq - st.netProjected);
    var options = [
      { key: 'floor', label: 'Commit the floor (' + fmt(st.moq) + ')',
        note: st.demand < st.moq
          ? 'covers every paid order; the ' + fmt(st.moq - st.demand) + '-unit excess may not sell — ' + sgd((st.moq - st.demand) * cost) + ' at risk'
          : 'demand already covers the floor',
        con: floorCon, cash: 'none — already collected' },
      { key: 'push', label: 'Push & commit projected',
        note: !canPushHere ? 'too close to close for a push to change the tail'
          : (gap > 0 && pushTail < gap
            ? 'lifts the tail only ~' + fmt(pushTail) + ' units — it cannot close a ' + fmt(gap) + '-unit gap'
            : 'lifts the tail ~' + fmt(pushTail) + ' units for ' + sgd(PUSH_COST)),
        con: pushCon, cash: sgd(PUSH_COST) + ' spend, funded from collected cash',
        pushed: canPushHere && !!st.pushed, disabled: !canPushHere || !pushCon },
      { key: 'upside', label: 'Commit projected (' + fmt(Math.max(st.moq, st.netProjected)) + ')',
        note: 'captures the ' + fmt(Math.max(0, st.netProjected - st.demand)) + '-unit tail if it materialises',
        con: upCon, cash: 'none — already collected' }
    ];
    var best = null;
    options.forEach(function (o) {
      if (o.disabled || !o.con) return;
      if (!best || o.con.lo > best.con.lo) best = o;
    });
    options.forEach(function (o) { o.recommended = !!(best && o === best); });
    return { options: options, gap: gap, pushedProj: pushedProj, pushTail: pushTail };
  }
  function decisionsHTML(states) {
    var rows = states.filter(function (s) { return s.status.key === 'risk' || s.status.key === 'floor'; });
    if (!rows.length) {
      return '<p class="small muted" style="margin:10px 0 0">No design is at the MOQ floor or behind pace — nothing to decide here. Raise the MOQ or stress the window above to see the commit options.</p>';
    }
    var html = '';
    rows.forEach(function (s) {
      var d = commitOptions(s);
      html += '<div class="deci" data-design="' + esc(s.design.name) + '">' +
        '<h4>' + esc(s.design.name) + ' <span class="muted small">· ' + esc(s.status.label) +
          ' · gap to MOQ ' + (d.gap ? fmt(d.gap) + ' units' : 'closed') + '</span></h4>' +
        '<table class="tbl tbl--deci"><thead><tr><th>Option</th><th>Contribution</th><th>Cash</th><th>Notes</th><th></th></tr></thead><tbody>';
      d.options.forEach(function (o) {
        var conTxt = o.con ? (o.con.lo === o.con.hi ? money(o.con.lo) : money(o.con.lo) + ' – ' + money(o.con.hi)) : '—';
        html += '<tr' + (o.disabled ? ' class="is-off"' : '') + '>' +
          '<td><b>' + esc(o.label) + '</b>' + (o.recommended ? ' <span class="badge badge--demo">Recommended</span>' : '') + '</td>' +
          '<td>' + conTxt + '</td>' +
          '<td>' + esc(o.cash) + '</td>' +
          '<td class="small muted">' + esc(o.note) + '</td>' +
          '<td>' + (o.key === 'push' && !o.disabled
            ? '<button type="button" class="ct-btn js-deci-push" data-design="' + esc(s.design.name) + '"' + (o.pushed ? ' data-off="1"' : '') + '>' + (o.pushed ? 'Remove push' : 'Model this push') + '</button>'
            : '') + '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    });
    return html;
  }

  function stateFor(design, demandOverride) {
    var extra = preOrders()[design.name] || 0;
    var demand = (typeof demandOverride === 'number' && !isNaN(demandOverride))
      ? demandOverride : demandOf(design);
    var moq = SCENARIO.moq;
    var projected = projection(demand, SCENARIO.day, WINDOW_DAYS);
    var prod = Math.max(demand, moq);
    var mg = marginOf(design.cost);
    var st = {
      design: design, demand: demand, extra: extra, moq: moq, prod: prod,
      projected: projected, day: SCENARIO.day, status: statusOf(projected, moq),
      margin: mg, contribution: mg.unit * prod
    };
    return addDecisionFields(st);
  }
  /* Stress + push are a layer over the base state (the way SCENARIO.demand is a
     layer over real orders). Every downstream number reads `net`/`netProjected`
     instead of `demand`/`projected`; at the defaults (0% cancels, no push) the
     layer is the identity, so every existing figure on the page is unchanged. */
  function addDecisionFields(st) {
    var f = netFactor();
    st.net = Math.round(st.demand * f);
    st.rawDemand = st.demand;
    st.demand = st.net;
    st.refunds = refundCash(st.rawDemand);
    var pushed = isPushed(st.design.name);
    st.pushed = pushed;
    st.pushTail = 0;
    if (pushed) {
      st.pushTail = Math.round(Math.max(0, st.projected - st.demand) * PUSH_LIFT);
    }
    st.projected = st.projected + st.pushTail;
    st.netProjected = Math.round(st.projected * f);
    st.status = statusOf(st.netProjected, st.moq);
    st.prod = Math.max(st.demand, st.moq);
    st.contribution = st.margin.unit * st.prod;
    return st;
  }

  function designByName(name) {
    for (var i = 0; i < DESIGNS.length; i++) {
      if (DESIGNS[i].name === name) return DESIGNS[i];
    }
    return null;
  }
  function indexOfDesign(name) {
    return DESIGNS.map(function (d) { return d.name; }).indexOf(name);
  }
  function colorFor(name) {
    var i = indexOfDesign(name);
    return DESIGN_COLORS[i < 0 ? 0 : i];
  }
  function shortFor(name) {
    var i = indexOfDesign(name);
    return i < 0 ? name : DESIGN_SHORT[i];
  }

  function readSignals() {
    try {
      var raw = lsGet(SIGNAL_KEY), map = raw ? JSON.parse(raw) : {};
      return (map && typeof map === 'object') ? map : {};
    } catch (e) { return {}; }
  }
  function writeSignal(name, v) {
    var map = readSignals();
    map[name] = v;
    lsSet(SIGNAL_KEY, JSON.stringify(map));
  }
  function signalFor(design) {
    var map = readSignals();
    return Object.prototype.hasOwnProperty.call(map, design.name) ? map[design.name] : design.signal;
  }

  function rangeWeeks() {
    for (var i = 0; i < RANGES.length; i++) if (RANGES[i].k === SCENARIO.range) return RANGES[i].n;
    return 12;
  }

  /* ---------- URL scenario (shareable what-ifs) ---------- */
  function readScenarioFromUrl() {
    try {
      var q = new URLSearchParams(window.location.search || '');
      var day = parseInt(q.get('day'), 10);
      var moq = parseInt(q.get('moq'), 10);
      var rng = q.get('range');
      var cancel = parseInt(q.get('cancel'), 10);
      if (day >= 1 && day <= WINDOW_DAYS) SCENARIO.day = day;
      if (moq >= 0) SCENARIO.moq = moq;
      if (rng && RANGES.some(function (r) { return r.k === rng; })) SCENARIO.range = rng;
      if (cancel > 0) SCENARIO.cancel = Math.min(CANCEL_CAP, cancel);
      if (q.get('delay') === '1') SCENARIO.delay = true;
      DESIGNS.forEach(function (d) {
        var v = parseInt(q.get(slug(d.name)), 10);
        if (v >= 0) SCENARIO.demand[d.name] = v;
        if (q.get('push-' + slug(d.name)) === '1') SCENARIO.push[d.name] = true;
      });
    } catch (e) {}
  }
  function syncUrl() {
    try {
      if (!window.history || typeof window.history.replaceState !== 'function') return;
      var q = new URLSearchParams();
      if (SCENARIO.day !== WINDOW_DAY) q.set('day', String(SCENARIO.day));
      if (SCENARIO.moq !== MOQ) q.set('moq', String(SCENARIO.moq));
      if (SCENARIO.range !== '12w') q.set('range', SCENARIO.range);
      if (SCENARIO.cancel > 0) q.set('cancel', String(SCENARIO.cancel));
      if (SCENARIO.delay) q.set('delay', '1');
      DESIGNS.forEach(function (d) {
        if (SCENARIO.demand[d.name] !== undefined) q.set(slug(d.name), String(SCENARIO.demand[d.name]));
        if (SCENARIO.push[d.name]) q.set('push-' + slug(d.name), '1');
      });
      var s = q.toString();
      window.history.replaceState(null, '', window.location.pathname + (s ? '?' + s : ''));
    } catch (e) {}
  }

  /* ---------- markup: rows, cards, tables ---------- */

  function attribHTML(title, weights, order, labels, totalUnits) {
    var C_ = C();
    var total = order.reduce(function (s, k) { return s + (weights[k] || 0); }, 0) || 1;
    var mode = SCENARIO.attr;
    var bar = order.map(function (k, i) {
      var pct = (weights[k] || 0) / total * 100;
      if (!pct) return '';
      var val = mode === 'count'
        ? fmt(Math.round((totalUnits || 0) * pct / 100))
        : Math.round(pct) + '%';
      return '<i class="attr__seg attr__seg--' + i + '" style="width:' + C_.round2(pct) + '%"' +
        ' data-tip="' + esc(labels[k] + ' \u2014 ' + Math.round(pct) + '%' +
          (mode === 'count' ? ' \u00b7 about ' + val + ' customers' : '')) + '"' +
        ' title="' + esc(labels[k] + ' ' + val) + '"></i>';
    }).join('');
    var legend = order.map(function (k, i) {
      var pct = Math.round((weights[k] || 0) / total * 100);
      var val = mode === 'count' ? fmt(Math.round((totalUnits || 0) * pct / 100)) : pct + '%';
      return '<span class="attr__key"><i class="attr__sw attr__sw--' + i + '"></i>' +
        esc(labels[k]) + ' <b>' + val + '</b></span>';
    }).join('');
    return '<div class="attr">' +
      '<span class="attr__lbl">' + esc(title) +
        '<i class="attr__unit">' + (mode === 'count' ? 'customers' : 'share') + '</i></span>' +
      '<div class="attr__bar">' + bar + '</div>' +
      '<div class="attr__legend">' + legend + '</div>' +
      '</div>';
  }

  /* The chip is ALWAYS rendered (untagged reads "none tagged"), and the two rows
     stack. Both are load-bearing for layout stability: if the chip appeared only
     when tagged, the row would wrap from one line to two and the card would grow
     — which would resize all three cards and shift the reasons beside it. */
  function signalHTML(design) {
    var cur = signalFor(design);
    var opts = SIGNALS.map(function (s) {
      return '<option value="' + esc(s.v) + '"' + (s.v === cur ? ' selected' : '') + '>' + esc(s.l) + '</option>';
    }).join('');
    return '<div class="dcard__signal">' +
      '<span class="signal-chip js-signal-chip">' +
        '<b>External signal</b> <span class="js-signal-txt">' + esc(cur || 'none tagged') + '</span></span>' +
      '<label class="small muted dcard__signalset">Signal' +
        '<select class="js-signal" aria-label="External demand signal for ' + esc(design.name) + '">' + opts + '</select>' +
      '</label>' +
      '</div>';
  }

  /* The signal line is rendered in every card, tagged or not, and clamped to two
     lines. Together with the chip above, that makes a card's height independent of
     which signal is selected — so choosing one cannot move anything. */
  function signalNoteHTML(parts) {
    return '<b>' + (parts.tagged ? 'External signal' : 'No signal tagged') + '</b>' +
      '<span class="reason__txt">' + esc(parts.note) + '</span>';
  }
  function signoteClass(parts) {
    return 'reason__sig js-signote' + (parts.tagged ? '' : ' reason__sig--none');
  }

  function marginHTML(st) {
    return '<dl class="mgrid">' +
      '<div><dt>Landed unit cost</dt><dd>' + money(st.margin.cost) + '</dd></div>' +
      '<div><dt>Pre-order price</dt><dd>' + money(st.margin.price) + '</dd></div>' +
      '<div><dt>Margin</dt><dd class="js-margin">' + st.margin.pct.toFixed(1) + '%</dd></div>' +
      '<div><dt>Contribution <span class="muted js-mqty">at ' + fmt(st.prod) + '</span></dt>' +
        '<dd class="js-contrib">' + money(st.contribution) + '</dd></div>' +
      '</dl>';
  }

  function rowHTML(d) {
    var st = stateFor(d);
    var presets = [600, 1000, 1400].map(function (v) {
      return '<button type="button" class="js-moq-preset" data-v="' + v + '">' + fmt(v) + '</button>';
    }).join('');
    return '<tr class="js-moq-row" data-design="' + esc(d.name) + '" data-moq="' + MOQ + '">' +
      '<td><b>' + esc(d.name) + '</b> <span class="muted small">(concept)</span>' +
        '<span class="js-demv small muted row-note"></span></td>' +
      '<td><span class="moq-control"><span class="qty-row" data-min="0" data-max="5000">' +
        '<button type="button" data-step="-100" aria-label="Decrease">\u2212</button>' +
        '<output value="' + st.demand + '">' + fmt(st.demand) + '</output>' +
        '<button type="button" data-step="100" aria-label="Increase">+</button></span>' + presets + '</span></td>' +
      '<td>' + fmt(st.moq) + '</td>' +
      '<td><b class="js-prod">' + fmt(st.prod) + '</b></td>' +
      '<td class="bar-cell"><div class="mini-bar"></div></td>' +
      '</tr>';
  }

  function cardHTML(d) {
    var st = stateFor(d);
    var parts = reasonParts(d, st.projected);
    return '<article class="dcard" data-design="' + esc(d.name) + '">' +
      '<header class="dcard__head">' +
        '<div><h4>' + esc(d.name) + '</h4>' +
          '<span class="small muted">Day ' + st.day + ' of ' + WINDOW_DAYS + ' \u00b7 closes ' + CLOSES + '</span></div>' +
        '<span class="dstatus dstatus--' + st.status.key + ' js-status">' + esc(st.status.label) + '</span>' +
      '</header>' +
      signalHTML(d) +
      '<dl class="dstats">' +
        '<div><dt>Orders to date</dt><dd class="js-orders">' + fmt(st.demand) + '</dd></div>' +
        '<div><dt>Projected close</dt><dd class="js-proj">' + fmt(st.projected) + '</dd></div>' +
        '<div><dt>Production qty</dt><dd class="js-qty">' + fmt(st.prod) + '</dd></div>' +
      '</dl>' +
      '<div class="js-card-traj">' + cardTrajectory(st) + '</div>' +
      '<div class="js-attr-seg">' + attribHTML('Who is buying', d.segments, SEG_ORDER, SEG_SHORT, st.demand) + '</div>' +
      '<div class="js-attr-ch">' + attribHTML('Where they came from', d.channels, CH_ORDER, CH_SHORT, st.demand) + '</div>' +
      '<div class="js-mgrid">' + marginHTML(st) + '</div>' +
      '<p class="dcard__reason"><b>Reason</b> <span class="js-reason">' + esc(parts.base) + '</span>' +
        '<span class="' + signoteClass(parts) + '">' + signalNoteHTML(parts) + '</span></p>' +
      '</article>';
  }

  function historyHTML() {
    var past = HISTORY.map(function (h) {
      return '<tr><td>' + esc(h.name) + '</td><td class="muted">' + esc(h.when) + '</td>' +
        '<td>' + fmt(h.qty) + '</td><td>' + h.sellThrough + '%</td><td>' + h.margin + '%</td></tr>';
    }).join('');
    var current = DESIGNS.map(function (d, i) {
      var st = stateFor(d);
      return '<tr class="js-hist-cur" data-design="' + esc(d.name) + '">' +
        '<td><span class="swatch" style="background:' + DESIGN_COLORS[i] + '"></span><b>' + esc(d.name) + '</b> ' +
          '<span class="badge badge--demo">this window</span></td>' +
        '<td class="muted">Sep 2026</td>' +
        '<td class="js-hqty">' + fmt(st.prod) + '</td>' +
        '<td class="muted">open</td>' +
        '<td class="js-hmargin">' + st.margin.pct.toFixed(1) + '%</td>' +
        '</tr>';
    }).join('');
    return past + '<tr class="hist-sep"><td colspan="5"><span>Current window \u2014 open, sell-through pending</span></td></tr>' + current;
  }

  /* ---------- charts (hand-built SVG, assets/charts.js) ---------- */

  function chartFrame(w, h, pad, xTicks, yTicks, xScale, yScale, xLabel, yLabel) {
    var K = C();
    var body = '';
    yTicks.forEach(function (t) {
      body += '<line class="ct-grid" x1="' + K.round2(xScale(1)) + '" y1="' + K.round2(yScale(t)) +
        '" x2="' + K.round2(xScale(WINDOW_DAYS)) + '" y2="' + K.round2(yScale(t)) + '"/>';
      body += K.text([pad.l - 9, yScale(t) + 4], yLabel(t), ' class="ct-axis" text-anchor="end"');
    });
    xTicks.forEach(function (t) {
      body += '<line class="ct-grid" x1="' + K.round2(xScale(t)) + '" y1="' + K.round2(yScale(yTicks[0])) +
        '" x2="' + K.round2(xScale(t)) + '" y2="' + pad.t + '"/>';
      body += K.text([xScale(t), h - pad.b + 17], xLabel(t), ' class="ct-axis" text-anchor="middle"');
    });
    return body;
  }

  function trajectorySVG(st, geom, compact) {
    var K = C();
    var pad = geom.pad, w = geom.w, h = geom.h;
    var yMax = Math.max(st.moq, st.demand, st.projected) * 1.12 || 1;
    var x = K.scaleLinear(1, WINDOW_DAYS, pad.l, w - pad.r);
    var y = K.scaleLinear(0, yMax, h - pad.b, pad.t);
    /* the model speaks in DATA space (day, units) — every series has to be mapped
       through the scales before it can be drawn, or it lands in the wrong place */
    var toPx = function (pts) { return pts.map(function (p) { return [x(p[0]), y(p[1])]; }); };
    var color = colorFor(st.design.name);
    var body = '';
    var actual = actualPoints(st), future = projectedPoints(st);

    if (!compact && SCENARIO.overlays.band) {
      var band = bandEdges(st);
      body += K.band(toPx(band.upper), toPx(band.lower), ' class="ct-band" style="fill:' + color + '"');
    }
    if (!compact && SCENARIO.overlays.pace) {
      body += K.line(toPx([[1, 0], [WINDOW_DAYS, st.moq]]), ' class="ct-pace"');
    }
    body += K.line(toPx(actual), ' class="ct-actual" style="stroke:' + color + '"');
    body += K.line(toPx([[st.day, st.demand]].concat(future)), ' class="ct-proj" style="stroke:' + color + '"');
    if (compact) {
      body += K.line(toPx([[1, st.moq], [WINDOW_DAYS, st.moq]]), ' class="ct-moq ct-moq--thin"');
    }
    body += K.circle([x(st.day), y(st.demand)], compact ? 3.5 : 4.5, ' class="ct-dot" style="fill:' + color + '"');
    body += K.circle([x(WINDOW_DAYS), y(st.projected)], compact ? 3 : 3.5, ' class="ct-dot ct-dot--open" style="stroke:' + color + '"');
    return K.svg(w, h, body, compact ? 'ct ct--mini' : 'ct');
  }

  function trajectoryChart(states) {
    var K = C();
    var pad = CHART.pad, w = CHART.w, h = CHART.h;
    var maxV = Math.max.apply(null, [SCENARIO.moq].concat(states.map(function (s) {
      /* the band flares ABOVE the projection, so the axis has to cover it too */
      return Math.max(s.projected * (1 + s.design.vol), s.projected, s.demand);
    })));
    var top = maxV * 1.12 || 1;
    var yMax = K.niceCeil(top, K.niceStep(top, 4));
    var x = K.scaleLinear(1, WINDOW_DAYS, pad.l, w - pad.r);
    var y = K.scaleLinear(0, yMax, h - pad.b, pad.t);
    var toPx = function (pts) { return pts.map(function (p) { return [x(p[0]), y(p[1])]; }); };

    var body = chartFrame(w, h, pad, [1, 5, 10, 15, WINDOW_DAYS], K.axisTicks(0, yMax, 4), x, y,
      function (d) { return 'Day ' + d; }, function (v) { return K.fmt(v); });

    if (SCENARIO.overlays.moq) {
      body += K.line(toPx([[1, SCENARIO.moq], [WINDOW_DAYS, SCENARIO.moq]]), ' class="ct-moq"');
      body += K.text([pad.l + 6, y(SCENARIO.moq) - 6], 'MOQ ' + K.fmt(SCENARIO.moq), ' class="ct-note"');
    }
    if (SCENARIO.overlays.pace) {
      body += K.line(toPx([[1, 0], [WINDOW_DAYS, SCENARIO.moq]]), ' class="ct-pace"');
      body += K.text([x(WINDOW_DAYS) - 6, y(SCENARIO.moq) - 20], 'needed pace to clear MOQ',
        ' class="ct-note" text-anchor="end"');
    }
    var dayX = x(SCENARIO.day);
    var dayAnchor = dayX > w - 150 ? 'end' : 'start';   /* keep the label inside on late days */
    body += '<line class="ct-today" x1="' + K.round2(dayX) + '" y1="' + y(0) +
      '" x2="' + K.round2(dayX) + '" y2="' + pad.t + '"/>';
    body += K.text([dayAnchor === 'end' ? dayX - 6 : dayX + 6, pad.t + 12], 'today \u00b7 day ' + SCENARIO.day,
      ' class="ct-note" text-anchor="' + dayAnchor + '"');

    states.forEach(function (s) {
      var color = colorFor(s.design.name);
      var actual = actualPoints(s), future = projectedPoints(s);
      if (SCENARIO.overlays.band) {
        var band = bandEdges(s);
        body += K.band(toPx(band.upper), toPx(band.lower), ' class="ct-band" style="fill:' + color + '"');
      }
      body += K.line(toPx(actual), ' class="ct-actual" style="stroke:' + color + '"');
      body += K.line(toPx([[s.day, s.demand]].concat(future)), ' class="ct-proj" style="stroke:' + color + '"');
      body += K.circle([x(s.day), y(s.demand)], 4.5, ' class="ct-dot" style="fill:' + color + '"');
      body += K.circle([x(WINDOW_DAYS), y(s.projected)], 3.5, ' class="ct-dot ct-dot--open" style="stroke:' + color + '"');
      var tip = s.design.name + ' \u00b7 day ' + s.day + ': ' + K.fmt(s.demand) + ' ordered \u00b7 projected ' +
        K.fmt(s.projected) + ' at close \u00b7 ' + s.status.label.toLowerCase();
      body += K.hit(toPx(actual.concat(future)), tip,
        s.design.name + ': ' + K.fmt(s.demand) + ' ordered, projected ' + K.fmt(s.projected));
    });

    var legend = '<div class="ct-legend">' + states.map(function (s) {
      return '<span class="ct-key"><i style="background:' + colorFor(s.design.name) + '"></i>' +
        esc(s.design.name) + ' <b>' + fmt(s.demand) + '</b> \u2192 ' + fmt(s.projected) + '</span>';
    }).join('') +
      '<span class="ct-key ct-key--note"><i class="ct-key--dash"></i>dashed = trailing-average projection</span>' +
      (SCENARIO.overlays.band
        ? '<span class="ct-key ct-key--note"><i class="ct-key--band"></i>shaded = illustrative spread, not a confidence interval</span>'
        : '') +
      '</div>';
    return K.svg(w, h, body) + legend;
  }

  /* daily order rhythm, one small multiple per design on a SHARED scale — so a
     scenario that lifts demand visibly lengthens the bars rather than just
     rescaling its own chart */
  function dailyChart(states) {
    var K = C();
    var pad = DAILY.pad, w = DAILY.w, h = DAILY.h;
    var moqPace = SCENARIO.moq / WINDOW_DAYS;
    var all = [];
    var rows = states.map(function (s) {
      var bars = dailyBars(s);
      all = all.concat(bars.map(function (b) { return b.v; }));
      return { st: s, bars: bars };
    });
    var maxV = Math.max(moqPace, Math.max.apply(null, all)) * 1.12 || 1;
    var y = K.scaleLinear(0, maxV, h - pad.b, pad.t);
    var slot = (w - pad.l - pad.r) / WINDOW_DAYS;
    var bw = Math.max(3, slot * 0.62);

    var figs = rows.map(function (row) {
      var s = row.st, color = colorFor(s.design.name);
      var body = '';
      row.bars.forEach(function (b) {
        var bx = pad.l + slot * (b.day - 1) + (slot - bw) / 2;
        var top = y(b.v);
        var tipTxt = 'Day ' + b.day + (b.future ? ' \u00b7 projected ' : ' \u00b7 ') + K.fmt(Math.round(b.v)) + ' orders' +
          (b.future ? '' : ' \u00b7 ' + s.design.name);
        /* the <title> must be the group's first child to name it, and <rect> stays
           self-closed so the markup is unambiguous in both SVG and HTML parsing */
        body += '<g class="ct-hit" data-tip="' + K.esc(tipTxt) + '"><title>' + K.esc(tipTxt) + '</title>' +
          '<rect class="ct-bar ' + (b.future ? 'ct-bar--future' : 'ct-bar--past') + '" x="' + K.round2(bx) +
          '" y="' + K.round2(top) + '" width="' + K.round2(bw) + '" height="' + K.round2(y(0) - top) +
          '" style="' + (b.future ? 'stroke:' + color : 'fill:' + color) + '"/></g>';
      });
      body += '<line class="ct-ref" x1="' + pad.l + '" y1="' + K.round2(y(moqPace)) + '" x2="' + K.round2(w - pad.r) +
        '" y2="' + K.round2(y(moqPace)) + '"/>';
      body += K.text([pad.l - 6, y(moqPace) + 3.5], K.fmt(Math.round(moqPace)), ' class="ct-axis" text-anchor="end"');
      return '<figure class="daily">' +
        '<figcaption><b>' + K.esc(shortFor(s.design.name)) + '</b>' +
          '<span class="dstatus dstatus--' + s.status.key + '">' + K.esc(s.status.label) + '</span>' +
          '<span class="daily__tot">' + K.fmt(s.demand) + ' \u2192 ' + K.fmt(s.projected) + '</span></figcaption>' +
        K.svg(w, h, body, 'ct ct--daily') +
        '</figure>';
    }).join('');

    return '<div class="daily-grid">' + figs + '</div>' +
      '<div class="ct-legend"><span class="ct-key ct-key--note">one bar per day \u00b7 solid = orders to date, outlined = projected \u00b7 ' +
      'the dashed line is the daily pace this MOQ needs (' + K.fmt(Math.round(moqPace)) + '/day) \u00b7 all three share one scale, ' +
      'so the scenario buttons change the bars and not just the axis</span></div>';
  }

  function contribChart(states) {
    var K = C();
    var pad = CHART.pad, w = CHART.w, h = CHART.h;
    var maxQty = Math.max.apply(null, states.map(function (s) { return s.prod; })) * 1.15 || 1;
    var maxCon = Math.max.apply(null, states.map(function (s) { return s.contribution; })) * 1.15 || 1;
    var xMax = K.niceCeil(maxQty, K.niceStep(maxQty, 4));
    var yMax = K.niceCeil(maxCon, K.niceStep(maxCon, 4));
    var x = K.scaleLinear(0, xMax, pad.l, w - pad.r);
    var y = K.scaleLinear(0, yMax, h - pad.b, pad.t);
    var xT = K.axisTicks(0, xMax, 4), yT = K.axisTicks(0, yMax, 4);

    var body = '';
    yT.forEach(function (t) {
      body += '<line class="ct-grid" x1="' + K.round2(x(xT[0])) + '" y1="' + K.round2(y(t)) +
        '" x2="' + K.round2(x(xT[xT.length - 1])) + '" y2="' + K.round2(y(t)) + '"/>';
      body += K.text([pad.l - 9, y(t) + 4], 'S$' + K.fmt(t), ' class="ct-axis" text-anchor="end"');
    });
    xT.forEach(function (t) {
      body += '<line class="ct-grid" x1="' + K.round2(x(t)) + '" y1="' + K.round2(y(yT[0])) +
        '" x2="' + K.round2(x(t)) + '" y2="' + pad.t + '"/>';
      body += K.text([x(t), h - pad.b + 17], K.fmt(t) + ' units', ' class="ct-axis" text-anchor="middle"');
    });

    body += '<line class="ct-moq ct-moq--vert" x1="' + K.round2(x(SCENARIO.moq)) + '" y1="' + y(0) +
      '" x2="' + K.round2(x(SCENARIO.moq)) + '" y2="' + pad.t + '"/>';
    body += K.text([x(SCENARIO.moq) + 6, pad.t + 12], 'MOQ ' + K.fmt(SCENARIO.moq), ' class="ct-note"');

    states.forEach(function (s) {
      var color = colorFor(s.design.name);
      var r = 7 + Math.max(0, Math.min(6, (s.margin.pct - 55) / 3));
      body += K.circle([x(s.prod), y(s.contribution)], r, ' class="ct-dot" style="fill:' + color + ';opacity:.85"');
      body += K.text([x(s.prod) + r + 5, y(s.contribution) + 4], shortFor(s.design.name), ' class="ct-note"');
      var tip = s.design.name + ': ' + K.fmt(s.prod) + ' units \u00b7 ' + s.margin.pct.toFixed(1) +
        '% margin \u00b7 ' + money(s.contribution) + ' contribution';
      body += '<g class="ct-hit" tabindex="0" role="img" aria-label="' + esc(tip) + '" data-tip="' + esc(tip) + '">' +
        K.circle([x(s.prod), y(s.contribution)], Math.max(12, r + 6), ' fill="transparent"') + '</g>';
    });

    return K.svg(w, h, body) +
      '<div class="ct-legend"><span class="ct-key ct-key--note">bubble size = margin % \u00b7 ' +
      'right of the MOQ line is where production stops being driven by the factory minimum</span></div>';
  }

  function histChart() {
    var K = C();
    var pad = CHART.pad, w = CHART.w, h = CHART.h;
    var cats = HISTORY.map(function (h_) {
      return { short: h_.short, label: h_.name, sub: h_.when, qty: h_.qty, past: true, sell: h_.sellThrough, margin: h_.margin };
    }).concat(DESIGNS.map(function (d, i) {
      var st = stateFor(d);
      return { short: DESIGN_SHORT[i], label: d.name, sub: 'this window', qty: st.prod, past: false, ci: i, sell: null, margin: st.margin.pct };
    }));
    var top = Math.max.apply(null, cats.map(function (c) { return c.qty; })) * 1.15 || 1;
    var yMax = K.niceCeil(top, K.niceStep(top, 4));
    var plotL = pad.l, plotR = w - pad.r;
    var slot = (plotR - plotL) / cats.length;
    var barW = slot * 0.52;
    var y = K.scaleLinear(0, yMax, h - pad.b, pad.t);

    var body = '';
    K.axisTicks(0, yMax, 4).forEach(function (t) {
      body += '<line class="ct-grid" x1="' + plotL + '" y1="' + K.round2(y(t)) + '" x2="' + plotR + '" y2="' + K.round2(y(t)) + '"/>';
      body += K.text([pad.l - 9, y(t) + 4], K.fmt(t), ' class="ct-axis" text-anchor="end"');
    });
    body += '<line class="ct-axis-line" x1="' + plotL + '" y1="' + K.round2(y(0)) + '" x2="' + plotR + '" y2="' + K.round2(y(0)) + '"/>';

    var pastQtys = HISTORY.map(function (h_) { return h_.qty; });
    var lo = Math.min.apply(null, pastQtys), hi = Math.max.apply(null, pastQtys);
    body += '<rect class="ct-bench" x="' + plotL + '" y="' + K.round2(y(hi)) + '" width="' +
      K.round2(plotR - plotL) + '" height="' + K.round2(y(lo) - y(hi)) + '"/>';
    body += K.text([plotL + 6, y(hi) - 6], 'past runs: ' + K.fmt(lo) + '\u2013' + K.fmt(hi) + ' units',
      ' class="ct-note"');

    cats.forEach(function (c, i) {
      var cx = plotL + slot * i + slot / 2;
      var color = c.past ? '#c9d2e0' : DESIGN_COLORS[c.ci];
      var yTop = y(c.qty);
      body += '<rect class="ct-bar" x="' + K.round2(cx - barW / 2) + '" y="' + K.round2(yTop) +
        '" width="' + K.round2(barW) + '" height="' + K.round2(y(0) - yTop) + '" style="fill:' + color + '"/>';
      body += K.text([cx, y(0) + 16], c.short, ' class="ct-axis" text-anchor="middle"');
      body += K.text([cx, y(0) + 27], c.past ? c.sub : 'open', ' class="ct-axis ct-axis--sub" text-anchor="middle"');
      var tip = c.label + ' (' + c.sub + '): ' + K.fmt(c.qty) + ' units \u00b7 ' +
        (c.sell === null ? 'sell-through pending (window open)' : c.sell + '% sell-through') +
        ' \u00b7 ' + Number(c.margin).toFixed(1) + '% margin';
      body += '<g class="ct-hit" tabindex="0" role="img" aria-label="' + esc(tip) + '" data-tip="' + esc(tip) + '">' +
        '<rect x="' + K.round2(cx - barW / 2) + '" y="' + K.round2(yTop) + '" width="' + K.round2(barW) +
        '" height="' + K.round2(y(0) - yTop) + '" fill="transparent"/></g>';
    });

    return K.svg(w, h, body) +
      '<div class="ct-legend"><span class="ct-key ct-key--note">grey bars = the ' + HISTORY.length +
      ' past runs \u00b7 coloured bars = this window at the current scenario \u00b7 the band is the past-run range</span></div>';
  }

  function sparkline(vals, color) {
    var K = C();
    var w = 132, h = 30, p = 3;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var x = K.scaleLinear(0, vals.length - 1, p, w - p);
    var y = K.scaleLinear(min === max ? min - 1 : min, max, h - p, p);
    var path = K.linePath(vals.map(function (v, i) { return [x(i), y(v)]; }));
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  }

  function cardTrajectory(st) {
    return trajectorySVG(st, MINI, true) +
      '<div class="ct-legend ct-legend--mini"><span class="ct-key ct-key--note">orders to date \u2192 projected close \u00b7 dashed line = MOQ</span></div>';
  }

  /* ---------- paint ---------- */

  function paintRow(row, st) {
    var out = row.querySelector('.qty-row output');
    if (out) { out.value = st.demand; out.textContent = fmt(st.demand); }
    var prod = row.querySelector('.js-prod');
    if (prod) prod.textContent = fmt(st.prod);
    var moqCell = row.children[2];
    if (moqCell) moqCell.textContent = fmt(st.moq);
    var note = row.querySelector('.js-demv');
    if (note) {
      var bits = [];
      bits.push(st.extra > 0 ? '+' + fmt(st.extra) + ' from your demo checkouts' : 'illustrative orders to date');
      if (SCENARIO.demand[st.design.name] !== undefined) bits.push('scenario');
      if (SCENARIO.cancel > 0) bits.push('net of ' + SCENARIO.cancel + '% cancellations');
      if (st.pushed) bits.push('includes modelled push');
      note.textContent = bits.join(' \u00b7 ');
    }
    var bar = row.querySelector('.mini-bar');
    if (bar) {
      var scale = Math.max(st.prod * 1.15, 1);
      bar.innerHTML = '<i class="dem" style="width:' + (st.demand / scale * 100) + '%"></i>' +
        '<i style="width:' + (st.moq / scale * 100) + '%"></i>';
    }
  }

  function setHTMLIn(ctx, sel, html) {
    var el = ctx ? ctx.querySelector(sel) : null;
    if (el) el.innerHTML = html;
  }

  function paintCard(card, st) {
    var status = card.querySelector('.js-status');
    if (status) {
      status.textContent = st.status.label;
      status.className = 'dstatus dstatus--' + st.status.key + ' js-status';
    }
    var orders = card.querySelector('.js-orders'); if (orders) orders.textContent = fmt(st.demand);
    var proj = card.querySelector('.js-proj'); if (proj) proj.textContent = fmt(st.projected);
    var qty = card.querySelector('.js-qty'); if (qty) qty.textContent = fmt(st.prod);
    setHTMLIn(card, '.js-card-traj', cardTrajectory(st));
    var seg = card.querySelector('.js-attr-seg');
    if (seg) seg.innerHTML = attribHTML('Who is buying', st.design.segments, SEG_ORDER, SEG_SHORT, st.demand);
    var ch = card.querySelector('.js-attr-ch');
    if (ch) ch.innerHTML = attribHTML('Where they came from', st.design.channels, CH_ORDER, CH_SHORT, st.demand);
    setHTMLIn(card, '.js-mgrid', marginHTML(st));
    var parts = reasonParts(st.design, st.projected);
    var reason = card.querySelector('.js-reason');
    if (reason) reason.textContent = parts.base;
    var note = card.querySelector('.js-signote');
    if (note) {
      note.className = signoteClass(parts);
      note.innerHTML = signalNoteHTML(parts);
    }
  }

  function paintVerdict(states) {
    var el = $('dashVerdict');
    if (!el) return;
    var v = verdictFor(states);
    el.className = 'dash-verdict dash-verdict--' + v.key;
    el.innerHTML = '<b class="dash-verdict__lead">' + esc(v.lead) + '</b> ' + v.text;
    var clock = $('dashClock');
    if (clock) {
      clock.innerHTML = clockHTML();
      clock.hidden = false;
    }
    var sn = $('stressNote');
    if (sn) {
      var stressBits = [];
      if (SCENARIO.cancel > 0) stressBits.push(SCENARIO.cancel + '% cancellations · ' + money(totalRefunds(states)) + ' owed back');
      if (SCENARIO.delay) stressBits.push('production slips +2w → ships ' + fmtDate(decisionClock().ship.date));
      sn.hidden = !stressBits.length;
      if (stressBits.length) sn.innerHTML = '<b>Stress:</b> ' + stressBits.join(' · ') + '.';
    }
    var dec = $('decisionsWrap');
    if (dec) dec.hidden = !rowsExist(states);
  }
  function totalRefunds(states) {
    return states.reduce(function (s, st) { return s + (st.refunds || 0); }, 0);
  }
  function rowsExist(states) {
    return states.some(function (s) { return s.status.key === 'risk' || s.status.key === 'floor'; });
  }
  function paintClock() {}

  function paintHealth(states) {
    var atRisk = states.filter(function (s) { return s.status.key === 'risk'; }).length;
    var ahead = states.filter(function (s) { return s.status.key === 'ahead'; }).length;
    var val = $('poHealthVal');
    if (val) val.textContent = states.length + ' designs \u00b7 ' + atRisk + ' at risk';
    var delta = $('poHealthDelta');
    if (delta) {
      delta.textContent = atRisk ? '\u2192 ' + atRisk + ' to act on' : '\u2713 all cover MOQ';
      delta.className = 'delta' + (atRisk ? ' delta--risk' : '');
    }
    var note = $('poHealthNote');
    if (note) {
      note.textContent = ahead + ' design' + (ahead === 1 ? '' : 's') +
        ' projected well above MOQ \u00b7 decisions are due before the window closes, not after.';
    }
  }

  /* store-wide tiles: the sparkline window and the delta both follow the range
     control, so they are interactive too */
  function paintTiles() {
    var n = rangeWeeks();
    Object.keys(TILE_META).forEach(function (k) {
      var meta = TILE_META[k];
      var full = TILE_SERIES[k];
      var vals = full.slice(Math.max(0, full.length - n));
      setHTML(meta.spark, sparkline(vals, TILE_COLORS[k]));
      var d = vals[vals.length - 1] - vals[0];
      var el = $(meta.delta);
      if (el) {
        el.textContent = (d >= 0 ? '+' : '\u2212') +
          (meta.money ? 'S$' + Math.abs(d).toFixed(2) : Math.abs(d).toFixed(1) + meta.unit);
      }
    });
    var lbl = $('rangeVal');
    if (lbl) lbl.textContent = n + 'w';
  }

  function paintScenarioNote() {
    var el = $('scenarioNote');
    if (!el) return;
    var bits = [];
    if (Object.keys(SCENARIO.demand).length) bits.push('a demand scenario');
    if (SCENARIO.day !== WINDOW_DAY) bits.push('day ' + SCENARIO.day + ' of ' + WINDOW_DAYS);
    if (SCENARIO.moq !== MOQ) bits.push('an MOQ of ' + fmt(SCENARIO.moq));
    if (SCENARIO.cancel > 0) bits.push(SCENARIO.cancel + '% cancellations');
    if (SCENARIO.delay) bits.push('a +2w production slip');
    Object.keys(SCENARIO.push).forEach(function (k) { if (SCENARIO.push[k]) bits.push('a modelled push on ' + k); });
    el.hidden = !bits.length;
    if (bits.length) {
      el.innerHTML = 'Modelling ' + bits.join(' \u00b7 ') +
        ' \u2014 this scenario is in the URL, so the link can be shared. Reset returns to the live orders-to-date view.';
    }
  }

  function syncControls() {
    var day = $('ctDay');
    if (day) day.value = String(SCENARIO.day);
    var dayVal = $('ctDayVal');
    if (dayVal) dayVal.textContent = String(SCENARIO.day);
    var moq = $('ctMoq');
    if (moq && document.activeElement !== moq) moq.value = String(SCENARIO.moq);
    var cancel = $('ctCancel');
    if (cancel) {
      cancel.value = String(SCENARIO.cancel);
      cancel.disabled = SCENARIO.day >= WINDOW_DAYS;
    }
    var cancelVal = $('ctCancelVal');
    if (cancelVal) cancelVal.textContent = String(SCENARIO.cancel) + '%';
    var delay = $('ctDelay');
    if (delay) delay.checked = !!SCENARIO.delay;
    $$('[data-overlay]').forEach(function (b) {
      b.classList.toggle('is-on', !!SCENARIO.overlays[b.getAttribute('data-overlay')]);
    });
    $$('[data-attr]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-attr') === SCENARIO.attr);
    });
    $$('[data-range]').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-range') === SCENARIO.range);
    });
  }

  /* stress + push layer: every downstream number reads the NET projection */
  function refresh() {
    var states = DESIGNS.map(function (d) { return stateFor(d); });
    function stateOf(name) {
      for (var i = 0; i < states.length; i++) if (states[i].design.name === name) return states[i];
      return null;
    }
    $$('.js-moq-row').forEach(function (row) {
      var st = stateOf(row.getAttribute('data-design'));
      if (st) paintRow(row, st);
    });
    $$('.dcard').forEach(function (card) {
      var st = stateOf(card.getAttribute('data-design'));
      if (st) paintCard(card, st);
    });
    setHTML('histRows', historyHTML());
    setHTML('chartPace', trajectoryChart(states));
    setHTML('chartDaily', dailyChart(states));
    setHTML('chartContrib', contribChart(states));
    setHTML('chartHist', histChart());
    setHTML('dashDecisions', decisionsHTML(states));
    paintClock();
    paintHealth(states);
    paintVerdict(states);
    paintTiles();
    paintScenarioNote();
    syncControls();
    syncUrl();
  }

  /* ---------- tooltip ---------- */
  function showTip(target, cx, cy) {
    var tip = $('chartTip');
    var txt = target.getAttribute('data-tip');
    if (!tip || !txt) return;
    tip.innerHTML = txt;
    tip.hidden = false;
    var rect = tip.getBoundingClientRect ? tip.getBoundingClientRect() : { width: 240, height: 44 };
    var vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
    var left = Math.min(Math.max(8, cx + 14), Math.max(8, vw - (rect.width || 240) - 10));
    var top = Math.max(8, cy - (rect.height || 44) - 14);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() { var t = $('chartTip'); if (t) t.hidden = true; }

  /* ---------- scenario buttons ---------- */
  function applyScenario(kind) {
    if (kind === 'reset') {
      SCENARIO.demand = {};
      SCENARIO.cancel = 0;
      SCENARIO.delay = false;
      SCENARIO.push = {};
    } else if (kind === 'close') {
      SCENARIO.day = WINDOW_DAYS;
    } else if (kind === 'moq') {
      DESIGNS.forEach(function (d) { SCENARIO.demand[d.name] = SCENARIO.moq; });
    } else if (kind === 'up' || kind === 'down') {
      DESIGNS.forEach(function (d) {
        var f = kind === 'up' ? 1.2 : 0.8;
        SCENARIO.demand[d.name] = Math.max(0, Math.round(demandOf(d) * f / 10) * 10);
      });
    }
    refresh();
  }

  /* ---------- wiring ---------- */
  document.addEventListener('qtychange', function (e) {
    var row = e.target && e.target.closest ? e.target.closest('.js-moq-row') : null;
    if (!row) return;
    var design = designByName(row.getAttribute('data-design'));
    var out = row.querySelector('.qty-row output');
    if (!design || !out) return;
    SCENARIO.demand[design.name] = parseInt(out.value, 10) || 0;
    refresh();
  });

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var preset = e.target.closest('.js-moq-preset');
    if (preset) {
      var row = preset.closest('.js-moq-row');
      var out = row ? row.querySelector('.qty-row output') : null;
      if (out) {
        out.value = preset.getAttribute('data-v');
        row.dispatchEvent(new Event('qtychange', { bubbles: true }));
      }
      return;
    }
    var scen = e.target.closest('[data-scenario]');
    if (scen) { applyScenario(scen.getAttribute('data-scenario')); return; }
    var ov = e.target.closest('[data-overlay]');
    if (ov) {
      var k = ov.getAttribute('data-overlay');
      SCENARIO.overlays[k] = !SCENARIO.overlays[k];
      syncControls();
      setHTML('chartPace', trajectoryChart(DESIGNS.map(function (d) { return stateFor(d); })));
      return;
    }
    var at = e.target.closest('[data-attr]');
    if (at) {
      SCENARIO.attr = at.getAttribute('data-attr');
      refresh();
      return;
    }
    var rg = e.target.closest('[data-range]');
    if (rg) {
      SCENARIO.range = rg.getAttribute('data-range');
      syncControls();
      paintTiles();
      syncUrl();
    }
  });

  document.addEventListener('input', function (e) {
    if (!e.target) return;
    if (e.target.id === 'ctDay') {
      SCENARIO.day = Math.min(WINDOW_DAYS, Math.max(1, parseInt(e.target.value, 10) || WINDOW_DAY));
      refresh();
      return;
    }
    if (e.target.id === 'ctMoq') {
      var v = parseInt(e.target.value, 10);
      if (v >= 0 && isFinite(v)) { SCENARIO.moq = v; refresh(); }
      return;
    }
    if (e.target.id === 'ctCancel') {
      var c = parseInt(e.target.value, 10) || 0;
      if (c >= 0 && c <= CANCEL_CAP) { SCENARIO.cancel = c; refresh(); }
      return;
    }
    if (e.target.id === 'ctDelay') {
      SCENARIO.delay = !!e.target.checked;
      refresh();
    }
  });

  document.addEventListener('change', function (e) {
    var sel = e.target && e.target.closest ? e.target.closest('.js-signal') : null;
    if (!sel) return;
    var card = sel.closest('.dcard');
    if (!card) return;
    var name = card.getAttribute('data-design');
    writeSignal(name, sel.value);
    var txt = card.querySelector('.js-signal-txt');
    if (txt) txt.textContent = sel.value || 'none tagged';
    /* the tag is not decoration: it changes the reason line, so the card the
       owner is looking at immediately explains itself. Only text nodes are
       rewritten — no element appears or disappears, so the row cannot resize. */
    refresh();
  });

  /* decision table: model the push for one design straight from the table */
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('.js-deci-push') : null;
    if (!b) return;
    var name = b.getAttribute('data-design');
    if (SCENARIO.push[name]) delete SCENARIO.push[name];
    else SCENARIO.push[name] = true;
    refresh();
  });

  document.addEventListener('mouseover', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) showTip(t, e.clientX || 0, e.clientY || 0);
  });
  document.addEventListener('mouseout', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) hideTip();
  });
  document.addEventListener('focusin', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (!t) return;
    var r = t.getBoundingClientRect ? t.getBoundingClientRect() : null;
    showTip(t, r ? r.left + r.width / 2 : 24, r ? r.top : 24);
  });
  document.addEventListener('focusout', hideTip);

  /* ---------- sticky bar geometry + section navigation ---------- */
  function hOf(el) {
    return (el && el.getBoundingClientRect) ? Math.round(el.getBoundingClientRect().height) : 0;
  }
  /* Publish the two heights the layout needs: the site header (the bar sticks
     beneath it) and the bar itself (each zone's scroll-margin clears both). */
  function syncGeometry() {
    var head = document.getElementById ? document.getElementById('siteHead') : null;
    var hHead = hOf(head), hBar = hOf($('dashBar'));
    var root = document.documentElement;
    if (root && root.style && typeof root.style.setProperty === 'function') {
      if (hHead) root.style.setProperty('--dash-top', hHead + 'px');
      root.style.setProperty('--dash-h', hBar + 'px');
    }
    return hHead + hBar;
  }
  function navOffset() {
    var head = document.getElementById ? document.getElementById('siteHead') : null;
    return hOf(head) + hOf($('dashBar')) + 14;
  }
  function jumpTo(id) {
    var t = document.getElementById ? document.getElementById(id) : null;
    if (!t || !t.getBoundingClientRect) return false;
    var y = t.getBoundingClientRect().top + (window.pageYOffset || 0) - navOffset();
    var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    try { window.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' }); }
    catch (e) { window.scrollTo(0, Math.max(0, y)); }
    return true;
  }
  /* jump links scroll without writing a hash — the scenario already owns the
     URL, and syncUrl() rewrites it on every refresh */
  function bindNav() {
    $$('.dash-nav a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;
        if (jumpTo(href.slice(1)) && e.preventDefault) e.preventDefault();
      });
    });
  }
  /* which question am I looking at? — highlights the matching jump link */
  function syncNav() {
    if (!window.IntersectionObserver) return;
    var links = $$('.dash-nav a');
    var zones = $$('.zone, .fold').filter(function (z) { return !!z.id; });
    if (!zones.length || !links.length) return;
    var pad = Math.round(navOffset()) + 8;
    var io = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-here', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-' + pad + 'px 0px -55% 0px', threshold: 0 });
    zones.forEach(function (z) { io.observe(z); });
  }

  function init() {
    var tbody = $('dashRows');
    if (!tbody) return;
    readScenarioFromUrl();
    tbody.innerHTML = DESIGNS.map(rowHTML).join('');
    setHTML('dashCards', DESIGNS.map(cardHTML).join(''));
    setHTML('histRows', historyHTML());
    paintTiles();

    var tally = preOrders();
    var live = Object.keys(tally).reduce(function (s, k) { return s + tally[k]; }, 0);
    var liveNote = $('dashLiveNote');
    if (liveNote) {
      liveNote.hidden = !live;
      if (live) {
        liveNote.innerHTML = '<b>' + fmt(live) + ' unit' + (live === 1 ? '' : 's') +
          '</b> in this dashboard came from your own demo checkouts through the storefront \u2014 ' +
          'place another pre-order and reload to watch demand, pace and margin move.';
      }
    }
    refresh();
    syncGeometry();
    bindNav();
    syncNav();
  }

  if (window.addEventListener) {
    window.addEventListener('resize', syncGeometry);
    window.addEventListener('load', syncGeometry);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  /* exposed for the smoke suite — the model is pure, so the projection, the flags,
     the rationale, the margin and the chart geometry can all be asserted directly */
  window.EL_DASH = {
    MOQ: MOQ, WINDOW_DAY: WINDOW_DAY, WINDOW_DAYS: WINDOW_DAYS,
    designs: DESIGNS, history: HISTORY, signals: SIGNALS, ranges: RANGES,
    tileSeries: TILE_SERIES, scenario: SCENARIO, colors: DESIGN_COLORS,
    projection: projection, statusOf: statusOf, dominant: dominant,
    marginOf: marginOf, reasonFor: reasonFor, reasonParts: reasonParts,
    signalWhy: signalWhy, verdictFor: verdictFor, stateFor: stateFor,
    designByName: designByName, preOrders: preOrders, demandFor: demandFor,
    demandOf: demandOf, signalFor: signalFor, slug: slug, fmt: fmt,
    actualPoints: actualPoints, projectedPoints: projectedPoints, bandEdges: bandEdges, dailyBars: dailyBars,
    decisionClock: decisionClock, clockHTML: clockHTML, commitOptions: commitOptions,
    decisionsHTML: decisionsHTML, netFactor: netFactor, netDemandOf: netDemandOf,
    refundCash: refundCash, pushedProjection: pushedProjection, dayToDate: dayToDate, fmtDate: fmtDate,
    rowHTML: rowHTML, cardHTML: cardHTML, historyHTML: historyHTML,
    attribHTML: attribHTML, marginHTML: marginHTML, signalHTML: signalHTML,
    signalNoteHTML: signalNoteHTML, signoteClass: signoteClass,
    trajectoryChart: trajectoryChart, dailyChart: dailyChart,
    contribChart: contribChart, histChart: histChart,
    cardTrajectory: cardTrajectory, sparkline: sparkline
  };
})();
