/* ============================================================
   THE ELLY STORE — revamp prototype · in-store staff assist
   (PRD §12 — Workflows 1 & 2)

   The customer-facing site has no staff-side equivalent today;
   this module is the tablet counterpart to the Recognise/Convert
   stages (§§5.2–5.3). The flow is a 4-stage loop:

     1 · Greet & occasion  — account lookup or walk-in
     2 · Build the set     — search the catalog → show the item
        photo to confirm → add to the set → personalise each
        eligible item in a slide-over drawer (name, placement,
        font, colour, wearer) → keep adding until the set is done
     3 · Fulfilment        — pickup at One Holland Village, or
        gift-from-counter (2c) reusing the online ship-to options
     4 · Hand to POS       — per-item draft order → status tracks

   Shape mirrors the B2B draft-order pattern (§10): the tablet
   builds a structured order (profile + loyalty + per-item
   personalisation/wearer specs) that a real backend would push
   as a Shopify Draft Order; here it lands in a sessionStorage
   store that the account page reads back. Everything is
   demo/illustrative.

   Two surfaces:
     · staff.html  — full wizard (wired only when #staffApp exists)
     · account.html — reads the draft-order store via
       EL_STAFF.accountOrdersHTML() to show order status + wearers.
   ============================================================ */
(function () {
  'use strict';

  var LS_KEY = 'elly-staff-draft-orders';
  /* The staff "set" and the customer site's bag are ONE store: elly-bags in
     localStorage, keyed by account id (see app.js). Names only — the same list
     the header badge and cart read. Staff additions for a matched customer land
     in that customer's bag (visible online), and online additions show up in the
     staff set. localStorage keeps it across tabs and browser restarts. */
  var BAG_MAP_KEY = 'elly-bags';

  /* ---------- placeholder inventory (PRD §12 open item: real
     warehouse-to-store transfer times replace the estimates) ----------

     Two tiers, split by popularity and sales mix:
     · One Holland Village store — the POPULAR edit only, kept in
       sufficient quantity: ~35% of sales happen in-store, so the
       shelf carries the fastest movers (matching/twin sets, newborn
       bestsellers, keepsake gift sets, Lion City SG prints).
     · Warehouse — MORE SKUs (popular + niche, essentially the full
       catalog) with LARGER quantities: ~65% of sales are online, so
       the warehouse holds the bulk. Any SKU not on the store shelf
       falls back here with an estimated transfer wait.

     checkStock: store first → warehouse fallback → none. */
  var STORE_QTY = {
    /* popular edit carried at One Holland Village (sufficient qty) */
    'disney-1': 8,   /* Kids Tee - Doodle Mickey (Twin it) */
    'disney-2': 6,   /* Kids Tee - Doodle Minnie (Twin it) */
    'disney-3': 5,   /* Kids Tee - Mickey Polaroid */
    'adult-1':  6,   /* Ladies Tee - Doodle Minnie (family twin) */
    'b2b-1':    6,   /* Adult Tee - Doodle Mickey (family twin) */
    'elly-1':   6,   /* Bamboo 2 Piece Set - Light Pink (Bestseller) */
    'elly-16':  5,   /* Kids Tee - Lion City (SG) */
    'adult-4':  4,   /* Adult Tee - Lion City (SG) */
    'elly-21':  4,   /* Overalls - Turquoise Vases */
    'gift-1':   2,   /* Deluxe Beginnings Keepsake Gift Set */
    'gift-3':   3,   /* Beary Personalisable Baby Gift Set */
    'custom-1': 4,   /* Personalised Kids Beanie - Cream */
    'disney-9': 3    /* Hooded Swim Robe - Rainbow Road Trip Mickey */
  };
  /* warehouse — full catalog; larger quantities (65% online sales).
     Entries override the default; 0 = not available anywhere (lost-sale
     demo path). Anything not listed defaults to WH_DEFAULT_QTY, so the
     warehouse genuinely carries more SKUs than the store. */
  var WAREHOUSE_QTY = {
    'disney-1': 30, 'disney-2': 24, 'disney-3': 20, 'disney-6': 14,
    'adult-1': 20, 'adult-2': 16, 'adult-3': 14, 'b2b-1': 20, 'adult-4': 14, 'adult-5': 12, 'adult-6': 12,
    'elly-1': 24, 'elly-4': 10, 'elly-16': 18, 'elly-21': 18, 'elly-24': 16,
    'gift-1': 8, 'gift-3': 10, 'custom-1': 12, 'disney-9': 8,
    'elly-20': 0    /* Russell Tee - Hot Dogs — out everywhere: lost-sale demo */
  };
  var WH_DEFAULT_QTY = 12;
  var WH_DEFAULT_WAIT = '2–3 days';
  var WAREHOUSE_WAITS = { 'elly-24': '3–5 days' }; /* per-SKU transfer time overrides */

  /* raw two-tier split for a SKU (also drives the UI + tests) */
  function stockSplit(id) {
    return {
      store: STORE_QTY[id] > 0 ? STORE_QTY[id] : 0,
      wh: (WAREHOUSE_QTY[id] != null ? WAREHOUSE_QTY[id] : WH_DEFAULT_QTY),
      wait: WAREHOUSE_WAITS[id] || WH_DEFAULT_WAIT
    };
  }
  function checkStock(id) {
    var split = stockSplit(id);
    /* in-store first: only the popular edit is on the Holland Village shelf */
    if (split.store > 0) return { loc: 'store', qty: split.store };
    /* warehouse fallback: full catalog, more stock — 65% of sales are online */
    if (split.wh > 0) return { loc: 'warehouse', qty: split.wh, wait: split.wait };
    return { loc: 'none', qty: 0 };
  }

  /* ---------- approved-character library (PRD §12) ----------
     A name approved once is reusable: searchable, paired with the
     font/size/colour that was approved for it. KR/CN/EN seeded per
     the PRD; more scripts land here as the business confirms them
     (Open Items). `lang` maps onto the configurator's language ids
     (en/cn/jp/kr) — a chip is only lit when the id really exists, so a
     Chinese name must carry lang 'cn', never 'kr'. */
  var LIBRARY = [
    { text: 'Amelia',  script: 'EN', lang: 'en', font: 'serif',  size: 'md', colour: 'Coral', note: 'Approved · common English name' },
    { text: 'Olivia',  script: 'EN', lang: 'en', font: 'script', size: 'md', colour: 'Navy',  note: 'Approved · common English name' },
    { text: 'Mina',    script: 'EN', lang: 'en', font: 'caps',   size: 'sm', colour: 'Gold',  note: 'Approved · short name, chest placement' },
    { text: '미나',     script: 'KR', lang: 'kr', font: 'serif',  size: 'md', colour: 'Navy',  note: 'Approved · Korean · Jan 2026' },
    { text: '하린',     script: 'KR', lang: 'kr', font: 'serif',  size: 'sm', colour: 'Black', note: 'Approved · Korean · Jan 2026' },
    { text: '美娜',     script: 'CN', lang: 'cn', font: 'serif',  size: 'md', colour: 'Coral', note: 'Approved · Chinese · Feb 2026' },
    { text: 'Emma',    script: 'EN', lang: 'en', font: 'serif',  size: 'md', colour: 'Cream', note: 'Approved · common English name' }
  ];

  function searchLibrary(q) {
    var term = String(q || '').trim().toLowerCase();
    if (!term) return LIBRARY.slice(0);
    return LIBRARY.filter(function (e) {
      return e.text.toLowerCase().indexOf(term) >= 0 ||
        e.script.toLowerCase().indexOf(term) >= 0;
    });
  }

  /* ---------- draft-order store (sessionStorage) ---------- */
  function readOrders() {
    try {
      return JSON.parse(sessionStorage.getItem(LS_KEY)) || [];
    } catch (e) { return []; }
  }
  function writeOrders(list) {
    try { sessionStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {}
  }

  /* shared per-account bag map (mirrors app.js's elly-bags) */
  function readBags() {
    try {
      var raw = localStorage.getItem(BAG_MAP_KEY);
      var map = raw ? JSON.parse(raw) : {};
      return (map && typeof map === 'object') ? map : {};
    } catch (e) { return {}; }
  }
  function writeBags(map) {
    try { localStorage.setItem(BAG_MAP_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function nextRef(list) {
    return 'OHV-' + (1000 + list.length + 1);
  }

  var STATUS_LADDER = ['received', 'in production', 'ready for pickup/shipped'];

  window.EL_STAFF_DAO = {
    list: readOrders,
    byRef: function (ref) {
      var list = readOrders();
      for (var i = 0; i < list.length; i++) if (list[i].ref === ref) return list[i];
      return null;
    },
    /* build + persist a draft order; returns the stored order.
       items carry per-item pers + wearer specs (PRD §12). */
    create: function (o) {
      var list = readOrders();
      var items = (o.items || []).map(function (it) {
        return {
          name: it.name || '',
          size: it.size || '',
          qty: it.qty || 1,
          pers: it.pers || null,
          wearer: it.wearer || null
        };
      });
      var order = {
        ref: nextRef(list),
        createdAt: o.createdAt || '',
        customerId: o.customerId || '',
        customerName: o.customerName || 'Walk-in customer',
        occasion: o.occasion || '',
        travelDate: o.travelDate || '',
        items: items,
        personalisation: o.personalisation || '',
        wearer: o.wearer || null,
        fulfilment: o.fulfilment || 'Pick up at One Holland Village',
        status: 'received'
      };
      list.push(order);
      writeOrders(list);
      return order;
    },
    /* demo status tracking: received → in production → ready (PRD §12) */
    advance: function (ref) {
      var list = readOrders();
      for (var i = 0; i < list.length; i++) {
        if (list[i].ref === ref) {
          var idx = STATUS_LADDER.indexOf(list[i].status);
          if (idx >= 0 && idx < STATUS_LADDER.length - 1) list[i].status = STATUS_LADDER[idx + 1];
          writeOrders(list);
          return list[i];
        }
      }
      return null;
    },
    statusLabel: function (s) {
      return String(s || 'received').replace(/(^|\s)\S/g, function (m) { return m.toUpperCase(); });
    }
  };

  /* ---------- account-page helper (also exercised by _smoke.js) ----------
     Pure HTML: per-item personalisation orders for the signed-in account,
     plus the "Past personalizations for: [names]" wearer list (PRD §12). */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;'); }

  /* one item line, e.g.:
     Kids Tee - Doodle Mickey · 3Y ×1 — 'Amelia' · left chest · Coral thread (wearer Amelia · 3Y) */
  function itemLine(it) {
    var line = esc(it.name || 'Item') + (it.size ? ' · ' + esc(it.size) : '') + ' ×' + (it.qty || 1);
    if (it.pers) line += ' — ' + esc(it.pers.summary || persSummary(it.pers));
    if (it.wearer && it.wearer.name) line += ' <span class="muted">(wearer ' + esc(it.wearer.name) + (it.wearer.ageSize ? ' · ' + esc(it.wearer.ageSize) : '') + ')</span>';
    return line;
  }

  function accountOrdersHTML(accountId) {
    var list = readOrders().filter(function (o) {
      return o.customerId && (!accountId || o.customerId === accountId);
    });
    if (!list.length) {
      return '<div class="summary-card" style="position:static">' +
        '<h3>No staff-assisted orders yet</h3>' +
        '<p class="small muted" style="margin-top:6px">Orders built on the in-store staff tablet appear here with their status — each personalised item rides along with its wearer.</p></div>';
    }
    /* wearer list — dedupe by name across items + legacy order-level wearer */
    var seen = {}, wearers = [];
    function addWearer(w) {
      if (w && w.name && !seen[w.name]) {
        seen[w.name] = true;
        wearers.push(w.name + (w.ageSize ? ' · ' + w.ageSize : ''));
      }
    }
    list.forEach(function (o) {
      (o.items || []).forEach(function (it) { addWearer(it.wearer); });
      addWearer(o.wearer);
    });
    var wearerHTML = wearers.length
      ? '<p class="small" style="margin-top:10px"><b>Past personalizations for:</b> ' + esc(wearers.join(' · ')) + '</p>'
      : '';
    var rows = list.map(function (o) {
      var step = STATUS_LADDER.indexOf(o.status);
      var ladder = STATUS_LADDER.map(function (s, i) {
        var cls = i < step ? ' is-done' : (i === step ? ' is-on' : '');
        return '<span class="ol-step' + cls + '">' + esc(s) + '</span>';
      }).join('<span class="ol-arrow">→</span>');
      var persCount = (o.items || []).filter(function (it) { return it.pers; }).length;
      return '<div class="summary-card" style="position:static;padding:16px 20px;margin-bottom:12px">' +
        '<div class="s-row" style="margin-bottom:4px"><span class="muted" style="font-size:12px">' + esc(o.ref) + ' · ' + esc(o.createdAt) + '</span>' +
        '<b style="font-size:12.5px">' + esc(o.fulfilment) + '</b></div>' +
        '<div class="s-row"><span>' + (o.items || []).map(itemLine).join('<br>') + '</span>' +
        '<b style="font-size:12.5px;white-space:nowrap">' + (persCount ? persCount + ' personalised' : 'No personalisation') + '</b></div>' +
        '<div class="ol-ladder">' + ladder + '</div>' +
        wearerHTML +
        '</div>';
    }).join('');
    return '<div class="staff-orders">' + rows + '</div>';
  }

  /* ============================================================
     Page wiring — staff.html only. Everything above works headless
     (DAO + helpers); this section is guarded by #staffApp so the
     module can load on account.html too without side effects.
     ============================================================ */
  var state = {
    customer: null,            /* matched EL_ACCOUNTS record, or walk-in */
    occasion: '',
    travelDate: '',
    rows: [],                  /* basket: { id, name, size, qty, img, pers, wearer } */
    lost: [],                  /* lost-sale log: { name, size } */
    fulfilment: 'Pick up at One Holland Village',
    persIndex: -1,             /* basket row the drawer is personalising */
    drawerSeq: [1, 2, 3]       /* the drawer steps that APPLY to the item being personalised */
  };

  function $(id) { return document.getElementById(id); }
  function all(sel, root) { return (root || document).querySelectorAll(sel); }
  function first(sel, root) { return (root || document).querySelector(sel); }
  /* sandbox-safe click — stub elements in _smoke.js have no click() */
  function tap(el) { if (el && typeof el.click === 'function') el.click(); }

  function productById(id) {
    if (typeof window.EL_PRODUCTS !== 'object') return null;
    for (var i = 0; i < window.EL_PRODUCTS.length; i++) if (window.EL_PRODUCTS[i].id === id) return window.EL_PRODUCTS[i];
    return null;
  }
  /* delegate to the site's one predicate (window.EL.isPersonalisable, defined in
     products.js and re-exported by app.js) — the staff tablet must open the
     configurator for exactly the items the website treats as personalisable */
  function isPersonalisable(prod) {
    return (window.EL && typeof window.EL.isPersonalisable === 'function')
      ? window.EL.isPersonalisable(prod)
      : !!(prod && prod.custom && prod.custom.methods && prod.custom.methods.length);
  }
  function prodPhoto(prod) {
    return (prod && ((prod.imgs && prod.imgs[0]) || prod.img)) || '';
  }
  function stockBadge(st) {
    if (st.loc === 'store') return '<span class="badge badge--blue">In store · ' + st.qty + ' on shelf</span>';
    if (st.loc === 'warehouse') return '<span class="badge badge--demo">Warehouse · est. ' + esc(st.wait) + '</span>';
    return '<span class="badge badge--ink">Unavailable today</span>';
  }

  function goStep(n) {
    all('.staff-step').forEach(function (el) {
      el.hidden = String(el.getAttribute('data-step')) !== String(n);
    });
    all('.staff-rail__step').forEach(function (el) {
      var on = String(el.getAttribute('data-step')) === String(n);
      el.classList.toggle('is-on', on);
      el.classList.toggle('is-done', parseInt(el.getAttribute('data-step'), 10) < n);
    });
    state.step = n;
    if (n === 4) renderReview();
  }

  /* ---------- step 1: greet & occasion capture ---------- */
  function findCustomer(q) {
    var term = String(q || '').trim().toLowerCase();
    if (!term) return [];
    if (typeof window.EL_ACCOUNTS_DAO !== 'object') return [];
    return window.EL_ACCOUNTS_DAO.list().filter(function (a) {
      return a.name.toLowerCase().indexOf(term) >= 0 ||
        (a.countryName || '').toLowerCase().indexOf(term) >= 0 ||
        (a.id || '').toLowerCase().indexOf(term) >= 0;
    });
  }

  function renderCustomerResults(q) {
    var box = $('staffCustResults');
    if (!box) return;
    var hits = findCustomer(q);
    if (!hits.length) {
      box.innerHTML = '<p class="small muted" style="margin:10px 0 0">No account match — the customer can be captured as a walk-in; loyalty capture at POS still syncs the purchase.</p>';
      return;
    }
    box.innerHTML = hits.map(function (a) {
      return '<button type="button" class="chip staff-cust-chip" data-acc="' + esc(a.id) + '">' +
        (a.emoji || '') + ' <b>' + esc(a.name) + '</b> · ' + esc(a.countryName) + ' · ' + a.points + ' pts</button>';
    }).join('');
  }

  /* ---------- step 2: search → photo confirm → add → personalise ---------- */
  function searchItems(q) {
    var term = String(q || '').trim().toLowerCase();
    if (!term || typeof window.EL_PRODUCTS !== 'object') return [];
    return window.EL_PRODUCTS.filter(function (p) {
      var hay = [p.n, p.type, (p.characters || []).join(' '), (p.tags || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(term) >= 0;
    }).slice(0, 12);
  }

  function renderResults(q) {
    var box = $('staffResults');
    if (!box) return;
    var hits = searchItems(q);
    if (!q) {
      box.innerHTML = '<p class="small muted">Type to search the catalog — results show the item photo, price and live stock position.</p>';
      return;
    }
    if (!hits.length) {
      box.innerHTML = '<p class="small muted">No matches — try a different name, character or type.</p>';
      return;
    }
    box.innerHTML = hits.map(function (p) {
      return '<button type="button" class="staff-result js-staff-result" data-id="' + esc(p.id) + '">' +
        '<img src="' + esc(prodPhoto(p)) + '" alt="' + esc(p.n) + '" loading="lazy">' +
        '<span class="staff-result__name">' + esc(p.n) + '</span>' +
        '<span class="staff-result__meta"><b>' + esc(p.p) + '</b>' + stockBadge(checkStock(p.id)) + '</span>' +
        (isPersonalisable(p) ? '<span class="badge badge--coral" style="position:absolute;top:8px;left:8px">Personalisable</span>' : '') +
        '</button>';
    }).join('');
  }

  function sizeOptions(prod) {
    /* the item's own size run always wins; fall back to the pet / shoe run, then
       to a single "One size" — a gift, plush or pet item must never offer baby
       months as if they were sizes */
    var run = (prod && prod.sizes && prod.sizes.length) ? prod.sizes
      : (prod && prod.petSize && prod.petSize.length) ? prod.petSize
      : (prod && prod.shoeSizes && prod.shoeSizes.length) ? prod.shoeSizes
      : ['One size'];
    return '<option value="">Any size</option>' + run.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('');
  }

  /* item confirm panel — the big photo is the "show the customer" step */
  function openConfirm(id) {
    var box = $('staffConfirm');
    var prod = productById(id);
    if (!box || !prod) return;
    state.confirm = prod;
    var st = checkStock(prod.id);
    box.hidden = false;
    box.innerHTML =
      '<div class="staff-confirm__img"><img src="' + esc(prodPhoto(prod)) + '" alt="' + esc(prod.n) + '"></div>' +
      '<div class="staff-confirm__info">' +
      '<h3>' + esc(prod.n) + '</h3>' +
      '<p class="muted" style="margin-top:4px">' + esc(prod.p) + (isPersonalisable(prod) ? ' · <span class="badge badge--coral">Personalisable</span>' : ' · <span class="muted">Not personalisable</span>') + '</p>' +
      '<div style="margin:8px 0">' + stockBadge(st) +
      (st.loc === 'warehouse' ? ' <span class="small muted">Customer chooses: wait in-store, or pay at POS and have it delivered later.</span>' : '') +
      '</div>' +
      '<div class="staff-add-row">' +
      '<select id="confirmSize" class="cfg-text" aria-label="Size">' + sizeOptions(prod) + '</select>' +
      '<input type="number" id="confirmQty" class="cfg-text" value="1" min="1" max="9" style="max-width:86px" aria-label="Quantity">' +
      '<button type="button" class="btn btn--blue" id="confirmAdd">Add to set</button>' +
      '<button type="button" class="btn btn--ghost" id="confirmBack">← Back to results</button>' +
      '</div>' +
      (st.loc === 'none' ? '<label class="f-check" style="margin-top:10px"><input type="checkbox" id="confirmLost"><span>Not available today — log as a lost sale (internal only)</span></label>' : '') +
      '</div>';
    /* scroll the confirm panel into view on the tablet */
    try { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
  }

  function addFromConfirm() {
    var prod = state.confirm;
    if (!prod) return;
    var size = ($('confirmSize') || {}).value || '';
    var qty = parseInt(($('confirmQty') || {}).value, 10) || 1;
    state.rows.push({ id: prod.id, name: prod.n, size: size, qty: qty, img: prodPhoto(prod), pers: null, wearer: null });
    addNameToBag(prod.n);
    var lostBox = $('confirmLost');
    if (lostBox && lostBox.checked) {
      state.lost.push({ name: prod.n, size: size });
      if (window.EL && window.EL.toast) window.EL.toast('Lost sale logged internally — <b>not</b> shown to the customer.');
    }
    var confirm = $('staffConfirm');
    if (confirm) { confirm.hidden = true; confirm.innerHTML = ''; }
    state.confirm = null;
    /* less clutter after the pick: clear the search so the view shows the set */
    var searchBox = $('staffSearch');
    if (searchBox) searchBox.value = '';
    renderResults('');
    renderBasket();
    if (window.EL && window.EL.toast) {
      window.EL.toast('Added to the set: <b>' + esc(prod.n) + '</b>' + (isPersonalisable(prod) ? ' — tap “Personalise” on the row to name it.' : ''));
    }
  }

  function persChip(row) {
    if (!row.pers) return '';
    var label = row.pers.summary || persSummary(row.pers);
    return '<span class="badge badge--coral">' + esc(label) + '</span>';
  }

  function renderBasket() {
    var box = $('staffBasket');
    if (!box) return;
    var empty = $('basketEmpty');
    if (empty) empty.hidden = state.rows.length > 0;
    box.innerHTML = state.rows.map(function (row, i) {
      var prod = productById(row.id);
      var st = checkStock(row.id);
      return '<div class="staff-bline" data-i="' + i + '">' +
        '<img class="staff-bline__img" src="' + esc(row.img) + '" alt="">' +
        '<div class="staff-bline__main">' +
        '<b>' + esc(row.name) + '</b>' +
        '<span class="muted">' + (row.size ? esc(row.size) + ' · ' : '') + '×' + row.qty + '</span>' +
        '<div class="staff-bline__tags">' + stockBadge(st) + persChip(row) +
        (row.wearer && row.wearer.name ? '<span class="badge badge--ink">wearer ' + esc(row.wearer.name) + '</span>' : '') +
        '</div>' +
        '</div>' +
        '<div class="staff-bline__side">' +
        (isPersonalisable(prod)
          ? '<button type="button" class="btn btn--ghost btn--sm js-pers-row" data-i="' + i + '">' + (row.pers ? 'Edit personalisation' : 'Personalise') + '</button>'
          : '<span class="small muted">Not personalisable</span>') +
        '<button type="button" class="btn btn--ghost btn--sm js-remove-row" data-i="' + i + '" aria-label="Remove ' + esc(row.name) + '">✕ Remove</button>' +
        '</div>' +
        '</div>';
    }).join('');
    var summary = $('stockSummary');
    if (summary) {
      var store = 0, wh = 0, none = 0;
      state.rows.forEach(function (r) {
        var st2 = checkStock(r.id);
        if (st2.loc === 'store') store++;
        else if (st2.loc === 'warehouse') wh++;
        else none++;
      });
      var parts = [];
      if (store) parts.push('<b>' + store + '</b> in store');
      if (wh) parts.push('<b>' + wh + '</b> from warehouse');
      if (none) parts.push('<b>' + none + '</b> unavailable');
      summary.innerHTML = (parts.length ? parts.join(' · ') : '') +
        (state.lost.length ? (parts.length ? ' · ' : '') + '<b>' + state.lost.length + ' lost sale' + (state.lost.length > 1 ? 's' : '') + ' logged</b>' : '');
    }
  }

  /* ---------- per-customer set = the customer's bag (step 1 → step 2) ---------- */
  function productByName(nm) {
    if (typeof window.EL_PRODUCTS === 'object') {
      for (var i = 0; i < window.EL_PRODUCTS.length; i++) {
        if (window.EL_PRODUCTS[i].n === nm) return window.EL_PRODUCTS[i];
      }
    }
    /* app.js also resolves picked Pre-Order designs ("<product> — <design>") to
       the design's artwork; reuse it so staff rows show the same image */
    if (window.EL && typeof window.EL.productByName === 'function') return window.EL.productByName(nm);
    return null;
  }
  /* the shared bag holds names (the site's cart reads names); materialise the
     richer staff rows from the catalog */
  function rowsFromNames(names, accId) {
    /* the customer's saved personalisation lives in the shared store keyed by their
       account id, so attach it here — the drawer then opens on the spec they chose */
    var saved = (typeof window.EL === 'object' && window.EL && typeof window.EL.persForAccount === 'function')
      ? function (nm) { return window.EL.persForAccount(accId, nm); }
      : function () { return null; };
    return (names || []).map(function (nm) {
      var prod = productByName(nm);
      return { id: prod ? prod.id : '', name: nm, size: '', qty: 1, img: prod ? prodPhoto(prod) : '', pers: saved(nm), wearer: null };
    });
  }
  function resetSearchUI() {
    var searchBox = $('staffSearch');
    if (searchBox) searchBox.value = '';
    renderResults('');
    var cf = $('staffConfirm');
    if (cf) { cf.hidden = true; cf.innerHTML = ''; }
    state.confirm = null;
  }
  function loadBasket(accId) {
    var map = readBags();
    state.rows = rowsFromNames(map[accId], accId);
    state.lost = [];
    resetSearchUI();
    renderBasket();
  }
  function selectAccount(acc) {
    var map = readBags();
    if (!state.customer && state.rows.length) {
      /* unowned set: adopt it into the customer being identified */
      var arr = map[acc.id] || [];
      state.rows.forEach(function (r) { arr.push(r.name); });
      map[acc.id] = arr;
      writeBags(map);
    }
    state.customer = acc;
    loadBasket(acc.id);
  }
  function selectWalkIn() {
    /* a new customer starts with an empty set (walk-in bags are never kept) */
    state.customer = null;
    state.rows = [];
    state.lost = [];
    resetSearchUI();
    renderBasket();
  }
  function clearSavedBasket(accId) {
    var key = accId || (state.customer ? state.customer.id : null);
    if (!key) return;
    var map = readBags();
    delete map[key];
    writeBags(map);
  }
  /* staff additions/removals for a matched customer write the SAME bag the
     customer site reads — the header badge, cart and checkout follow along */
  function addNameToBag(name) {
    var key = state.customer ? state.customer.id : null;
    if (!key) return;
    var map = readBags();
    var arr = map[key] || [];
    arr.push(name);
    map[key] = arr;
    writeBags(map);
  }
  function removeNameFromBag(name) {
    var key = state.customer ? state.customer.id : null;
    if (!key) return;
    var map = readBags();
    var arr = map[key] || [];
    var i = arr.indexOf(name);
    if (i >= 0) { arr.splice(i, 1); map[key] = arr; writeBags(map); }
  }

  /* ---------- personalisation drawer (slide-over, mini-wizard) ---------- */
  /* order matters: the drawer always opens on the configurator itself, so
     "Personalise" never lands on an empty-looking panel. Library + preview
     follow, and the dots/Back/Next walk the same order. */
  var DRAWER_STEPS = ['Details', 'Name', 'Preview'];

  /* the drawn steps are only the APPLICABLE ones: an item that takes patches but not
     embroidery has no Name library to browse, so that tab never appears and Next walks
     straight from Details to Preview */
  function drawerStepsFor(prod) {
    return (prod && prod.custom && (prod.custom.methods || []).indexOf('embroidered') >= 0) ? [1, 2, 3] : [1, 3];
  }
  function drawerSeq() { return (state.drawerSeq && state.drawerSeq.length) ? state.drawerSeq : [1, 2, 3]; }
  function renderDots(stepNo) {
    var box = $('drawerDots');
    if (!box) return;
    var seq = drawerSeq(), active = seq.indexOf(stepNo);
    box.innerHTML = seq.map(function (s, i) {
      return '<button type="button" class="drawer-dot' + (i === active ? ' is-on' : '') + '" data-ds="' + s + '"><span class="no">' + (i + 1) + '</span>' + DRAWER_STEPS[s - 1] + '</button>';
    }).join('');
  }

  /* prev/next walk the applicable steps, skipping any that don't apply */
  function drawerMove(delta) {
    var seq = drawerSeq();
    var i = seq.indexOf(currentDrawerStep());
    if (i < 0) i = 0;
    var j = Math.min(seq.length - 1, Math.max(0, i + delta));
    if (j !== i) drawerStep(seq[j]);
  }

  function drawerStep(n) {
    all('.drawer-step', $('staffDrawer')).forEach(function (el) {
      el.hidden = String(el.getAttribute('data-step')) !== String(n);
    });
    var seq = drawerSeq();
    var at = seq.indexOf(n); if (at < 0) at = 0;
    renderDots(n);
    var next = $('drawerNext');
    if (next) next.textContent = at === seq.length - 1 ? 'Save personalisation' : 'Next';
    var prev = $('drawerPrev');
    if (prev) prev.textContent = at === 0 ? '' : '← Back';
    if (prev) prev.hidden = at === 0;
    /* keep the Live Look fresh when the preview step becomes visible */
    if (n === 3 && typeof window.EL === 'object' && typeof window.EL.initConfigurator === 'function') {
      var cfg = $('configurator');
      /* re-trigger a render through the public surface: re-init would reset the
         working spec — instead nudge via cfgRefresh if exposed, else skip */
      if (cfg && window.EL.cfgRefresh) window.EL.cfgRefresh();
    }
  }

  /* if the configurator module never loaded (or produced no controls), say so
     in the panel instead of leaving an empty box — a blank drawer is a bug that
     looks like nothing happened. */
  function cfgFallback() {
    var step = first('.drawer-step--cfg');
    if (!step || $('cfgFallback')) return;
    var note = document.createElement('div');
    note.className = 'demo-note';
    note.id = 'cfgFallback';
    note.innerHTML = '<span><b>The personalisation configurator didn&rsquo;t load.</b> Reload the page and try again (assets/app.js drives it) — the order can still be built and handed to POS without it.</span>';
    step.insertBefore(note, step.firstChild);
  }

  function openDrawer(i) {
    var row = state.rows[i];
    if (!row) return;
    var prod = productById(row.id);
    if (!prod || !isPersonalisable(prod)) return;
    state.persIndex = i;
    /* items that don't take embroidery skip the Name library step entirely */
    state.drawerSeq = drawerStepsFor(prod);
    var title = $('drawerTitle');
    if (title) title.textContent = row.name;
    /* single global configurator instance — reset for this product, then
       restore any saved spec on top */
    var canCfg = typeof window.EL === 'object' && typeof window.EL.initConfigurator === 'function';
    if (canCfg) {
      window.EL.initConfigurator(prod);
      if (row.pers) applyPersToDom(row.pers);
    }
    /* always reveal the configurator — this used to sit inside the guard, which
       left the panel empty whenever the module was unavailable */
    var cfg = $('configurator');
    if (cfg) cfg.hidden = false;
    var methodsBox = $('cfgMethods');
    if (!canCfg || !methodsBox || !String(methodsBox.innerHTML || '').length) cfgFallback();
    var wName = $('wearerName'); if (wName) wName.value = row.wearer ? row.wearer.name : '';
    var wAge = $('wearerAge'); if (wAge) wAge.value = row.wearer ? row.wearer.ageSize : '';
    var wRel = $('wearerRel'); if (wRel) wRel.value = row.wearer ? row.wearer.rel : '';
    var drawer = $('staffDrawer');
    if (drawer) {
      drawer.hidden = false;
      drawer.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('staff-drawer-open');
    drawerStep(1);
  }

  function closeDrawer() {
    var drawer = $('staffDrawer');
    if (drawer) {
      drawer.hidden = true;
      drawer.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('staff-drawer-open');
    state.persIndex = -1;
  }

  /* snapshot the working spec from the configurator DOM (chips carry data-v) */
  function snapshotPers() {
    var g = function (sel) { var el = first(sel); return el ? el.getAttribute('data-v') : ''; };
    var patches = [];
    all('#cfgPatches .cfg-chip.is-on').forEach(function (b) { patches.push(b.getAttribute('data-v')); });
    var colourEl = first('#cfgColours .c-swatch.is-on');
    var pers = {
      method: g('#cfgMethods .cfg-chip.is-on'),
      placement: g('#cfgPlacements .cfg-chip.is-on'),
      text: ($('cfgText') || {}).value || '',
      colourName: colourEl ? colourEl.getAttribute('data-c') : '',
      font: g('#cfgFonts .cfg-chip.is-on'),
      fontSize: g('#cfgSizes .cfg-chip.is-on'),
      language: g('#cfgLangs .cfg-chip.is-on'),
      patches: patches
    };
    if (typeof window.EL === 'object' && typeof window.EL.cfgSummaryText === 'function') {
      pers.summary = window.EL.cfgSummaryText();
    }
    return pers;
  }

  /* re-apply a saved spec onto the freshly-init'd configurator (chip clicks,
     same mechanism as the character-library "Use") */
  function applyPersToDom(p) {
    if (!p) return;
    var m = first('#cfgMethods .cfg-chip[data-v="' + p.method + '"]');
    if (m) tap(m);
    var pl = first('#cfgPlacements .cfg-chip[data-v="' + p.placement + '"]');
    if (pl) tap(pl);
    var input = $('cfgText');
    if (input) {
      input.value = p.text || '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    var lg = first('#cfgLangs .cfg-chip[data-v="' + p.language + '"]');
    if (lg) tap(lg);
    var fo = first('#cfgFonts .cfg-chip[data-v="' + p.font + '"]');
    if (fo) tap(fo);
    var sz = first('#cfgSizes .cfg-chip[data-v="' + p.fontSize + '"]');
    if (sz) tap(sz);
    var co = first('#cfgColours .c-swatch[data-c="' + p.colourName + '"]');
    if (co) tap(co);
    (p.patches || []).forEach(function (id) {
      var pa = first('#cfgPatches .cfg-chip[data-v="' + id + '"]');
      if (pa) tap(pa);
    });
  }

  function saveDrawer() {
    var row = state.rows[state.persIndex];
    if (!row) { closeDrawer(); return; }
    var pers = snapshotPers();
    row.pers = (pers.method && (pers.text || pers.patches.length)) ? pers : null;
    /* a matched customer's online cart reads the SAME store, so a capture here lands in
       their bag (and an explicit removal clears it) — exactly like the shared bag */
    if (state.customer && typeof window.EL === 'object' && window.EL && typeof window.EL.savePersForAccount === 'function') {
      window.EL.savePersForAccount(state.customer.id, row.name, row.pers);
    }
    var wName = ($('wearerName') || {}).value || '';
    row.wearer = wName.trim()
      ? { name: wName.trim(), ageSize: ($('wearerAge') || {}).value || '', rel: ($('wearerRel') || {}).value || '' }
      : null;
    renderBasket();
    var name = row.name;
    closeDrawer();
    if (window.EL && window.EL.toast) {
      window.EL.toast(row.pers
        ? 'Personalisation saved for <b>' + esc(name) + '</b>' + (row.wearer ? ' — wearer ' + esc(row.wearer.name) : '') + '.'
        : 'Removed personalisation from <b>' + esc(name) + '</b>.');
    }
    renderReview();
  }

  /* pure per-item summary for tests + fallback rendering */
  function persSummary(p) {
    if (!p) return '';
    var parts = [];
    if (p.method === 'patches') {
      if (p.patches && p.patches.length) parts.push((p.patches.length) + ' iron-on patches');
      return parts.join(' · ');
    }
    if (p.text) parts.push("'" + p.text + "'");
    if (p.placement) parts.push(p.placement);
    if (p.colourName) parts.push(p.colourName + ' thread');
    if (p.font) parts.push(p.font);
    if (p.fontSize) parts.push(p.fontSize);
    if (p.language && p.language !== 'en') parts.push(p.language);
    return parts.join(' · ');
  }

  /* ---------- step 4: draft-order review & handoff ---------- */
  function fulfilmentLabel() {
    var kind = state.fulfilment;
    if (kind === 'Pick up at One Holland Village') return kind;
    var shipTo = $('staffShipTo') && $('staffShipTo').value ? $('staffShipTo').value : 'recipient address';
    return 'Gift from counter — ship to ' + shipTo;
  }

  function renderReview() {
    var box = $('draftReview');
    if (!box) return;
    var cust = state.customer
      ? state.customer.name + ' · ' + (state.customer.countryName || '') + ' · ' + state.customer.points + ' pts'
      : 'Walk-in customer · loyalty captured at POS';
    var persCount = state.rows.filter(function (r) { return r.pers; }).length;
    box.innerHTML =
      '<div class="summary-card" style="position:static">' +
      '<h3>Draft order — hand to POS</h3>' +
      '<div class="s-row"><span>Customer</span><b>' + esc(cust) + '</b></div>' +
      (state.occasion ? '<div class="s-row"><span>Occasion</span><b>' + esc(state.occasion) + (state.travelDate ? ' · travel ' + esc(state.travelDate) : '') + '</b></div>' : '') +
      '<div class="s-row"><span>Items (' + state.rows.length + ')</span><b>' + state.rows.map(function (r) {
        return esc(r.name) + (r.size ? ' · ' + esc(r.size) : '') + ' ×' + r.qty +
          (r.pers ? ' — ' + esc(r.pers.summary || persSummary(r.pers)) : '') +
          (r.wearer && r.wearer.name ? ' <span class="muted">(wearer ' + esc(r.wearer.name) + (r.wearer.ageSize ? ' · ' + esc(r.wearer.ageSize) : '') + ')</span>' : '');
      }).join('<br>') + '</b></div>' +
      (state.lost.length ? '<div class="s-row"><span>Lost sales (internal)</span><b>' + esc(state.lost.map(function (l) { return l.name; }).join(', ')) + '</b></div>' : '') +
      '<div class="s-row"><span>Fulfilment</span><b>' + esc(fulfilmentLabel()) + '</b></div>' +
      '<p class="small muted" style="margin-top:12px">' + (persCount ? '<b>' + persCount + ' item' + (persCount > 1 ? 's' : '') + ' personalised.</b> ' : 'No personalisation. ') +
      'Handing off builds a draft order the cashier retrieves at the POS terminal by customer lookup or this reference — no re-keying, no handwritten invoice number.</p>' +
      '</div>';
  }

  function handoff() {
    var cust = state.customer;
    var items = state.rows.map(function (r) {
      return { name: r.name, size: r.size, qty: r.qty, pers: r.pers, wearer: r.wearer };
    });
    var firstWearer = null;
    for (var i = 0; i < state.rows.length; i++) {
      if (state.rows[i].wearer) { firstWearer = state.rows[i].wearer; break; }
    }
    var order = window.EL_STAFF_DAO.create({
      createdAt: new Date().toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }),
      customerId: cust ? cust.id : '',
      customerName: cust ? cust.name : 'Walk-in customer',
      occasion: state.occasion,
      travelDate: state.travelDate,
      items: items,
      personalisation: items.filter(function (it) { return it.pers; }).map(function (it) { return it.name + ': ' + (it.pers.summary || persSummary(it.pers)); }).join(' | '),
      wearer: firstWearer,
      fulfilment: fulfilmentLabel()
    });
    /* the set was consumed by the draft order — clear the customer's saved
       basket so a re-selected customer starts a fresh set */
    clearSavedBasket(cust ? cust.id : null);
    var box = $('handoffResult');
    if (!box) return order;
    box.innerHTML =
      '<div class="demo-note" style="border-color:var(--blue);background:var(--blue-wash)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l7 3v5c0 5-3.4 8.4-7 10-3.6-1.6-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>' +
      '<span><b>Draft order ' + esc(order.ref) + ' handed to POS.</b> Cashier retrieves by customer or reference to complete the sale — payment stays on the Shopify POS terminal. Status now tracks for staff and the customer&rsquo;s account.</span>' +
      '</div>' +
      '<div style="margin-top:14px">' +
      '<span class="badge badge--demo">Status (demo ladder)</span>' +
      '<div class="ol-ladder" id="orderLadder"></div>' +
      '<div class="chip-row" style="margin-top:12px">' +
      '<button type="button" class="chip chip--coral js-advance-status" data-ref="' + esc(order.ref) + '">Advance status (demo)</button>' +
      '<a class="chip" href="account.html">See it in the customer&rsquo;s account →</a>' +
      '<button type="button" class="chip js-new-order">Start another order</button>' +
      '</div></div>';
    renderLadder(order);
    return order;
  }

  function renderLadder(order) {
    var box = $('orderLadder');
    if (!box) return;
    var step = STATUS_LADDER.indexOf(order.status);
    box.innerHTML = STATUS_LADDER.map(function (s, i) {
      var cls = i < step ? ' is-done' : (i === step ? ' is-on' : '');
      return '<span class="ol-step' + cls + '">' + esc(s) + '</span>';
    }).join('<span class="ol-arrow">→</span>');
  }

  /* ---------- click wiring (staff page only) ---------- */
  function bootStaff() {
    if (!document.getElementById('staffApp')) return;

    /* step rail: click any stage to jump straight to it */
    all('.js-staff-go').forEach(function (b) {
      b.addEventListener('click', function () { goStep(parseInt(b.getAttribute('data-step'), 10)); });
    });
    all('.staff-rail__step').forEach(function (b) {
      b.addEventListener('click', function () { goStep(parseInt(b.getAttribute('data-step'), 10)); });
    });

    /* step 1: customer search */
    var custInput = $('staffCustInput');
    if (custInput) {
      custInput.addEventListener('input', function () { renderCustomerResults(custInput.value); });
      custInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); renderCustomerResults(custInput.value); } });
    }

    /* step 2: search → confirm → add */
    var searchInput = $('staffSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () { renderResults(searchInput.value); });
      searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); renderResults(searchInput.value); } });
    }

    /* the set follows the customer: no one is matched yet, so it starts empty.
       Picking a customer on step 1 loads their saved set (if any). */
    renderBasket();
    renderResults('');

    document.addEventListener('click', function (e) {
      /* customer match / walk-in — the set on step 2 follows the customer */
      var chip = e.target.closest('.staff-cust-chip');
      if (chip) {
        var acc = window.EL_ACCOUNTS_DAO ? window.EL_ACCOUNTS_DAO.byId(chip.getAttribute('data-acc')) : null;
        if (!acc) return;
        selectAccount(acc);
        if (custInput) custInput.value = ''; /* clear the search bar after a match */
        var box = $('staffCustResults');
        if (box) box.innerHTML = '<span class="badge badge--blue">Serving: ' + esc(acc.name) + '</span>';
        var walk = $('staffWalkIn');
        if (walk) walk.classList.remove('is-on');
        if (window.EL && window.EL.toast) {
          var n = state.rows.length;
          window.EL.toast('Customer matched — unified profile: <b>' + esc(acc.name) + '</b>, ' + acc.points + ' pts.' +
            (n ? ' The set shows <b>' + n + ' item' + (n > 1 ? 's' : '') + '</b> saved for this customer.' : ' No saved set yet — the set starts empty.'));
        }
        return;
      }
      var walkBtn = e.target.closest('#staffWalkIn');
      if (walkBtn) {
        selectWalkIn();
        var box2 = $('staffCustResults');
        if (box2) box2.innerHTML = '<span class="badge badge--demo">Walk-in / new customer — loyalty captured at POS · the set starts empty</span>';
        walkBtn.classList.add('is-on');
        if (window.EL && window.EL.toast) {
          window.EL.toast('Walk-in / new customer — the set starts empty (loyalty captured at POS).');
        }
        return;
      }
      /* search result → photo confirm */
      var res = e.target.closest('.js-staff-result');
      if (res) { openConfirm(res.getAttribute('data-id')); return; }
      var add = e.target.closest('#confirmAdd');
      if (add) { addFromConfirm(); return; }
      var back = e.target.closest('#confirmBack');
      if (back) {
        var cf = $('staffConfirm');
        if (cf) { cf.hidden = true; cf.innerHTML = ''; }
        state.confirm = null;
        return;
      }
      /* basket row actions */
      var persBtn = e.target.closest('.js-pers-row');
      if (persBtn) { openDrawer(parseInt(persBtn.getAttribute('data-i'), 10)); return; }
      var rm = e.target.closest('.js-remove-row');
      if (rm) {
        var i = parseInt(rm.getAttribute('data-i'), 10);
        if (i >= 0 && i < state.rows.length) {
          var removedRow = state.rows[i];
          state.rows.splice(i, 1);
          removeNameFromBag(removedRow.name);
        }
        renderBasket();
        return;
      }
      /* drawer */
      var ds = e.target.closest('.drawer-dot');
      if (ds) { drawerStep(parseInt(ds.getAttribute('data-ds'), 10)); return; }
      var cClose = e.target.closest('#drawerClose') || e.target.closest('#staffDrawerScrim');
      if (cClose) { closeDrawer(); return; }
      var use = e.target.closest('.js-char-use');
      if (use) {
        var i2 = parseInt(use.getAttribute('data-i'), 10);
        var q = charSearch ? charSearch.value : '';
        var entry = searchLibrary(q)[i2];
        if (entry) applyCharEntry(entry);
        return;
      }
      var approve = e.target.closest('#charApprove');
      if (approve) {
        var input = $('cfgText');
        var text = input ? input.value.trim() : '';
        if (!text) { if (window.EL && window.EL.toast) window.EL.toast('Type a name in the configurator first, then approve it.'); return; }
        var existing = LIBRARY.filter(function (l) { return l.text === text; })[0];
        if (!existing) {
          LIBRARY.push({ text: text, script: 'EN', lang: 'en', font: 'serif', size: 'md', colour: 'Coral', note: 'Approved in-store · this session' });
          if (window.EL && window.EL.toast) window.EL.toast('Approved — added to the library for every staff member.');
        } else if (window.EL && window.EL.toast) {
          window.EL.toast('Already approved: <b>' + esc(text) + '</b>');
        }
        if (charSearch) renderCharResults(charSearch.value);
      }
      /* step 4: status + new order */
      var adv = e.target.closest('.js-advance-status');
      if (adv) {
        var order = window.EL_STAFF_DAO.advance(adv.getAttribute('data-ref'));
        if (order) renderLadder(order);
        if (window.EL && window.EL.toast) window.EL.toast('Order status: <b>' + window.EL_STAFF_DAO.statusLabel(order.status) + '</b> — visible in the customer&rsquo;s account too.');
        return;
      }
      var neu = e.target.closest('.js-new-order');
      if (neu) {
        state = { customer: null, occasion: '', travelDate: '', rows: [], lost: [], fulfilment: 'Pick up at One Holland Village', persIndex: -1, drawerSeq: [1, 2, 3] };
        var res2 = $('handoffResult'); if (res2) res2.innerHTML = '';
        var box3 = $('draftReview'); if (box3) box3.innerHTML = '';
        var custBox = $('staffCustResults'); if (custBox) custBox.innerHTML = '';
        var sr = $('staffSearch'); if (sr) sr.value = '';
        renderBasket();
        renderResults('');
        goStep(1);
      }
    });

    /* drawer nav */
    var prevBtn = $('drawerPrev');
    if (prevBtn) prevBtn.addEventListener('click', function () { drawerMove(-1); });
    var nextBtn = $('drawerNext');
    if (nextBtn) nextBtn.addEventListener('click', function () {
      var seq = drawerSeq();
      if (currentDrawerStep() === seq[seq.length - 1]) saveDrawer();
      else drawerMove(1);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    /* char library inside the drawer */
    var charSearch = $('charSearch');
    if (charSearch) {
      charSearch.addEventListener('input', function () { renderCharResults(charSearch.value); });
      renderCharResults('');
    }

    /* step 3: fulfilment radios + gift-from-counter ship-to (reuse checkout options) */
    document.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'staffFulfil') {
        state.fulfilment = e.target.value === 'gift' ? 'Gift from counter — ship to recipient' : 'Pick up at One Holland Village';
        var gift = $('staffGiftPanel');
        if (gift) gift.hidden = e.target.value !== 'gift';
      }
    });

    var handoffBtn = $('staffHandoff');
    if (handoffBtn) handoffBtn.addEventListener('click', handoff);

    /* keep review + state in sync as the wizard is walked */
    document.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'staffOccasion') state.occasion = e.target.value;
      if (e.target && e.target.id === 'staffTravel') state.travelDate = e.target.value;
      if (e.target && e.target.id === 'staffShipTo') {
        var giftPanel = $('staffGiftPanel');
        if (giftPanel && !giftPanel.hidden) state.fulfilment = 'Gift from counter — ship to ' + e.target.value;
      }
      renderReview();
    });

    goStep(1);
  }

  function currentDrawerStep() {
    var els = all('.drawer-step', $('staffDrawer'));
    for (var i = 0; i < els.length; i++) {
      if (!els[i].hidden) return parseInt(els[i].getAttribute('data-step'), 10);
    }
    return 1;
  }

  /* character library render + apply (drawer mini-step 1) */
  function renderCharResults(q) {
    var box = $('charResults');
    if (!box) return;
    var hits = searchLibrary(q);
    box.innerHTML = hits.length
      ? hits.map(function (e, i) {
          return '<div class="char-card">' +
            '<div class="char-card__main"><b class="char-card__text" lang="' + esc(e.script) + '">' + esc(e.text) + '</b>' +
            '<span class="muted">' + esc(e.script) + ' · ' + esc(e.note) + '</span></div>' +
            '<button type="button" class="btn btn--ghost btn--sm js-char-use" data-i="' + i + '">Use</button>' +
            '</div>';
        }).join('')
      : '<p class="small muted">No approved matches — approve the current name to add it (reused for every staff member, PRD §12).</p>';
  }

  function applyCharEntry(e) {
    var input = $('cfgText');
    if (input) {
      input.value = e.text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    /* click the matching configurator chips so the live preview updates */
    var lang = first('#cfgLangs .cfg-chip[data-v="' + e.lang + '"]');
    if (lang) tap(lang);
    var font = first('#cfgFonts .cfg-chip[data-v="' + e.font + '"]');
    if (font) tap(font);
    var size = first('#cfgSizes .cfg-chip[data-v="' + e.size + '"]');
    if (size) tap(size);
    var col = first('#cfgColours .c-swatch[data-c="' + e.colour + '"]');
    if (col) tap(col);
    if (typeof window.EL === 'object' && window.EL.toast) {
      window.EL.toast('Approved character applied: <b>' + esc(e.text) + '</b> (' + esc(e.script) + ') — font, size &amp; colour set from the library.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootStaff);
  } else bootStaff();

  /* public surface (headless-safe for _smoke.js and account.html) */
  window.EL_STAFF = {
    checkStock: checkStock,
    stockSplit: stockSplit,
    searchLibrary: searchLibrary,
    library: function () { return LIBRARY.slice(0); },
    searchItems: searchItems,
    productById: productById,
    isPersonalisable: isPersonalisable,
    persSummary: persSummary,
    accountOrdersHTML: accountOrdersHTML,
    STATUS_LADDER: STATUS_LADDER.slice(0),
    /* the staff set is the customer's bag — one shared localStorage store with
       the customer site (see app.js). Names only; walk-in (empty account id)
       is never persisted. Headless-safe for _smoke.js. */
    bag: {
      get: function (accId) { return (readBags()[accId] || []).slice(); },
      save: function (accId, names) {
        if (!accId) return;
        var map = readBags();
        map[accId] = (names || []).slice();
        writeBags(map);
      },
      clear: function (accId) { clearSavedBasket(accId); },
      all: readBags
    },
    rowsFromNames: rowsFromNames,
    drawerStepsFor: drawerStepsFor,
    state: state
  };
})();