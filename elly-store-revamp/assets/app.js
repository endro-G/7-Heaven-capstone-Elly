/* ============================================================
   THE ELLY STORE — revamp prototype · interactions
   Demo shell: visitor toggle, search overlay, ghost product
   grids (structure placeholders), facets, tabs, B2B tiering,
   checkout fulfilment options, admin MOQ/demand demo.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* storage that never throws (private mode / blocked storage falls back to memory) */
  var _memStore = {};
  function ssGet(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return k in _memStore ? _memStore[k] : null; } }
  function ssSet(k, v) { _memStore[k] = v; try { window.sessionStorage.setItem(k, v); } catch (e) {} }

  function icon(name) {
    var set = window.EL && EL.icons || {};
    return set[name] || '';
  }

  /* ---------- Ghost product card (structure placeholder) ---------- */
  var KIND_ICON = {
    elly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M7 5.5h10l1.5 5.2a6.7 6.7 0 0 1-3.7 2l-.3 4.3H9.5l-.3-4.3a6.7 6.7 0 0 1-3.7-2z"/><path d="M8 3.5c1.6 0 2.4 1 4 1s2.4-1 4-1" stroke-linecap="round"/></svg>',
    disney: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 7.3l5-.7z" opacity=".85"/><circle cx="12" cy="14" r="6" opacity=".35"/></svg>',
    shoe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 16.5c3-1.2 6.4-2 9.6-2.6l1.4-.3a4.6 4.6 0 0 1 4.5 2L20.6 17H8.5c-1.9 0-3.6.3-4.5-.5z"/><path d="M4 16.5c.6-2.6 2.9-6.5 4.6-7.6l3.3 4.8" stroke-linecap="round"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3.5" y="7.5" width="17" height="4"/><path d="M5 11.5V20h14v-8.5M12 7.5V20M12 7.5S9.5 3 7 4.5 6 9 8 9s4-1.5 4-1.5z"/></svg>',
    custom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 4.5l7 7-7 7-7-7z"/><path d="M12 4.5l1.8 1.8L12 8.1 10.2 6.3zM12 15.9l1.8 1.8L12 19.5l-1.8-1.8zM4.5 12l1.8-1.8L8.1 12l-1.8 1.8zM15.9 12l1.8-1.8L19.5 12l-1.8 1.8z"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>',
    furkids: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 21c-4.4 0-7-2.6-7-6.5C5 9.5 8 5.5 12 3.5c4 2 7 6 7 11 0 3.9-2.6 6.5-7 6.5z"/><path d="M12 8.5c-1.3 0-2.2 1-2.2 2.3 0 .6.2 1 .2 1.7 0 .8-.3 1.2-.8 1.6M12 8.5c1.3 0 2.2 1 2.2 2.3 0 .6-.2 1-.2 1.7 0 .8.3 1.2.8 1.6" stroke-linecap="round"/><path d="M9.5 17.5c.7.4 1.6.6 2.5.6s1.8-.2 2.5-.6" stroke-linecap="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 20.5S4 15 4 9.7A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8 2.5C20 15 12 20.5 12 20.5z"/></svg>'
  };

  /* ---------- Real product catalog (populated from the live theellystore.com feed) ----------
     assets/products.js exposes window.EL_PRODUCTS; each item carries real name, price,
     Shopify-CDN image, pillar kind and the intent tags that drive occasion-led rails. */
  var PRODUCTS = (window.EL_PRODUCTS) || [];

  /* occasion tile / URL param -> catalog intent tag */
  var OCCASION_INTENT = {
    'Newborn & Baby Shower': 'newborn',
    'Big Brother / Little Sister': 'sibling',
    'Theme Park Vacation': 'park',
    'Family Photoshoot': 'photoshoot',
    'Pajama Party / Sleepover': 'sleepover',
    'Holiday Gift Boxes': 'gift',
    'Birthday': 'birthday'
  };

  /* visitor segment -> product pool keys (used by the recommender grid + "rec" rails) */
  var SEG_PICKS = {
    'tourist-first': [{ k: 'disney', int: ['park'] }, { k: 'elly', int: ['park', 'swim'] }, { k: 'gift', int: ['gift'] }, { k: 'shoe', int: ['park'] }],
    'local-first': [{ k: 'gift', int: ['newborn'] }, { k: 'elly', int: ['newborn'] }, { k: 'gift', int: ['sibling'] }, { k: 'elly', int: ['sleepover'] }],
    'tourist-return': [{ k: 'disney', int: ['park', 'singapore'] }, { k: 'disney' }, { k: 'gift', int: ['gift'] }],
    'local-return': [{ k: 'disney', int: ['photoshoot'] }, { k: 'elly', int: ['photoshoot'] }, { k: 'gift', int: ['birthday'] }, { k: 'gift', int: ['gift'] }]
  };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function ghostCard(kind, opts) {
    opts = opts || {};
    var k = kind || 'elly';
    var ic = KIND_ICON[k] || KIND_ICON.elly;
    var label = opts.label || ({ elly: 'Elly Label', disney: 'Disney | elly', shoe: 'Shoes', gift: 'Gift set', custom: 'Personalised item', furkids: 'FurKids item' })[k] || 'Product';
    var badge = opts.badge ? '<div class="ph-card__badges"><span class="badge ' + opts.badgeCls + '">' + opts.badge + '</span></div>' : '';
    var starRow = opts.stars ? '<span class="rev">' + icon('star') + ' ' + opts.stars + '</span>' : '<span class="rev" style="color:var(--line)">\u2605\u2605\u2605\u2605\u2605</span>';
    var title = opts.title
      ? '<h3 class="ph-card__title" style="font-size:13.5px;letter-spacing:.01em">' + esc(opts.title) + '</h3>'
      : '<h3 class="ph-card__title"><span class="sk"></span></h3>';
    var price = opts.price
      ? '<span class="price-tx">' + esc(opts.price) + '</span>'
      : '<span class="sk sk--2"></span>';
    return '<article class="ph-card" data-kind="' + k + '">' +
      '<div class="ph-card__media">' + badge +
      '<div class="media-ico">' + ic + '<span>Product image</span></div>' +
      '<button type="button" class="quick-add js-add-demo">Add to bag</button></div>' +
      title +
      '<div class="ph-card__meta">' + price + starRow + '</div>' +
      '<div class="ph-card__meta" style="margin-top:7px"><span class="ph-card__title" style="font-size:11.5px;color:var(--ink-light);font-weight:400">' + label + ' \u2014 placeholder</span></div>' +
      '</article>';
  }

  /* ---------- Real product card (image, price, rating) ---------- */
  function productCard(p) {
    var badge = p.badge ? '<div class="ph-card__badges"><span class="badge ' + p.badgeCls + '">' + esc(p.badge) + '</span></div>' : '';
    var stars = p.stars ? '<span class="rev">' + icon('star') + ' ' + esc(p.stars) + '</span>' : '<span class="rev" style="color:var(--line)">\u2605\u2605\u2605\u2605\u2605</span>';
    return '<article class="ph-card ph-card--real" data-kind="' + p.k + '">' +
      '<div class="ph-card__media">' + badge +
      '<img src="' + esc(p.img) + '" alt="' + esc(p.n) + '" loading="lazy">' +
      '<button type="button" class="quick-add js-add-demo">Add to bag</button></div>' +
      '<h3 class="ph-card__title">' + esc(p.n) + '</h3>' +
      '<div class="ph-card__meta"><span class="price-tx">' + esc(p.p) + '</span>' + stars + '</div>' +
      '</article>';
  }

  /* collect the pool described by keys: {k: kind, int: intent} — kind/intent optional */
  function pickPool(keys) {
    var out = [], seen = {};
    keys.forEach(function (key) {
      PRODUCTS.forEach(function (p) {
        var okK = !key.k || p.k === key.k;
        var okI = !key.int || key.int.some(function (it) { return (p.int || []).indexOf(it) >= 0; });
        if (okK && okI && !seen[p.n]) { seen[p.n] = true; out.push(p); }
      });
    });
    return out;
  }

  /* spread-pick n products from a pool, rotating from the given seed (grids on one
     page show different items) */
  function fillFrom(pool, n, seed) {
    if (!pool.length) return [];
    var out = [], used = {}, i = 0;
    var step = pool.length > n ? Math.max(1, Math.floor(pool.length / n)) : 1;
    while (out.length < n && i < pool.length * 4) {
      var p = pool[(seed + i * step) % pool.length];
      if (!used[p.n]) { used[p.n] = true; out.push(p); }
      i++;
    }
    return out;
  }

  function fillGrids() {
    var seed = 0;
    $$('[data-ghost-grid]').forEach(function (grid) {
      var n = parseInt(grid.getAttribute('data-ghost-grid'), 10) || 8;
      var kind = grid.getAttribute('data-kind') || 'elly';
      /* Elly FurKids stays as structure placeholders (concept line, not live products) */
      if (kind === 'furkids') {
        var ghost = '';
        for (var g = 0; g < n; g++) ghost += ghostCard('furkids');
        grid.innerHTML = ghost;
        return;
      }
      var intent = grid.getAttribute('data-intent') || '';
      var occ = occasionFromUrl();
      if (occ && OCCASION_INTENT[occ]) intent = OCCASION_INTENT[occ];
      var kinds = kind.split(' ');
      var keys;
      if (intent === 'rec') {
        keys = SEG_PICKS[segSuggestionKey()] || SEG_PICKS['local-first'];
      } else if (kinds.length > 1) {
        /* mixed rails (e.g. "custom elly"): interleave one product from each kind */
        var per = Math.ceil(n / kinds.length), flat = [];
        kinds.forEach(function (k) { flat = flat.concat(fillFrom(pickPool([{ k: k }]), per, seed++)); });
        grid.innerHTML = flat.slice(0, n).map(productCard).join('');
        return;
      } else {
        keys = [{ k: kinds[0] }];
        if (intent) keys = [{ k: kinds[0], int: [intent] }, { k: kinds[0] }];
      }
      grid.innerHTML = fillFrom(pickPool(keys), n, seed++).map(productCard).join('');
    });
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(html, sticky) {
    var t = $('#toast');
    if (!t) return;
    t.innerHTML = html + '<button type="button" class="x js-toast-x" aria-label="Dismiss" style="opacity:.75">' + icon('close') + '</button>';
    t.classList.add('show');
    clearTimeout(toastTimer);
    if (!sticky) toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3400);
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('.js-toast-x')) {
      var t = $('#toast'); if (t) t.classList.remove('show');
    }
  });

  /* ---------- Bag (in-memory demo counter) ---------- */
  function bagCount() { return parseInt(ssGet('elly-bag') || '0', 10); }
  function setBag(n) {
    ssSet('elly-bag', n);
    var c = $('#bagCount');
    if (c) { c.textContent = n; c.hidden = n <= 0; }
  }
  function refreshBag() { setBag(bagCount()); }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('.js-add-demo');
    if (add) {
      setBag(bagCount() + 1);
      toast('Added to bag \u2014 <b>demo</b>. <a href="cart.html" style="text-decoration:underline;color:#fff">View bag</a>');
    }
  });

  /* ---------- Drawer / scrims / search ---------- */
  var body = document.body;

  function openDrawer() { var d = $('#mDrawer'); if (d) { d.classList.add('show'); d.setAttribute('aria-hidden', 'false'); } showScrim('drawer'); }
  function closeDrawer() { var d = $('#mDrawer'); if (d) { d.classList.remove('show'); d.setAttribute('aria-hidden', 'true'); } hideScrim('drawer'); }
  function showScrim(forWho) { $$('.js-scrim').forEach(function (s) { if (s.getAttribute('data-for') === forWho) s.classList.add('show'); }); }
  function hideScrim(forWho) { $$('.js-scrim').forEach(function (s) { if (s.getAttribute('data-for') === forWho) s.classList.remove('show'); }); }
  function closeAllOverlays() { closeDrawer(); closeSearch(); hideFacets(); }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('.js-burger')) openDrawer();
    if (t.closest('.js-close-drawer')) closeDrawer();
    if (t.closest('.js-close-overlay')) closeAllOverlays();
    if (t.closest('.js-scrim')) closeAllOverlays();
    if (t.closest('.js-close-search')) closeSearch();
    if (t.closest('.js-scrim')) return;
  });

  /* mobile nav accordions */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.m-navlink');
    if (!b) return;
    e.preventDefault();
    var open = b.classList.toggle('open');
    $$('.m-navlink').forEach(function (o) { if (o !== b) o.classList.remove('open'); });
  });

  /* ---------- Search overlay ---------- */
  var RECENT_KEY = 'elly-recent';
  var searchOpen = false;

  function openSearch() {
    var layer = $('#searchLayer');
    if (!layer) return;
    layer.classList.add('show'); searchOpen = true;
    renderSearchChips();
    resetSearchResults();
    var input = $('#bigSearch');
    if (input && document.activeElement !== input) input.focus();
  }
  function closeSearch() {
    var layer = $('#searchLayer');
    if (!layer) return;
    layer.classList.remove('show'); searchOpen = false;
    var input = $('#bigSearch');
    if (input && document.activeElement === input) input.blur();
  }
  /* opening: the whole field bar is clickable (icon, input, keyboard hint,
     go-button) and focus also opens it — Quince-style instant recommender panel.
     Guarded so re-opening never wipes what the visitor already typed. */
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.id === 'bigSearch' && !searchOpen) openSearch();
  });
  /* closing: click outside the field + its panel */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (searchOpen && !t.closest('.search-layer') && !t.closest('.search-field')) closeSearch();
    if (t.closest('.js-open-search')) { e.preventDefault(); if (!searchOpen) openSearch(); }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.closest('.search-field')) { e.preventDefault(); openSearch(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (searchOpen) { closeSearch(); return; }
      closeAllOverlays();
    }
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      e.preventDefault(); openSearch();
    }
  });

  function demoSeg() {
    return { geo: ssGet('elly-geo') || 'local', guest: ssGet('elly-guest') || 'returning' };
  }

  /* header account tool: "Sign In" only while signed out; the demo's
     Returning-member toggle counts as signed in (PRD §5.2 recognition) */
  function updateSignState() {
    var lbl = $('#signLbl');
    if (!lbl) return;
    var signedIn = demoSeg().guest === 'returning';
    lbl.textContent = signedIn ? 'Hi, Chloe' : 'Sign In';
    lbl.title = signedIn ? 'Signed in as Chloe \u00b7 1,240 pts (demo)' : 'Sign in to your account';
    var link = $('#signLink');
    if (link) link.setAttribute('aria-label', signedIn ? 'Your account' : 'Sign in to your account');
  }

  var SUGGEST = {
    'tourist-first': ['Disney Cruise outfits', 'Family photoshoot looks', 'Mickey Go Local tee', 'Shop now, ship home', 'Theme Park Vacation set'],
    'local-first': ['Birthday present', 'Newborn & baby shower gift', 'Full month set', 'Sibling matching set', 'Sleepover PJs'],
    'tourist-return': ['Back in your size: Nautical Mickey', 'New: Marina Bay night designs', 'Restock your holiday edit', 'Stitch \u2014 you viewed this'],
    'local-return': ['Refill your favourites', 'Newborn gift \u2014 you bought this', 'Birthday edit for your 5yo', 'Points balance: 1,240 \u00b7 redeem S$5']
  };

  var OCCASION_CHIPS = [
    ['Newborn & Baby Shower', '\ud83d\udc76', 'gifting-hub.html'],
    ['Big Brother / Little Sister', '\ud83d\udc66', 'elly-label.html'],
    ['Theme Park Vacation', '\ud83c\udf04', 'disney-elly.html'],
    ['Family Photoshoot', '\ud83d\udcf8', 'elly-label.html'],
    ['Pajama Party / Sleepover', '\ud83d\udcad', 'elly-label.html'],
    ['Holiday Gift Boxes', '\ud83c\udf81', 'gifting-hub.html']
  ];

  function segSuggestionKey() {
    var s = demoSeg();
    return s.geo + '-' + s.guest;
  }

  function renderSearchChips() {
    var s = demoSeg();
    var key = segSuggestionKey();
    var label = $('#suggestLabel');
    if (label) {
      label.textContent = s.guest === 'returning'
        ? 'Suggested for you \u00b7 based on your purchase & browse history (demo)'
        : 'Suggested searches \u00b7 ' + (s.geo === 'tourist' ? 'visiting Singapore' : 'local') + ' first-time visitor (demo)';
    }
    var wrap = $('#suggestChips');
    if (wrap) {
      wrap.innerHTML = SUGGEST[key].map(function (c) {
        return '<button type="button" class="chip js-search-chip">' + c + '</button>';
      }).join('');
    }
    var recents = [];
    try { recents = JSON.parse(ssGet(RECENT_KEY)) || []; } catch (e) { recents = []; }
    var rw = $('#recentChipsWrap'), rc = $('#recentChips');
    if (rw && rc) {
      if (recents.length) {
        rw.hidden = false;
        rc.innerHTML = recents.map(function (q) {
          return '<button type="button" class="chip chip--coral js-search-chip">' + icon('search') + q + '</button>';
        }).join('');
      } else rw.hidden = true;
    }
    var ow = $('#occasionChips');
    if (ow) {
      ow.innerHTML = OCCASION_CHIPS.map(function (o) {
        return '<a class="chip" href="' + o[2] + '?occasion=' + encodeURIComponent(o[0]) + '">' + o[1] + ' ' + o[0] + '</a>';
      }).join('');
    }
  }

  function rememberRecent(q) {
    q = String(q).trim();
    if (!q) return;
    var recents = [];
    try { recents = JSON.parse(ssGet(RECENT_KEY)) || []; } catch (e) { recents = []; }
    recents = [q].concat(recents.filter(function (r) { return r !== q; })).slice(0, 5);
    ssSet(RECENT_KEY, JSON.stringify(recents));
  }

  function resetSearchResults() {
    var idle = $('.search-idle'), res = $('#searchResults');
    if (idle) idle.style.display = '';
    if (res) res.style.display = 'none';
    var input = $('#bigSearch');
    if (input) input.value = '';
  }

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'bigSearch') runSearch(e.target.value);
  });
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.js-search-chip');
    if (!chip) return;
    var q = chip.textContent.trim();
    var input = $('#bigSearch');
    if (input) { input.value = q; runSearch(q); }
  });

  /* ---------- Hero visitor demo (index) ----------
     Rotating-banner hero + recommender engine are implemented further
     down (they override the older static-hero demo). Only the occasion
     re-ordering and the segment listeners live here. */

  function reorderOccasions(geo) {
    var rail = $('#occRail');
    if (!rail) return;
    var cards = $$('.occ-card', rail);
    var order = geo === 'tourist'
      ? ['occ-theme-park', 'occ-photoshoot', 'occ-sleepover', 'occ-newborn', 'occ-sibling', 'occ-gift']
      : ['occ-newborn', 'occ-sibling', 'occ-sleepover', 'occ-theme-park', 'occ-photoshoot', 'occ-gift'];
    order.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) rail.appendChild(el);
    });
  }

  document.addEventListener('click', function (e) {
    var seg = e.target.closest('.seg button[data-seg]');
    if (!seg) return;
    var group = seg.parentElement;
    $$('button', group).forEach(function (b) { b.classList.remove('is-on'); });
    seg.classList.add('is-on');
    ssSet(seg.getAttribute('data-seg'), seg.getAttribute('data-val'));
    applyHeroState();
    toast('Visitor signals updated \u2014 hero, occasion rail & search suggestions now serve the <b>' + demoSeg().geo + ' \u00b7 ' + demoSeg().guest + '</b> experience (demo)');
  });

  /* self-declare fallback (PRD §5.1) */
  document.addEventListener('click', function (e) {
    var decl = e.target.closest('[data-selfdeclare]');
    if (!decl) return;
    ssSet('elly-geo', 'tourist');
    var segs = $$('.seg button[data-seg="elly-geo"]');
    segs.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-val') === 'tourist'); });
    applyHeroState();
    toast('Got it \u2014 serving the <b>tourist</b> experience \u00b7 I\u2019m visiting Singapore \ud83c\udf34 (demo override)');
  });

  /* ---------- Occasion banner (query param) ---------- */
  function occasionFromUrl() {
    try {
      var p = new URLSearchParams(window.location.search);
      return p.get('occasion');
    } catch (e) { return null; }
  }
  document.addEventListener('DOMContentLoaded', function () {
    var occ = occasionFromUrl();
    if (occ) {
      var banner = $('#occBanner');
      if (banner) {
        banner.hidden = false;
        var t = $('#occBannerText');
        if (t) t.textContent = 'Browsing occasion: ' + occ + ' (demo) \u2014 this collection will be curated from products tagged with this occasion.';
      }
    }
  });

  /* ---------- Facets (listing pages) ---------- */
  function activeFacets(panel) {
    var vals = [];
    $$('input[type="checkbox"]:checked', panel).forEach(function (i) {
      vals.push({ name: i.getAttribute('data-f'), val: i.value });
    });
    $$('.c-swatch.is-on', panel).forEach(function (sw) {
      vals.push({ name: 'Colour', val: sw.getAttribute('data-c') });
    });
    return vals;
  }

  function updateFacetUI() {
    var panel = $('#facetPanel');
    if (!panel) return;
    var facetHead = $('.facet-title');
    var vals = activeFacets(panel);
    var pillWrap = $('.active-filters');
    if (pillWrap) {
      pillWrap.innerHTML = vals.map(function (v) {
        return '<span class="f-pill">' + v.val + '<button type="button" data-remove="' + v.val.replace(/"/g, '&quot;') + '" aria-label="Remove ' + v.val + '">' + icon('close') + '</button></span>';
      }).join('');
      var clear = $('.js-clear-filters', pillWrap);
      if (clear) pillWrap.appendChild(clear);
    }
    var count = $('.result-line');
    if (count) {
      if (vals.length) count.innerHTML = '<b>0 products</b> match your ' + vals.length + ' filter' + (vals.length > 1 ? 's' : '') + ' \u2014 live catalog (demo) once filters connect.';
      else count.innerHTML = '<b>Live demo catalog</b> \u2014 products populated from theellystore.com feed.';
    }
    var grid = $('[data-ghost-grid]');
    var empty = $('.empty-slot');
    if (grid && empty) {
      var showGhosts = vals.length === 0;
      grid.style.display = showGhosts ? '' : 'none';
      empty.style.display = showGhosts ? 'none' : '';
      var emT = $('strong', empty);
      if (emT) emT.textContent = vals.length ? 'No products yet' : 'Grid empty';
      var emS = $('span', empty);
      if (emS) emS.textContent = vals.length ? 'Filters will query the catalog once product data is loaded in the next step.' : 'Product cards appear here.';
    }
  }

  document.addEventListener('change', function (e) {
    var f = e.target.closest('.facet-panel input[type="checkbox"]');
    if (f) updateFacetUI();
  });
  document.addEventListener('click', function (e) {
    var sw = e.target.closest('.c-swatch');
    if (sw) {
      var on = sw.classList.toggle('is-on');
      if (!on) sw.classList.remove('is-on');
      updateFacetUI();
    }
    var rm = e.target.closest('.f-pill button');
    if (rm) {
      var val = rm.getAttribute('data-remove');
      var panel = $('#facetPanel');
      if (panel) {
        $$('input[type="checkbox"]', panel).forEach(function (i) { if (i.value === val) i.checked = false; });
        $$('.c-swatch', panel).forEach(function (s) { if (s.getAttribute('data-c') === val) s.classList.remove('is-on'); });
      }
      updateFacetUI();
    }
    var clear = e.target.closest('.js-clear-filters');
    if (clear) {
      var p2 = $('#facetPanel');
      if (p2) {
        $$('input[type="checkbox"]', p2).forEach(function (i) { i.checked = false; });
        $$('.c-swatch', p2).forEach(function (s) { s.classList.remove('is-on'); });
      }
      updateFacetUI();
      toast('All filters cleared');
    }
  });

  /* facet group collapse */
  document.addEventListener('click', function (e) {
    var h = e.target.closest('.facet-group h4');
    if (h && !e.target.closest('.c-swatch')) h.parentElement.classList.toggle('is-closed');
  });

  /* facet drawer (mobile) */
  function hideFacets() {
    var p = $('#facetPanel');
    if (p) p.classList.remove('show');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-facet-toggle]');
    if (t) {
      var p = $('#facetPanel');
      if (p) { p.classList.add('show'); showScrim('drawer'); }
    }
  });

  /* ---------- Sort (demo only) ---------- */
  document.addEventListener('change', function (e) {
    if (e.target.matches('.sort select')) {
      toast('Sorted by ' + e.target.value + ' \u2014 ordering applies once product data loads (demo)');
    }
  });

  /* ---------- PDP: size chips, qty steppers ---------- */
  document.addEventListener('click', function (e) {
    var sc = e.target.closest('.size-chip:not(.oos)');
    if (sc) {
      $$('.size-chip', sc.parentElement).forEach(function (c) { c.classList.remove('is-on'); });
      sc.classList.add('is-on');
      var info = sc.closest('.pdp__info');
      if (info) {
        var sel = $('#sizeSel', info);
        if (sel) sel.textContent = sc.getAttribute('data-size') || sc.textContent.trim();
      }
    }
    var thumb = e.target.closest('.pdp__thumb');
    if (thumb) {
      $$('.pdp__thumb', thumb.parentElement).forEach(function (t) { t.classList.remove('is-on'); });
      thumb.classList.add('is-on');
    }
    var q = e.target.closest('.qty-row button[data-step]');
    if (q) {
      var row = q.closest('.qty-row');
      var out = $('output', row);
      var raw = parseInt(out.value, 10);
      var cur = isNaN(raw) ? 1 : raw;
      var min = parseInt(row.getAttribute('data-min') || '1', 10);
      var max = parseInt(row.getAttribute('data-max') || '99', 10);
      var next = Math.min(max, Math.max(min, cur + parseInt(q.getAttribute('data-step'), 10)));
      out.value = next;
      out.textContent = next;
      var ev = new Event('qtychange', { bubbles: true });
      row.dispatchEvent(ev);
    }
  });

  /* PDP buy button */
  document.addEventListener('click', function (e) {
    var buy = e.target.closest('.js-buy');
    if (buy) {
      e.preventDefault();
      var sizeSel = buy.closest('.pdp__info, .ph-info, form, .card');
      var picked = sizeSel ? $('.size-chip.is-on', sizeSel) : null;
      if (picked) {
        setBag(bagCount() + 1);
        toast('Added to bag \u2014 <b>demo</b>. <a href="cart.html" style="text-decoration:underline;color:#fff">View bag</a>');
      } else {
        toast('Please pick a size first (demo checkout flow)');
      }
    }
  });

  /* ---------- Tabs ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-tab-btn]');
    if (!btn) return;
    var scope = btn.closest('[data-tabs]');
    $$('[data-tab-btn]', scope).forEach(function (b) {
      b.classList.toggle('is-on', b === btn);
      var k = b.getAttribute('aria-selected');
      if (k) b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    var target = btn.getAttribute('data-tab-target');
    $$('[data-tab-pane]', scope).forEach(function (p) {
      p.classList.toggle('is-on', p.getAttribute('data-tab-pane') === target);
    });
  });

  /* tab styling hooks (chips that behave as tabs) */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.tab-chip');
    if (t) {
      var group = t.closest('[data-tab-chip-group]');
      if (group) $$('.tab-chip', group).forEach(function (c) { c.classList.remove('is-on'); });
      t.classList.add('is-on');
    }
  });

  /* ---------- Checkout: fulfilment options (PRD §5.3) ---------- */
  document.addEventListener('change', function (e) {
    var fopt = e.target.closest('.fopt input[type="radio"]');
    if (!fopt) return;
    var box = fopt.closest('.fopts');
    $$('.fopt', box).forEach(function (o) {
      var r = $('input', o);
      o.classList.toggle('is-on', r === fopt && r.checked);
    });
    var val = fopt.value;
    var note = $('.fulfil-note');
    if (note) {
      var copy = {
        ship: 'Delivery to a Singapore address or hotel \u2014 arrive before you fly home.',
        home: 'Delivery to your home country after you leave Singapore \u2014 we hold & ship on your return date.',
        store: 'Ready for collection at our store / pop-up \u2014 no shipping, immediate pickup.'
      }[val];
      var shipEst = $('.ship-est');
      if (shipEst) {
        shipEst.textContent = val === 'store' ? 'Free \u2014 collect in store' : val === 'home' ? 'Calculated at checkout \u00b7 ships after your trip' : 'S$6 \u00b7 free over S$100';
      }
      note.textContent = copy;
      note.style.display = 'block';
    }
    var summaryFulfil = $('.js-fulfil-summary');
    if (summaryFulfil) {
      var label = $('.fopt.is-on b', box);
      summaryFulfil.textContent = label ? label.textContent : '';
    }
    /* show/hide per-option blocks */
    $$('.js-fulfil-block').forEach(function (bl) {
      bl.style.display = bl.getAttribute('data-fulfil') === val ? '' : 'none';
    });
  });

  /* ---------- Cart page ---------- */
  function cartTotals() {
    var subtotal = 0, qty = 0;
    $$('.js-cart-line').forEach(function (line) {
      var out = $('.qty-row output', line);
      var price = parseFloat(line.getAttribute('data-price')) || 0;
      var n = parseInt(out.value, 10) || 0;
      qty += n;
      subtotal += price * n;
      var lp = $('.line-price', line);
      if (lp) lp.textContent = 'S$' + subtotal.toFixed(2);
    });
    var st = $('#cartSubtotal'); if (st) st.textContent = 'S$' + subtotal.toFixed(2);
    var tot = $('#cartTotal'); if (tot) tot.textContent = 'S$' + subtotal.toFixed(2);
    var meter = $('#shipMeter'); if (meter) meter.style.width = Math.min(100, subtotal / 100 * 100) + '%';
    var lbl = $('#shipMeterLabel');
    if (lbl) lbl.textContent = subtotal >= 100 ? 'You\u2019ve unlocked free standard shipping' : 'S$' + (100 - subtotal).toFixed(2) + ' away from free standard shipping';
    return subtotal;
  }
  function cartQty() {
    var q = 0;
    $$('.js-cart-line').forEach(function (l) { q += parseInt($('.qty-row output', l).value, 10) || 0; });
    return q;
  }
  document.addEventListener('qtychange', function (e) {
    if (e.target.closest('.js-cart-line')) {
      cartTotals();
      setBag(cartQty());
    }
  });
  document.addEventListener('DOMContentLoaded', function () {
    if ($('.js-cart-line')) { cartTotals(); setBag(cartQty()); }
    var checkoutBtn = $('.js-go-checkout');
    if (checkoutBtn) checkoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (bagCount() === 0 && !$('.js-cart-line')) {
        toast('Your bag is empty \u2014 add a demo item first');
        return;
      }
      window.location.href = 'checkout.html';
    });
  });

  /* ---------- B2B quote (tiered pricing + RFQ wizard, PRD §10) ---------- */
  var TIERS = [
    { min: 10, max: 49, disc: 0.10 },
    { min: 50, max: 99, disc: 0.15 },
    { min: 100, max: 299, disc: 0.20 },
    { min: 300, max: Infinity, disc: null }
  ];

  /* sample catalog rows for the RFQ demo (PRD §10) — real items plug in from the catalog later */
  var B2B_ITEMS = [
    { name: 'Sample \u00b7 Disney tee', unit: 34 },
    { name: 'Sample \u00b7 Elly romper', unit: 29 },
    { name: 'Sample \u00b7 personalised robe', unit: 59 }
  ];
  var B2B_SIZES = {
    0: ['0\u20131Y', '2\u20133Y', '4\u20135Y', '6\u20137Y', '8\u201310Y', '11\u201314Y'],
    1: ['0\u20133M', '3\u20136M', '6\u201312M', '1\u20132Y', '2\u20133Y'],
    2: ['2\u20133Y', '4\u20135Y', '6\u20137Y', '8\u201310Y', '11\u201314Y']
  };
  var B2B_OTYPE_ALIAS = { bulk: 'Bulk / wholesale', corporate: 'Corporate', event: 'Corporate event' };
  var b2bDeco = { method: 'Standard', add: 0 };

  function buildB2BMatrix() {
    var box = $('#b2bMatrix');
    if (!box) return;
    box.innerHTML = B2B_ITEMS.map(function (it, i) {
      var sizes = B2B_SIZES[i] || [];
      var th = sizes.map(function (s) { return '<th>' + s + '</th>'; }).join('');
      var td = sizes.map(function () {
        return '<td><div class="qty-row" data-min="0" data-max="500">' +
          '<button type="button" data-step="-1" aria-label="Decrease">\u2212</button>' +
          '<output>0</output>' +
          '<button type="button" data-step="1" aria-label="Increase">+</button></div></td>';
      }).join('');
      return '<div class="js-b2b-line b2b-line" data-idx="' + i + '" data-name="' + it.name + '" data-unit="' + it.unit + '" style="margin-bottom:26px">' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">' +
        '<b>' + it.name + '</b><span class="muted small">S$' + it.unit.toFixed(2) + ' each</span>' +
        '<span class="small" style="margin-left:auto">Line total: <b class="js-line-total">S$0.00</b> \u00b7 <b class="js-line-qty">0</b> units</span></div>' +
        '<div class="sz-scroll"><table class="sz-matrix"><thead><tr>' + th + '</tr></thead><tbody><tr>' + td + '</tr></tbody></table></div>' +
        '</div>';
    }).join('');
  }

  function b2bRecalc() {
    var totalQty = 0, subtotal = 0, rowsHtml = '';
    $$('.js-b2b-line').forEach(function (line) {
      if (line.classList.contains('is-off')) return;
      var q = 0;
      $$('.qty-row output', line).forEach(function (o) { q += parseInt(o.value, 10) || 0; });
      var unit = parseFloat(line.getAttribute('data-unit')) || 0;
      var name = line.getAttribute('data-name') || 'Item';
      totalQty += q;
      subtotal += q * unit;
      var per = $('.js-line-total', line);
      if (per) per.textContent = 'S$' + (q * unit).toFixed(2);
      var qo = $('.js-line-qty', line);
      if (qo) qo.textContent = q;
      if (q > 0) rowsHtml += '<div class="r"><span>' + name + ' \u00d7 ' + q + '</span><b>S$' + (q * unit).toFixed(2) + '</b></div>';
    });
    var deco = (b2bDeco.add && totalQty) ? b2bDeco.add * totalQty : 0;
    if (deco) rowsHtml += '<div class="r"><span>Decoration \u00b7 ' + b2bDeco.method + ' \u00d7 ' + totalQty + ' units</span><b>S$' + deco.toFixed(2) + '</b></div>';

    var tier = totalQty >= 10 ? (TIERS.find(function (t) { return totalQty >= t.min && totalQty <= t.max; }) || null) : null;
    var custom = tier && tier.disc === null;
    var disc = tier && !custom ? tier.disc : 0;
    var save = subtotal * disc;
    var total = subtotal + deco - save;
    var belowMin = totalQty > 0 && totalQty < 10;

    $$('.tier-table tr[data-tier]').forEach(function (tr) {
      tr.classList.toggle('is-on', !!tier && parseInt(tr.getAttribute('data-tier'), 10) === tier.min);
    });
    function set(id, txt) { var el = $(id); if (el) el.textContent = txt; }
    set('#b2bQty', totalQty);
    set('#b2bSub', 'S$' + subtotal.toFixed(2));
    set('#b2bSave', custom ? '\u2014' : (save ? '-\u00a0S$' + save.toFixed(2) : 'S$0.00'));
    set('#b2bTotal', custom ? 'Custom quote' : 'S$' + total.toFixed(2));
    set('#b2bUnit', totalQty ? 'S$' + (total / totalQty).toFixed(2) : '\u2014');
    set('#b2bRunQty', totalQty);
    set('#b2bRunSub', 'S$' + subtotal.toFixed(2));
    set('#b2bRunDeco', 'S$' + deco.toFixed(2));
    set('#b2bRunSave', custom ? '\u2014' : (save ? '-\u00a0S$' + save.toFixed(2) : 'S$0.00'));
    set('#b2bRunTotal', custom ? 'Custom quote' : 'S$' + total.toFixed(2));
    var lines = $('#b2bLines');
    if (lines) lines.innerHTML = rowsHtml || '<div class="r"><span>No items added yet</span><b>\u2014</b></div>';
    var note = $('#b2bTierNote');
    if (note) {
      if (!totalQty) note.textContent = 'Add quantities to preview live tiered pricing.';
      else if (belowMin) note.textContent = 'Below the 10-unit tier minimum \u2014 contact us for smaller orders.';
      else if (custom) note.textContent = '300+ units \u2014 this flags for our team to prepare a custom quote (per prototype pricing model).';
      else note.textContent = 'Tier applied: ' + tier.min + '\u2013' + (tier.max === Infinity ? '+' : tier.max) + ' units \u00b7 ' + (disc * 100) + '% off.';
    }
  }
  document.addEventListener('qtychange', function (e) {
    if (e.target.closest('.js-b2b-line')) b2bRecalc();
  });

  /* B2B steps */
  var b2bStep = 1;
  function goStep(n) {
    b2bStep = n;
    $$('.js-b2b-step').forEach(function (el) {
      el.style.display = el.getAttribute('data-step') === String(n) ? '' : 'none';
    });
    $$('.step-i').forEach(function (s) {
      var i = parseInt(s.getAttribute('data-step-i'), 10);
      s.classList.toggle('is-on', i === n);
      s.classList.toggle('is-done', i < n);
    });
  }
  document.addEventListener('click', function (e) {
    var next = e.target.closest('.js-b2b-next');
    if (next) {
      var g = parseInt(next.getAttribute('data-goto'), 10);
      b2bRecalc();
      goStep(g);
    }
  });

  /* reveal wizard + preselect order type (landing CTA / use-case cards / deep links) */
  function setB2BOType(name) {
    if (!name) return;
    $$('.otype').forEach(function (c) { c.classList.toggle('is-on', c.getAttribute('data-name') === name); });
    $$('.js-otype-label').forEach(function (t) { t.textContent = name; });
  }
  function startB2B(otypeName, step) {
    var wiz = $('#b2bWizard');
    if (!wiz) return;
    wiz.hidden = false;
    setB2BOType(otypeName || '');
    goStep(step || 1);
    setTimeout(function () {
      if (wiz.scrollIntoView) wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }
  document.addEventListener('click', function (e) {
    var st = e.target.closest('.js-b2b-start');
    if (!st) return;
    startB2B(st.getAttribute('data-otype') || '', parseInt(st.getAttribute('data-step') || '1', 10));
  });

  /* deep-link support: b2b.html?otype=corporate&step=2 */
  function applyB2BQuery() {
    if (!$('#b2bWizard')) return;
    var params = {};
    (window.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var p = kv.split('=');
      params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    if (!params.start && !params.otype && !params.step) return;
    var otype = B2B_OTYPE_ALIAS[String(params.otype || '').toLowerCase()] || '';
    var step = Math.min(Math.max(parseInt(params.step, 10) || 1, 1), 6);
    startB2B(otype, step);
  }

  /* item include/exclude (step 2) */
  document.addEventListener('click', function (e) {
    var inc = e.target.closest('.js-b2b-inc');
    if (!inc) return;
    var on = !inc.classList.contains('is-on');
    inc.classList.toggle('is-on', on);
    var idx = inc.getAttribute('data-idx');
    $$('.js-b2b-line').forEach(function (line) {
      if (line.getAttribute('data-idx') !== idx) return;
      line.classList.toggle('is-off', !on);
      if (!on) {
        $$('.qty-row output', line).forEach(function (o) { o.value = 0; o.textContent = 0; });
      }
    });
    b2bRecalc();
  });

  /* decoration method chips + thread colour swatches (step 3) */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.deco-chip');
    if (!chip) return;
    var row = chip.closest('.chip-row');
    if (row) $$('.deco-chip', row).forEach(function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    b2bDeco.method = chip.getAttribute('data-method');
    b2bDeco.add = parseFloat(chip.getAttribute('data-add')) || 0;
    $$('#decoPanes [data-method-pane]').forEach(function (p) { p.hidden = p.getAttribute('data-method-pane') !== b2bDeco.method; });
    b2bRecalc();
  });
  document.addEventListener('click', function (e) {
    var sw = e.target.closest('.sw');
    if (!sw) return;
    $$('.sw', sw.parentElement).forEach(function (c) { c.classList.remove('is-on'); });
    sw.classList.add('is-on');
  });

  /* rush-date flag (step 1) */
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'b2bDate') return;
    var v = e.target.value;
    var note = $('#rushNote');
    if (!note) return;
    var days = 0;
    if (v) days = Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);
    note.hidden = !v || days >= 21;
  });

  /* artwork upload (step 5) — client-side only */
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'artFile') return;
    var f = e.target.files && e.target.files[0];
    var t = $('#artName');
    if (t) t.textContent = f ? 'File ready: ' + f.name + ' \u2014 demo only, nothing is uploaded.' : 'No file chosen.';
  });

  /* two-stage close-out: request quote → confirmation (PRD §10) */
  document.addEventListener('click', function (e) {
    var req = e.target.closest('#b2bRequest');
    if (req) {
      var q = parseInt((($('#b2bQty') || {}).textContent), 10) || 0;
      if (!q) { toast('Add at least one size quantity before requesting a quote.'); return; }
      toast('Quote request received \u2014 <b>demo only</b>. No live order was placed.', true);
      goStep(6);
      var wiz = $('#b2bWizard');
      if (wiz && wiz.scrollIntoView) wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    var dl = e.target.closest('.js-b2b-download');
    if (dl) { toast('Quote downloaded as PDF \u2014 <b>demo</b> (shareable-quote UI planned).'); return; }
    var rs = e.target.closest('.js-b2b-reset');
    if (rs) {
      $$('.js-b2b-line').forEach(function (line) {
        $$('.qty-row output', line).forEach(function (o) { o.value = 0; o.textContent = 0; });
        line.classList.remove('is-off');
      });
      $$('.js-b2b-inc').forEach(function (r) { r.classList.add('is-on'); });
      $$('.deco-chip').forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-method') === 'Standard'); });
      b2bDeco = { method: 'Standard', add: 0 };
      $$('#decoPanes [data-method-pane]').forEach(function (p) { p.hidden = true; });
      var d = $('#b2bDate'); if (d) d.value = '';
      var rn = $('#rushNote'); if (rn) rn.hidden = true;
      var an = $('#artName'); if (an) an.textContent = 'No file chosen.';
      var f = $('#artFile'); if (f) f.value = '';
      b2bRecalc();
      goStep(1);
    }
  });

  /* B2B order-type selector */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('.otype');
    if (!o) return;
    $$('.otype', o.parentElement).forEach(function (c) { c.classList.remove('is-on'); });
    o.classList.add('is-on');
    $$('.js-otype-label').forEach(function (t) { t.textContent = o.getAttribute('data-name'); });
  });

  /* ---------- Admin: demand vs MOQ demo (PRD §8.6) ---------- */
  document.addEventListener('qtychange', function (e) {
    if (e.target.closest('.js-moq-row')) {
      var row = e.target.closest('.js-moq-row');
      var dem = parseInt($('.qty-row output', row).value, 10) || 0;
      var moq = parseInt(row.getAttribute('data-moq'), 10) || 1000;
      var prod = Math.max(dem, moq);
      var outP = $('.js-prod', row); if (outP) outP.textContent = prod;
      var outD = $('.js-demv', row); if (outD) outD.textContent = dem;
      var bar = $('.mini-bar', row);
      if (bar) {
        var scale = Math.max(prod * 1.15, 1);
        bar.innerHTML = '<i class="dem" style="width:' + (dem / scale * 100) + '%"></i><i style="width:' + (moq / scale * 100) + '%"></i>';
      }
      var reason = $('.js-reason', row);
      if (reason) {
        reason.textContent = dem >= moq
          ? 'Demand-driven \u2014 production set by ' + dem + ' pre-orders (above the ' + moq + ' MOQ).'
          : 'MOQ-driven \u2014 demand of ' + dem + ' is below the ' + moq + '-unit MOQ, so production runs at MOQ.';
      }
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.js-moq-preset');
    if (!b) return;
    var row = b.closest('.js-moq-row');
    var out = $('.qty-row output', row);
    out.value = b.getAttribute('data-v');
    row.dispatchEvent(new Event('qtychange', { bubbles: true }));
  });

  /* ---------- Newsletter (demo) ---------- */
  document.addEventListener('submit', function (e) {
    var nl = e.target.closest('.js-newsletter');
    if (nl) {
      e.preventDefault();
      toast('Thanks! You\u2019re on the list \u2014 <b>demo</b> (no email sent).');
      nl.reset();
    }
  });

  /* ---------- Reveal / misc ---------- */
  document.addEventListener('click', function (e) {
    var rev = e.target.closest('.js-reveal-more');
    if (rev) {
      var target = $(rev.getAttribute('data-target'));
      if (target) { target.hidden = !target.hidden; rev.textContent = target.hidden ? 'Show more' : 'Show less'; }
    }
  });

  /* sticky header shadow */
  document.addEventListener('scroll', function () {
    var h = $('#siteHead');
    if (h) h.classList.toggle('is-stuck', window.scrollY > 8);
  }, { passive: true });

  /* ---------- Scroll bump (site-wide) ----------
     Cards marked [data-bump] pop up with a springy overshoot as they enter
     the viewport and shrink/fade back down as they leave (bump in / bump out).
     Anything already on screen at load settles in place so there is no flash. */
  (function () {
    var els = $$('[data-bump]');
    if (!els.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduced) {
      els.forEach(function (el) { el.classList.add('bump-in'); });
      return;
    }
    var vh = window.innerHeight || document.documentElement.clientHeight;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add('bump-in');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle('bump-in', en.isIntersecting);
      });
    }, { threshold: 0 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Quick-shop hover preview (landing) ---------- */
  function quickPanelHTML(p) {
    var intro =
      '<div class="mega__intro"><div class="mega__eyebrow"><span class="mega__emoji" style="background:var(--tint-' + p.tint + ')">' + p.emoji + '</span>' +
      '<span class="mega__kicker">' + p.label + ' pillar</span></div>' +
      '<h3>' + p.tagline + '</h3>' +
      '<p>' + p.blurb + '</p>' +
      '<div class="mega__cta"><a class="btn btn--coral btn--sm" href="' + p.url + '">Shop all ' + p.label + '</a>' +
      (p.concept ? '<span class="concept-tag">Concept</span>' : '') +
      '</div></div>';
    var cols = p.groups.map(function (g) {
      return '<div class="mega__group"><h4>' + g.title + '</h4><ul>' +
        g.links.map(function (l) {
          var href = /pre-order/i.test(l) ? 'pre-order.html' : p.url;
          return '<li><a href="' + href + '">' + l + '</a></li>';
        }).join('') + '</ul></div>';
    }).join('');
    var note = '<div class="mega__note">' +
      (p.concept ? '<span class="concept-tag">Concept only \u2014 not a Disney-licensed product</span>' : '<span class="mega__note-ico">' + icon('bolt') + '</span>') +
      '<span>' + p.note + '</span></div>';
    return '<div class="mega__in">' + intro +
      '<div class="mega__right"><div class="mega__cols">' + cols + '</div>' + note + '</div></div>';
  }

  function initQuickShop() {
    var tabs = $('#qsTabs'), stage = $('#qsStage');
    if (!tabs || !stage || !window.EL || !EL.PILLARS) return;
    tabs.innerHTML = EL.PILLARS.map(function (p) {
      return '<button type="button" class="qs-tab" data-key="' + p.key + '" data-tint="' + p.tint + '" role="tab" aria-selected="false">' +
        '<span class="em">' + p.emoji + '</span><b>' + p.label + '</b></button>';
    }).join('');
    var current = null;
    function show(key, animate) {
      if (key === current) return;
      var p = null;
      for (var i = 0; i < EL.PILLARS.length; i++) {
        if (EL.PILLARS[i].key === key) p = EL.PILLARS[i];
      }
      if (!p) return;
      current = key;
      $$('.qs-tab', tabs).forEach(function (b) {
        var on = b.getAttribute('data-key') === key;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (animate) { stage.classList.remove('swap'); void stage.offsetWidth; stage.classList.add('swap'); }
      stage.innerHTML = quickPanelHTML(p);
    }
    tabs.addEventListener('mouseover', function (e) {
      var b = e.target.closest('.qs-tab');
      if (b) show(b.getAttribute('data-key'), true);
    });
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.qs-tab');
      if (b) show(b.getAttribute('data-key'), true);
    });
    tabs.addEventListener('focusin', function (e) {
      var b = e.target.closest('.qs-tab');
      if (b) show(b.getAttribute('data-key'), false);
    });
    show('elly-label', false);
  }

  /* ============================================================
     Recommender engine (PRD §5.1) + rotating hero banner + search
     growth — declared after the earlier demo implementations so
     these versions win for the same function names.
     ============================================================ */

  /* --- recommender product data, per visitor segment (PRD §5.1) --- */
  var RECS = {
    'tourist-first': {
      why: 'Site-wide trending intents — what every tourist searches first.',
      items: [
        { n: 'Theme Park Vacation set', p: 'S$38', k: 'disney', stars: '4.9 (212)' },
        { n: 'Disney Cruise outfit', p: 'S$52', k: 'disney', stars: '4.8 (96)' },
        { n: 'Family Photoshoot look', p: 'S$46', k: 'elly', stars: '5.0 (64)' },
        { n: 'Mickey Go Local tee', p: 'S$29', k: 'disney', stars: '4.7 (188)' },
        { n: 'Shop now, ship home edit', p: 'S$88', k: 'gift', stars: '4.9 (41)' },
        { n: 'Pre-Order — Marina Bay night', p: 'S$59', k: 'disney', stars: 'New' }
      ]
    },
    'local-first': {
      why: 'Most-searched intents site-wide, seeded from the occasion collections.',
      items: [
        { n: 'Birthday present — kids 0-14', p: 'S$36', k: 'elly', stars: '4.9 (174)' },
        { n: 'Newborn & Baby Shower gift set', p: 'S$80', k: 'gift', stars: '5.0 (233)' },
        { n: 'Full month set', p: 'S$95', k: 'gift', stars: '4.9 (121)' },
        { n: 'Sibling matching set', p: 'S$64', k: 'elly', stars: '4.8 (87)' },
        { n: 'Sleepover PJs — family set', p: 'S$42', k: 'elly', stars: '4.7 (56)' },
        { n: 'Holiday Gift Box', p: 'S$72', k: 'gift', stars: 'New' }
      ]
    },
    'tourist-return': {
      why: 'Cross-sell from your purchase & browse history — plus new arrivals.',
      items: [
        { n: 'Nautical Mickey tee — restocked', p: 'S$32', k: 'disney', stars: '4.9 (312)', badge: 'Back in your size', badgeCls: 'badge--coral' },
        { n: 'Marina Bay night set — new', p: 'S$58', k: 'disney', stars: 'New', badge: 'Just dropped', badgeCls: 'badge--blue' },
        { n: 'Stitch — you viewed this', p: 'S$44', k: 'disney', stars: '4.8 (167)' },
        { n: 'Holiday gift edit for the flight home', p: 'S$72', k: 'gift', stars: '4.9 (88)' },
        { n: 'Family Photoshoot look — 2 sizes left', p: 'S$46', k: 'elly', stars: '5.0 (64)' },
        { n: 'Pre-Order — heritage shophouse', p: 'S$59', k: 'disney', stars: 'New' }
      ]
    },
    'local-return': {
      why: 'Ranked from purchase + browse history first — including in-store records.',
      items: [
        { n: 'Frozen dress — you bought this', p: 'S$68', k: 'disney', stars: '5.0 (421)', badge: 'In-store · linked', badgeCls: 'badge--blue' },
        { n: 'Keepsake box — in-store purchase', p: 'S$120', k: 'gift', stars: '4.9 (203)' },
        { n: 'Birthday edit for your 5yo', p: 'S$54', k: 'elly', stars: '4.8 (77)' },
        { n: 'Refill your favourites', p: 'S$39', k: 'elly', stars: '4.7 (132)' },
        { n: 'Sleepover PJs — sibling set', p: 'S$46', k: 'elly', stars: '4.8 (64)' },
        { n: 'Pre-Order — Gardens by the Bay', p: 'S$59', k: 'disney', stars: 'New' }
      ]
    }
  };

  function allRecItems() {
    var out = [], seen = {};
    Object.keys(RECS).forEach(function (key) {
      RECS[key].items.forEach(function (r) {
        if (!seen[r.n]) { seen[r.n] = true; out.push(r); }
      });
    });
    return out;
  }

  function renderRecGrid() {
    var grid = $('#recGrid');
    if (!grid) return;
    var set = RECS[segSuggestionKey()] || RECS['local-first'];
    var why = $('#recWhy');
    if (why) why.textContent = set.why;
    var keys = SEG_PICKS[segSuggestionKey()] || SEG_PICKS['local-first'];
    grid.innerHTML = fillFrom(pickPool(keys), 6, 0).map(productCard).join('');
  }

  /* --- recommender tiles under the hero (occasion rail) --- */
  var REC_TILES = {
    'tourist-first': { kicker: 'Recommended for your visit · demo', title: 'What tourists search first', sub: 'Theme-park looks, family photoshoots and gifting lead the list for visitors planning a Singapore trip.' },
    'local-first': { kicker: 'Popular this week · demo', title: 'What Singapore families are shopping', sub: 'Newborn & baby-shower edits, sibling sets and sleepover favourites lead for local families.' },
    'tourist-return': { kicker: 'Recommender · based on your last trip', title: 'Recommended for you', sub: 'Your purchase & browse history re-ranks these occasions — travel edits first, events second.' },
    'local-return': { kicker: 'Recommender · from your history', title: 'Recommended for you', sub: 'Occasions ranked from your purchase & browse history (incl. in-store records), events second.' }
  };

  function updateRecTiles() {
    var c = REC_TILES[segSuggestionKey()] || REC_TILES['local-first'];
    var k = $('#recTilesKicker'); if (k) k.textContent = c.kicker;
    var t = $('#recTilesTitle'); if (t) t.textContent = c.title;
    var s = $('#recTilesSub'); if (s) s.textContent = c.sub;
  }

  /* --- rotating hero slides (PRD §5.1: max 3–4 per segment) --- */
  var _pre = {
    kicker: 'Disney Pre-Order \u00b7 new designs', h1: 'Be first to own a brand-new design',
    sub: 'Three Singapore concept designs \u2014 full payment upfront, guaranteed fulfilment, up to 8-week lead time. Production runs at demand or MOQ, whichever is higher.',
    cta: 'Preview the Pre-Order PDP', ctaHref: 'pre-order.html',
    art: '\ud83c\udf04', tag: 'Pre-order open', a: '#e9eefb', b: '#cdd9f4', c: '#a9bde8',
    f1t: 'Heritage \u00b7 Gardens \u00b7 Skyline', f1v: '3 concept designs', f1c: 'var(--coral)',
    f2t: 'Full payment', f2v: 'guaranteed fulfilment', f2c: 'var(--blue)'
  };
  var _cust = {
    kicker: 'Customization pillar', h1: 'Make it truly theirs',
    sub: 'Names, initials, thread colours and placement \u2014 embroidered or iron-on, offered right at checkout on eligible items.',
    cta: 'Explore customization', ctaHref: 'customization.html',
    art: '\ud83e\uddf5', tag: 'Customization', a: '#efeafb', b: '#dcd2f5', c: '#c2b4ec',
    f1t: 'Embroidered or iron-on', f1v: 'top-level filter', f1c: 'var(--coral)',
    f2t: 'Add at checkout', f2v: 'eligible items', f2c: 'var(--blue)'
  };
  var _tf1 = {
    kicker: 'Visiting Singapore \u00b7 trending event', h1: 'Disney Cruise season is coming',
    sub: 'Park-ready twinning looks, cruise outfits and the family-photoshoot edit \u2014 the events every tourist searches first.',
    cta: 'Explore Theme Park Vacation', ctaHref: 'disney-elly.html?occasion=Theme%20Park%20Vacation',
    cta2: 'Shop now, ship home', cta2Href: 'checkout.html',
    art: '\ud83d\udea2', tag: 'Event \u00b7 Cruise season', a: '#d9e8fb', b: '#b6d0f2', c: '#8fb4e6',
    f1t: 'Shop now, ship home', f1v: 'for tourists', f1c: 'var(--blue)',
    f2t: 'Family Photoshoot edit', f2v: 'curated for you', f2c: 'var(--coral)'
  };
  var _tf2 = {
    kicker: 'Most searched site-wide \u00b7 today', h1: 'Everyone\u2019s searching: birthday presents',
    sub: 'Gift edits by age and budget, wrapped and ready \u2014 the #1 intent across the store right now.',
    cta: 'Shop birthday gifts', ctaHref: 'gifting-hub.html?occasion=Birthday',
    cta2: 'Browse all occasions', cta2Href: 'gifting-hub.html',
    art: '\ud83c\udf82', tag: 'Trending intent', a: '#fdeee0', b: '#f8dcbb', c: '#f0c28d',
    f1t: 'Birthday gift sets', f1v: 'from S$80', f1c: 'var(--coral)',
    f2t: 'Most-searched', f2v: 'site-wide (demo)', f2c: 'var(--blue)'
  };
  var _lf1 = {
    kicker: 'Singapore \u00b7 trending event', h1: 'Newborn & Baby Shower season',
    sub: 'Full-month sets, keepsake gifts and sibling matching \u2014 the occasions Singapore families shop first.',
    cta: 'Shop Newborn & Baby Shower', ctaHref: 'gifting-hub.html?occasion=Newborn%20%26%20Baby%20Shower',
    cta2: 'Sibling sets', cta2Href: 'elly-label.html?occasion=Big%20Brother%20%2F%20Little%20Sister',
    art: '\ud83c\udf7c', tag: 'Event \u00b7 Newborn season', a: '#fdeee0', b: '#f8dcbb', c: '#f0c28d',
    f1t: 'Newborn & Baby Shower', f1v: 'occasion edit', f1c: 'var(--coral)',
    f2t: 'Full month sets', f2v: 'keepsake-ready', f2c: 'var(--blue)'
  };
  var _tr1 = {
    kicker: 'Welcome back \u00b7 recommender (demo)', h1: 'Because you shopped with us',
    sub: 'Your Nautical Mickey tee restocked in your family\u2019s sizes \u2014 plus new Marina Bay night designs based on your last trip.',
    cta: 'See your recommended edit', ctaHref: 'account.html',
    cta2: 'View unified history', cta2Href: 'account.html',
    art: '\u26f5', tag: 'Recommender \u00b7 history first', a: '#e9eefb', b: '#cdd9f4', c: '#a9bde8',
    f1t: 'Because you bought', f1v: 'Nautical Mickey tee', f1c: 'var(--coral)',
    f2t: 'New in your size', f2v: 'Marina Bay night set', f2c: 'var(--blue)'
  };
  var _tr2 = {
    kicker: 'Visiting again \u00b7 trending event', h1: 'Theme Park season \u2014 plan your looks',
    sub: 'The cruise ship is in port and the parks are calling. Twinning sets, photoshoot edits and shop-now-ship-home options.',
    cta: 'Explore Theme Park Vacation', ctaHref: 'disney-elly.html?occasion=Theme%20Park%20Vacation',
    art: '\ud83c\udff0', tag: 'Event \u00b7 Park season', a: '#d9e8fb', b: '#b6d0f2', c: '#8fb4e6',
    f1t: 'Twinning sets', f1v: 'park-ready', f1c: 'var(--coral)',
    f2t: 'Ship before you fly', f2v: 'hotel delivery', f2c: 'var(--blue)'
  };
  var _lr1 = {
    kicker: 'Welcome back \u00b7 recommender (demo)', h1: 'Birthday season is coming \u2014 we remembered',
    sub: 'Your daughter turns 5 next month. Her Frozen wishlist, the keepsake box you bought in-store, and 1,240 points ready to redeem.',
    cta: 'View your personalised edit', ctaHref: 'account.html',
    cta2: 'Check your points', cta2Href: 'account.html',
    art: '\ud83c\udf82', tag: 'Recommender \u00b7 history first', a: '#fde7e9', b: '#f9c8cd', c: '#f2a4ad',
    f1t: 'Because you bought', f1v: 'Frozen dress, in-store', f1c: 'var(--coral)',
    f2t: 'Points to redeem', f2v: '1,240 \u00b7 S$60 off', f2c: 'var(--blue)'
  };

  var HERO_SLIDES = {
    'tourist-first': [_tf1, _tf2, _pre, _cust],
    'local-first': [_lf1, _tf2, _pre, _cust],
    'tourist-return': [_tr1, _tr2, _pre, _cust],
    'local-return': [_lr1, _lf1, _pre, _cust]
  };

  var heroTimer = null, heroIdx = 0, heroLen = 0, HERO_MS = 6000; /* auto-advance interval (ms) */

  /* realistic hero imagery per slide — real Elly Store photography/product shots,
     keyed by the slide headline so artwork slots render as images instead */
  var HERO_IMG = {
    'Disney Cruise season is coming': { i: 'hero/hero-cruise-1.jpg', a: 'Disney | elly cruise outfits during a family photoshoot' },
    'Theme Park season — plan your looks': { i: 'hero/hero-cruise-2.jpg', a: 'Disney holiday outfits for the theme-park season' },
    'Everyone’s searching: birthday presents': { i: 'hero/hero-deluxe-boxes.jpg', a: 'Deluxe gift boxes, wrapped and ready' },
    'Newborn & Baby Shower season': { i: 'hero/hero-baby-blanket.jpg', a: 'Soft bamboo baby blanket in a floral bunny print' },
    'Birthday season is coming — we remembered': { i: 'hero/hero-deluxe-boxes.jpg', a: 'Keepsake gift box from an in-store purchase' },
    'Because you shopped with us': { i: 'hero/hero-sailor-mickey.png', a: 'Nautical Mickey design — restocked in your sizes' },
    'Be first to own a brand-new design': { i: 'hero/hero-preorder-garden.png', a: 'Pre-order concept artwork — Gardens by the Bay (illustrative, not approved)' },
    'Make it truly theirs': { i: 'hero/hero-bomber.jpg', a: 'Embroidered varsity bomber from the Customization pillar' }
  };

  function heroSlideHTML(st, i) {
    var hi = HERO_IMG[st.h1];
    return '<div class="hero-slide" role="group" aria-label="Banner ' + (i + 1) + '">' +
      '<div class="hero__in">' +
      '<div class="hero__copy">' +
      '<span class="kicker hero__kicker">' + st.kicker + '</span>' +
      '<h1 class="display">' + st.h1 + '</h1>' +
      '<p class="hero__sub">' + st.sub + '</p>' +
      '<div class="hero__cta">' +
      '<a class="btn btn--coral" href="' + st.ctaHref + '">' + st.cta + '</a>' +
      (st.cta2 ? '<a class="btn btn--ghost" href="' + st.cta2Href + '">' + st.cta2 + '</a>' : '') +
      '</div></div>' +
      '<div class="hero__visual">' +
      '<div class="hero__art" style="--art-a:' + st.a + ';--art-b:' + st.b + ';--art-c:' + st.c + '">' +
      '<span class="concept-tag art-tag">' + st.tag + '</span>' +
      (hi
        ? '<img class="hero-art-img" src="assets/' + hi.i + '" alt="' + esc(hi.a) + '" loading="' + (i === 0 ? 'eager' : 'lazy') + '">'
        : '<div style="text-align:center"><span class="ph-emoji">' + st.art + '</span>' +
        '<p>Illustrative artwork slot</p></div>') +
      '</div>' +
      '<div class="hero__float hero__float--t"><span class="dot" style="background:' + st.f1c + '"></span>' +
      '<div><span class="f-t">' + st.f1t + '</span><b>' + st.f1v + '</b></div></div>' +
      '<div class="hero__float hero__float--b"><span class="dot" style="background:' + st.f2c + '"></span>' +
      '<div><span class="f-t">' + st.f2t + '</span><b>' + st.f2v + '</b></div></div>' +
      '</div></div></div>';
  }

  function showHeroSlide(i, animate) {
    var wrap = $('#heroSlides');
    if (!wrap || !heroLen) return;
    heroIdx = ((i % heroLen) + heroLen) % heroLen;
    $$('.hero-slide', wrap).forEach(function (s, idx) { s.classList.toggle('is-on', idx === heroIdx); });
    $$('.hero-dot').forEach(function (d, idx) { d.classList.toggle('is-on', idx === heroIdx); });
    var count = $('#heroCount');
    if (count) count.textContent = (heroIdx + 1) + ' / ' + heroLen;
    /* restart the active dot's coral fill so it tracks the next auto-advance interval */
    var active = $('.hero-dot.is-on');
    if (active) {
      var bar = $('i', active);
      if (bar) { var clone = bar.cloneNode(true); active.replaceChild(clone, bar); }
    }
  }

  function startHeroTimer() {
    stopHeroTimer();
    if (heroLen < 2) return;
    heroTimer = setInterval(function () { showHeroSlide(heroIdx + 1, true); }, HERO_MS);
  }
  function stopHeroTimer() { if (heroTimer) { clearInterval(heroTimer); heroTimer = null; } }

  function renderHeroSlides() {
    var wrap = $('#heroSlides');
    if (!wrap) return;
    var s = demoSeg();
    var slides = HERO_SLIDES[s.geo + '-' + s.guest] || HERO_SLIDES['local-first'];
    heroLen = slides.length;
    wrap.innerHTML = slides.map(heroSlideHTML).join('');
    var dots = $('#heroDots');
    if (dots) {
      dots.innerHTML = slides.map(function (_, i) {
        return '<button type="button" class="hero-dot" data-i="' + i + '" aria-label="Banner ' + (i + 1) + '"><i></i></button>';
      }).join('');
    }
    heroIdx = 0;
    showHeroSlide(0, false);
    startHeroTimer();
  }

  /* overrides the earlier demo implementation */
  function applyHeroState() {
    renderHeroSlides();
    renderRecGrid();
    updateRecTiles();
    var rec = $('#recRail');
    if (rec) rec.style.display = demoSeg().guest === 'returning' ? '' : 'none';
    reorderOccasions(demoSeg().geo);
    fillGrids(); /* re-rank product rails per visitor segment */
    updateSignState();
    updateDemoStatus();
  }

  /* overrides the earlier demo status copy */
  function updateDemoStatus() {
    var st = $('.demo-status');
    if (!st) return;
    var s = demoSeg();
    var txt = {
      'tourist-first': 'Hero: 4 rotating slides (event \u2192 trending \u2192 pre-order \u2192 customization) \u00b7 rail weighted to travel, photoshoot & gifting. Search = trending intents.',
      'local-first': 'Hero: 4 rotating slides (event \u2192 trending \u2192 pre-order \u2192 customization) \u00b7 rail weighted to newborn, sleepover & siblings. Search = trending intents.',
      'tourist-return': 'Hero: 4 rotating slides (recommender \u2192 event \u2192 pre-order \u2192 customization) \u00b7 rail weighted to travel. Search = your cross-sell suggestions.',
      'local-return': 'Hero: 4 rotating slides (recommender \u2192 event \u2192 pre-order \u2192 customization) \u00b7 rail weighted to local occasions. Search = your cross-sell suggestions.'
    }[s.geo + '-' + s.guest];
    st.innerHTML = 'Serving: <b>' + (s.geo === 'tourist' ? 'Tourist \u00b7 overseas geo' : 'Local \u00b7 SG geo') + '</b> + <b>' + (s.guest === 'returning' ? 'Returning member (logged in)' : 'First-time (anonymous)') + '</b>. ' + txt;
  }

  /* carousel controls: dots + arrows + pause on hover */
  document.addEventListener('click', function (e) {
    var dot = e.target.closest('.hero-dot');
    if (dot) { showHeroSlide(parseInt(dot.getAttribute('data-i'), 10), true); startHeroTimer(); return; }
    if (e.target.closest('.js-hero-prev')) { showHeroSlide(heroIdx - 1, true); startHeroTimer(); return; }
    if (e.target.closest('.js-hero-next')) { showHeroSlide(heroIdx + 1, true); startHeroTimer(); return; }
  });
  /* live rotation: the banner ALWAYS auto-advances — no hover pause at all.
     Manual dot/arrow clicks simply reset the countdown (handled above). */

  /* search field grows on focus; shrinks back on blur/close (Quince-style) */
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.id === 'bigSearch') { var u = $('#hdrUtil'); if (u) u.classList.add('searching'); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-field') && !e.target.closest('.search-layer')) {
      var u = $('#hdrUtil'); if (u) u.classList.remove('searching');
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var u = $('#hdrUtil'); if (u) u.classList.remove('searching'); }
  });

  /* search results now match against recommender data (overrides earlier demo) */
  function runSearch(q) {
    q = String(q).trim();
    if (!q) { resetSearchResults(); return; }
    rememberRecent(q);
    var idle = $('.search-idle'), res = $('#searchResults');
    if (idle) idle.style.display = 'none';
    if (res) {
      res.style.display = '';
      var grid = $('#resultGrid');
      var ql = q.toLowerCase();
      var hits = PRODUCTS.filter(function (p) { return p.n.toLowerCase().indexOf(ql) >= 0; });
      if (grid) {
        grid.innerHTML = hits.length
          ? hits.slice(0, 8).map(productCard).join('')
          : fillFrom(pickPool([{ k: 'elly' }, { k: 'disney' }, { k: 'gift' }]), 8, 0).map(productCard).join('');
      }
      var count = $('#resultCount');
      if (count) {
        count.textContent = hits.length
          ? 'Showing ' + hits.length + ' match' + (hits.length > 1 ? 'es' : '') + ' \u2014 \u201c' + q + '\u201d (from the live catalog)'
          : '0 products match \u201c' + q + '\u201d \u2014 showing popular picks instead';
      }
    }
  }

  /* ---------- PDP + cart demo lines get real products ---------- */
  function productByName(name) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].n === name) return PRODUCTS[i];
    return null;
  }

  function populatePDP() {
    var pdp = $('.pdp');
    if (!pdp) return;
    var prod = null;
    try {
      var q = new URLSearchParams(window.location.search).get('p');
      if (q) prod = PRODUCTS.filter(function (p) { return p.n.toLowerCase().indexOf(q.toLowerCase()) >= 0; })[0];
    } catch (e) {}
    if (!prod) prod = productByName("Skye Dress - Elsa's Ice Magic") || PRODUCTS[0];
    var pillar = ({ elly: 'Elly Label', disney: 'Disney | elly', shoe: 'Shoes', gift: 'Gifting', custom: 'Customization' })[prod.k] || 'Elly Label';
    var t = $('#pdpTitle'); if (t) t.textContent = prod.n;
    var k = $('#pdpKicker'); if (k) k.textContent = pillar + ' \u00b7 ' + (prod.int || []).join(' / ');
    var pr = $('#pdpPrice'); if (pr) pr.textContent = prod.p;
    var d = $('#pdpDesc');
    if (d) d.textContent = 'Made for comfort and play first \u2014 soft, breathable fabric, machine washable. Populated from the live catalog (theellystore.com) so the PDP layout has real product imagery, pricing and copy slots.';
    var crumb = $('#pdpCrumb'); if (crumb) crumb.textContent = prod.n;
    var main = $('.pdp__main');
    if (main) {
      var imgs = prod.imgs && prod.imgs.length ? prod.imgs : [prod.img];
      main.classList.add('is-real');
      main.innerHTML = '<div class="pdp__tags"><span class="badge badge--blue">Personalisable at checkout</span></div>' +
        '<img class="pdp-img" src="' + esc(imgs[0]) + '" alt="' + esc(prod.n) + '">';
    }
    $$('.pdp__thumb').forEach(function (th, i) {
      var imgs = prod.imgs && prod.imgs.length ? prod.imgs : [prod.img];
      if (i < imgs.length) {
        th.classList.add('is-real');
        th.innerHTML = '<img src="' + esc(imgs[i]) + '" alt="Image ' + (i + 1) + '">';
      }
    });
  }

  function populateCartLines() {
    var lines = $$('.js-cart-line');
    if (!lines.length) return;
    var picks = [
      productByName("Skye Dress - Elsa's Ice Magic"),
      productByName('Long-Sleeve Pyjamas Set - Rain And Cozy'),
      productByName('Kids Tee - Doodle Mickey'),
      productByName('Deluxe Beginnings Keepsake Baby Gift Set')
    ].filter(Boolean);
    if (!picks.length) return;
    var sizes = ['3Y', '2Y', '12M', '0\u20136M'], colours = ['Ice blue', 'Rain & Cozy', 'Cream', 'Blue'];
    lines.forEach(function (line, i) {
      var prod = picks[i % picks.length];
      if (!prod) return;
      line.setAttribute('data-price', String(parseFloat(prod.p.replace(/S\$/, '')) || 0));
      var img = $('.cart-line__img', line);
      if (img) {
        img.classList.add('is-real');
        img.innerHTML = '<img src="' + esc(prod.img) + '" alt="' + esc(prod.n) + '">';
      }
      var h4 = $('h4', line);
      if (h4) h4.textContent = prod.n;
      var meta = $('.meta', line);
      if (meta) {
        var spans = $$('span', meta);
        if (spans[0]) spans[0].textContent = 'Size: ' + sizes[i % sizes.length] + ' \u00b7 Colour: ' + colours[i % colours.length];
        if (spans[1]) spans[1].textContent = 'From the live catalog \u00b7 demo line';
      }
    });
  }

  /* ---------- Init ---------- */
  function init() {
    populatePDP();
    populateCartLines();
    fillGrids();
    refreshBag();
    initQuickShop();
    applyHeroState();
    updateFacetUI();
    if ($('.js-cart-line')) cartTotals();
    buildB2BMatrix();
    if ($('.js-b2b-line')) b2bRecalc();
    goStep(1);
    applyB2BQuery();
    /* qtychange listeners need an initial pass for moq rows */
    $$('.js-moq-row').forEach(function (r) {
      var out = $('.qty-row output', r);
      if (out) out.value = out.getAttribute('value') || '0';
      r.dispatchEvent(new Event('qtychange', { bubbles: true }));
    });
    /* pre-order PDP: default select size + qty */
    var sizeChips = $$('.size-row .size-chip:not(.oos)');
    if (sizeChips.length && !$('.size-chip.is-on')) sizeChips[0].classList.add('is-on');
    sizeChips.forEach(function (sc) {
      if (sc.classList.contains('is-on')) {
        var info = sc.closest('.pdp__info');
        if (info) {
          var sel = $('#sizeSel', info);
          if (sel) sel.textContent = sc.getAttribute('data-size') || sc.textContent.trim();
        }
      }
    });
    var fopt = $('.fopt input[type="radio"]:checked');
    if (fopt) fopt.dispatchEvent(new Event('change', { bubbles: true }));
    /* demo seg UI reflect saved state */
    [['elly-geo', 'local'], ['elly-guest', 'returning']].forEach(function (pair) {
      var saved = ssGet(pair[0]);
      $$('.seg button[data-seg="' + pair[0] + '"]').forEach(function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-val') === (saved || pair[1]));
      });
    });
    document.body.classList.add('ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();

  window.EL = window.EL || {};
  window.EL.ghostCard = ghostCard;
  window.EL.toast = toast;
  window.EL.goStep = goStep;
  window.EL.startB2B = startB2B;
})();
