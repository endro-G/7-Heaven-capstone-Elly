/* ============================================================
   THE ELLY STORE — revamp prototype · visitor geo-location
   Silent, permission-free geo for the demo. No GPS, no prompts,
   nothing stored beyond the current session.

   Detection chain (first success wins):
     1. dev override   ?geo=US in the URL, or ELGEO.override('US')
                       (?geo=clear removes it) — for testing any country
     2. session cache  sessionStorage key "elly-geo" (6h)
     3. Vercel edge    GET /api/geo — the api/geo.js function returns the
                       x-vercel-ip-* headers (free on Vercel Hobby, no key)
     4. ipwho.is       free key-less IP lookup — this is what runs on
                       localhost, where /api/geo does not exist
     5. locale hint    visitor timezone + browser language (offline-safe)

   What it does with the result:
     - announcement bar chip: "🇸🇬 Singapore · ships worldwide"
     - checkout: preselects the visitor's country in #f-country
       (skipped for SG visitors — ship-to-Singapore stays the default)

   Test locally:  add ?geo=US (or any ISO code) to any page URL,
   or run ELGEO.override('JP') / ELGEO.clearOverride() in the console.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'elly-geo';            /* resolved geo, this session only */
  var OVR = 'elly-geo-override';   /* dev override, this session only */
  var MAX_AGE = 6 * 60 * 60 * 1000;
  var OTHER = 'Other (20+ countries)';

  /* ISO-3166 alpha-2 → display name (countries the demo cares about) */
  var NAMES = {
    SG:'Singapore', MY:'Malaysia', ID:'Indonesia', TH:'Thailand', PH:'Philippines',
    VN:'Vietnam', TW:'Taiwan', CN:'China', HK:'Hong Kong', MO:'Macao', JP:'Japan',
    KR:'South Korea', IN:'India', BD:'Bangladesh', LK:'Sri Lanka', NP:'Nepal',
    PK:'Pakistan', AE:'United Arab Emirates', SA:'Saudi Arabia', QA:'Qatar',
    KW:'Kuwait', BH:'Bahrain', OM:'Oman', IL:'Israel', TR:'Turkey',
    AU:'Australia', NZ:'New Zealand', FJ:'Fiji',
    US:'United States', CA:'Canada', MX:'Mexico',
    BR:'Brazil', AR:'Argentina', CL:'Chile', CO:'Colombia', PE:'Peru',
    GB:'United Kingdom', IE:'Ireland', FR:'France', DE:'Germany', ES:'Spain',
    IT:'Italy', PT:'Portugal', NL:'Netherlands', BE:'Belgium', LU:'Luxembourg',
    CH:'Switzerland', AT:'Austria', SE:'Sweden', NO:'Norway', DK:'Denmark',
    FI:'Finland', IS:'Iceland', PL:'Poland', CZ:'Czechia', HU:'Hungary',
    RO:'Romania', GR:'Greece', RU:'Russia', UA:'Ukraine', HR:'Croatia',
    ZA:'South Africa', EG:'Egypt', KE:'Kenya', NG:'Nigeria', MA:'Morocco',
    MV:'Maldives', KH:'Cambodia', MM:'Myanmar', LA:'Laos', MN:'Mongolia',
    BN:'Brunei'
  };

  /* timezone → { c: country code, city } — the cheap, permission-free hint */
  var TZ = {
    'Asia/Singapore': { c: 'SG', city: 'Singapore' },
    'Asia/Kuala_Lumpur': { c: 'MY', city: 'Kuala Lumpur' },
    'Asia/Jakarta': { c: 'ID', city: 'Jakarta' },
    'Asia/Bangkok': { c: 'TH', city: 'Bangkok' },
    'Asia/Manila': { c: 'PH', city: 'Manila' },
    'Asia/Ho_Chi_Minh': { c: 'VN', city: 'Ho Chi Minh City' },
    'Asia/Shanghai': { c: 'CN', city: 'Shanghai' },
    'Asia/Hong_Kong': { c: 'HK', city: 'Hong Kong' },
    'Asia/Taipei': { c: 'TW', city: 'Taipei' },
    'Asia/Tokyo': { c: 'JP', city: 'Tokyo' },
    'Asia/Seoul': { c: 'KR', city: 'Seoul' },
    'Asia/Kolkata': { c: 'IN', city: 'Mumbai' },
    'Asia/Colombo': { c: 'LK', city: 'Colombo' },
    'Asia/Dubai': { c: 'AE', city: 'Dubai' },
    'Asia/Riyadh': { c: 'SA', city: 'Riyadh' },
    'Australia/Sydney': { c: 'AU', city: 'Sydney' },
    'Australia/Melbourne': { c: 'AU', city: 'Melbourne' },
    'Australia/Perth': { c: 'AU', city: 'Perth' },
    'Pacific/Auckland': { c: 'NZ', city: 'Auckland' },
    'Europe/London': { c: 'GB', city: 'London' },
    'Europe/Dublin': { c: 'IE', city: 'Dublin' },
    'Europe/Paris': { c: 'FR', city: 'Paris' },
    'Europe/Berlin': { c: 'DE', city: 'Berlin' },
    'Europe/Zurich': { c: 'CH', city: 'Zurich' },
    'Europe/Amsterdam': { c: 'NL', city: 'Amsterdam' },
    'Europe/Madrid': { c: 'ES', city: 'Madrid' },
    'Europe/Rome': { c: 'IT', city: 'Rome' },
    'America/New_York': { c: 'US', city: 'New York' },
    'America/Chicago': { c: 'US', city: 'Chicago' },
    'America/Los_Angeles': { c: 'US', city: 'Los Angeles' },
    'America/Toronto': { c: 'CA', city: 'Toronto' },
    'America/Vancouver': { c: 'CA', city: 'Vancouver' },
    'America/Mexico_City': { c: 'MX', city: 'Mexico City' },
    'America/Sao_Paulo': { c: 'BR', city: 'Sao Paulo' }
  };

  /* checkout #f-country option text per country code */
  var CHECKOUT = {
    AU: 'Australia', CN: 'China', ID: 'Indonesia', JP: 'Japan',
    MY: 'Malaysia', GB: 'United Kingdom', US: 'United States'
  };

  /* ---------- helpers ---------- */
  function nameFor(cc) { return NAMES[cc] || cc || ''; }
  function flagFor(cc) {
    cc = String(cc || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return '';
    return String.fromCodePoint(0x1F1E6 + cc.charCodeAt(0) - 65, 0x1F1E6 + cc.charCodeAt(1) - 65);
  }
  function norm(cc, city, lat, lng, source) {
    cc = String(cc || '').toUpperCase();
    var nlat = parseFloat(lat), nlng = parseFloat(lng);
    return {
      country: cc, countryName: nameFor(cc), city: city || '',
      lat: isNaN(nlat) ? null : nlat, lng: isNaN(nlng) ? null : nlng,
      source: source
    };
  }
  function fetchJSON(url, ms) {
    if (typeof fetch !== 'function') return Promise.reject(new Error('no fetch'));
    return new Promise(function (resolve, reject) {
      var done = false;
      var timer = setTimeout(function () {
        if (!done) { done = true; reject(new Error('timeout')); }
      }, ms || 3000);
      fetch(url).then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error('http ' + r.status));
      }).then(function (data) {
        if (!done) { done = true; clearTimeout(timer); resolve(data); }
      }).catch(function (err) {
        if (!done) { done = true; clearTimeout(timer); reject(err); }
      });
    });
  }

  /* ---------- tier 3: Vercel edge geo (api/geo.js) ---------- */
  function fromVercel() {
    return fetchJSON('/api/geo', 2500).then(function (d) {
      if (!d || !d.country || d.source !== 'vercel') throw new Error('vercel geo miss');
      return norm(d.country, d.city, d.lat, d.lng, 'vercel-edge');
    });
  }

  /* ---------- tier 4: ipwho.is (no key, CORS-enabled) ---------- */
  function fromIpWho() {
    return fetchJSON('https://ipwho.is/', 3500).then(function (d) {
      if (!d || d.success === false || !d.country_code) throw new Error('ipwho miss');
      return norm(d.country_code, d.city, d.latitude, d.longitude, 'ip-lookup');
    });
  }

  /* ---------- tier 5: timezone + browser language (always works) ---------- */
  function localeHint() {
    var tz = '', lang = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    try {
      lang = (typeof navigator !== 'undefined' &&
        (navigator.language || (navigator.languages && navigator.languages[0]))) || '';
    } catch (e) {}
    var t = TZ[tz];
    if (t && t.c) {
      return norm(t.c, t.city || tz.split('/').pop().replace(/_/g, ' '), null, null, 'locale-hint');
    }
    var m = /[-_]([A-Za-z]{2})$/.exec(lang || '');
    if (m) return norm(m[1].toUpperCase(), '', null, null, 'locale-hint');
    /* store default: Singapore */
    return norm('SG', 'Singapore', null, null, 'locale-hint');
  }

  /* ---------- cache + override (session-scoped) ---------- */
  function cacheGet() {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      var o = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (!o || !o.country || Date.now() - (o.at || 0) > MAX_AGE) return null;
      return o;
    } catch (e) { return null; }
  }
  function cachePut(g) {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(KEY, JSON.stringify({
        country: g.country, countryName: g.countryName, city: g.city,
        lat: g.lat, lng: g.lng, source: g.source, at: Date.now()
      }));
    } catch (e) {}
  }
  var memOverride = null;
  function readOverride() {
    /* ?geo=XX (or ?geo=clear) wins over a stored override */
    var search = '';
    try { search = (typeof location !== 'undefined' && location.search) || ''; } catch (e) {}
    if (search) {
      var m = /[?&]geo=([A-Za-z]{2}|clear)(?:&|#|$)/.exec(search);
      if (m) {
        var v = m[1].toUpperCase();
        memOverride = v === 'CLEAR' ? null : v;
        try {
          if (typeof sessionStorage !== 'undefined') {
            if (memOverride) sessionStorage.setItem(OVR, memOverride);
            else sessionStorage.removeItem(OVR);
          }
        } catch (e) {}
      }
    }
    if (memOverride) return memOverride;
    try {
      if (typeof sessionStorage !== 'undefined') return sessionStorage.getItem(OVR) || null;
    } catch (e) {}
    return null;
  }

  /* ---------- resolution ---------- */
  var resolved = null, waiting = [];
  function flush() {
    var fns = waiting.splice(0);
    for (var i = 0; i < fns.length; i++) { try { fns[i](resolved); } catch (e) {} }
  }
  function resolve() {
    if (resolved) return Promise.resolve(resolved);
    var ovr = readOverride();
    if (ovr) { resolved = norm(ovr, '', null, null, 'override'); flush(); return Promise.resolve(resolved); }
    var c = cacheGet();
    if (c) { resolved = c; flush(); return Promise.resolve(resolved); }
    return fromVercel().catch(fromIpWho).catch(function () { return localeHint(); })
      .then(function (g) { resolved = g; cachePut(g); flush(); return g; });
  }

  /* ---------- apply: announcement chip ---------- */
  function applyChip(g) {
    var loc = document.querySelector('.announce__loc');
    if (!loc) return;
    var place = g.city && g.city !== g.countryName ? g.city + ', ' + g.countryName : g.countryName;
    var how = g.source === 'override'
      ? 'Demo override \u2014 from ?geo=' + g.country + ' or ELGEO.override()'
      : 'Detected via ' + g.source + ' \u00b7 add ?geo=US to the URL to override';
    try { loc.setAttribute('title', how); } catch (e) {}
    var svg = loc.querySelector ? loc.querySelector('svg') : null;
    var flag = flagFor(g.country);
    var text = (flag ? flag + ' ' : '') + (place || 'Singapore') + ' \u00b7 ships worldwide';
    if (svg) {
      /* keep the pin icon, replace only the text after it */
      while (svg.nextSibling) loc.removeChild(svg.nextSibling);
      loc.appendChild(document.createTextNode(' ' + text));
    } else if (typeof loc.textContent === 'string') {
      loc.textContent = text;
    }
  }

  /* ---------- apply: checkout country preselect ---------- */
  function checkoutTarget(g) {
    if (!g || !g.country || g.country === 'SG') return null;
    return CHECKOUT[g.country] || OTHER;
  }
  function applyCheckout(g) {
    var sel = document.getElementById('f-country');
    if (!sel || !g || sel.getAttribute('data-geo-done') || sel.getAttribute('data-user-touched')) return;
    var target = checkoutTarget(g);
    if (!target) return;
    var opts = sel.options || [];
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].text === target) {
        if (typeof sel.selectedIndex === 'number') sel.selectedIndex = i;
        sel.setAttribute('data-geo-done', '1');
        return;
      }
    }
  }
  /* never fight the shopper: once they touch the country field, stop preselecting */
  document.addEventListener('change', function (e) {
    var t = e && e.target;
    if (t && t.id === 'f-country') { try { t.setAttribute('data-user-touched', '1'); } catch (err) {} }
  });

  /* the shell (with the chip) is injected by components.js — wait for it */
  function whenShell(cb) {
    if (document.querySelector('.announce__loc')) return cb();
    var run = function () {
      var tries = 0;
      (function poll() {
        if (document.querySelector('.announce__loc') || tries++ > 50) return cb();
        setTimeout(poll, 100);
      })();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }

  function applyAll(g) {
    whenShell(function () { applyChip(g); });
    applyCheckout(g);
    /* geo.js is loaded dynamically by components.js and may run while the
       page is still parsing — retry the checkout preselect after DOM ready */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { applyCheckout(g); });
    }
  }
  resolve().then(applyAll);

  /* ---------- public API (window.ELGEO) ---------- */
  window.ELGEO = {
    get: resolve,
    ready: function (fn) { if (resolved) fn(resolved); else waiting.push(fn); },
    override: function (cc) {
      memOverride = cc ? String(cc).toUpperCase() : null;
      resolved = null;
      try {
        if (typeof sessionStorage !== 'undefined') {
          if (memOverride) sessionStorage.setItem(OVR, memOverride);
          else sessionStorage.removeItem(OVR);
        }
      } catch (e) {}
      return resolve();
    },
    clearOverride: function () { return this.override(null); },
    /* small pure helpers, exposed for the smoke test + future wiring */
    nameFor: nameFor,
    flagFor: flagFor,
    localeHint: localeHint,
    checkoutTarget: checkoutTarget
  };
})();
