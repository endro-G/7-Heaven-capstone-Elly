/* ============================================================
   THE ELLY STORE — revamp prototype · interactions
   Demo shell: visitor toggle, search overlay, catalog-populated
   product grids (with ghost-card fallback), facets (UI only),
   tabs, B2B tiering, checkout fulfilment options, admin MOQ/demand demo.
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
  var ALL_PRODUCTS = (window.EL_PRODUCTS) || [];
  /* Consumer catalog: B2B-only items live in the same database but never surface in
     browsing/search/PDP pools \u2014 they only appear in the B2B quote flow (PRD \u00a710). */
  var PRODUCTS = ALL_PRODUCTS.filter(function (p) { return p.availability !== 'b2b-only'; });

  /* occasion tile / URL param -> catalog intent tag */
  var OCCASION_INTENT = {
    'Newborn & Baby Shower': 'newborn',
    'Big Brother / Little Sister': 'sibling',
    'Theme Park Vacation': 'park',
    'Family Photoshoot': 'photoshoot',
    'Pajama Party / Sleepover': 'sleepover',
    'Holiday Gift Boxes': 'gift',
    'Birthday': 'birthday',
    'Twinning & Matching Sets': 'twin'
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
    return '<article class="ph-card ph-card--real" data-kind="' + p.k + '" data-p="' + esc(p.n) + '">' +
      '<div class="ph-card__media">' + badge +
      '<img src="' + esc(p.img) + '" alt="' + esc(p.n) + '" loading="lazy">' +
      '<button type="button" class="quick-add js-add-demo">Add to bag</button></div>' +
      '<h3 class="ph-card__title">' + esc(p.n) + '</h3>' +
      '<div class="ph-card__meta"><span class="price-tx">' + esc(p.p) + '</span>' + stars + '</div>' +
      '</article>';
  }

  /* collect the pool described by keys: {k: kind, int: intent} — kind/intent optional.
     Categories overlap: a product may belong to several pillars (kinds) — its primary
     kind is `k`, extra memberships live in `kinds` (e.g. a Disney tee that is also
     personalisable shows under Customization too). */
  function inKind(p, kind) { return p.k === kind || (p.kinds || []).indexOf(kind) >= 0; }
  function pickPool(keys) {
    var out = [], seen = {};
    keys.forEach(function (key) {
      PRODUCTS.forEach(function (p) {
        var okK = !key.k || inKind(p, key.k);
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
      /* listing pages: the facet panel owns the grid — updateFacetUI renders the
         FULL category pool, so a filter can only ever narrow what's on screen
         (never reveal items that weren't already shown). Curated rails (home,
         PDP cross-sell) still get the capped, rotating fill below. */
      if ($('#facetPanel')) return;
      var n = parseInt(grid.getAttribute('data-ghost-grid'), 10) || 8;
      var kind = grid.getAttribute('data-kind') || 'elly';
      var intent = grid.getAttribute('data-intent') || '';
      var occ = occasionFromUrl();
      if (occ && OCCASION_INTENT[occ]) intent = OCCASION_INTENT[occ];
      var kinds = kind.split(' ');
      var keys;
      if (intent === 'rec') {
        keys = SEG_PICKS[segSuggestionKey()] || SEG_PICKS['local-first'];
      } else if (kinds.length > 1) {
        /* mixed rails (e.g. "custom elly"): interleave one product from each kind.
           A product in multiple kinds is only shown once per page. */
        var per = Math.ceil(n / kinds.length), flat = [], seenN = {};
        kinds.forEach(function (k) {
          fillFrom(pickPool([{ k: k }]), per, seed++).forEach(function (p) {
            if (!seenN[p.n]) { seenN[p.n] = true; flat.push(p); }
          });
        });
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

  /* ---------- Bag (demo, session-scoped) ----------
     The header badge count and the cart/checkout lines both come from one source:
     elly-bag-items (the product names actually added). elly-bag mirrors its length
     for the badge, so count and contents can never disagree. */
  var CURRENT_PDP = null;
  function bagItems() {
    try {
      var raw = ssGet('elly-bag-items');
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function bagCount() { return bagItems().length; }
  function saveBagItems(items) {
    ssSet('elly-bag-items', JSON.stringify(items));
    var n = items.length;
    ssSet('elly-bag', n);
    var c = $('#bagCount');
    if (c) { c.textContent = n; c.hidden = n <= 0; }
  }
  function addToBag(name) {
    var items = bagItems();
    items.push(name);
    saveBagItems(items);
  }
  function removeFromBag(name) {
    var items = bagItems();
    var i = items.indexOf(name);
    if (i < 0) return false;
    items.splice(i, 1);
    saveBagItems(items);
    return true;
  }
  function setBag(n) {
    /* demo-only override used by the smoke harness; keep items in sync by padding/trimming */
    var items = bagItems();
    while (items.length < n) items.push('Beary Personalisable Baby Gift Set');
    if (items.length > n) items.length = n;
    saveBagItems(items);
  }
  function refreshBag() { saveBagItems(bagItems()); }

  document.addEventListener('click', function (e) {
    var add = e.target.closest('.js-add-demo');
    if (add) {
      var card = add.closest('.ph-card');
      var name = card ? (card.getAttribute('data-p') || REP_PRODUCT[card.getAttribute('data-kind')] || '') : '';
      if (!name) name = 'Beary Personalisable Baby Gift Set';
      addToBag(name);
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

  /* run a search on the results page: remember the query, then navigate to
     search.html?q=… (or reload when it's the same query — assigning an identical
     URL does nothing, so the second search would appear dead) */
  function goSearch(q) {
    q = String(q || '').trim();
    if (!q) { openSearch(); return; }
    rememberRecent(q);
    if (searchQueryFromUrl() === q) { window.location.reload(); return; }
    window.location.href = 'search.html?q=' + encodeURIComponent(q);
  }

  function openSearch() {
    var layer = $('#searchLayer');
    if (!layer) return;
    layer.classList.add('show'); searchOpen = true;
    renderSearchChips();
    /* keep whatever was typed: if there is a query (typed live, or Enter / the
       submit arrow pressed), run it and show results — never wipe the input */
    var input = $('#bigSearch');
    var q = input ? String(input.value).trim() : '';
    if (q) runSearch(q);
    else resetSearchResults();
    if (input) {
      if (document.activeElement !== input) input.focus();
      /* select the (prefilled) query so typing a new search REPLACES it instead
         of appending to it — otherwise a second search on the results page
         becomes "mickeydress"-style garbage */
      input.select();
    }
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
    if (t.closest('.js-open-search')) {
      e.preventDefault();
      if (t.closest('.sf-go')) {
        /* clicking the arrow button: run the search — WITHOUT this branch the
           preventDefault above cancels the button's form submission entirely,
           so the arrow silently did nothing */
        var input = $('#bigSearch');
        goSearch(input ? input.value : '');
      } else if (!searchOpen) openSearch();
    }
  });
  /* Enter / submit arrow: run the search on the results page (search.html) where
     the full match list is shown with the facet panel on the left. Typing alone
     still shows live results inside the overlay (runSearch on input). */
  document.addEventListener('submit', function (e) {
    if (e.target.closest('.search-field')) {
      e.preventDefault();
      var input = $('#bigSearch');
      goSearch(input ? input.value : '');
    }
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
    'tourist-first': ['Disney Cruise outfits', 'Family photoshoot looks', 'Mickey Go Local tee', 'Twinning tees for the park', 'Shop now, ship home', 'Theme Park Vacation set'],
    'local-first': ['Birthday present', 'Newborn & baby shower gift', 'Full month set', 'Twinning & matching outfits', 'Sleepover PJs'],
    'tourist-return': ['Back in your size: Nautical Mickey', 'New: Marina Bay night designs', 'Restock your holiday edit', 'Stitch \u2014 you viewed this'],
    'local-return': ['Refill your favourites', 'Newborn gift \u2014 you bought this', 'Birthday edit for your 5yo', 'Points balance: 1,240 \u00b7 redeem S$5']
  };

  /* icons for the intent-led category chips (shown ranked by catalog size) */
  var INTENT_ICONS = {
    newborn: '\ud83d\udc76', gift: '\ud83c\udf81', sibling: '\ud83d\udc66', twin: '\ud83d\udc6f',
    park: '\ud83c\udff0', sleepover: '\ud83d\udcad', photoshoot: '\ud83d\udcf8', birthday: '\ud83c\udf82',
    cny: '\ud83e\udde7', singapore: '\ud83c\udfdd\ufe0f', custom: '\u2728', pets: '\ud83d\udc3e'
  };
  /* words too generic to surface as a "most searched" keyword chip (structure
     words, generic product words, and colour/facet noise) */
  var POPULAR_STOP = {};
  ['the','and','for','with','your','from','tee','tees','set','sets','kids','adult','adults',
   'new','concept','order','pre','personalised','personalisable','print','prints','style',
   'tops','classics','occasionwear','multi','white','cream','blue','pink','red','navy','green',
   'aqua','yellow','grey','gray','lilac','brown','black','blush','royal']
    .forEach(function (w) { POPULAR_STOP[w] = 1; });

  function segSuggestionKey() {
    var s = demoSeg();
    /* normalise "returning" (demoSeg default + demo-bar value) to "return",
       matching the SUGGEST / SEG_PICKS / REC_TILES keys */
    return s.geo + '-' + (s.guest === 'returning' ? 'return' : s.guest);
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
      wrap.innerHTML = (SUGGEST[key] || SUGGEST['local-first']).map(function (c) {
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
    /* most searched keywords — chips run a real keyword search */
    var kw = $('#popularKeywords');
    if (kw) {
      kw.innerHTML = popularKeywords(8).map(function (o) {
        return '<button type="button" class="chip js-search-chip" data-q="' + esc(o.k) + '">' + esc(o.k) + '<small class="chip-count">' + o.n + '</small></button>';
      }).join('');
    }
    /* most popular intent-led categories — ranked by catalog size, chips run the
       intent search (e.g. "Twinning & Matching Sets" resolves via EL_INTENTS) */
    var ow = $('#occasionChips');
    if (ow) {
      ow.innerHTML = popularIntents(7).map(function (o) {
        return '<button type="button" class="chip js-search-chip" data-q="' + esc(o.label) + '">' + (INTENT_ICONS[o.key] || '') + ' ' + esc(o.label) + '<small class="chip-count">' + o.count + '</small></button>';
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
  /* clicking any suggestion chip (recent / keyword / intent) opens the results
     page for that query — data-q carries the clean query (chips may display an
     icon / count label), and the full match list + facets show there */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.js-search-chip');
    if (!chip) return;
    var q = (chip.getAttribute('data-q') || chip.textContent.trim());
    if (q) {
      rememberRecent(q);
      window.location.href = 'search.html?q=' + encodeURIComponent(q);
    }
  });

  /* ---------- Hero visitor demo (index) ----------
     Rotating-banner hero + recommender engine are implemented further
     down (they override the older static-hero demo). Only the occasion
     re-ordering and the segment listeners live here. */

  function reorderOccasions(geo) {
    var rail = $('#occRail');
    if (!rail) return;
    var cards = $$('.occ-card', rail);
    /* Twinning & Matching shows for both segments, re-ranked: tourists see it
       right after the travel cluster (park-ready twinning), locals get it
       beside sibling sets (family matching is a core local occasion). */
    var order = geo === 'tourist'
      ? ['occ-theme-park', 'occ-photoshoot', 'occ-twin', 'occ-sleepover', 'occ-newborn', 'occ-sibling', 'occ-gift']
      : ['occ-newborn', 'occ-sibling', 'occ-twin', 'occ-sleepover', 'occ-theme-park', 'occ-photoshoot', 'occ-gift'];
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
  /* search results page: the ?q= param is the query the grid + facets operate on */
  function searchQueryFromUrl() {
    try {
      var p = new URLSearchParams(window.location.search);
      var q = p.get('q');
      return q ? String(q).trim() : '';
    } catch (e) { return ''; }
  }
  document.addEventListener('DOMContentLoaded', function () {
    var occ = occasionFromUrl();
    if (occ) {
      var banner = $('#occBanner');
      if (banner) {
        banner.hidden = false;
        var t = $('#occBannerText');
        if (t) t.textContent = 'Browsing occasion: ' + occ + ' \u2014 the grid below is curated from products tagged with this occasion (demo).';
      }
    }
  });

  /* ---------- Facets (listing pages) — wired to the product database ----------
     Facet values on each listing page map onto the metadata tags in products.js
     (age, type, characters, colours, price, customization method/placement,
     pet size, shoe stage/brand/size, occasion/recipient/style/budget). */
  var SORT_STATE = ''; /* '' = Featured (database order) */

  var CHAR_GROUPS = {
    'Mickey & Friends': ['Mickey', 'Minnie', 'Donald', 'Daisy', 'Goofy', 'Pluto'],
    'Disney Princess': ['Princess', 'Rapunzel', 'Ariel', 'Little Mermaid', 'Cinderella', 'Belle', 'Aurora'],
    'Frozen': ['Frozen', 'Elsa', 'Anna', 'Olaf'],
    'Winnie the Pooh': ['Pooh', 'Piglet', 'Eeyore', 'Tigger', 'Hundred Acre'],
    'Stitch': ['Stitch'],
    'Zootopia': ['Zootopia']
  };
  var AGE_ALIAS = {
    'Baby Disney (0–2Y)': ['Newborn (0–12M)', 'Baby (0–2Y)'],
    'Girls (1–14Y)': ['Kids (1–14Y)'],
    'Boys (1–14Y)': ['Kids (1–14Y)']
  };
  var TYPE_ALIAS = {
    'Dresses & cheongsams': ['Dresses'],
    'Tees & separates': ['Tops & tees']
  };
  var OCC_FACET = {
    'Newborn & baby shower': ['newborn'],
    'Full month': ['fullmonth'],
    'Birthday': ['birthday'],
    'Festive / Christmas': ['christmas'],
    'Thank you / hostess': ['hostess'],
    'Twinning & matching': ['twin'],
    'Theme park vacation': ['park'],
    'Family photoshoot': ['photoshoot'],
    'Pajama party / sleepover': ['sleepover'],
    'Gifting': ['gift'],
    'Chinese New Year': ['cny'],
    'Singapore souvenirs': ['singapore'],
    'FurKids / pets': ['pets']
  };
  var PLACE_FACET = {
    'Chest / pocket': ['left chest', 'front'],
    'Back / yoke': ['full back'],
    'Sleeve / cuff': ['sleeve / cuff'],
    'Keepsake box lid': ['keepsake box lid']
  };

  function hasMethod(p, m) { return (p.custom && p.custom.methods || []).indexOf(m) >= 0; }
  function matchList(p, field, v) {
    var list = p[field] || [];
    v = String(v).toLowerCase();
    return list.some(function (x) {
      x = String(x).toLowerCase();
      return x === v || x.indexOf(v) >= 0 || v.indexOf(x) >= 0;
    });
  }
  function matchChars(p, v) {
    var group = CHAR_GROUPS[v] || [v];
    return group.some(function (c) {
      return matchList(p, 'characters', c);
    });
  }
  function priceMatch(price, v) {
    if (v === 'Under $40') return price < 40;
    if (v === '$40–$80') return price >= 40 && price < 80;
    if (v === '$80+') return price >= 80;
    if (v === 'Under $80') return price < 80;
    if (v === '$80–$150') return price >= 80 && price < 150;
    if (v === '$150–$300') return price >= 150 && price < 300;
    if (v === '$300+') return price >= 300;
    return false;
  }
  function occMatch(p, v) {
    var keys = OCC_FACET[v] || [String(v).toLowerCase()];
    var all = (p.int || []).concat(p.occasion || []).map(function (t) { return String(t).toLowerCase(); });
    return keys.some(function (k) { return all.indexOf(String(k).toLowerCase()) >= 0; });
  }
  function styleMatch(p, v) {
    if (v === 'Gift set (ready to give)') return (p.giftStyle || []).indexOf(v) >= 0 || p.type === 'Gift set';
    if (v === 'Keepsake box') return (p.giftStyle || []).indexOf(v) >= 0 || p.type === 'Keepsake box';
    if (v === 'Personalisable') return cfgEligible(p);
    return false; /* digital gift card: no product carries it in the database */
  }
  /* one facet value → does this product match? (name = data-f, v = checkbox/swatch value) */
  function facetMatch(p, name, v) {
    var page = (document.body && document.body.getAttribute('data-page')) || '';
    switch (name) {
      case 'Price': case 'Budget': return priceMatch(p.price || 0, v);
      case 'Colour':
        /* customization page thread-colour swatches end in ' thread' */
        if (/ thread$/i.test(String(v))) return hasMethod(p, 'embroidered');
        return matchList(p, 'colours', v);
      case 'Character': return matchChars(p, v);
      case 'Age': {
        var keys = AGE_ALIAS[v] || [v];
        return keys.some(function (k) { return (p.age || []).indexOf(k) >= 0; });
      }
      case 'Type':
        /* "In stock now" = everything that is not concept / pre-order / B2B-only
           (regular catalog items simply carry no availability flag) */
        if (v === 'In stock now') return p.availability !== 'concept' && p.availability !== 'pre-order' && p.availability !== 'b2b-only';
        if (v === 'Pre-order design') return p.availability === 'pre-order';
        if (v === 'Concept design') return p.availability === 'concept';
        if (page === 'shoe-boutique') return matchList(p, 'shoeType', v);
        return (TYPE_ALIAS[v] || [v]).indexOf(p.type) >= 0;
      case 'Method': return v === 'Embroidered' ? hasMethod(p, 'embroidered') : hasMethod(p, 'patches');
      case 'Thread colour': return hasMethod(p, 'embroidered');
      case 'Detail': return hasMethod(p, 'embroidered'); /* Name / Initials / Number are embroidered */
      case 'Placement': {
        var pl = PLACE_FACET[v] || [String(v).toLowerCase()];
        return (p.custom && p.custom.placements || []).some(function (x) {
          return pl.some(function (k) { return String(x).toLowerCase() === k; });
        });
      }
      case 'Pet size': return matchList(p, 'petSize', v);
      case 'Stage': return matchList(p, 'shoeStage', v);
      case 'Brand': return matchList(p, 'brand', v);
      case 'Size': return matchList(p, 'shoeSizes', v);
      case 'Occasion': return occMatch(p, v);
      case 'Recipient': return matchList(p, 'recipient', v);
      case 'Style': return styleMatch(p, v);
    }
    return false;
  }

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

  /* the full category pool behind the page's grid (union of its pillar kinds) */
  function pagePool() {
    var grid = $('[data-ghost-grid]');
    if (!grid) return [];
    /* search results page: the pool IS the query's hits (intent-led or keyword),
       so the facets on the left narrow the searched results */
    if ((document.body && document.body.getAttribute('data-page')) === 'search') {
      var sq = searchQueryFromUrl();
      return sq ? searchProducts(sq).hits : [];
    }
    var kind = grid.getAttribute('data-kind') || 'elly';
    var intent = grid.getAttribute('data-intent') || '';
    var occ = occasionFromUrl();
    var occIntent = occ && OCCASION_INTENT[occ] ? OCCASION_INTENT[occ] : '';
    if (occIntent) intent = occIntent;
    var kinds = kind.split(' ');
    var keys;
    if (intent === 'rec') keys = SEG_PICKS[segSuggestionKey()] || SEG_PICKS['local-first'];
    else if (occIntent) {
      /* intent-led browsing (occasion tile / URL): every consumer product tagged
         with that intent, across ALL pillars — e.g. Twinning & Matching spans
         elly + disney + gift items, so any host page shows the full intent edit. */
      keys = [{ int: [occIntent] }];
    }
    else if (kinds.length > 1) keys = kinds.map(function (k) { return { k: k }; });
    else {
      keys = [{ k: kinds[0] }];
      if (intent) keys = [{ k: kinds[0], int: [intent] }, { k: kinds[0] }];
    }
    return pickPool(keys);
  }

  function revCount(p) {
    var m = /\((\d+)\)/.exec(p.stars || '');
    return m ? parseInt(m[1], 10) : 0;
  }
  function sortProducts(list) {
    var s = SORT_STATE || '';
    var arr = list.slice();
    if (!s || s === 'Featured' || s === 'Newest') return arr;
    if (s === 'Best selling') {
      return arr.sort(function (a, b) { return revCount(b) - revCount(a); });
    }
    if (s.indexOf('Price: low to high') >= 0) return arr.sort(function (a, b) { return (a.price || 0) - (b.price || 0); });
    if (s.indexOf('Price: high to low') >= 0) return arr.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
    return arr;
  }

  function updateFacetUI() {
    var panel = $('#facetPanel');
    if (!panel) return;
    var vals = activeFacets(panel);
    var pillWrap = $('.active-filters');
    if (pillWrap) {
      pillWrap.innerHTML = vals.map(function (v) {
        return '<span class="f-pill">' + v.val + '<button type="button" data-remove="' + v.val.replace(/"/g, '&quot;') + '" aria-label="Remove ' + v.val + '">' + icon('close') + '</button></span>';
      }).join('');
    }
    var grid = $('[data-ghost-grid]');
    var empty = $('.empty-slot');
    var count = $('.result-line');
    if (!grid) return;
    var pool = pagePool();
    var pageName = (document.body && document.body.getAttribute('data-page')) || '';
    var isFurkids = pageName === 'furkids';
    var isSearch = pageName === 'search';
    var sq = isSearch ? searchQueryFromUrl() : '';
    /* always render the full (filtered + sorted) category pool — the initial view
       and every filtered view come from the same renderer, so filtering never
       changes the item count the wrong way (e.g. revealing items that weren't
       shown before clicking a filter). */
    var filtered = vals.length
      ? pool.filter(function (p) { return vals.every(function (f) { return facetMatch(p, f.name, f.val); }); })
      : pool;
    var sorted = sortProducts(filtered);
    if (sorted.length) {
      grid.style.display = '';
      grid.innerHTML = sorted.map(productCard).join('');
      if (empty) empty.style.display = 'none';
      if (count) {
        count.innerHTML = isSearch
          ? vals.length
            ? '<b>' + sorted.length + '</b> of <b>' + pool.length + '</b> matches for \u201c' + esc(sq) + '\u201d also match your filters.'
            : '<b>' + sorted.length + '</b> product' + (sorted.length === 1 ? '' : 's') + ' match \u201c' + esc(sq) + '\u201d \u2014 refine with the filters on the left (keywords, intents &amp; tags from the product database).'
          : vals.length
            ? '<b>' + sorted.length + '</b> product' + (sorted.length === 1 ? '' : 's') + ' match your filters \u2014 tagged from the product database.'
            : isFurkids
              ? '<b>' + pool.length + ' FurKids items</b> \u2014 live pet accessories beside concept pieces \u00b7 Concept only \u2014 no Disney licence applied for.'
              : '<b>' + pool.length + ' products</b> in this category \u2014 filtered &amp; sorted from the product database (theellystore.com feed).';
      }
    } else {
      grid.style.display = 'none';
      if (empty) {
        empty.style.display = '';
        var emT = $('strong', empty);
        var emS = $('span', empty);
        if (isSearch && !pool.length) {
          if (emT) emT.textContent = sq ? 'No products match \u201c' + sq + '\u201d' : 'Enter a search to get started';
          if (emS) emS.textContent = sq
            ? 'Try a different keyword, or an occasion like \u201cbirthday\u201d, \u201ctwinning\u201d or \u201cdisney\u201d.'
            : 'Type a keyword or occasion in the search field above \u2014 matches are shown here with filters on the left.';
        } else {
          if (emT) emT.textContent = 'No products match these filters';
          if (emS) emS.textContent = 'Try clearing a filter \u2014 every product carries tags &amp; metadata from the same database.';
        }
      }
      if (count) {
        count.innerHTML = isSearch
          ? '<b>0 products</b> match \u201c' + esc(sq) + '\u201d' + (vals.length ? ' with these filters' : '') + ' \u2014 try a different search.'
          : '<b>0 products</b> match these filters \u2014 try clearing one.';
      }
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
      SORT_STATE = '';
      var sortSel = $('.sort select');
      if (sortSel) sortSel.value = 'Featured';
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

  /* ---------- Sort (wired — re-orders the filtered pool from the database) ---------- */
  document.addEventListener('change', function (e) {
    if (e.target.matches('.sort select')) {
      SORT_STATE = e.target.value;
      updateFacetUI();
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
        var name = (CURRENT_PDP && CURRENT_PDP.n) || (($('#preTitle') && $('#preTitle').textContent) || 'Beary Personalisable Baby Gift Set');
        addToBag(name);
        var pers = cfgSummaryText();
        toast('Added to bag \u2014 <b>demo</b>' + (pers ? ' \u00b7 ' + esc(pers) : '') + '. <a href="cart.html" style="text-decoration:underline;color:#fff">View bag</a>');
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
      var n = out ? (parseInt(out.value, 10) || 0) : 1;
      qty += n;
      subtotal += price * n;
      var lp = $('.line-price', line);
      if (lp) lp.textContent = 'S$' + (price * n).toFixed(2);
    });
    var st = $('#cartSubtotal'); if (st) st.textContent = 'S$' + subtotal.toFixed(2);
    var tot = $('#cartTotal'); if (tot) tot.textContent = 'S$' + subtotal.toFixed(2);
    var meter = $('#shipMeter'); if (meter) meter.style.width = Math.min(100, subtotal / 100 * 100) + '%';
    var lbl = $('#shipMeterLabel');
    if (lbl) lbl.textContent = subtotal >= 100 ? 'You\u2019ve unlocked free standard shipping' : 'S$' + (100 - subtotal).toFixed(2) + ' away from free standard shipping';
    return subtotal;
  }
  document.addEventListener('qtychange', function (e) {
    if (e.target.closest('.js-cart-line')) {
      cartTotals();
    }
  });
  document.addEventListener('DOMContentLoaded', function () {
    if ($('.js-cart-line')) cartTotals();
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

  /* B2B catalogue — DERIVED from the shared product database (products.js).
     Every product tagged b2b.available surfaces here with its unit price and size
     run; B2B-only items (adult/varsity tees) live in the same database but are
     excluded from consumer browsing (PRD §10: same catalog, B2B-eligible subset). */
  var B2B_KIND_LABEL = { elly: 'Elly Label', disney: 'Disney | elly', custom: 'Customization', gift: 'Gifting Hub' };
  var B2B_ITEMS = [];
  ALL_PRODUCTS.forEach(function (p) {
    if (!p.b2b || !p.b2b.available) return;
    B2B_ITEMS.push({
      kind: p.k,
      name: p.n,
      meta: p.b2b.meta || (B2B_KIND_LABEL[p.k] || 'Elly Label') + ' \u00b7 ' + ((p.age || []).join('/')),
      unit: (p.b2b.unit != null ? p.b2b.unit : (p.price || 0)),
      img: p.img,
      sizes: (p.b2b.sizes && p.b2b.sizes.length) ? p.b2b.sizes : ((p.sizes && p.sizes.length) ? p.sizes : ['Set']),
      glyph: 'tee'
    });
  });

  /* SVG artwork — fallback only; B2B_ITEMS[].img (real store photo) is used when present */
  var B2B_THREADS = [['Coral', '#FF6070'], ['Blue', '#4D6EB5'], ['Ink', '#1a1a1a'], ['White', '#ffffff'], ['Gold', '#C9A227'], ['Forest', '#2F6B4F']];
  function b2bArtSVG(it) {
    var glyph = it.glyph || 'tee';
    var d;
    if (glyph === 'romper') d = 'M46 6L33 15 17 21 10 29 18 41 26 39 27 58 73 58 74 39 82 41 90 29 83 21 67 15 54 6ZM33 58L31 86 44 86 46 64 54 64 56 86 69 86 67 58Z';
    else if (glyph === 'robe') d = 'M46 6L33 15 17 21 10 29 18 41 26 39 27 92 73 92 74 39 82 41 90 29 83 21 67 15 54 6ZM38 48L30 92 46 92 50 62 54 92 70 92 62 48Z';
    else d = 'M46 6L33 15 17 21 10 29 18 41 26 39 27 84 73 84 74 39 82 41 90 29 83 21 67 15 54 6Z';
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img">' +
      '<rect width="100" height="100" fill="#FCF6EE"/>' +
      '<path d="' + d + '" fill="' + (it.tint || '#e7ecf7') + '" stroke="' + (it.ink || '#9fb0cc') + '" stroke-width="2.5" stroke-linejoin="round"/>' +
      (glyph === 'tee' ? '<ellipse cx="50" cy="7" rx="8" ry="3" fill="#FCF6EE"/>' : '') +
      '</svg>';
  }
  function b2bArtSrc(it) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(b2bArtSVG(it));
  }
  function b2bShirtBase() {
    return '<rect width="100" height="100" fill="#FCF6EE"/>' +
      '<path d="M46 6L33 15 17 21 10 29 18 41 26 39 27 84 73 84 74 39 82 41 90 29 83 21 67 15 54 6Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="7" rx="8" ry="3" fill="#FCF6EE" stroke="#1a1a1a" stroke-width="1"/>';
  }
  function b2bPlaceDiag(place) {
    var zone = '';
    if (place === 'Left chest') zone = '<rect x="31" y="44" width="14" height="18" rx="2" fill="rgba(255,96,112,.22)" stroke="#FF6070" stroke-width="1.5" stroke-dasharray="3 2"/>';
    else if (place === 'Centre front') zone = '<rect x="41" y="43" width="18" height="22" rx="2" fill="rgba(255,96,112,.22)" stroke="#FF6070" stroke-width="1.5" stroke-dasharray="3 2"/>';
    else if (place === 'Full back') zone = '<rect x="31" y="44" width="38" height="34" rx="3" fill="rgba(77,110,181,.18)" stroke="#4D6EB5" stroke-width="1.5" stroke-dasharray="4 3"/>';
    else zone = '<polygon points="15,29 24,23 32,28 30,38 19,37" fill="rgba(255,96,112,.22)" stroke="#FF6070" stroke-width="1.5" stroke-dasharray="3 2"/>';
    return '<figure class="b2b-fig"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + b2bShirtBase() + zone + '</svg><figcaption>' + esc(place || '') + (place === 'Full back' ? ' \u2014 larger coverage' : '') + '</figcaption></figure>';
  }
  function b2bIronDiag(key) {
    var size = { 'Small (A6)': [14, 18], 'Medium (A5)': [22, 27], 'Large (A4)': [32, 36] }[key] || [22, 27];
    var w = size[0], h = size[1], x = (100 - w) / 2, y = 40 - h / 2;
    return '<figure class="b2b-fig"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' + b2bShirtBase() +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5" fill="rgba(77,110,181,.18)" stroke="#4D6EB5" stroke-width="1.5" stroke-dasharray="3 2"/>' +
      '</svg><figcaption>' + esc(key || '') + ' transfer</figcaption></figure>';
  }
  function b2bThreadSwatchesHTML() {
    return B2B_THREADS.map(function (t, i) {
      return '<button type="button" class="b2b-colour' + (i === 0 ? ' is-on' : '') + '" style="background:' + t[1] + '" data-col="' + t[0] + '" aria-label="' + t[0] + ' thread" aria-pressed="' + (i === 0 ? 'true' : 'false') + '" title="' + t[0] + '"></button>';
    }).join('');
  }
  /* decoration methods — the add-on is per unit; only Standard has no extra fields */
  var B2B_METHODS = [
    { key: 'Standard', label: 'Standard (no decoration)', add: 0 },
    { key: 'Embroidery', label: 'Embroidery', add: 8 },
    { key: 'Iron-on', label: 'Iron-on', add: 4 },
    { key: 'Screen print', label: 'Screen print', add: 6 },
    { key: 'DTG', label: 'DTG (full colour)', add: 12 }
  ];
  /* conditional fields shown per line when a decoration method is picked */
  var B2B_PARAM_HTML = {
    'Embroidery': '<div class="form-grid" style="max-width:520px">' +
      '<div class="field emb-field">' +
      '<label>Placement</label>' +
      '<select class="js-dp" data-param="placement">' +
      '<option>Left chest</option><option>Sleeve</option><option>Full back</option><option>Centre front</option></select>' +
      '<div class="js-diag-place b2b-diag">' + b2bPlaceDiag('Left chest') + '</div></div>' +
      '<div class="field emb-field">' +
      '<label>Thread colour</label>' +
      '<div class="b2b-colours" data-param="thread" role="radiogroup" aria-label="Thread colour">' + b2bThreadSwatchesHTML() + '</div>' +
      '<p class="small muted" style="margin:12px 0 0">Adds <b>S$8.00 per unit</b>. Names, initials or a small logo \u2014 up to ~12 characters for the chest.</p>' +
      '</div>' +
      '</div>',
    'Iron-on': '<div class="field" style="max-width:360px;margin:0"><label>Transfer size</label>' +
      '<select class="js-dp" data-param="transfer"><option>Small (A6)</option><option>Medium (A5)</option><option>Large (A4)</option></select>' +
      '<div class="js-diag-iron b2b-diag">' + b2bIronDiag('Small (A6)') + '</div></div>' +
      '<p class="small muted" style="margin-top:10px">Adds <b>S$4.00 per unit</b>. Heat-transfer name or design \u2014 fastest turnaround for events.</p>',
    'Screen print': '<div class="form-grid" style="max-width:340px"><div class="field"><label>Ink colours</label>' +
      '<select class="js-dp" data-param="inks"><option>1 colour</option><option>2 colours</option><option>3 colours</option></select></div></div>' +
      '<p class="small muted" style="margin-top:10px">Adds <b>S$6.00 per unit</b> (1 colour). Best for large single-colour logos \u2014 vector artwork required.</p>',
    'DTG': '<p class="small muted">Adds <b>S$12.00 per unit</b>. Full-colour photo-style prints \u2014 upload your artwork in the Artwork &amp; shipping step. Great for corporate keepsakes and event merchandise.</p>'
  };
  var B2B_OTYPE_ALIAS = { bulk: 'Bulk / wholesale', corporate: 'Corporate', event: 'Corporate event' };
  var b2bArtName = '';
  /* Frozen, validated quote draft — set when the customer confirms details on the
     Review & confirm step (5). Request and Download both read from this so the quote
     sheet always carries the details the customer confirmed (never a live DOM read). */
  var b2bDraft = null;
  function b2bNewRef() { return 'ELQ-2026-' + Math.floor(1000 + Math.random() * 9000); }

  function b2bDecoActive(line) {
    var c = $('.js-b2b-deco.is-active', line) || $('.js-b2b-deco', line);
    return { method: c ? c.getAttribute('data-method') : 'Standard', add: parseFloat((c && c.getAttribute('data-add')) || '0') || 0 };
  }
  function lineTotals(line) {
    var q = 0;
    $$('.qty-row output', line).forEach(function (o) { q += parseInt(o.value, 10) || 0; });
    var unit = parseFloat(line.getAttribute('data-unit')) || 0;
    var d = b2bDecoActive(line);
    return { name: line.getAttribute('data-name') || 'Item', qty: q, unit: unit, sub: q * unit, decoAdd: d.add, deco: d.add * q, method: d.method, line: line };
  }
  function visibleLines() {
    var out = [];
    $$('.js-b2b-line').forEach(function (line) {
      if (line.hidden) return;
      out.push(lineTotals(line));
    });
    return out;
  }
  /* ---- step-2 dropdown rows: one item per row, options appear under the selected item ---- */
  function b2bSelectOptionsHTML() {
    var out = '<option value="">Choose an item…</option>';
    ['elly', 'disney', 'custom', 'gift'].forEach(function (kind) {
      var group = [];
      B2B_ITEMS.forEach(function (it, i) {
        if (it.kind !== kind) return;
        group.push('<option value="' + i + '">' + esc(it.name) + ' \u2014 S$' + it.unit.toFixed(2) + ' \u00b7 ' + it.sizes.length + ' sizes</option>');
      });
      if (group.length) out += '<optgroup label="' + (B2B_KIND_LABEL[kind] || kind) + '">' + group.join('') + '</optgroup>';
    });
    return out;
  }
  function b2bItemPanelHTML(it) {
    var chips = B2B_METHODS.map(function (m, mi) {
      return '<button type="button" class="chip js-b2b-deco' + (mi === 0 ? ' is-active' : '') + '" data-method="' + m.key + '" data-add="' + m.add + '">' + m.label + '</button>';
    }).join('');
    var szq = it.sizes.map(function (s) {
      return '<span class="szq"><span class="szq-lbl">' + esc(s) + '</span>' +
        '<span class="qty-row" data-min="0" data-max="500">' +
        '<button type="button" data-step="-1" aria-label="Decrease">\u2212</button><output>0</output>' +
        '<button type="button" data-step="1" aria-label="Increase">+</button></span></span>';
    }).join('');
    return '<div class="b2b-line__head">' +
      '<img class="b2b-item-img" src="' + (it.img || b2bArtSrc(it)) + '" alt="' + esc(it.name) + '">' +
      '<span style="min-width:0"><b style="display:block">' + esc(it.name) + '</b><span class="lbl">' + esc(it.meta) + ' \u00b7 S$' + it.unit.toFixed(2) + ' each</span></span>' +
      '<span class="tally">Line: <b class="js-line-qty">0</b> units \u00b7 <b class="js-line-sub">S$0.00</b> \u00b7 deco <b class="js-line-deco">S$0.00</b></span></div>' +
      '<div class="szq-wrap">' + szq + '</div>' +
      '<div class="chip-row" role="radiogroup" aria-label="Decoration for ' + esc(it.name) + '" style="margin-bottom:10px">' + chips + '</div>' +
      '<div class="js-dp-wrap"></div>' +
      '<p class="line-note small muted" style="color:var(--ink-soft)"></p>';
  }
  function b2bRowHTML() {
    return '<div class="b2b-row js-b2b-row">' +
      '<div class="b2b-row__bar">' +
      '<select class="js-b2b-sel" aria-label="Choose an item">' + b2bSelectOptionsHTML() + '</select>' +
      '<button type="button" class="b2b-rm js-b2b-rm" aria-label="Remove this item">\u00d7</button>' +
      '</div>' +
      '<p class="small muted js-b2b-hint" style="margin:8px 2px 0">Select an item to set sizes, quantities and decoration.</p>' +
      '<div class="js-b2b-line b2b-line" hidden></div>' +
      '</div>';
  }
  function b2bResetRows() {
    var c = $('#b2bRows');
    if (c) c.innerHTML = b2bRowHTML();
  }
  /* builds the step-2 dropdown row list */
  function buildB2BLines() {
    if (!$('#b2bRows')) return;
    b2bResetRows();
  }

  function b2bType() {
    var o = $('.otype.is-on');
    return o ? o.getAttribute('data-name') : 'Bulk / wholesale';
  }
  /* MOQ rules: wholesale 10 per design line · corporate / events 20 per order (hard block on submit) */
  function b2bMoqStatus(totals, type) {
    var ordered = totals.filter(function (t) { return t.qty > 0; });
    if (!ordered.length) return { ok: false, msg: 'Choose a design and add quantities first.' };
    if (type === 'Bulk / wholesale') {
      var low = ordered.filter(function (t) { return t.qty < 10; });
      if (low.length) {
        var names = low.map(function (t) { return t.name; }).join(', ');
        return { ok: false, msg: 'Each wholesale design needs at least 10 units \u2014 ' + names + ' ' + (low.length > 1 ? 'are' : 'is') + ' below.' };
      }
      return { ok: true, msg: 'Meets the 10-units-per-design minimum \u2014 tier pricing applies.' };
    }
    var total = ordered.reduce(function (s, t) { return s + t.qty; }, 0);
    if (total < 20) return { ok: false, msg: 'Corporate/event orders need at least 20 units total \u2014 currently ' + total + '. Add more, or call +65 9628 1037.' };
    return { ok: true, msg: 'Meets the 20-unit order minimum \u2014 tier pricing applies.' };
  }
  function b2bRecalc() {
    var totals = visibleLines();
    var totalQty = totals.reduce(function (s, t) { return s + t.qty; }, 0);
    var subtotal = totals.reduce(function (s, t) { return s + t.sub; }, 0);
    var deco = totals.reduce(function (s, t) { return s + t.deco; }, 0);
    var rowsHtml = '';
    totals.forEach(function (t) {
      if (!t.qty) return;
      rowsHtml += '<div class="r"><span>' + esc(t.name) + ' \u00d7 ' + t.qty + (t.method !== 'Standard' ? ' \u00b7 ' + esc(t.method) : '') + '</span><b>S$' + (t.sub + t.deco).toFixed(2) + '</b></div>';
    });
    var tier = totalQty >= 10 ? (TIERS.find(function (x) { return totalQty >= x.min && totalQty <= x.max; }) || null) : null;
    var custom = tier && tier.disc === null;
    var disc = tier && !custom ? tier.disc : 0;
    var save = subtotal * disc;
    var total = subtotal + deco - save;

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

    var moq = b2bMoqStatus(totals, b2bType());
    var hasAny = totalQty > 0;
    var moqCls = hasAny ? (moq.ok ? 'b2b-moq-ok' : 'b2b-moq-warn') : '';
    var tierTxt = !hasAny ? 'Pick an item and add quantities \u2014 tier pricing from 10 units.' : (totalQty < 10 ? 'Add quantities \u2014 tier pricing from 10 units.' : (custom ? '300+ units \u2014 flags for a custom quote.' : 'Tier applied: ' + tier.min + '\u2013' + (tier.max === Infinity ? '+' : tier.max) + ' units \u00b7 ' + Math.round(disc * 100) + '% off.'));
    var runNote = $('#b2bRunMoq');
    if (runNote) {
      runNote.innerHTML = '<span class="' + moqCls + '">' + esc(moq.msg) + '</span>';
      if (hasAny) runNote.innerHTML += '<br><span style="color:var(--ink-soft)">' + tierTxt + '</span>';
    }
    var moqLine = $('#b2bMoqLine');
    if (moqLine) {
      var avg = hasAny ? 'Avg. unit: S$' + (total / totalQty).toFixed(2) + ' \u00b7 tiers reset below 10 units.' : '';
      moqLine.innerHTML = '<span class="' + moqCls + '">' + esc(moq.msg) + '</span>' + (avg ? '<br><span style="color:var(--ink-soft)">' + avg + '</span>' : '');
    }
    /* per-line tally + wholesale per-line hint */
    $$('.js-b2b-line').forEach(function (line) {
      var t = lineTotals(line);
      var n = $('.js-line-qty', line); if (n) n.textContent = t.qty;
      var s = $('.js-line-sub', line); if (s) s.textContent = 'S$' + (t.sub + t.deco).toFixed(2);
      var dd = $('.js-line-deco', line); if (dd) dd.textContent = 'S$' + t.deco.toFixed(2);
      var note = $('.js-line-moq', line);
      if (note) {
        if (t.qty && b2bType() === 'Bulk / wholesale' && t.qty < 10) {
          note.textContent = 'Needs at least 10 units for this design \u2014 add ' + (10 - t.qty) + ' more.';
          note.className = 'line-note small b2b-moq-warn';
        } else {
          note.textContent = '';
          note.className = 'line-note small muted';
        }
      }
    });
  }
  document.addEventListener('qtychange', function (e) {
    if (e.target.closest('.js-b2b-line')) b2bRecalc();
  });

  /* B2B steps */
  var b2bStep = 1;
  function goStep(n) {
    b2bStep = n;
    $$('.js-b2b-step').forEach(function (el) {
      var on = el.getAttribute('data-step') === String(n);
      el.classList.toggle('is-on', on);
      el.style.display = on ? '' : 'none';
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
    var step = Math.min(Math.max(parseInt(params.step, 10) || 1, 1), 5);
    startB2B(otype, step);
  }

  /* step 2: picking an item in a dropdown row reveals its options below the row */
  document.addEventListener('change', function (e) {
    var sel = e.target.closest('.js-b2b-sel');
    if (!sel) return;
    var row = sel.closest('.js-b2b-row');
    var line = row ? $('.js-b2b-line', row) : null;
    var hint = row ? $('.js-b2b-hint', row) : null;
    var v = sel.value;
    var idx = v === '' ? -1 : parseInt(v, 10);
    if (!row || !line) return;
    var clear = function () {
      line.hidden = true;
      line.removeAttribute('data-idx');
      line.removeAttribute('data-name');
      line.removeAttribute('data-unit');
      line.innerHTML = '';
      if (hint) hint.style.display = '';
      b2bRecalc();
    };
    if (v === '' || isNaN(idx) || !B2B_ITEMS[idx]) { clear(); return; }
    var dup = $$('.js-b2b-row').some(function (r) {
      if (r === row) return false;
      var l = $('.js-b2b-line', r);
      return l && !l.hidden && l.getAttribute('data-idx') === v;
    });
    if (dup) {
      toast('That item is already on your list \u2014 pick another or remove its line first.');
      sel.value = '';
      clear();
      return;
    }
    var it = B2B_ITEMS[idx];
    line.setAttribute('data-idx', v);
    line.setAttribute('data-name', it.name);
    line.setAttribute('data-unit', it.unit);
    line.innerHTML = b2bItemPanelHTML(it);
    line.hidden = false;
    if (hint) hint.style.display = 'none';
    b2bRecalc();
  });

  /* step 2: remove a row / add another row */
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('.js-b2b-rm');
    if (rm) {
      var row = rm.closest('.js-b2b-row');
      if (row && row.parentElement) row.parentElement.removeChild(row);
      b2bRecalc();
      return;
    }
    var add = e.target.closest('.js-b2b-add');
    if (!add) return;
    var c = $('#b2bRows');
    if (!c) return;
    if (c.querySelectorAll('.js-b2b-row').length >= 8) {
      toast('That\u2019s a lot of lines \u2014 for bigger mixes call +65 9628 1037.');
      return;
    }
    var tmp = document.createElement('div');
    tmp.innerHTML = b2bRowHTML();
    while (tmp.firstChild) c.appendChild(tmp.firstChild);
    var sels = c.querySelectorAll('.js-b2b-sel');
    var last = sels[sels.length - 1];
    if (last) last.focus();
  });

  /* step 2: per-line decoration method + conditional fields */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.js-b2b-deco');
    if (!chip) return;
    var line = chip.closest('.js-b2b-line');
    if (!line) return;
    $$('.js-b2b-deco', line).forEach(function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    var method = chip.getAttribute('data-method');
    var wrap = $('.js-dp-wrap', line);
    if (wrap) wrap.innerHTML = B2B_PARAM_HTML[method] || '';
    b2bRecalc();
  });

  /* live diagrams: embroidery placement + iron-on transfer size */
  document.addEventListener('change', function (e) {
    var place = e.target.closest('select[data-param="placement"]');
    if (place) {
      var lp = place.closest('.js-b2b-line');
      var box = lp && $('.js-diag-place', lp);
      if (box) box.innerHTML = b2bPlaceDiag(place.value);
      return;
    }
    var iron = e.target.closest('select[data-param="transfer"]');
    if (iron) {
      var li = iron.closest('.js-b2b-line');
      var box2 = li && $('.js-diag-iron', li);
      if (box2) box2.innerHTML = b2bIronDiag(iron.value);
    }
  });

  /* thread colour swatches (Embroidery) */
  document.addEventListener('click', function (e) {
    var c = e.target.closest('.b2b-colour');
    if (!c) return;
    var grp = c.closest('[data-param="thread"]');
    if (!grp) return;
    $$('.b2b-colour', grp).forEach(function (x) {
      var on = x === c;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
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

  /* artwork upload — client-side only (file name is carried in the demo payload) */
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'artFile') return;
    var f = e.target.files && e.target.files[0];
    b2bArtName = f ? f.name : '';
    var t = $('#artName');
    if (t) t.textContent = f ? 'File ready: ' + f.name + ' \u2014 demo only, nothing is uploaded.' : 'No file chosen.';
  });

  /* payload builders — structured to mirror a Shopify Draft Order (PRD §10); demo only, nothing is sent */
  function b2bParams(line) {
    var out = {};
    $$('[data-param]', line).forEach(function (f) {
      var key = f.getAttribute('data-param');
      if (!key) return;
      if (f.tagName === 'SELECT') { out[key] = f.value; return; }
      var on = $('.is-on', f);
      out[key] = on ? (on.getAttribute('data-col') || on.textContent.trim()) : '';
    });
    return out;
  }
  function b2bSizesByLine(line) {
    var by = {};
    $$('.szq', line).forEach(function (sz) {
      var lbl = $('.szq-lbl', sz);
      var out = $('.qty-row output', sz);
      var q = parseInt(out && out.value, 10) || 0;
      if (lbl && q > 0) by[lbl.textContent.trim()] = q;
    });
    return by;
  }
  function b2bPayload() {
    var type = b2bType();
    var lines = visibleLines().filter(function (t) { return t.qty > 0; }).map(function (t) {
      return {
        name: t.name,
        unitPrice: t.unit,
        qty: t.qty,
        sizes: b2bSizesByLine(t.line),
        decoration: { method: t.method, addOnPerUnit: t.decoAdd },
        decorationParams: b2bParams(t.line),
        lineTotal: +(t.sub + t.deco).toFixed(2)
      };
    });
    var totalQty = lines.reduce(function (s, t) { return s + t.qty; }, 0);
    var subtotal = lines.reduce(function (s, t) { return s + t.unitPrice * t.qty; }, 0);
    var deco = lines.reduce(function (s, t) { return s + t.decoration.addOnPerUnit * t.qty; }, 0);
    var tier = totalQty >= 10 ? (TIERS.find(function (x) { return totalQty >= x.min && totalQty <= x.max; }) || null) : null;
    var custom = tier && tier.disc === null;
    var disc = tier && !custom ? tier.disc : 0;
    var ship = (($('input[name="shipOpt"]:checked') || {}).value) || 'single';
    /* val() is called with bare ids (e.g. 'b2bName'); $ is querySelector, so it needs the '#' prefix */
    function val(id) { var el = $(id.charAt(0) === '#' ? id : '#' + id); return el ? el.value.trim() : ''; }
    return {
      ref: 'ELQ-2026-' + Math.floor(1000 + Math.random() * 9000),
      submittedAt: new Date().toISOString(),
      type: type,
      deadline: val('b2bDate') || null,
      customer: {
        name: val('b2bName'),
        email: val('b2bEmail'),
        phone: val('b2bPhone'),
        company: val('b2bCompany'),
        uen: val('b2bUen'),
        po: val('b2bPo')
      },
      shipping: { mode: ship, splitLocations: ship === 'split' ? (val('splitN') || '') : null },
      artwork: b2bArtName || null,
      notes: val('b2bNotes'),
      items: lines,
      totals: {
        qty: totalQty,
        subtotal: +subtotal.toFixed(2),
        decoration: +deco.toFixed(2),
        tierDiscount: +Math.round(subtotal * disc * 100) / 100,
        custom: custom,
        estimatedTotal: custom ? null : +((subtotal + deco - subtotal * disc)).toFixed(2)
      }
    };
  }
  function b2bPrintHTML(p) {
    var date = new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
    var itemRows = p.items.map(function (it) {
      var sizes = Object.keys(it.sizes).map(function (s) { return s + ': ' + it.sizes[s]; }).join(', ') || '\u2014';
      var deco = it.decoration.method === 'Standard' ? '\u2014' : it.decoration.method +
        (it.decorationParams.placement ? ' \u00b7 ' + it.decorationParams.placement : '') +
        (it.decorationParams.thread ? ' \u00b7 ' + it.decorationParams.thread : '');
      return '<tr><td>' + esc(it.name) + '<br><span style="font-size:10.5px;color:#555">' + sizes + '</span></td>' +
        '<td class="right">' + it.qty + '</td><td>' + esc(deco) + '</td>' +
        '<td class="right">S$' + it.lineTotal.toFixed(2) + '</td></tr>';
    }).join('');
    function escT(s) { return esc(s || ''); }
    return '<h1>The Elly Store \u2014 B2B quote request (demo)</h1>' +
      '<div class="sub">Reference <b>' + escT(p.ref) + '</b> \u00b7 ' + date + ' \u00b7 ' + escT(p.type) + ' \u00b7 demo only \u2014 nothing was sent</div>' +
      '<table><tr class="meta"><td><b>Requested by</b><br>' + escT(p.customer.name) + (p.customer.company ? ', ' + escT(p.customer.company) : '') +
      '<br>' + escT(p.customer.email) + (p.customer.phone ? '<br>' + escT(p.customer.phone) : '') + '</td>' +
      '<td><b>Shipping</b><br>' + (p.shipping.mode === 'split' ? 'Split to ' + escT(p.shipping.splitLocations) + ' locations' : 'Single bulk shipment') +
      '<br>Deadline: ' + (p.deadline || 'not set') + '</td></tr></table>' +
      '<table><thead><tr><th>Item</th><th class="right">Qty</th><th>Decoration</th><th class="right">Line total</th></tr></thead><tbody>' + itemRows + '</tbody>' +
      '<tr class="tot"><td colspan="2">Total units \u00b7 ' + p.totals.qty + '</td><td class="right">Subtotal</td><td class="right">S$' + p.totals.subtotal.toFixed(2) + '</td></tr>' +
      '<tr class="tot"><td colspan="2"></td><td class="right">Decoration</td><td class="right">S$' + p.totals.decoration.toFixed(2) + '</td></tr>' +
      '<tr class="tot"><td colspan="2"></td><td class="right">Tier discount</td><td class="right">' + (p.totals.custom ? 'Custom quote' : '\u2013 S$' + p.totals.tierDiscount.toFixed(2)) + '</td></tr>' +
      '<tr class="tot"><td colspan="2"></td><td class="right">Estimated total</td><td class="right">' + (p.totals.custom ? 'Custom quote' : 'S$' + p.totals.estimatedTotal.toFixed(2)) + '</td></tr></table>' +
      (p.notes ? '<table><tr class="meta"><td><b>Quote notes</b><br>' + escT(p.notes) + '</td></tr></table>' : '') +
      '<div class="foot">Two-stage flow: instant estimate \u2192 team review within ~2 working days \u2192 confirmed checkout link emailed. Ready-stock + personalisation: up to 14 working days production. Samples/sales: +65 9628 1037. Prototype sheet \u2014 no live order was placed.</div>';
  }
  function b2bRenderPrint(p) {
    var el = $('#printQuote');
    if (el) el.innerHTML = b2bPrintHTML(p);
  }
  /* read-only echo of the confirmed draft (what the customer checks before Request/Download) */
  function b2bReviewHTML(p) {
    var cu = p.customer;
    function escT(s) { return esc(s || ''); }
    function kv(k, v) { return v ? '<dt>' + escT(k) + '</dt><dd>' + escT(v) + '</dd>' : ''; }
    var kvRows = kv('Name', cu.name) + kv('Company', cu.company) + kv('Email', cu.email) +
      kv('Phone / WhatsApp', cu.phone) + kv('UEN', cu.uen) + kv('PO number', cu.po);
    var ship = p.shipping.mode === 'split'
      ? 'Split to ' + escT(p.shipping.splitLocations || 'several') + ' locations'
      : 'Single bulk shipment';
    var lines = p.items.map(function (it) {
      var sizes = Object.keys(it.sizes).map(function (s) { return s + ' \u00d7 ' + it.sizes[s]; }).join(', ');
      var deco = it.decoration.method === 'Standard' ? '' : ' \u00b7 ' + esc(it.decoration.method);
      var ps = it.decorationParams || {};
      var pText = [ps.placement, ps.thread, ps.inks, ps.transfer].filter(Boolean);
      var meta = [];
      if (sizes) meta.push(sizes);
      if (pText.length) meta.push('Decoration: ' + pText.join(' \u00b7 '));
      return '<div class="rev-line"><div><b>' + esc(it.name) + '</b>' + deco +
        (meta.length ? '<div class="small muted" style="margin-top:2px">' + esc(meta.join(' \u2014 ')) + '</div>' : '') +
        '</div><div class="right"><b>\u00d7' + it.qty + '</b><div class="small muted">S$' + it.lineTotal.toFixed(2) + '</div></div></div>';
    }).join('') || '<div class="rev-line">No items with quantities yet</div>';
    var discCell = p.totals.custom ? 'Custom quote' : '\u2013 S$' + p.totals.tierDiscount.toFixed(2);
    var totCell = p.totals.custom ? 'Custom quote' : 'S$' + p.totals.estimatedTotal.toFixed(2);
    return '<div class="rev-grid">' +
      '<div class="rev-card"><h3>Requested by</h3><dl class="rev-kv">' + kvRows + '</dl></div>' +
      '<div class="rev-card"><h3>Order details</h3><dl class="rev-kv">' +
      kv('Order type', p.type) + kv('Event date / deadline', p.deadline || 'Not set') +
      kv('Shipping', ship) + kv('Artwork file', p.artwork || 'None uploaded') +
      '</dl></div>' +
      '<div class="rev-card rev-card--wide"><h3>Items &amp; estimate</h3>' + lines +
      '<div class="r"><span>Total units</span><b>' + p.totals.qty + '</b></div>' +
      '<div class="r"><span>Subtotal (list price)</span><b>S$' + p.totals.subtotal.toFixed(2) + '</b></div>' +
      '<div class="r"><span>Decoration add-on</span><b>S$' + p.totals.decoration.toFixed(2) + '</b></div>' +
      '<div class="r"><span>Tier discount</span><b class="disc">' + discCell + '</b></div>' +
      '<div class="r total"><span>Estimated total</span><span class="price">' + totCell + '</span></div>' +
      '</div>' +
      (p.notes ? '<div class="rev-card rev-card--wide"><h3>Quote notes</h3><p class="small" style="margin:0">' + escT(p.notes) + '</p></div>' : '') +
      '</div>';
  }
  function b2bRenderReview(p) {
    var el = $('#b2bReview');
    if (el) el.innerHTML = b2bReviewHTML(p);
  }
  /* gate to the Review & confirm step: quantities + MOQ + requester details must be valid.
     On success the draft is frozen and echoed back for the customer to confirm. */
  function b2bOpenReview() {
    b2bRecalc();
    var moq = b2bMoqStatus(visibleLines(), b2bType());
    if (!moq.ok) { toast(moq.msg); return; }
    var need = b2bRequester();
    if (need) { toast(need.msg); if (need.focus) need.focus.focus(); return; }
    var p = b2bPayload();
    p.ref = b2bNewRef();
    b2bDraft = p;
    b2bRenderReview(p);
    goStep(5);
  }

  /* requester details must be present — they fill the "Requested by" block on the quote sheet
     and (for request) route the confirmed quote. Checked when entering Review & confirm. */
  function b2bRequester() {
    var name = (($('#b2bName') || {}).value || '').trim();
    var email = (($('#b2bEmail') || {}).value || '').trim();
    if (!name) return { msg: 'Please add your full name so the quote shows who requested it.', focus: $('#b2bName') };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { msg: 'Please add a valid work email so we can send the confirmed quote.', focus: $('#b2bEmail') };
    if (b2bType() === 'Bulk / wholesale' && !((($('#b2bCompany') || {}).value || '').trim())) return { msg: 'Please add your company \u2014 required for wholesale.', focus: $('#b2bCompany') };
    return null;
  }

  /* two-stage close-out: review & confirm (freeze draft) → request quote → confirmation (PRD §10) */
  document.addEventListener('click', function (e) {
    var rvw = e.target.closest('.js-b2b-review');
    if (rvw) { b2bOpenReview(); return; }
    var req = e.target.closest('#b2bRequest');
    if (req) {
      if (!b2bDraft) b2bOpenReview(); /* defensive: the button lives on the review step */
      if (!b2bDraft) return;
      var p = b2bDraft;
      window.__b2bLastQuote = p;
      var ref = $('#b2bRef'); if (ref) ref.textContent = p.ref;
      var to = $('#b2bEmailTo'); if (to) to.textContent = p.customer.email;
      b2bRenderPrint(p);
      toast('Quote request received \u2014 <b>demo only</b>. No live order was placed.', true);
      goStep(6);
      var wiz = $('#b2bWizard');
      if (wiz && wiz.scrollIntoView) wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    var dl = e.target.closest('.js-b2b-download');
    if (dl) {
      if (!b2bDraft) { b2bOpenReview(); if (!b2bDraft) return; }
      b2bRenderPrint(b2bDraft);
      window.print();
      return;
    }
    var rs = e.target.closest('.js-b2b-reset');
    if (rs) {
      b2bResetRows();
      b2bDraft = null;
      var rv = $('#b2bReview'); if (rv) rv.innerHTML = '';
      var d = $('#b2bDate'); if (d) d.value = '';
      var rn = $('#rushNote'); if (rn) rn.hidden = true;
      var an = $('#artName'); if (an) an.textContent = 'No file chosen.';
      var f = $('#artFile'); if (f) f.value = '';
      b2bArtName = '';
      ['b2bName', 'b2bEmail', 'b2bPhone', 'b2bCompany', 'b2bUen', 'b2bPo', 'b2bNotes'].forEach(function (id) {
        var el = $(id); if (el) el.value = '';
      });
      var first = $('.otype'); if (first) first.click();
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
    b2bRecalc();
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
      '<span class="mega__kicker">' + p.label + '</span></div>' +
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
    'local-first': { kicker: 'Popular this week · demo', title: 'What Singapore families are shopping', sub: 'Newborn & baby-shower edits, sibling & twinning sets and sleepover favourites lead for local families.' },
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
    kicker: 'Customization', h1: 'Make it truly theirs',
    sub: 'Embroidered initials with placement & thread colour \u2014 or iron-on patches from a pre-set selection, on eligible items before you pay.',
    cta: 'Explore customization', ctaHref: 'customization.html',
    art: '\ud83e\uddf5', tag: 'Customization', a: '#efeafb', b: '#dcd2f5', c: '#c2b4ec',
    f1t: 'Embroidered or iron-on patches', f1v: 'top-level filter', f1c: 'var(--coral)',
    f2t: 'Initial + placement + thread', f2v: 'or pre-set patches', f2c: 'var(--blue)'
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
    'Make it truly theirs': { i: 'hero/hero-bomber.jpg', a: 'Embroidered varsity bomber from the Customization range' }
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
      'local-first': 'Hero: 4 rotating slides (event \u2192 trending \u2192 pre-order \u2192 customization) \u00b7 rail weighted to newborn, twinning, sleepover & siblings. Search = trending intents.',
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

  /* ---------- Search (wired): resolve intent-led phrases first, then keywords ----------
     Two modes against the product database (products.js):
     1) INTENT — the query (or a popular alias of it, e.g. "birthday present",
        "baby shower", "theme park vacation", "sleepover PJs") matches one of the
        intent-led categories in window.EL_INTENTS → every product tagged with that
        category is returned. Items live in multiple intents, so a category search
        surfaces the whole intent-led edit.
     2) KEYWORD — otherwise the query is tokenised and a product matches when EVERY
        token appears across its name, tags, characters, type, collection or colours. */
  function itemTagged(p, tag) {
    tag = String(tag).toLowerCase();
    var ints = (p.int || []).concat(p.occasion || []);
    for (var i = 0; i < ints.length; i++) {
      if (String(ints[i]).toLowerCase() === tag) return true;
    }
    return (p.tags || []).some(function (t) { return String(t).toLowerCase() === tag; });
  }
  /* longest matched phrase wins, so overlapping aliases resolve to the most
     specific intent ("birthday present" → Birthday, not Gifting's "present") */
  function searchProducts(q) {
    q = String(q).toLowerCase();
    var intents = (window.EL_INTENTS) || [];
    var matched = null, bestLen = 0;
    for (var i = 0; i < intents.length; i++) {
      var it = intents[i];
      var names = [String(it.label).toLowerCase()].concat((it.aliases || []).map(function (a) { return String(a).toLowerCase(); }));
      for (var j = 0; j < names.length; j++) {
        var n = names[j], len = -1;
        /* query contains the phrase — only for specific aliases (>= 4 chars) so
           short ones like "cat"/"dog"/"sg" don't fire inside unrelated words
           ("jellycat" is Jellycat plush, not the FurKids intent); short aliases
           still resolve via the reverse rule or keyword tags */
        if (q.indexOf(n) >= 0 && n.length >= 4) len = n.length;
        /* short query matching a whole word inside a phrase ("sg", "pjs", "cat")
           — word-boundary only, so "cat" never fires inside "va-cat-ion" */
        else if (q.length >= 2 && q.indexOf(' ') < 0 && (' ' + n + ' ').indexOf(' ' + q + ' ') >= 0) len = q.length;
        if (len > bestLen) { bestLen = len; matched = it; }
      }
    }
    if (matched) {
      var tags = matched.tags || [];
      var seen = {}, out = [];
      PRODUCTS.forEach(function (p) {
        var ok = tags.some(function (t) { return itemTagged(p, t); });
        if (ok && !seen[p.n]) { seen[p.n] = true; out.push(p); }
      });
      return { hits: out, intent: matched.label };
    }
    var tokens = q.split(/[^a-z0-9]+/).filter(Boolean);
    var hits = tokens.length ? PRODUCTS.filter(function (p) {
      return tokens.every(function (t) { return searchHaystack(p).indexOf(t) >= 0; });
    }) : [];
    return { hits: hits, intent: null };
  }

  /* every searchable token for a product (name + tags + characters + type +
     collection + colours) — used by keyword matching */
  function searchHaystack(p) {
    return ((p.n || '') + ' ' + (p.tags || []).join(' ') + ' ' +
      (p.characters || []).join(' ') + ' ' + (p.type || '') + ' ' +
      (p.collection || []).join(' ') + ' ' + (p.colours || []).join(' ')).toLowerCase();
  }

  /* high-signal fields for popularity ranking (names, tags, characters — skips
     facet noise like colours/type/collection labels) */
  function popularityHaystack(p) {
    return ((p.n || '') + ' ' + (p.tags || []).join(' ') + ' ' + (p.characters || []).join(' ')).toLowerCase();
  }

  /* "most searched" keywords: the highest-frequency searchable terms across the
     live catalog (how many products each keyword matches). Cached after first run. */
  var _popularKeywords = null;
  function popularKeywords(n) {
    n = n || 8;
    if (!_popularKeywords) {
      var counts = {};
      PRODUCTS.forEach(function (p) {
        var seen = {};
        popularityHaystack(p).split(/[^a-z0-9]+/).filter(Boolean).forEach(function (t) {
          if (t.length < 3 || POPULAR_STOP[t] || seen[t]) return;
          seen[t] = true;
          counts[t] = (counts[t] || 0) + 1;
        });
      });
      _popularKeywords = Object.keys(counts)
        .map(function (k) { return { k: k, n: counts[k] }; })
        .filter(function (o) { return o.n >= 3; })
        .sort(function (a, b) { return b.n - a.n || (a.k < b.k ? -1 : 1); });
    }
    return _popularKeywords.slice(0, n);
  }

  /* "most popular intent-led categories": every EL_INTENTS category ranked by how
     many products it returns (catalog size), with a small popularity bonus so the
     top picks read naturally. */
  var _popularIntents = null;
  function popularIntents(n) {
    n = n || 7;
    if (!_popularIntents) {
      _popularIntents = ((window.EL_INTENTS) || []).map(function (it) {
        var c = 0, seen = {};
        PRODUCTS.forEach(function (p) {
          var ok = (it.tags || []).some(function (t) { return itemTagged(p, t); });
          if (ok && !seen[p.n]) { seen[p.n] = true; c++; }
        });
        return { key: it.key, label: it.label, count: c };
      }).sort(function (a, b) { return b.count - a.count || (a.key < b.key ? -1 : 1); });
    }
    return _popularIntents.slice(0, n);
  }

  function runSearch(q) {
    q = String(q).trim();
    if (!q) { resetSearchResults(); return; }
    rememberRecent(q);
    var idle = $('.search-idle'), res = $('#searchResults');
    if (idle) idle.style.display = 'none';
    if (res) {
      /* explicit 'grid' — the stylesheet default for .search-results is
         display:none, so clearing the inline style would keep it hidden */
      res.style.display = 'grid';
      var grid = $('#resultGrid');
      var r = searchProducts(q);
      var hits = r.hits;
      if (grid) {
        grid.innerHTML = hits.length
          ? hits.slice(0, 8).map(productCard).join('')
          : fillFrom(pickPool([{ k: 'elly' }, { k: 'disney' }, { k: 'gift' }]), 8, 0).map(productCard).join('');
      }
      var count = $('#resultCount');
      if (count) {
        if (hits.length) {
          count.textContent = (r.intent ? r.intent + ' \u00b7 ' : '') + hits.length + ' match' + (hits.length > 1 ? 'es' : '') + ' for \u201c' + q + '\u201d \u2014 ' + (r.intent ? 'intent-led' : 'keywords & tags') + ' from the product database';
        } else {
          count.textContent = '0 products match \u201c' + q + '\u201d \u2014 showing popular picks instead';
        }
      }
    }
  }

  /* ---------- PDP + cart demo lines get real products ---------- */
  function productByName(name) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].n === name) return PRODUCTS[i];
    return null;
  }

  /* ---------- Interactive personalisation configurator (PRD §5.3 · §8 #5) ----------
     Runs on the PDP for products tagged personalisable (prod.custom). Two methods,
     matching the live store: embroidered (initials + placement + thread colour + font
     type + font size + language — EN / JP / KR, for baby & kids clothing) and iron-on
     patches (up to 3 free, picked from the product's range — Disney patches for Disney
     products, non-Disney patches otherwise — each on a pre-selected spot). A product
     may offer both or only one. One interface, two views: customer self-serve and
     staff/POS (unified per PRD §5.3). */
  var CUSTOM_PLACEMENTS = {
    'left chest':       { label: 'Left chest',       max: 10, x: '24%', y: '31%', w: '32%' },
    'full back':        { label: 'Full back',        max: 14, x: '50%', y: '42%', w: '46%' },
    'sleeve / cuff':    { label: 'Sleeve / cuff',    max: 8,  x: '52%', y: '74%', w: '32%' },
    'front':            { label: 'Front centre',     max: 10, x: '50%', y: '50%', w: '42%' },
    'corner':           { label: 'Blanket corner',   max: 12, x: '24%', y: '78%', w: '44%' },
    'hood':             { label: 'Hood',             max: 8,  x: '50%', y: '12%', w: '34%' },
    'keepsake box lid': { label: 'Keepsake box lid', max: 12, x: '50%', y: '46%', w: '50%' }
  };
  var CUSTOM_COLOURS = [
    { name: 'Cream', hex: '#f2e8d5' }, { name: 'Coral', hex: '#ff6070' }, { name: 'Navy', hex: '#30346f' },
    { name: 'Gold', hex: '#c9a227' }, { name: 'White', hex: '#ffffff' }, { name: 'Black', hex: '#1d1d1d' }
  ];
  /* embroidery: a curated set of calligraphy fonts — cursive scripts and
     non-cursive display faces chosen to look like a gift tag / keepsake
     (PRD §5.3 — embroidered service for baby & kids clothing: initials +
     thread + font + size + language). The default stays on 'serif'. */
  var CUSTOM_FONTS = [
    { id: 'script',  label: 'Elegant Script',   family: "'Great Vibes', cursive" },
    { id: 'script2', label: 'Light Script',     family: "'Parisienne', cursive" },
    { id: 'serif',   label: 'Graceful Serif',   family: "'Cormorant Garamond', serif" },
    { id: 'caps',    label: 'Calligraphy Caps', family: "'Cinzel', serif" }
  ];
  var CUSTOM_FONT_SIZES = [
    { id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }
  ];
  var CUSTOM_LANGS = [
    { id: 'en', label: 'English', placeholder: 'e.g. Amelia' },
    { id: 'jp', label: '日本語',   placeholder: '例： あみ' },
    { id: 'kr', label: '한국어',   placeholder: '예: 미나' }
  ];
  /* iron-on patches: each design carries a pre-selected location (spot) on the
     garment — pick up to 3 free; Disney ranges for Disney products, non-Disney
     (SG) ranges for everything else (PRD §5.3) */
  var CUSTOM_PATCH_SETS = {
    sg: {
      label: 'Singapore designs',
      note: 'non-Disney iron-on patches in pre-set spots on the tee (chest, sleeves, hem)',
      patches: [
        { id: 'kopi',   name: 'Team Kopi',                    hex: '#7b4a2d', spot: 0 },
        { id: 'teh',    name: 'Team Teh',                     hex: '#c9a227', spot: 2 },
        { id: 'milo',   name: 'StyloMilo',                    hex: '#6b4423', spot: 3 },
        { id: 'chilli', name: 'Chilli Crab Hero',             hex: '#e14b3b', spot: 4 },
        { id: 'break',  name: 'Breakfast Legends',            hex: '#d98a3f', spot: 5 },
        { id: 'durian', name: 'Durian King',                  hex: '#a67c00', spot: 1 },
        { id: 'kiasu',  name: 'Kiasu Spirit',                 hex: '#3f7fbf', spot: 6 },
        { id: 'slide',  name: 'Slide First, Homework Later!',  hex: '#7a9e4d', spot: 7 },
        { id: 'tissue', name: 'Tissue Warriors',              hex: '#b56576', spot: 8 }
      ]
    },
    disney: {
      label: 'Disney vinyls',
      note: 'Disney-only iron-on vinyl patches in pre-set spots on the tee (chest, sleeves, hem)',
      /* real patch artwork (from the Baseball Tee - Pop Mickey product page) so the
         chosen character renders as the actual vinyl patch on the Live Look */
      patches: [
        { id: 'mickey', name: 'Pop Mickey', hex: '#e14b3b', spot: 0, img: 'assets/images/patches/pop-mickey.webp' },
        { id: 'minnie', name: 'Pop Minnie', hex: '#ff6f91', spot: 2, img: 'assets/images/patches/pop-minnie.webp' },
        { id: 'donald', name: 'Pop Donald', hex: '#3f7fbf', spot: 3, img: 'assets/images/patches/pop-donald.webp' },
        { id: 'daisy',  name: 'Pop Daisy',  hex: '#c9a227', spot: 4, img: 'assets/images/patches/pop-daisy.webp' },
        { id: 'pluto',  name: 'Pop Pluto',  hex: '#8a6d3b', spot: 8, img: 'assets/images/patches/pop-pluto.webp' },
        { id: 'goofy',  name: 'Pop Goofy',  hex: '#7a9e4d', spot: 5, img: 'assets/images/patches/pop-goofy.webp' }
      ]
    }
  };
  var CFG_METHOD_LABELS = { embroidered: 'Embroidered', patches: 'Iron-on patches' };
  var CFG = { prod: null, method: '', placement: '', text: '', colourName: 'Coral', colourHex: '#ff6070', patches: [], font: 'serif', fontSize: 'md', language: 'en', open: false };
  /* pre-selected patch locations on a tee-shaped garment */
  var PATCH_SPOTS = [
    { x: '24%', y: '32%', loc: 'left chest' },
    { x: '50%', y: '32%', loc: 'front chest' },
    { x: '74%', y: '32%', loc: 'right chest' },
    { x: '10%', y: '58%', loc: 'left sleeve' },
    { x: '90%', y: '58%', loc: 'right sleeve' },
    { x: '50%', y: '47%', loc: 'front centre' },
    { x: '36%', y: '70%', loc: 'lower left' },
    { x: '64%', y: '70%', loc: 'lower right' },
    { x: '50%', y: '80%', loc: 'hem' }
  ];

  /* ---------- Live Look stage (PRD §5.3) ----------
     The real product photos are often shot at an angle or as lifestyle shots, so
     text overlaid on them can't look truly embroidered. For customisable items the
     PDP therefore renders a SECOND, larger image below the main one: a flat,
     horizontally-aligned front / top view of the item, drawn in the item's own
     colours and design hints, with the personalisation (initials / patches) laid
     onto that flat surface — so type comes out level, never slanted.

     Each blueprint: art(viewBox 400×400) + placements (x/y/w in % of the art box,
     where the embroidery lands for that product's placement options) + label. */
  var LIVELOOK_DATA = {
    /* ---------- tees (front view, flat-lay) ---------- */
    tee: {
      label: 'Front view \u00b7 flat lay',
      placements: { 'left chest': { x: 33, y: 30, w: 24 }, 'front': { x: 50, y: 34, w: 42 }, 'sleeve / cuff': { x: 24, y: 33, w: 13 } },
      art: {
        bg: '#f6efe3', fill: '#ffffff', shade: '#e9e2d4', trim: '#e5dccb',
        body: 'M138 74 L78 100 88 156 104 162 104 330 a10 10 0 0 0 10 10 L286 340 a10 10 0 0 0 10 -10 L296 162 312 156 322 100 262 74 Z',
        neck: 'M138 74 C138 100 158 116 200 116 C242 116 262 100 262 74',
        sleeves: ['M138 74 L78 100 88 156 120 148 120 108 Z', 'M262 74 L322 100 312 156 280 148 280 108 Z'],
        decor: function (p) { return p && p.characters && p.characters.indexOf('Mickey') >= 0
          ? '<circle cx="200" cy="196" r="15" fill="none" stroke="#d9cfc0" stroke-width="5"/><circle cx="188" cy="182" r="6" fill="#d9cfc0"/><circle cx="212" cy="182" r="6" fill="#d9cfc0"/>'
          : '<rect x="168" y="176" width="64" height="44" rx="6" fill="none" stroke="#d9cfc0" stroke-width="4"/>'; }
      }
    },
    /* ---------- overalls (front view) ---------- */
    overalls: {
      label: 'Front view \u00b7 flat lay',
      placements: { 'left chest': { x: 40, y: 26, w: 22 }, 'sleeve / cuff': { x: 30, y: 55, w: 14 } },
      art: {
        bg: '#f2ece0', fill: '#bfe0e6', shade: '#a8cfd6', trim: '#8fb9c2',
        body: 'M148 62 L138 118 130 332 a10 10 0 0 0 10 10 L260 342 a10 10 0 0 0 10 -10 L262 118 252 62 Z',
        neck: 'M148 62 L188 96 L200 84 L212 96 L252 62',
        sleeves: ['M138 70 L112 240 128 244 146 128 Z', 'M262 70 L288 240 272 244 254 128 Z'],
        buttons: [[166, 130], [234, 130]],
        pocket: 'M176 210 L224 210 L224 252 L176 252 Z'
      }
    },
    /* ---------- blankets / swaddles (top view, flat) ---------- */
    blanket: {
      label: 'Top view \u00b7 laid flat',
      placements: { 'corner': { x: 22, y: 78, w: 40 }, 'front': { x: 50, y: 52, w: 40 } },
      art: {
        bg: '#f6efe3', fill: '#f3ecdf', shade: '#e7dcc7', trim: '#d9cdb5', scallop: true,
        body: 'M62 70 L338 70 L338 330 L62 330 Z',
        decor: function (p) {
          var dots = '';
          for (var r = 0; r < 3; r++) for (var c = 0; c < 5; c++) {
            dots += '<circle cx="' + (130 + c * 36) + '" cy="' + (140 + r * 44) + '" r="5" fill="#d9cdb5" opacity=".7"/>';
          }
          return dots;
        }
      }
    },
    /* ---------- keepsake / gift boxes (top view, lid facing up) ---------- */
    box: {
      label: 'Top view \u00b7 lid facing up',
      placements: { 'keepsake box lid': { x: 50, y: 50, w: 52 }, 'front': { x: 50, y: 55, w: 44 } },
      art: {
        bg: '#f2ece0', fill: '#f7f1e5', shade: '#e4d8c2', trim: '#c9a227',
        body: 'M78 92 L322 92 L322 308 L78 308 Z',
        inner: 'M96 110 L304 110 L304 290 L96 290 Z',
        ribbonH: 'M78 186 L322 186', ribbonV: 'M200 92 L200 308'
      }
    },
    /* ---------- hooded robe (front view, hood up) ---------- */
    robe: {
      label: 'Front view \u00b7 hood up',
      placements: { 'hood': { x: 50, y: 16, w: 30 }, 'front': { x: 50, y: 42, w: 38 } },
      art: {
        bg: '#f6efe3', fill: '#dceaf7', shade: '#c7daee', trim: '#aec6de',
        body: 'M150 118 L96 146 102 200 122 204 122 330 a10 10 0 0 0 10 10 L268 340 a10 10 0 0 0 10 -10 L278 204 298 200 304 146 250 118 Z',
        neck: 'M150 118 C150 150 168 172 200 172 C232 172 250 150 250 118',
        hood: 'M150 118 C128 62 156 34 200 34 C244 34 272 62 250 118 C238 136 226 146 200 146 C174 146 162 136 150 118 Z',
        belt: 'M122 236 L278 236'
      }
    },
    /* ---------- beanie (front view, cuff up) ---------- */
    beanie: {
      label: 'Front view',
      placements: { 'front': { x: 50, y: 46, w: 40 } },
      art: {
        bg: '#f2ece0', fill: '#f1e6d6', shade: '#e0d2bd', trim: '#e8dccb',
        body: 'M110 250 C110 130 150 84 200 84 C250 84 290 130 290 250 Z',
        cuff: 'M104 250 L296 250 L296 306 a10 10 0 0 1 -10 10 L114 316 a10 10 0 0 1 -10 -10 Z',
        pompom: true
      }
    }
  };
  /* real product photos used as the Live Look stage (instead of the schematic
     flat view) for items where the studio shot is a straight-on front / top
     view. src is the local copy; aspect is the photo's intrinsic ratio so the
     wrap matches it and the overlay % coords map onto the real item. */
  var LIVELOOK_PHOTOS = {
    'gift-10':   { src: 'assets/images/livelook-gift-10.jpg',    aspect: '1 / 1', label: 'Product photo \u00b7 top view', placements: { 'keepsake box lid': { x: 50, y: 50, w: 52 } } },
    /* -v2: the user's updated studio shot (replaced in place earlier, which stale-cached
       the old photo — a fresh filename forces the new image through caches) */
    'gift-3':    { src: 'assets/images/livelook-gift-3-v2.jpg',  aspect: '2 / 3', label: 'Product photo \u00b7 front view', placements: { 'front': { x: 50, y: 50, w: 36 } } },
    'disney-1':  {
      /* default surface is the Left chest studio shot; only choosing the
         sleeve / cuff placement swaps to the sleeve photo */
      src: 'assets/images/livelook-disney-1-leftchest.png', aspect: '1664 / 928', label: 'Product photo \u00b7 left chest',
      placements: {
        'left chest':   { src: 'assets/images/livelook-disney-1-leftchest.png', aspect: '1664 / 928', label: 'Product photo \u00b7 left chest', x: 45, y: 25, w: 15 },
        'sleeve / cuff': { src: 'assets/images/livelook-disney-1-sleeve.png',    aspect: '1664 / 928', label: 'Product photo \u00b7 sleeve',      x: 70, y: 43, w: 11 }
      }
    }
  };
  /* item id -> Live Look blueprint (personalisable items only; default by product type) */
  var LIVELOOK_BY_ID = {
    'disney-1': 'tee', 'elly-16': 'tee', 'adult-4': 'tee',
    'elly-21': 'overalls',
    'elly-4': 'blanket', 'elly-5': 'blanket',
    'gift-1': 'box', 'gift-10': 'box',
    'disney-9': 'robe',
    'custom-1': 'beanie', 'custom-2': 'beanie', 'custom-3': 'beanie', 'custom-4': 'beanie'
  };
  function cfgLivelookKey(prod) {
    if (!prod) return '';
    if (LIVELOOK_BY_ID[prod.id]) return LIVELOOK_BY_ID[prod.id];
    return ({ 'Tops & tees': 'tee', 'Bottoms & shorts': 'overalls', 'Blankets & swaddles': 'blanket', 'Keepsake box': 'box', 'Gift set': 'box', 'Swimwear': 'robe', 'Accessories': 'beanie' })[prod.type] || '';
  }
  /* colours / decor overrides for specific variants so the flat view matches the
     real item's colourway (pink beanie, navy beanie, grey beanie, aqua box…) */
  var LIVELOOK_VARIANTS = {
    'custom-1': { art: { fill: '#f1e6d6', shade: '#e0d2bd' } },
    'custom-2': { art: { fill: '#2f3a68', shade: '#26305a' } },
    'custom-3': { art: { fill: '#9b9b9b', shade: '#878787' } },
    'custom-4': { art: { fill: '#f6c7cf', shade: '#e9b0bc' } },
    'gift-10':  { art: { fill: '#bfe0e6', shade: '#a8cfd6', trim: '#7fa8b2' } },
    'elly-16':  { art: { fill: '#fdf6f0', shade: '#f0e4d8', decor: null } }
  };
  function cfgLivelookArt(prod, key) {
    var bp = LIVELOOK_DATA[key];
    if (!bp) return null;
    var base = {};
    Object.keys(bp.art).forEach(function (k) { base[k] = bp.art[k]; });
    var v = LIVELOOK_VARIANTS[prod && prod.id];
    if (v && v.art) Object.keys(v.art).forEach(function (k) { base[k] = v.art[k]; });
    return base;
  }
  /* one blueprint covers per-placement spots; pick the coordinate set for a placement.
     Photo-backed items (LIVELOOK_PHOTOS) carry their own placement coords, tuned to
     where the embroidery sits on the real photo. */
  function cfgLivelookSpot(prod, key, placement) {
    var ph = prod && LIVELOOK_PHOTOS[prod.id];
    if (ph && ph.placements) return ph.placements[placement] || firstVal(ph.placements);
    var bp = LIVELOOK_DATA[key];
    if (!bp) return null;
    return bp.placements[placement] || bp.placements.front || bp.placements['keepsake box lid'] || firstVal(bp.placements);
  }
  function firstVal(o) { for (var k in o) if (o.hasOwnProperty(k)) return o[k]; return { x: 50, y: 50, w: 40 }; }
  /* PATCH_SPOTS (photo-style tee) translated onto the flat tee drawing */
  var FLAT_TEE_PATCH_SPOTS = {
    'left chest': { x: 40, y: 30 }, 'front chest': { x: 50, y: 30 }, 'right chest': { x: 60, y: 30 },
    'left sleeve': { x: 30, y: 42 }, 'right sleeve': { x: 70, y: 42 },
    'front centre': { x: 50, y: 55 },
    'lower left': { x: 35, y: 68 }, 'lower right': { x: 65, y: 68 }, 'hem': { x: 50, y: 92 }
  };
  /* every patch renders at the same width (as % of the Live Look), whichever
     spot is pre-set — consistent patch size across the garment */
  var PATCH_SPOT_W = 7;

  /* draw the flat front / top view of the item as an inline SVG (400×400) */
  function cfgLivelookSVG(prod, key) {
    var bp = LIVELOOK_DATA[key];
    var art = cfgLivelookArt(prod, key);
    if (!bp || !art) return '';
    var s = '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc((prod ? prod.n : 'Item') + ' \u2014 ' + bp.label) + '">';
    s += '<rect width="400" height="400" rx="14" fill="' + (art.bg || '#f6efe3') + '"/>';
    /* soft drop shadow under the item */
    s += '<ellipse cx="200" cy="352" rx="128" ry="16" fill="rgba(0,0,0,.07)"/>';
    if (art.sleeves) art.sleeves.forEach(function (d) { s += '<path d="' + d + '" fill="' + art.shade + '"/>'; });
    if (art.hood) s += '<path d="' + art.hood + '" fill="' + art.shade + '" stroke="' + art.trim + '" stroke-width="3"/>';
    s += '<path d="' + art.body + '" fill="' + art.fill + '" stroke="' + art.trim + '" stroke-width="3.5" stroke-linejoin="round"/>';
    if (art.neck) s += '<path d="' + art.neck + '" fill="none" stroke="' + art.trim + '" stroke-width="3.5" stroke-linecap="round"/>';
    if (art.inner) s += '<path d="' + art.inner + '" fill="none" stroke="' + art.shade + '" stroke-width="3"/>';
    if (art.ribbonH) s += '<path d="' + art.ribbonH + '" stroke="' + art.trim + '" stroke-width="14" opacity=".85"/>';
    if (art.ribbonV) s += '<path d="' + art.ribbonV + '" stroke="' + art.trim + '" stroke-width="14" opacity=".85"/>';
    if (art.scallop) {
      for (var i = 0; i < 11; i++) s += '<circle cx="' + (78 + i * 24.4) + '" cy="330" r="12" fill="none" stroke="' + art.trim + '" stroke-width="2.5" opacity=".8"/>';
    }
    if (art.buttons) art.buttons.forEach(function (b) { s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5" fill="' + art.trim + '"/>'; });
    if (art.pocket) s += '<path d="' + art.pocket + '" fill="none" stroke="' + art.shade + '" stroke-width="3"/>';
    if (art.belt) s += '<path d="' + art.belt + '" stroke="' + art.trim + '" stroke-width="8" opacity=".9"/>';
    if (art.pompom) s += '<circle cx="200" cy="72" r="17" fill="' + art.shade + '" stroke="' + art.trim + '" stroke-width="3"/>';
    if (art.decor) s += (typeof art.decor === 'function' ? art.decor(prod) : art.decor);
    s += '</svg>';
    return s;
  }

  function cfgEligible(prod) { return !!(prod && prod.custom && prod.custom.methods && prod.custom.methods.length); }
  function cfgPlacementCfg(key) { return CUSTOM_PLACEMENTS[key] || { label: key, max: 10, x: '50%', y: '50%', w: '40%' }; }
  function cfgPatchSet() { return CUSTOM_PATCH_SETS[(CFG.prod && CFG.prod.custom && CFG.prod.custom.patchSet) || 'sg'] || CUSTOM_PATCH_SETS.sg; }
  function cfgPatchCount() { return (CFG.prod && CFG.prod.custom && CFG.prod.custom.patchCount) || 3; }
  function cfgPatchById(id) {
    var set = cfgPatchSet();
    for (var i = 0; i < set.patches.length; i++) if (set.patches[i].id === id) return set.patches[i];
    return null;
  }
  function cfgPatchSpot(id) {
    var p = cfgPatchById(id);
    var s = PATCH_SPOTS[(p && p.spot != null) ? p.spot : 0];
    return s || PATCH_SPOTS[0];
  }
  function cfgFontById(id) {
    for (var i = 0; i < CUSTOM_FONTS.length; i++) if (CUSTOM_FONTS[i].id === id) return CUSTOM_FONTS[i];
    return CUSTOM_FONTS[0];
  }
  function cfgSizeById(id) {
    for (var i = 0; i < CUSTOM_FONT_SIZES.length; i++) if (CUSTOM_FONT_SIZES[i].id === id) return CUSTOM_FONT_SIZES[i];
    return CUSTOM_FONT_SIZES[1];
  }
  function cfgLangById(id) {
    for (var i = 0; i < CUSTOM_LANGS.length; i++) if (CUSTOM_LANGS[i].id === id) return CUSTOM_LANGS[i];
    return CUSTOM_LANGS[0];
  }
  /* non-Latin scripts get a tighter limit — native characters are wider in thread */
  function cfgLangMax(max) {
    return CFG.language === 'en' ? max : Math.min(max || 8, 8);
  }
  function cfgSummaryText() {
    var parts = [];
    if (CFG.method) parts.push(CFG_METHOD_LABELS[CFG.method] || CFG.method);
    if (CFG.method === 'patches') {
      if (CFG.patches.length) {
        parts.push(CFG.patches.map(function (id) {
          var p = cfgPatchById(id);
          return p ? p.name + ' (' + cfgPatchSpot(id).loc + ')' : id;
        }).join(' + '));
      }
    } else {
      if (CFG.text) parts.push("'" + CFG.text + "'");
      if (CFG.placement) parts.push(cfgPlacementCfg(CFG.placement).label);
      if (CFG.colourName) parts.push(CFG.colourName + ' thread');
      parts.push(cfgFontById(CFG.font).label);
      parts.push(cfgSizeById(CFG.fontSize).label);
      if (CFG.language !== 'en') parts.push(cfgLangById(CFG.language).label);
    }
    return parts.join(' \u00b7 ');
  }

  /* ---------- Live Look stage (large, below the main image) ----------
     For customisable items the PDP shows a second, larger image under the main
     photo: a flat, horizontally-aligned front / top view of the item drawn in its
     own colourway, with the chosen personalisation laid onto the flat surface —
     so initials come out level and realistic instead of warped onto an angled
     photo. A caption names the view; a corner tag says it's a rendering. */
  function cfgLivelookStage() {
    var stage = $('#livelookStage');
    if (!stage) return;
    var prod = CFG.prod;
    var key = cfgLivelookKey(prod);
    if (!key) { stage.hidden = true; return; }
    stage.hidden = false;
    cfgRenderPreview();
  }

  /* embroidery / patches laid onto the flat Live Look surface */
  function cfgRenderPreview() {
    var stage = $('#livelookStage');
    var wrap = $('#livelookArtWrap');
    if (!stage || !wrap) return;
    var key = cfgLivelookKey(CFG.prod);
    if (!key) return;
    var method = CFG.method || ((CFG.prod && CFG.prod.custom && CFG.prod.custom.methods || [])[0] || '');
    var ph = CFG.prod && LIVELOOK_PHOTOS[CFG.prod.id];
    /* per-placement studio shots: embroidered mode swaps the surface photo to the
       one for the chosen placement (e.g. Kids Tee - Doodle Mickey); patches and
       no-placement fall back to the default photo */
    var phEntry = ph;
    if (ph && ph.placements && method === 'embroidered' && CFG.placement && ph.placements[CFG.placement]) {
      var pl = ph.placements[CFG.placement];
      /* per-placement entries may only carry x/y/w (gift-3, gift-10) — inherit
         the product photo src/aspect/label so the surface image doesn't vanish;
         entries with their own src (disney-1 sleeve) keep theirs */
      phEntry = { src: pl.src || ph.src, aspect: pl.aspect || ph.aspect, label: pl.label || ph.label, x: pl.x, y: pl.y, w: pl.w };
    }
    /* caption: view chip names the photo matching the chosen placement + item name */
    var bp = LIVELOOK_DATA[key];
    var cap = stage.querySelector('.livelook__caption');
    if (cap) cap.innerHTML = '<span class="livelook__view">' + esc(phEntry ? phEntry.label : bp.label) + '</span><span class="livelook__name">' + esc(CFG.prod ? CFG.prod.n : '') + '</span>';
    var art;
    if (phEntry) {
      /* real studio photo as the Live Look surface; wrap aspect matches the photo
         so the overlay % coords land on the actual item in the frame */
      art = '<img class="livelook__photo" src="' + esc(phEntry.src) + '" alt="' + esc(CFG.prod.n) + '">';
      wrap.style.aspectRatio = phEntry.aspect;
    } else {
      art = cfgLivelookSVG(CFG.prod, key);
      wrap.style.aspectRatio = '';
    }
    if (wrap.dataset.art !== art) {
      wrap.innerHTML = art + '<div class="livelook__overlay" id="livelookOverlay"></div>';
      wrap.dataset.art = art;
    }
    var ov = $('#livelookOverlay');
    if (!ov) return;
    var spots = [];
    if (method === 'patches') {
      /* every picked patch lands on its pre-set spot, translated onto the flat tee */
      CFG.patches.forEach(function (id) {
        var p = cfgPatchById(id);
        if (!p) return;
        var teeSpot = cfgPatchSpot(id);
        var flat = FLAT_TEE_PATCH_SPOTS[teeSpot.loc] || { x: 50, y: 40 };
        spots.push({
          x: flat.x, y: flat.y,
          label: p.name, sub: teeSpot.loc, hex: p.hex,
          img: p.img || '', w: PATCH_SPOT_W
        });
      });
    } else if (CFG.placement && CFG.text) {
      var spot = cfgLivelookSpot(CFG.prod, key, CFG.placement);
      var font = cfgFontById(CFG.font);
      var native = CFG.language !== 'en';
      /* the initials render exactly as typed — the customer decides the case */
      spots.push({
        x: spot.x, y: spot.y, w: spot.w,
        text: CFG.text, family: font.family, colour: CFG.colourHex,
        size: CFG.fontSize, native: native,
        sub: cfgPlacementCfg(CFG.placement).label + ' \u00b7 ' + CFG.colourName + ' thread'
      });
    }
    if (!spots.length) {
      /* nothing personalised yet — show the placement hint on the flat view */
      var hint = method === 'patches'
        ? 'Pick up to ' + cfgPatchCount() + ' patches — each lands on its pre-set spot on the flat view.'
        : (CFG.placement ? cfgPlacementCfg(CFG.placement).label + ' \u2014 type a name or initials to see it here.' : 'Pick a placement, then type a name or initials.');
      ov.innerHTML = '<span class="livelook__hint">' + esc(hint) + '</span>';
      return;
    }
    ov.innerHTML = spots.map(function (sp) {
      var inner;
      if (sp.text) {
        inner = '<span class="livelook__emb livelook__emb--' + sp.size + (sp.native ? ' livelook__emb--native' : '') + '" style="font-family:' + sp.family + ';color:' + sp.colour + '">' + esc(sp.text) + '</span>';
      } else if (sp.img) {
        /* real vinyl patch artwork overlaid at its pre-set spot */
        inner = '<img class="livelook__patchimg" src="' + esc(sp.img) + '" alt="' + esc(sp.label) + '">';
      } else {
        inner = '<span class="livelook__patch" style="--patchc:' + sp.hex + '">' + esc(sp.label) + '<em>' + esc(sp.sub) + '</em></span>';
      }
      return '<span class="livelook__spot" style="left:' + sp.x + '%;top:' + sp.y + '%' + ((sp.text || sp.img) ? ';width:' + sp.w + '%' : '') + '">' + inner + '</span>';
    }).join('');
  }

  /* the embroidery/patches themselves are rendered straight onto the Live Look
     stage below the gallery — no separate in-panel sample is shown */

  function cfgRefresh() {
    var isPatches = CFG.method === 'patches';
    var max = CFG.placement ? cfgLangMax(cfgPlacementCfg(CFG.placement).max) : 0;
    var input = $('#cfgText');
    if (input) {
      input.maxLength = max || 16;
      if (max && CFG.text.length > max) CFG.text = CFG.text.slice(0, max);
      if (input.value !== CFG.text) input.value = CFG.text;
      var lang = cfgLangById(CFG.language);
      input.placeholder = lang.placeholder;
    }
    var m = $('#cfgMethod'); if (m) m.textContent = CFG.method ? (CFG_METHOD_LABELS[CFG.method] || CFG.method) : '\u2014';
    var p = $('#cfgPlacement'); if (p) p.textContent = CFG.placement ? cfgPlacementCfg(CFG.placement).label : '\u2014';
    var ch = $('#cfgChars'); if (ch) ch.textContent = CFG.text.length + (max ? ' / ' + max : '');
    var c = $('#cfgColour'); if (c) c.textContent = (CFG.method === 'embroidered' && CFG.colourName) ? CFG.colourName : '\u2014';
    var f = $('#cfgFont'); if (f) f.textContent = (CFG.method === 'embroidered') ? cfgFontById(CFG.font).label : '\u2014';
    var sz = $('#cfgSize'); if (sz) sz.textContent = (CFG.method === 'embroidered') ? cfgSizeById(CFG.fontSize).label : '\u2014';
    var lg = $('#cfgLang'); if (lg) lg.textContent = (CFG.method === 'embroidered') ? cfgLangById(CFG.language).label : '\u2014';
    var placeWrap = $('#cfgPlaceWrap'); if (placeWrap) placeWrap.hidden = isPatches;
    var textWrap = $('#cfgTextWrap'); if (textWrap) textWrap.hidden = isPatches;
    var langWrap = $('#cfgLangWrap'); if (langWrap) langWrap.hidden = isPatches;
    var fontWrap = $('#cfgFontWrap'); if (fontWrap) fontWrap.hidden = isPatches;
    var sizeWrap = $('#cfgSizeWrap'); if (sizeWrap) sizeWrap.hidden = isPatches;
    var colours = $('#cfgColoursWrap'); if (colours) colours.hidden = isPatches;
    var patchWrap = $('#cfgPatchesWrap'); if (patchWrap) patchWrap.hidden = !isPatches;
    var th = $('#cfgTextHint');
    if (th) th.textContent = isPatches ? '' : (CFG.placement
      ? (CFG.language === 'en'
        ? (cfgPlacementCfg(CFG.placement).label + ' \u2014 up to ' + max + ' characters; type the letters exactly as you want them embroidered.')
        : cfgLangById(CFG.language).label + ' fits up to ' + max + ' characters \u2014 native script keeps its shape.')
      : 'Pick a placement first \u2014 the character limit depends on it.');
    var set = cfgPatchSet();
    var pcSel = $('#cfgPatchSel');
    if (pcSel) pcSel.textContent = CFG.patches.length ? CFG.patches.map(function (id) { var p = cfgPatchById(id); return p ? p.name : id; }).join(' + ') : '\u2014';
    var pcCount = $('#cfgPatchCount');
    if (pcCount) pcCount.textContent = CFG.patches.length + ' of ' + cfgPatchCount() + ' free';
    var ph = $('#cfgPatchHint');
    if (ph) ph.textContent = set.note + ' Pick up to ' + cfgPatchCount() + ' free \u2014 each patch goes to its pre-set spot on the tee.';
    var sum = $('#cfgSummary');
    if (sum) {
      var s = cfgSummaryText();
      sum.textContent = s ? 'Personalisation: ' + s + ' \u2014 the preview on the image updates live.' : 'Choose a method, then set the details to preview your personalisation here.';
    }
    cfgRenderPreview();
  }

  function cfgPickMethod(name) {
    CFG.method = name;
    $$('#cfgMethods .cfg-chip').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === name); });
    cfgRefresh();
  }
  function cfgPickPlacement(key) {
    CFG.placement = key;
    $$('#cfgPlacements .cfg-chip').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === key); });
    cfgRefresh();
  }
  function cfgPickColour(name, hex) {
    CFG.colourName = name; CFG.colourHex = hex;
    $$('#cfgColours .c-swatch').forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-c') === name); });
    cfgRefresh();
  }
  function cfgPickPatch(id) {
    var i = CFG.patches.indexOf(id);
    if (i >= 0) CFG.patches.splice(i, 1);
    else if (CFG.patches.length < cfgPatchCount()) CFG.patches.push(id);
    else { toast('You get up to ' + cfgPatchCount() + ' free patches \u2014 remove one to swap (demo).'); return; }
    $$('#cfgPatches .cfg-chip').forEach(function (b) { b.classList.toggle('is-on', CFG.patches.indexOf(b.getAttribute('data-v')) >= 0); });
    cfgRefresh();
  }
  function cfgPickFont(id) {
    CFG.font = id;
    $$('#cfgFonts .cfg-chip').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === id); });
    cfgRefresh();
  }
  function cfgPickSize(id) {
    CFG.fontSize = id;
    $$('#cfgSizes .cfg-chip').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === id); });
    cfgRefresh();
  }
  function cfgPickLang(id) {
    CFG.language = id;
    $$('#cfgLangs .cfg-chip').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === id); });
    cfgRefresh();
  }
  function cfgToggleLabel() {
    if (!CFG.prod || !CFG.prod.custom || !CFG.prod.custom.methods) return 'Add personalisation';
    var hasE = CFG.prod.custom.methods.indexOf('embroidered') >= 0;
    var hasP = CFG.prod.custom.methods.indexOf('patches') >= 0;
    if (hasE && hasP) return 'Add a name or patches';
    if (hasP) return 'Add iron-on patches';
    return 'Add a name / initials';
  }
  function setPersOpen(open) {
    CFG.open = open;
    var cfg = $('#configurator'), tog = $('#persToggle');
    if (cfg) cfg.hidden = !open;
    if (tog) tog.textContent = open ? 'Hide personalisation' : cfgToggleLabel();
  }

  function initConfigurator(prod) {
    CFG.prod = prod; CFG.method = ''; CFG.placement = ''; CFG.text = ''; CFG.colourName = 'Coral'; CFG.colourHex = '#ff6070'; CFG.patches = []; CFG.font = 'serif'; CFG.fontSize = 'md'; CFG.language = 'en'; CFG.open = false;
    var cfg = $('#configurator'), tog = $('#persToggle');
    var eligible = cfgEligible(prod);
    if (tog) tog.hidden = !eligible;
    if (cfg) cfg.hidden = true;
    if (!eligible) return;
    var mm = $('#cfgMethods');
    if (mm) mm.innerHTML = prod.custom.methods.map(function (mth) {
      return '<button type="button" class="cfg-chip" data-v="' + mth + '">' + (CFG_METHOD_LABELS[mth] || mth) + '</button>';
    }).join('');
    var pp = $('#cfgPlacements');
    if (pp) pp.innerHTML = (prod.custom.placements || []).map(function (pl) {
      return '<button type="button" class="cfg-chip" data-v="' + pl + '">' + cfgPlacementCfg(pl).label + '</button>';
    }).join('');
    var cc = $('#cfgColours');
    if (cc) cc.innerHTML = CUSTOM_COLOURS.map(function (col) {
      return '<button type="button" class="c-swatch' + (col.name === 'Coral' ? ' is-on' : '') + '" data-c="' + col.name + '" style="background:' + col.hex + '" aria-label="' + col.name + ' thread"></button>';
    }).join('');
    var pk = $('#cfgPatches');
    if (pk) pk.innerHTML = cfgPatchSet().patches.map(function (pt) {
      var spot = PATCH_SPOTS[(pt.spot != null) ? pt.spot : 0];
      /* tiles show the real patch artwork so the customer knows what they're
         picking before it appears on the Live Look; the colour dot is the
         fallback for sets without artwork */
      var tile = pt.img
        ? '<img class="cfg-patch-img" src="' + esc(pt.img) + '" alt="' + esc(pt.name) + '" loading="lazy">'
        : '<span class="cfg-patch-dot" style="background:' + pt.hex + '"></span>';
      return '<button type="button" class="cfg-chip cfg-patch" data-v="' + pt.id + '">' + tile + pt.name + '<em class="cfg-patch-loc">' + esc(spot.loc) + '</em></button>';
    }).join('');
    var ff = $('#cfgFonts');
    if (ff) ff.innerHTML = CUSTOM_FONTS.map(function (fo) {
      return '<button type="button" class="cfg-chip cfg-chip--font' + (fo.id === 'serif' ? ' is-on' : '') + '" data-v="' + fo.id + '" style="font-family:' + fo.family + '">' + fo.label + '</button>';
    }).join('');
    var ss = $('#cfgSizes');
    if (ss) ss.innerHTML = CUSTOM_FONT_SIZES.map(function (si) {
      return '<button type="button" class="cfg-chip' + (si.id === 'md' ? ' is-on' : '') + '" data-v="' + si.id + '">' + si.label + '</button>';
    }).join('');
    var ll = $('#cfgLangs');
    if (ll) ll.innerHTML = CUSTOM_LANGS.map(function (la) {
      return '<button type="button" class="cfg-chip' + (la.id === 'en' ? ' is-on' : '') + '" data-v="' + la.id + '">' + la.label + '</button>';
    }).join('');
    if (tog) tog.textContent = cfgToggleLabel();
    var input = $('#cfgText'); if (input) input.value = '';
    cfgLivelookStage();
    cfgPickMethod(prod.custom.methods.indexOf('embroidered') >= 0 ? 'embroidered' : prod.custom.methods[0]);
    try {
      if (new URLSearchParams(window.location.search).get('personalise') === '1') setPersOpen(true);
    } catch (e) {}
  }

  /* configurator interactions */
  document.addEventListener('click', function (e) {
    var tog = e.target.closest('.js-toggle-pers');
    if (tog) { setPersOpen(!CFG.open); return; }
    var mth = e.target.closest('#cfgMethods .cfg-chip');
    if (mth) { cfgPickMethod(mth.getAttribute('data-v')); return; }
    var pl = e.target.closest('#cfgPlacements .cfg-chip');
    if (pl) { cfgPickPlacement(pl.getAttribute('data-v')); return; }
    var sw = e.target.closest('#cfgColours .c-swatch');
    if (sw) {
      var col = CUSTOM_COLOURS.filter(function (c) { return c.name === sw.getAttribute('data-c'); })[0];
      if (col) cfgPickColour(col.name, col.hex);
      return;
    }
    var pch = e.target.closest('#cfgPatches .cfg-chip');
    if (pch) { cfgPickPatch(pch.getAttribute('data-v')); return; }
    var fo = e.target.closest('#cfgFonts .cfg-chip');
    if (fo) { cfgPickFont(fo.getAttribute('data-v')); return; }
    var si = e.target.closest('#cfgSizes .cfg-chip');
    if (si) { cfgPickSize(si.getAttribute('data-v')); return; }
    var la = e.target.closest('#cfgLangs .cfg-chip');
    if (la) { cfgPickLang(la.getAttribute('data-v')); return; }
    var vb = e.target.closest('#cfgViewSeg button[data-cfgview]');
    if (vb) {
      $$('#cfgViewSeg button').forEach(function (x) { x.classList.toggle('is-on', x === vb); });
      var note = $('#cfgStaffNote');
      if (note) note.hidden = vb.getAttribute('data-cfgview') !== 'staff';
      toast('Configurator view: <b>' + (vb.getAttribute('data-cfgview') === 'staff' ? 'Staff \u00b7 POS' : 'Customer') + '</b> \u2014 same interface, in-store capture on tablet/POS (demo)');
      return;
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'cfgText') {
      var max = CFG.placement ? cfgLangMax(cfgPlacementCfg(CFG.placement).max) : 16;
      CFG.text = String(e.target.value).slice(0, max);
      if (e.target.value !== CFG.text) e.target.value = CFG.text;
      cfgRefresh();
    }
  });

  /* product cards deep-link to the PDP (?p= resolves the catalog); ghost cards use a
     representative item so every listing page feeds a working PDP */
  var REP_PRODUCT = {
    elly: 'Overalls - Turquoise Vases',
    disney: 'Kids Tee - Doodle Mickey',
    gift: 'Deluxe Beginnings Keepsake Baby Gift Set',
    custom: 'Beary Personalisable Baby Gift Set',
    shoe: 'Jefferson Print Child Skyway Blue/ Shell White/ Twirling Horses'
  };
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.ph-card');
    if (!card || e.target.closest('.quick-add')) return;
    var q = card.getAttribute('data-p') || REP_PRODUCT[card.getAttribute('data-kind')];
    if (q) window.location.href = 'pdp.html?p=' + encodeURIComponent(q);
  });

  function populatePDP() {
    var pdp = $('.pdp');
    /* only run on a real product PDP: pages that reuse the .pdp layout shell but are
       not product pages (e.g. pre-order design gallery) must keep their own markup */
    if (!pdp || !$('#pdpTitle')) return;
    var prod = null;
    try {
      var q = new URLSearchParams(window.location.search).get('p');
      if (q) prod = PRODUCTS.filter(function (p) { return p.n.toLowerCase().indexOf(q.toLowerCase()) >= 0; })[0];
    } catch (e) {}
    if (!prod) prod = productByName('Beary Personalisable Baby Gift Set') || PRODUCTS[0];
    CURRENT_PDP = prod;
    var pillar = ({ elly: 'Elly Label', disney: 'Disney | elly', shoe: 'Shoes', gift: 'Gifting', custom: 'Customization' })[prod.k] || 'Elly Label';
    if (document.title) document.title = prod.n + ' | The Elly Store';
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
      main.innerHTML = '<div class="pdp__tags">' + (cfgEligible(prod) ? '<span class="badge badge--coral">Personalisable</span>' : '') + '</div>' +
        '<img class="pdp-img" src="' + esc(imgs[0]) + '" alt="' + esc(prod.n) + '">';
    }
    /* Live Look stage: a large, flat front / top view below the main photo — only
       for customisable items, where the initials/patches need a realistic surface */
    if (cfgEligible(prod)) {
      var gal = $('.pdp__gal');
      if (gal && !$('#livelookStage')) {
        /* NB: no data-bump here — the scroll-bump observer snapshots its elements
           at script-load, so a stage injected at DOMContentLoaded would never be
           observed and would stay at opacity 0. It shows immediately instead. */
        gal.insertAdjacentHTML('beforeend',
          '<figure class="livelook" id="livelookStage">' +
          '<div class="livelook__wrap" id="livelookArtWrap"></div>' +
          '<span class="livelook__tag">Rendered preview — final embroidery may vary slightly</span>' +
          '<figcaption class="livelook__caption"></figcaption>' +
          '</figure>');
      }
    }
    $$('.pdp__thumb').forEach(function (th, i) {
      var imgs = prod.imgs && prod.imgs.length ? prod.imgs : [prod.img];
      if (i < imgs.length) {
        th.classList.add('is-real');
        th.innerHTML = '<img src="' + esc(imgs[i]) + '" alt="Image ' + (i + 1) + '">';
      }
    });
    initConfigurator(prod);
  }

  /* Build the bag lines from the items actually added (elly-bag-items) — the header
     badge and the cart/checkout lines share this one value, so count and contents can
     never disagree. The cart page renders a full line (image, size/colour, qty stepper,
     working Remove) per added item; the checkout summary renders a compact line per
     item. Zero items -> empty state. */
  /* items added that aren't in the catalog (e.g. a pre-order design) still get a
     line so the badge count always equals the lines shown */
  function fallbackProduct(name) {
    return { n: name, p: 'S$0', img: '' };
  }
  function cartLineHTML(prod, i, compact) {
    var price = parseFloat((prod.p || 'S$0').replace(/S\$/, '')) || 0;
    var sizes = ['3Y', '2Y', '12M', '0\u20136M'], colours = ['Ice blue', 'Rain & Cozy', 'Cream', 'Blue'];
    if (compact) {
      return '<div class="js-cart-line" data-name="' + esc(prod.n) + '" data-price="' + price + '" style="border-bottom:1px solid var(--line-soft);padding:10px 0;display:flex;gap:12px;align-items:center">' +
        '<div style="width:46px;height:46px;border-radius:var(--radius);flex:none;overflow:hidden;border:1px solid var(--line)"><img src="' + esc(prod.img) + '" alt="' + esc(prod.n) + '" style="width:100%;height:100%;object-fit:cover"></div>' +
        '<div style="flex:1;font-size:12.5px"><b>' + esc(prod.n) + '</b><br><span class="muted">' + sizes[i % sizes.length] + ' \u00b7 qty 1</span></div>' +
        '<span style="font-weight:700;font-size:13px">S$' + price.toFixed(2) + '</span></div>';
    }
    return '<div class="js-cart-line" data-name="' + esc(prod.n) + '" data-price="' + price + '" style="border-top:1px solid var(--line)">' +
      '<div class="cart-line">' +
      '<div class="cart-line__img is-real" style="--m-a:#e3ecfb;--m-b:#c2d6f2"><img src="' + esc(prod.img) + '" alt="' + esc(prod.n) + '"></div>' +
      '<div><h4>' + esc(prod.n) + '</h4>' +
      '<div class="meta"><span>Size: ' + sizes[i % sizes.length] + ' \u00b7 Colour: ' + colours[i % colours.length] + '</span><span>From the live catalog \u00b7 demo line</span></div>' +
      '<div class="qty-row" data-min="1" data-max="10"><button type="button" data-step="-1" aria-label="Decrease">\u2212</button><output>1</output><button type="button" data-step="1" aria-label="Increase">+</button></div>' +
      '</div>' +
      '<div class="cart-line__right"><span class="line-price">S$' + price.toFixed(2) + '</span>' +
      '<button type="button" class="small muted js-remove-line" style="display:block;margin-top:10px;background:none;border:0;padding:0;text-align:right;text-decoration:underline;cursor:pointer">Remove</button></div>' +
      '</div></div>';
  }
  function populateCartLines() {
    var container = $('#cartLines') || $('#ckLines');
    if (!container) return;
    var compact = !!$('#ckLines');
    var names = bagItems();
    var empty = $('#cartEmpty');
    if (!names.length) {
      container.innerHTML = '';
      if (empty) empty.style.display = '';
      cartTotals();
      return;
    }
    if (empty) empty.style.display = 'none';
    var html = '';
    names.forEach(function (name, i) {
      var prod = productByName(name) || fallbackProduct(name);
      html += cartLineHTML(prod, i, compact);
    });
    container.innerHTML = html;
    cartTotals();
  }

  /* Remove a line: drop it from elly-bag-items and re-render — the badge count
     updates from the same array, so it always matches what is left in the cart. */
  document.addEventListener('click', function (e) {
    var rm = e.target.closest('.js-remove-line');
    if (!rm) return;
    e.preventDefault();
    var line = rm.closest('.js-cart-line');
    var name = line ? line.getAttribute('data-name') : '';
    if (name && removeFromBag(name)) {
      populateCartLines();
      toast('Removed from bag \u2014 <b>demo</b>');
    }
  });

  /* ---------- Init ---------- */
  function init() {
    populatePDP();
    populateCartLines();
    fillGrids();
    refreshBag();
    initQuickShop();
    applyHeroState();
    /* search results page: reflect the query in the hero + document title, and
       prefill the header search field so it can be refined */
    if ((document.body && document.body.getAttribute('data-page')) === 'search') {
      var sq = searchQueryFromUrl();
      var st = $('#searchQueryTitle');
      if (st) st.textContent = sq ? '\u201c' + sq + '\u201d' : '';
      if (sq) {
        var bar = document.title.indexOf('|');
        if (bar > 0) document.title = sq + ' \u2014 ' + document.title.slice(bar + 2);
      }
      var big = $('#bigSearch');
      if (big) big.value = sq;
    }
    updateFacetUI();
    if ($('.js-cart-line')) cartTotals();
    buildB2BLines();
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
  window.EL.b2bReview = b2bOpenReview;
  window.EL.startB2B = startB2B;
  window.EL.initConfigurator = initConfigurator;
  window.EL.cfgSummaryText = cfgSummaryText;
  window.EL.inKind = inKind;
  window.EL.pickPool = pickPool;
  window.EL.pagePool = pagePool;
  window.EL.updateFacetUI = updateFacetUI;
  window.EL.searchProducts = searchProducts;
  window.EL.bagCount = bagCount;
  window.EL.setBag = setBag;
  window.EL.refreshBag = refreshBag;
  window.EL.populateCartLines = populateCartLines;
  window.EL.bagItems = bagItems;
  window.EL.addToBag = addToBag;
  window.EL.removeFromBag = removeFromBag;
})();
