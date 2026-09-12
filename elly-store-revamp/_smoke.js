'use strict';
const fs = require('fs'), vm = require('vm');

function makeEl(tag) {
  const classes = new Set();
  const el = {
    tagName: (tag || 'div').toUpperCase(), children: [], style: {}, dataset: {}, _parent: null,
    classList: {
      add: (c) => classes.add(c), remove: (c) => classes.delete(c),
      toggle: (c, force) => { const w = force === undefined ? !classes.has(c) : !!force; w ? classes.add(c) : classes.delete(c); return w; },
      contains: (c) => classes.has(c)
    },
    setAttribute(k, v) { this.dataset[k] = String(v); },
    getAttribute(k) { return k in this.dataset ? this.dataset[k] : null; },
    addEventListener() {}, dispatchEvent() { return true; },
    appendChild(c) { if (c._parent) { const p = c._parent.children; const i = p.indexOf(c); if (i > -1) p.splice(i, 1); } c._parent = this; this.children.push(c); return c; },
    insertBefore(n) { if (n._parent) { const p = n._parent.children; const i = p.indexOf(n); if (i > -1) p.splice(i, 1); } n._parent = this; this.children.push(n); return n; },
    replaceChild(n, o) { const i = this.children.indexOf(o); if (i > -1) this.children[i] = n; return o; },
    cloneNode() { return makeEl(this.tagName); },
    remove() {}, contains() { return false; }, matches() { return false; }, closest() { return null; },
    querySelector() { return null; }, querySelectorAll() { return []; }, focus() {}, blur() {}
  };
  Object.defineProperty(el, 'innerHTML', {
    get() { return this._html || ''; },
    set(v) { this._html = String(v); this.children = []; const ch = makeEl('div'); ch._html = String(v); ch._parent = this; this.children.push(ch); }
  });
  Object.defineProperty(el, 'firstChild', { get() { return this.children[0] || null; } });
  return el;
}

const registry = {};
['#heroSlides', '#heroDots', '#heroCount', '#recGrid', '#occRail', '#searchLayer', '#bigSearch',
 '#suggestChips', '#suggestLabel', '#recentChips', '#recentChipsWrap', '#occasionChips', '#resultGrid',
 '#resultCount', '.search-idle', '#searchResults', '#hdrUtil', '#signLbl', '#signLink', '#mDrawer',
 '#bagCount', '#toast', '.seg', '.demo-status', '#occBanner', '#occBannerText', 'body', '#content',
 '.search-field', '.js-open-search', '#recTilesKicker', '#recTilesTitle', '#recTilesSub', '#heroDynamic',
 '#b2bWizard', '#b2bMatrix', '#b2bLines', '#b2bTierNote', '#b2bRunQty', '#b2bRunSub', '#b2bRunDeco', '#b2bRunSave', '#b2bRunTotal',
 '#b2bQty', '#b2bSub', '#b2bSave', '#b2bTotal', '#b2bUnit', '#rushNote', '#artName', '#decoPanes', '#b2bDate', '#artFile', '#b2bRequest',
 '#configurator', '#persToggle', '#cfgMethods', '#cfgPlacements', '#cfgColours', '#cfgColoursWrap', '#cfgText', '#cfgTextHint',
 '#cfgMethod', '#cfgPlacement', '#cfgChars', '#cfgColour', '#cfgSummary', '#cfgStaffNote', '#cfgViewSeg', '#cfgPreview',
 '#cfgPlaceWrap', '#cfgTextWrap', '#cfgPatchesWrap', '#cfgPatches', '#cfgPatchSel', '#cfgPatchCount', '#cfgPatchHint',
 '#cfgLang', '#cfgLangWrap', '#cfgLangs', '#cfgFont', '#cfgFontWrap', '#cfgFonts', '#cfgSize', '#cfgSizeWrap', '#cfgSizes',
 '#pdpTitle', '#pdpKicker', '#pdpPrice', '#pdpDesc', '#pdpCrumb', '.pdp', '.pdp__main', '.pdp__gal', '.pdp__thumbs',
 '#cartLines', '#ckLines', '#cartEmpty', '#cartSubtotal', '#cartTotal', '#shipMeter', '#shipMeterLabel',
 '#recRail', '#recRailLink', '#eventsEyebrow', '#mAcctPill', '#signPanel', '.announce__loc', '#f-country',
 /* in-store staff assist (PRD §12) */
 '#staffApp', '#staffCustInput', '#staffCustResults', '#staffWalkIn', '#staffOccasion', '#staffTravel',
 '#staffSearch', '#staffResults', '#staffConfirm', '#confirmSize', '#confirmQty', '#confirmAdd',
 '#confirmBack', '#confirmLost', '#staffBasket', '#basketEmpty', '#stockSummary',
 '#staffDrawer', '#staffDrawerScrim', '#drawerTitle', '#drawerDots', '#drawerPrev', '#drawerNext', '#drawerClose',
 '#charSearch', '#charResults', '#charApprove', '#livelookStage', '#livelookArtWrap',
 '#staffGiftPanel', '#staffShipTo', '#wearerName', '#wearerAge', '#wearerRel',
 '#staffFulfilItems', '#staffFulfilCount',
 '#draftReview', '#staffHandoff', '#handoffResult', '#orderLadder', '#acctStaffOrders',
 '#viewedRail', '#viewedGrid', '#viewedChipsWrap', '#viewedChips',
 '#pdpXsellGrid', '#pdpXsellTitle', '#pdpXsellKicker', '#pdpXsellLink', '#pdpXsell',
 '#pdpViewed', '#pdpViewedGrid', '#pdpViewedKicker', '#pdpViewedTitle',
 '#cartXsell', '#cartXsellGrid', '#persEditor']
  .forEach((s) => { registry[s] = makeEl('div'); });

const listeners = {};
const document = {
  readyState: 'loading', body: registry['body'], documentElement: registry['body'],
  addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
  removeEventListener() {},
  querySelector(sel) { return registry[sel] || null; },
  querySelectorAll() { return []; },
  createElement: (t) => makeEl(t), createTextNode: () => makeEl('text'),
  getElementById: (id) => registry['#' + id] || null
};

const sandbox = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, document,
  location: { search: '', href: 'http://localhost:4173/index.html' },
  URLSearchParams, Event: function (t) { this.type = t; },
  requestAnimationFrame: (f) => setTimeout(f, 0), navigator: { userAgent: 'smoke' },
  /* real browsers have window.addEventListener — the sign panel closes on
     resize/Escape, so the sandbox needs the stub too */
  addEventListener: function () {}, removeEventListener: function () {}
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

function load(f) { vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f }); }
let failed = false;
function check(n, c) { console.log((c ? '  ok ' : '  FAIL ') + n); if (!c) failed = true; }

registry['#heroSlides'].querySelectorAll = function () { return []; };

try {
  load('assets/components.js');
  sandbox.EL_PRODUCTS = [
    { n: 'Beary Personalisable Baby Gift Set', p: 'S$150', k: 'custom', img: 'x.jpg', custom: { methods: ['embroidered'], placements: ['front'] } },
    { id: 'disney-1', n: 'Kids Tee - Doodle Mickey', p: 'S$49.90', k: 'disney', kinds: ['disney', 'custom'], img: 'y.jpg', tags: ['kids tee', 'mickey', 'doodle'], sizes: ['3Y', '5Y'], custom: { methods: ['patches'], patchSet: 'disney', patchCount: 2 } },
    { id: 'elly-24', n: 'Swim Shorts - Turtles', p: 'S$39.90', k: 'elly', img: 'z.jpg', tags: ['swim shorts', 'turtles'] },
    /* cross-sell fixtures: a same-category tee vs a complementary swim piece, and a
       pair of pet items that must only ever pair with each other */
    { id: 'xsell-1', n: 'Kids Tee - Doodle Mickey Twin', p: 'S$45.90', k: 'disney', type: 'Tops & tees', characters: ['Mickey'], int: ['park'], img: 'xs1.jpg' },
    { id: 'xsell-2', n: 'Mickey Swim Shorts', p: 'S$25.90', k: 'disney', type: 'Swimwear', characters: ['Mickey'], int: ['park'], img: 'xs2.jpg' },
    { id: 'pet-1', n: 'Pet Bandana - Test Paws', p: 'S$30', k: 'furkids', type: 'Pet apparel', int: ['pets'], img: 'p1.jpg' },
    { id: 'pet-2', n: 'Pet Scarf - Test Paws', p: 'S$28', k: 'furkids', type: 'Pet apparel', int: ['pets'], img: 'p2.jpg' }
  ];
  /* demo account database + segment resolver load BEFORE app.js so the
     engine's first render already serves the right segment */
  load('assets/accounts.js');

  /* geo + segment stubs: fetch is stubbed to reject, so the only working
     geo tiers are the ?geo= override and the timezone/locale hint —
     exactly the two paths that must never hit the network */
  sandbox.sessionStorage = {
    _m: {},
    getItem: function (k) { return k in this._m ? this._m[k] : null; },
    setItem: function (k, v) { this._m[k] = String(v); },
    removeItem: function (k) { delete this._m[k]; }
  };
  /* per-account bag lives in localStorage (survives tabs/restarts) */
  sandbox.localStorage = {
    _m: {},
    getItem: function (k) { return k in this._m ? this._m[k] : null; },
    setItem: function (k, v) { this._m[k] = String(v); },
    removeItem: function (k) { delete this._m[k]; }
  };
  var announceLoc = registry['.announce__loc'];
  announceLoc._html = '<svg></svg> Singapore \u00b7 ships worldwide';
  announceLoc.textContent = '';
  var countrySel = registry['#f-country'];
  countrySel.tagName = 'SELECT';
  countrySel.options = [
    { text: 'Australia' }, { text: 'China' }, { text: 'Indonesia' }, { text: 'Japan' },
    { text: 'Malaysia' }, { text: 'United Kingdom' }, { text: 'United States' },
    { text: 'Other (20+ countries)' }
  ];
  countrySel.selectedIndex = 0;
  sandbox.fetch = function () { return Promise.reject(new Error('offline in smoke')); };

  load('assets/geo.js');
  load('assets/segment.js');
  load('assets/app.js');
  load('assets/staff.js'); /* staff assist registers its own DOMContentLoaded wiring */
  check('scripts evaluate fully', typeof sandbox.EL === 'object' && typeof sandbox.EL.ghostCard === 'function');
  check('staff module exports (EL_STAFF + DAO)', typeof sandbox.EL_STAFF === 'object' && typeof sandbox.EL_STAFF_DAO === 'object' && typeof sandbox.EL_STAFF.checkStock === 'function');
  (listeners['DOMContentLoaded'] || []).forEach((fn) => fn());

  const all = registry['body'].children.map((c) => c._html || '').join('\n');
  check('shell injected', /site-head/.test(all) && /search-field/.test(all));
  check('header tool says Bag', />Bag<\/span>/.test(all));
  check('no header label says Cart', !/>Cart<\/span>/.test(all));
  check('anonymous default: header says Sign In (no demo bar)', (registry['#signLbl'].textContent || '') === 'Sign In');
  check('demo bar removed from landing', !/demo-bar/.test(all) && !/Demo&nbsp;controls/.test(all));
  check('sign-in panel lives in the header (opens under the account tool)', /sign-panel/.test(all) && /js-signin/.test(all) && /tom-cook/.test(all) && /chloe-ng/.test(all));
  check('B2B banner injected (headline + sub-line + CTA)', /b2b-banner/.test(all) && /Bulk and corporate orders, made simple/.test(all) && /Start your quote/.test(all) && /b2b\.html/.test(all));
  check('mobile drawer no longer carries a B2B button', !/b2b\.html">B2B &amp; bulk quotes<\/a>/.test(all));
  /* Tapping a pillar in the mobile drawer must land on that pillar's product
     listing: the label is the link, the caret only opens the sub-categories. */
  check('mobile drawer: every pillar links to its listing, with its own caret toggle', (function () {
    var urls = ['elly-label.html', 'disney-elly.html', 'shoe-boutique.html', 'gifting-hub.html', 'customization.html', 'furkids.html'];
    var links = all.match(/<a class="m-navlink" href="[^"]+"/g) || [];
    var toggles = all.match(/data-m-sub-toggle/g) || [];
    return urls.every(function (u) { return all.indexOf('<a class="m-navlink" href="' + u + '"') >= 0; }) &&
      links.length === urls.length && toggles.length === urls.length;
  })());
  check('mobile drawer: pillar taps navigate (no preventDefault on the pillar name)', (function () {
    var src = fs.readFileSync('assets/app.js', 'utf8');
    return /closest\('\[data-m-sub-toggle\]'\)/.test(src) && !/closest\('\.m-navlink'\)/.test(src);
  })());
  /* ---------- sub-pillar deep links really filter the listing ----------
     A sub-pillar item (mega menu + mobile drawer) must land on a NARROWED grid for its
     pillar, not the pillar's full listing. Every ?f=Facet:Value the menus emit is
     replayed against the real product database, so a typo in components.js SUB_FACET
     (or a facet whose data moved) fails the suite instead of silently showing the
     whole category. */
  check('sub-pillar links filter their pillar listing, never the full grid', (function () {
    var catCtx = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync('assets/products.js', 'utf8'), catCtx);
    var CAT = catCtx.window.EL_PRODUCTS;
    var PAGE_KIND = {}, PAGE_DATA = {};
    ['elly-label.html', 'disney-elly.html', 'shoe-boutique.html', 'gifting-hub.html', 'customization.html', 'furkids.html'].forEach(function (page) {
      var html = fs.readFileSync(page, 'utf8');
      var m = /data-ghost-grid="\d+" data-kind="([^"]+)"/.exec(html);
      if (m) PAGE_KIND[page] = m[1];
      var d = /<body data-page="([^"]+)"/.exec(html);
      PAGE_DATA[page] = d ? d[1] : '';
    });
    /* signed off deliberately — the prototype catalogue has nothing to narrow to / the
       facet itself is already satisfied by every item in the category */
    var OK_UNFILTERED = ['All Disney', 'Outerwear', 'New In', 'Personalised name tag', 'Matching family + pet looks'];
    var OK_EMPTY = ['Bobux', 'Garvalin', 'KEEN', 'Old Soles', 'Adventure shoes', 'Waterplay', 'Digital gift card'];
    var OK_SAME = ['Small pets', 'Medium pets', 'Large pets'];
    var blocks = [], bre = /class="(?:m-sub|mega__group)"[^>]*>([\s\S]*?)(?:<\/div>|<\/ul>)/g, b;
    while ((b = bre.exec(all))) blocks.push(b[1]);
    var bad = [], total = 0;
    blocks.forEach(function (block) {
      var re = /<a href="([^"]+)">([^<]+)<\/a>/g, m;
      while ((m = re.exec(block))) {
        var href = m[1].replace(/&amp;/g, '&');
        var label = m[2].replace(/&amp;/g, '&');
        total++;
        if (href === 'pre-order.html') continue;   /* the Pre-Order PDP is its own page */
        var page = href.split('?')[0];
        var kind = PAGE_KIND[page];
        if (!kind) { bad.push(label + ' → ' + page); continue; }
        var specs = href.indexOf('?') < 0 ? [] : new URLSearchParams(href.slice(href.indexOf('?') + 1)).getAll('f').map(function (s) {
          var j = s.indexOf(':');
          return [s.slice(0, j), s.slice(j + 1)];
        });
        if (!specs.length) {
          if (OK_UNFILTERED.indexOf(label) < 0) bad.push(label + ' → unfiltered');
          continue;
        }
        /* facetMatch is page-aware (shoe-stages/sizes read the shoe page's own fields) */
        registry['body'].setAttribute('data-page', PAGE_DATA[page] || '');
        var pool = CAT.filter(function (pr) { return pr.k === kind || (pr.kinds || []).indexOf(kind) >= 0; });
        var hits = pool.filter(function (pr) {
          return specs.every(function (f) { return sandbox.EL.facetMatch(pr, f[0], f[1]); });
        }).length;
        if (!hits) { if (OK_EMPTY.indexOf(label) < 0) bad.push(label + ' → 0 of ' + pool.length); }
        else if (hits === pool.length) { if (OK_SAME.indexOf(label) < 0) bad.push(label + ' → no narrowing'); }
      }
    });
    if (bad.length) console.log('    ↳ ' + bad.join(' · '));
    return total >= 70 && bad.length === 0;
  })());
  /* ---------- Girls / Boys (1–14Y) are audience edits, not one age bucket ----------
     They used to alias to "Kids (1–14Y)", so a boy's edit showed dresses & cheongsams. */
  check('catalogue carries the gender signal the Girls/Boys edits rely on', (function () {
    var catCtx = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync('assets/products.js', 'utf8'), catCtx);
    var CAT = catCtx.window.EL_PRODUCTS;
    var cuts = CAT.filter(function (p) { return p.type === 'Dresses' || /girls'/i.test(p.n); });
    return cuts.length >= 15 && cuts.every(function (p) { return p.gender === 'girls'; });
  })());
  check('Boys (1–14Y) drops every girls-only piece and keeps the rest of the kids range', (function () {
    var catCtx = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync('assets/products.js', 'utf8'), catCtx);
    var CAT = catCtx.window.EL_PRODUCTS;
    var pool = CAT.filter(function (p) { return (p.age || []).indexOf('Kids (1–14Y)') >= 0; });
    var boys = pool.filter(function (p) { return sandbox.EL.facetMatch(p, 'Age', 'Boys (1–14Y)'); });
    var girlsOnly = pool.filter(function (p) { return p.gender === 'girls'; });
    return girlsOnly.length > 0 &&
      !boys.some(function (p) { return p.gender === 'girls'; }) &&     /* no dresses under Boys */
      boys.length === pool.length - girlsOnly.length &&               /* nothing else dropped */
      boys.length < pool.length;                                      /* and it really narrowed */
  })());
  check('Elly Label panel offers the Girls/Boys facets its sub-links point at', (function () {
    var src = fs.readFileSync('elly-label.html', 'utf8');
    return /data-f="Age" value="Girls \(1–14Y\)"/.test(src) && /data-f="Age" value="Boys \(1–14Y\)"/.test(src);
  })());
  check('every SUB_FACET entry maps a real pillar sub-link (no typos, no stale keys)', (function () {
    var body = /var SUB_FACET = \{([\s\S]*?)\n  \};/.exec(fs.readFileSync('assets/components.js', 'utf8'));
    if (!body || !sandbox.EL.PILLARS) return false;
    var keys = (body[1].match(/(?:^|\n)    '([^']+)': \[\[/g) || []).map(function (l) { return l.trim().replace(/': \[\[$/, '').replace(/^'/, ''); });
    if (keys.length < 60) return false;
    return keys.every(function (k) {
      var i = k.indexOf('|'), pk = k.slice(0, i), label = k.slice(i + 1);
      var pillar = sandbox.EL.PILLARS.filter(function (p) { return p.key === pk; })[0];
      if (!pillar) return false;
      return pillar.groups.some(function (g) { return g.links.indexOf(label) >= 0; });
    });
  })());
  registry['#b2bWizard'].hidden = true;
  check('B2B wizard hidden by default', registry['#b2bWizard'].hidden === true);
  check('startB2B exported', typeof sandbox.EL.startB2B === 'function');
  sandbox.EL.startB2B('Corporate & events', 1);
  check('startB2B reveals wizard without error', registry['#b2bWizard'].hidden === false);
  /* order type is a step-1 decision: corporate gifting + corporate events are ONE option */
  const b2bHtml = fs.readFileSync('b2b.html', 'utf8');
  const step1Html = b2bHtml.slice(b2bHtml.indexOf('What kind of order is this?'), b2bHtml.indexOf('data-step="2"'));
  check('B2B step 1 offers two order types (corporate gifting merged with events)',
    (step1Html.match(/class="otype[ "]/g) || []).length === 2 &&
    /data-name="Corporate &amp; events"/.test(step1Html) &&
    !/data-name="Corporate event"/.test(step1Html));
  check('B2B step 1 asks for a description of the event above the date',
    /id="b2bEvent"/.test(step1Html) &&
    step1Html.indexOf('id="b2bEvent"') < step1Html.indexOf('id="b2bDate"'));
  check('B2B landing merges corporate gifting + events into one use-case card',
    (b2bHtml.match(/class="use-card/g) || []).length === 2 &&
    /<b>Corporate &amp; events<\/b>/.test(b2bHtml) &&
    !/<b>Corporate gifting<\/b>/.test(b2bHtml) &&
    !/<b>Corporate events<\/b>/.test(b2bHtml));

  /* PDP personalisation configurator (PRD §5.3 / §8 #5) */
  check('PDP populated with default personalisable item', registry['#pdpTitle'].textContent === 'Beary Personalisable Baby Gift Set');
  check('configurator toggle visible for eligible product', registry['#persToggle'].hidden === false);
  check('configurator closed by default', registry['#configurator'].hidden === true);
  check('embroidered-only product: method chips = Embroidered only', /Embroidered/.test(registry['#cfgMethods']._html || '') && !/Iron-on/.test(registry['#cfgMethods']._html || ''));
  check('embroidered-only product: placement chips built (Front centre)', /Front centre/.test(registry['#cfgPlacements']._html || ''));
  check('thread colour swatches built', /c-swatch/.test(registry['#cfgColours']._html || ''));
  check('customer / staff (POS) view toggle present', typeof registry['#cfgViewSeg'] === 'object' && typeof registry['#cfgStaffNote'] === 'object');
  check('embroidery: font picker built (curated calligraphy range)', /Elegant Script/.test(registry['#cfgFonts']._html || '') && /Light Script/.test(registry['#cfgFonts']._html || '') && /Graceful Serif/.test(registry['#cfgFonts']._html || '') && /Calligraphy Caps/.test(registry['#cfgFonts']._html || ''));
  check('embroidery: size + language pickers built', /Medium/.test(registry['#cfgSizes']._html || '') && /日本語/.test(registry['#cfgLangs']._html || '') && /한국어/.test(registry['#cfgLangs']._html || ''));
  /* the font range belongs to the script: the four elegant Latin faces carry no
     Chinese/Korean glyphs, so a native name picked against one fell back to a
     system face that looked nothing like the embroidery. */
  check('embroidery fonts are scoped to the script (2 中文 + 2 한국어, none shared with Latin)', (function () {
    var ids = function (l) { return l.map(function (f) { return f.id; }); };
    var en = ids(sandbox.EL.cfgFontsFor('en')), cn = ids(sandbox.EL.cfgFontsFor('cn')), kr = ids(sandbox.EL.cfgFontsFor('kr')), jp = ids(sandbox.EL.cfgFontsFor('jp'));
    var shared = cn.concat(kr, jp).filter(function (id) { return en.indexOf(id) >= 0; });
    return en.length === 4 && cn.length === 2 && kr.length === 2 && jp.length >= 1 && shared.length === 0;
  })());
  check('every script has a declared font range (no language inherits Latin faces)', (function () {
    return sandbox.EL.customLangs.every(function (l) { return sandbox.EL.cfgFontsFor(l.id).length > 0; });
  })());
  check('every font declares a family + script, and each CJK face a native sample glyph', (function () {
    var all = sandbox.EL.customFonts;
    return all.every(function (f) { return !!f.id && !!f.label && !!f.family && !!f.script; }) &&
      all.filter(function (f) { return f.script !== 'latin'; }).every(function (f) { return !!f.sample; });
  })());
  check('Latin still defaults to Graceful Serif; each native script defaults inside its own range', (function () {
    var inRange = function (lang) { return sandbox.EL.cfgFontsFor(lang).map(function (f) { return f.id; }).indexOf(sandbox.EL.cfgDefaultFontId(lang)) >= 0; };
    return sandbox.EL.cfgDefaultFontId('en') === 'serif' && inRange('cn') && inRange('kr') && inRange('jp');
  })());
  var pickLang = function (id) {
    var chip = {
      id: '', closest: function () { return null; }, matches: function () { return false; },
      getAttribute: function (k) { return k === 'data-v' ? id : null; },
      classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } }
    };
    var ev = { target: { closest: function (s) { return s === '#cfgLangs .cfg-chip' ? chip : null; } }, preventDefault: function () {}, stopPropagation: function () {} };
    /* per-listener try/catch: an unrelated click handler may need a fuller stub than
       this one event carries, and it must not stop the configurator's handler */
    (listeners['click'] || []).forEach(function (fn) { try { fn(ev); } catch (e) {} });
    return true;
  };
  check('picking 中文 rebuilds the font chips in the Chinese range (no English face left)', (function () {
    sandbox.EL.initConfigurator(sandbox.EL_PRODUCTS[0]);
    if (!pickLang('cn')) return false;
    var html = registry['#cfgFonts']._html || '';
    return /Elegant Ming/.test(html) && /Brush Calligraphy/.test(html) && /cfg-sample/.test(html) &&
      !/Graceful Serif/.test(html) && !/Elegant Script/.test(html) &&
      (registry['#cfgFont'].textContent || '') === 'Elegant Ming';
  })());
  check('picking 한국어 rebuilds the font chips in the Korean range', (function () {
    sandbox.EL.initConfigurator(sandbox.EL_PRODUCTS[0]);
    if (!pickLang('kr')) return false;
    var html = registry['#cfgFonts']._html || '';
    return /Elegant Myeongjo/.test(html) && /Soft Batang/.test(html) &&
      !/Graceful Serif/.test(html) && !/Elegant Ming/.test(html);
  })());
  check('switching back to English restores the Latin range', (function () {
    sandbox.EL.initConfigurator(sandbox.EL_PRODUCTS[0]);
    pickLang('cn'); pickLang('en');
    var html = registry['#cfgFonts']._html || '';
    return /Graceful Serif/.test(html) && !/Elegant Ming/.test(html) && !/Elegant Myeongjo/.test(html);
  })());
  check('a native script previews the name in its own face (the field is not left in the site font)', (function () {
    sandbox.EL.initConfigurator(sandbox.EL_PRODUCTS[0]);
    pickLang('kr');
    var fam = registry['#cfgText'].style.fontFamily || '';
    return /Nanum Myeongjo/.test(fam);
  })());
  check('English leaves the text field in its own typography (no font flip for Latin)', (function () {
    sandbox.EL.initConfigurator(sandbox.EL_PRODUCTS[0]);
    return (registry['#cfgText'].style.fontFamily || '') === '';
  })());
  /* a stored spec restores script-first: the chips are rebuilt per script, so a
     native font id can only be lit once its script is selected */
  check('restoring a saved spec applies the script before the font', (function () {
    var fn = /function cfgRestore\(spec\)[\s\S]*?\n  \}/.exec(fs.readFileSync('assets/app.js', 'utf8'));
    if (!fn) return false;
    var lang = fn[0].indexOf('cfgPickLang(spec.language)'), font = fn[0].indexOf('cfgPickFont(spec.font)');
    return lang >= 0 && font >= 0 && lang < font;
  })());
  sandbox.EL.initConfigurator({ n: 'Kids Tee - Doodle Mickey', p: 'S$49.90', k: 'disney', img: 'y.jpg', custom: { methods: ['patches'], patchSet: 'disney', patchCount: 3 } });
  check('patches-only product: method chips = Iron-on patches', /Iron-on patches/.test(registry['#cfgMethods']._html || ''));
  check('patches-only product: patch picker built (Pop Mickey)', /Pop Mickey/.test(registry['#cfgPatches']._html || ''));
  check('patches-only product: each patch shows its pre-selected spot', /left chest/.test(registry['#cfgPatches']._html || '') && /right sleeve/.test(registry['#cfgPatches']._html || ''));
  check('patches-only product: patch picker row visible, text row hidden', registry['#cfgPatchesWrap'].hidden === false && registry['#cfgTextWrap'].hidden === true);
  check('patches-only product: up to 3 free shown', (registry['#cfgPatchCount'].textContent || '') === '0 of 3 free');
  check('patches summary renders picked patches', (sandbox.EL.cfgSummaryText() || '').indexOf('Iron-on patches') >= 0);
  /* scripts: the approved-character library is KR/CN/EN (PRD §12), so Chinese must be
     selectable — a name the library approves can never land on the wrong chip */
  check('embroidery scripts include 中文 (PRD §12: KR / CN / EN)', /中文/.test(registry['#cfgLangs']._html || ''));
  check('every language id is unique so a stored spec restores exactly one chip', (function () {
    var ids = sandbox.EL.customLangs.map(function (l) { return l.id; });
    return ids.length === new Set(ids).size && ids.indexOf('cn') >= 0;
  })());
  check('staff character library tags its Chinese entry as cn, not kr', (function () {
    var src = fs.readFileSync('assets/staff.js', 'utf8');
    return /script: 'CN', lang: 'cn'/.test(src) && !/script: 'CN', lang: 'kr'/.test(src);
  })());
  check('staff library seeds each CJK name with a font from its own script\u2019s range', (function () {
    var src = fs.readFileSync('assets/staff.js', 'utf8');
    return /script: 'KR', lang: 'kr', font: 'kr-/.test(src) && /script: 'CN', lang: 'cn', font: 'cn-/.test(src);
  })());
  check('staff library shows an approved name in the typeface it was approved in', (function () {
    var src = fs.readFileSync('assets/staff.js', 'utf8');
    return /char-card__text" lang="' \+ esc\(e\.script\) \+ '"' \+ charFontStyle\(e\)/.test(src) &&
      /window\.EL\.cfgFontById\(e\.font\)/.test(src);
  })());
  check('every family the configurator can pick is loaded by the pages that render it', (function () {
    var fam = sandbox.EL.customFonts.map(function (f) { return f.family.split(',')[0].replace(/['"]/g, '').trim(); });
    var pages = ['pdp.html', 'staff.html', 'cart.html'].map(function (p) { return fs.readFileSync(p, 'utf8').replace(/\+/g, ' '); });
    var missing = [];
    fam.forEach(function (f) {
      pages.forEach(function (src, i) { if (src.indexOf('family=' + f) < 0) missing.push(['pdp.html', 'staff.html', 'cart.html'][i] + ':' + f); });
    });
    return missing.length === 0;
  })());
  check('CJK font chips carry a native sample glyph so the real shapes are visible', (function () {
    var src = fs.readFileSync('assets/styles.css', 'utf8');
    return /\.cfg-fonts \.cfg-chip \.cfg-sample\s*\{/.test(src);
  })());
  /* native scripts get a limit that SCALES with the placement instead of a flat 8,
     so a 12-character blanket corner / keepsake lid keeps its room */
  check('native-script character limit scales with the placement (no flat ceiling)', (function () {
    var f = sandbox.EL.cfgLangMaxFor;
    return f(12, 'kr') === 9 && f(14, 'kr') === 11 && f(10, 'kr') === 8 && f(8, 'kr') === 8 && f(14, 'en') === 14;
  })());
  check('native-script limit is never tighter than the 8 the site already shipped', (function () {
    var f = sandbox.EL.cfgLangMaxFor;
    return [8, 10, 12, 14].every(function (m) { return f(m, 'kr') >= Math.min(m, 8); });
  })());
  check('native-script limit never exceeds its placement booking', (function () {
    var f = sandbox.EL.cfgLangMaxFor;
    return [8, 10, 12, 14].every(function (m) { return f(m, 'cn') <= m && f(m, 'jp') <= m; });
  })());
  /* B2B: decoration is item-aware — the same data the consumer configurator uses */
  check('B2B capability: garment gets the bulk methods, placements include full back', (function () {
    var cap = sandbox.EL.b2bCapability({ type: 'Tops & tees' });
    return cap.deco.join(',') === 'Embroidery,Iron-on,Screen print,DTG' && cap.places.indexOf('full back') >= 0 && cap.diagram === 'tee';
  })());
  check('B2B capability: a keepsake box takes lid embroidery only', (function () {
    var cap = sandbox.EL.b2bCapability({ type: 'Keepsake box' });
    return cap.deco.join(',') === 'Embroidery' && cap.places.join(',') === 'keepsake box lid' && cap.diagram === 'box';
  })());
  check('B2B capability: an undecoratable item (pet bow-tie) offers nothing', (function () {
    var cap = sandbox.EL.b2bCapability({ type: 'Bows' });
    return cap.deco.length === 0;
  })());
  check('B2B capability: an item\u2019s own placements override the garment defaults', (function () {
    var cap = sandbox.EL.b2bCapability({ type: 'Tops & tees', custom: { methods: ['embroidered'], placements: ['left chest', 'sleeve / cuff'] } });
    return cap.places.join(',') === 'left chest,sleeve / cuff,full back';
  })());
  check('B2B panel offers only the item\u2019s own methods', (function () {
    var panel = sandbox.EL.b2bItemPanelHTML({ name: 'Personalisable Turquoise Gift Box', meta: 'x', unit: 60, img: '', sizes: ['One size'], deco: ['Embroidery'], places: ['keepsake box lid'], diagram: 'box' });
    return /Embroidery/.test(panel) && !/Screen print/.test(panel) && !/DTG/.test(panel) && /Standard \(no decoration\)/.test(panel);
  })());
  check('B2B panel says so when an item can take no decoration', (function () {
    var panel = sandbox.EL.b2bItemPanelHTML({ name: 'Pet Bow-Tie', meta: 'x', unit: 20, img: '', sizes: ['S'], deco: [], places: [], diagram: 'bandana' });
    return /js-deco-note/.test(panel) && /Decoration isn/.test(panel) && !/js-b2b-deco" data-method="Embroidery"/.test(panel);
  })());
  check('B2B line panel targets the wholesale per-line minimum note', (function () {
    var panel = sandbox.EL.b2bItemPanelHTML({ name: 'Tee', meta: 'x', unit: 40, img: '', sizes: ['S'], deco: ['Embroidery'], places: ['left chest'], diagram: 'tee' });
    return /js-line-moq/.test(panel);
  })());
  /* B2B embroidery pane is built from the SAME tables as the PDP configurator */
  check('B2B embroidery pane uses the item\u2019s placements and its own diagram', (function () {
    var pane = sandbox.EL.b2bParamHTML('Embroidery', { places: ['keepsake box lid'], diagram: 'box' });
    return /Keepsake box lid/.test(pane) && !/Full back/.test(pane) && /data-diagram="box"/.test(pane);
  })());
  check('B2B embroidery pane carries script, font, size and the consumer thread palette', (function () {
    var pane = sandbox.EL.b2bParamHTML('Embroidery', { places: ['left chest'], diagram: 'tee' });
    return /data-param="lang"/.test(pane) && /中文/.test(pane) && /Graceful Serif/.test(pane) && /data-param="fontSize"/.test(pane) && /data-col="Cream"/.test(pane) && /data-col="Navy"/.test(pane) && /is-on" style="background:#ff6070"/.test(pane);
  })());
  check('B2B font select offers only the script\u2019s range (a 中文 run gets no Latin face)', (function () {
    var cn = sandbox.EL.b2bFontOptions('cn'), kr = sandbox.EL.b2bFontOptions('kr'), en = sandbox.EL.b2bFontOptions('en');
    return /ZCOOL XiaoWei/.test(cn) && /Ma Shan Zheng/.test(cn) && !/Great Vibes|Cinzel|Cormorant/.test(cn) &&
      /Nanum Myeongjo/.test(kr) && /Gowun Batang/.test(kr) && !/Great Vibes|Cinzel|Cormorant/.test(kr) &&
      /Cormorant Garamond/.test(en) && /selected/.test(en);
  })());
  check('B2B embroidery pane starts on the Latin range (Script defaults to English)', (function () {
    var pane = sandbox.EL.b2bParamHTML('Embroidery', { places: ['left chest'], diagram: 'tee' });
    return /data-param="font"/.test(pane) && /Graceful Serif<\/option>/.test(pane) && !/ZCOOL XiaoWei/.test(pane);
  })());
  check('changing the B2B Script rebuilds the Font type select in that script', (function () {
    var fontSel = makeEl('select');
    fontSel.value = 'Graceful Serif';
    var langSel = makeEl('select');
    langSel.value = '\u4e2d\u6587';
    var line = makeEl('div');
    line.querySelector = function (sel) {
      if (sel === 'select[data-param="font"]') return fontSel;
      if (sel === 'select[data-param="lang"]') return langSel;
      if (sel === '.js-limit-note') return makeEl('p');
      return null;
    };
    langSel.closest = function (s) { return s === '.js-b2b-line' ? line : null; };
    var ev = {
      target: {
        id: '', value: '\u4e2d\u6587', name: '',
        closest: function (s) { return s === 'select[data-param="lang"]' ? langSel : null; },
        matches: function () { return false; }
      }
    };
    /* per-listener try/catch: earlier change handlers expect a fuller stub, and one
       of them throwing must not hide the B2B behaviour under test */
    (listeners['change'] || []).forEach(function (fn) { try { fn(ev); } catch (e) {} });
    return /ZCOOL XiaoWei/.test(fontSel._html || '') && /Ma Shan Zheng/.test(fontSel._html || '') &&
      !/Great Vibes/.test(fontSel._html || '') && fontSel.getAttribute('data-script') === 'cn';
  })());
  check('B2B embroidery pane captures per-unit names with a live count', (function () {
    var pane = sandbox.EL.b2bParamHTML('Embroidery', { places: ['left chest'], diagram: 'tee' });
    return /js-dp-names/.test(pane) && /js-names-note/.test(pane) && /js-limit-note/.test(pane);
  })());
  check('B2B placement diagram follows the item shape, not always a t-shirt', (function () {
    var box = sandbox.EL.b2bPlaceDiag('keepsake box lid', 'box');
    var tee = sandbox.EL.b2bPlaceDiag('left chest', 'tee');
    return /Keepsake box lid/.test(box) && /ellipse cx="50" cy="7"/.test(tee) && !/ellipse cx="50" cy="7"/.test(box);
  })());
  check('multi-kind overlap: Disney tee also in Customization pool', typeof sandbox.EL.inKind === 'function' && sandbox.EL.inKind(sandbox.EL_PRODUCTS[1], 'custom') === true && sandbox.EL.inKind(sandbox.EL_PRODUCTS[0], 'custom') === true);
  check('multi-kind overlap: pickPool includes cross-kind product once', (sandbox.EL.pickPool([{ k: 'custom' }]).map((p) => p.n).indexOf('Kids Tee - Doodle Mickey') >= 0));
  /* personalisation is ONE derived property (custom.methods) — there is no stored
     `method` facet and no `giftStyle` flag to drift out of sync, and every surface
     asks the same predicate */
  check('one personalisation predicate: EL + staff agree', typeof sandbox.EL.isPersonalisable === 'function' && sandbox.EL.isPersonalisable(sandbox.EL_PRODUCTS[1]) === true && sandbox.EL.isPersonalisable(sandbox.EL_PRODUCTS[2]) === false && sandbox.EL_STAFF.isPersonalisable(sandbox.EL_PRODUCTS[1]) === sandbox.EL.isPersonalisable(sandbox.EL_PRODUCTS[1]));
  /* the overlay must be visible on the listing card BEFORE the shopper opens the PDP */
  check('listing cards overlay the Personalisable chip only when eligible', (function () {
    var yes = sandbox.EL.productCard(sandbox.EL_PRODUCTS[1]);
    var no = sandbox.EL.productCard(sandbox.EL_PRODUCTS[2]);
    /* the same coral chip the staff tablet overlays on its result thumbs */
    return /badge badge--coral">Personalisable</.test(yes) && !/Personalisable/.test(no);
  })());
  check('search alias: "personalisable" wired to the Personalisation intent', (function () {
    /* smoke uses a stub catalog and never loads EL_INTENTS, so assert the alias on the
       source — the intent match itself is exercised by the real-catalog checks */
    var src = fs.readFileSync('assets/products.js', 'utf8');
    var m = /key: 'custom'[\s\S]{0,200}?aliases:\s*\[([^\]]*)\]/.exec(src);
    return !!m && m[1].indexOf("'personalisable'") >= 0;
  })());
  check('product database stores no duplicate personalisation fields', (function () {
    var src = fs.readFileSync('assets/products.js', 'utf8');
    return !/"method":/.test(src) && !/"giftStyle":\[[^\]]*Personalisable/.test(src);
  })());
  check('card badge overlay stacks above the product photo (CSS z-index)', (function () {
    /* markup alone can't catch this: the real card's <img> is position:absolute and
       follows the badge in the DOM, so the badge vanishes without a z-index */
    var src = fs.readFileSync('assets/styles.css', 'utf8');
    var m = /\.ph-card__badges\s*\{([^}]*)\}/.exec(src);
    return !!m && /z-index\s*:/.test(m[1]);
  })());
  /* Every listing page's filter sheet is position: fixed on mobile. A transformed
     (or will-change: transform) ancestor becomes the containing block for fixed
     descendants, so the section hosting the sheet must use the fade-only bump —
     otherwise the sheet is laid out against the section instead of the viewport and
     filtering looks dead on phones while desktop (static panel) is unaffected. */
  ['disney-elly', 'search', 'furkids', 'elly-label', 'shoe-boutique', 'customization', 'gifting-hub'].forEach(function (page) {
    var src = fs.readFileSync(page + '.html', 'utf8');
    var panel = src.indexOf('id="facetPanel"');
    var open = src.lastIndexOf('<section', panel);
    var tag = open < 0 ? '' : src.slice(open, src.indexOf('>', open) + 1);
    check(page + ': filter-sheet section uses the fade-only bump (no transform)', /data-bump="fade"/.test(tag));
  });
  check('fade-only bump clears transform + will-change in CSS', (function () {
    var src = fs.readFileSync('assets/styles.css', 'utf8');
    var m = /\[data-bump="fade"\][^{]*\{([^}]*)\}/.exec(src);
    return !!m && /transform:\s*none/.test(m[1]) && /will-change:\s*auto/.test(m[1]);
  })());
  /* ---------- mobile filter sheet: committing a filter collapses the overlay ----------
     The sheet covers the grid on phones, so leaving it open hid the very result of the
     filter the shopper just chose. Desktop is unaffected: there the panel sits in flow
     beside the grid and never receives .show. */
  (function () {
    /* the listing pages own #facetPanel; register a stand-in for $()/querySelector */
    var panel = makeEl('aside');
    registry['#facetPanel'] = panel;
    function stub(kind) {
      var el = {
        id: '', value: '', files: [],
        closest: function (s) {
          if (kind === 'change') return s === '.facet-panel input[type="checkbox"]' ? el : null;
          return s === '.c-swatch' ? el : null;
        },
        matches: function () { return false; },
        getAttribute: function () { return 'Cream'; },
        classList: { toggle: function () { return true; }, add: function () {}, remove: function () {}, contains: function () { return true; } }
      };
      return el;
    }
    function commit(kind) {
      var ev = { target: stub(kind), preventDefault: function () {}, stopPropagation: function () {} };
      try { (listeners[kind] || []).forEach(function (fn) { fn(ev); }); } catch (e) { /* later listeners may need a fuller stub */ }
    }
    panel.classList.add('show'); commit('change');
    check('mobile: choosing a facet collapses the filter sheet', !panel.classList.contains('show'));
    panel.classList.add('show'); commit('click');
    check('mobile: choosing a colour swatch collapses the filter sheet', !panel.classList.contains('show'));
    commit('change');
    check('desktop: a filter tap leaves the in-flow panel untouched', !panel.classList.contains('show'));
    delete registry['#facetPanel'];   /* don't leak into the grid/facet checks below */
  })();
  check('hideFacets clears the borrowed drawer scrim as well', (function () {
    var m = /function hideFacets\(\)[\s\S]*?\n  \}/.exec(fs.readFileSync('assets/app.js', 'utf8'));
    return !!m && /hideScrim\('drawer'\)/.test(m[0]);
  })());
  check('PDP carries no Personalisable badge — the configurator is the signal', (function () {
    var src = fs.readFileSync('pdp.html', 'utf8');
    return /id="pdpPersAcc" hidden/.test(src) && !/Personalisable/.test(src);
  })());
  /* PDP gallery: thumbnails are built from the item's own images (no static placeholders),
     each carries its image for the click-to-swap, and a single-image item collapses the rail */
  check('PDP gallery: thumbnails built from the item, not left as placeholders', (function () {
    var thumbs = registry['.pdp__thumbs']._html || '';
    return /class="pdp__thumb is-real is-on"/.test(thumbs) && /data-img="x\.jpg"/.test(thumbs) && thumbs.indexOf('<svg') < 0;
  })());
  check('PDP gallery: a single-image item collapses the thumbnail rail', registry['.pdp__gal'].classList.contains('pdp__gal--solo') === true);
  check('PDP gallery: pdp.html ships no static placeholder thumbnails', (function () {
    var src = fs.readFileSync('pdp.html', 'utf8');
    var m = /<div class="pdp__thumbs"[^>]*>([\s\S]*?)<\/div>/.exec(src);
    return !!m && m[1].trim() === '';
  })());
  check('PDP gallery: click handler swaps the main photo from data-img', (function () {
    var src = fs.readFileSync('assets/app.js', 'utf8');
    return /thumb\.getAttribute\('data-img'\)/.test(src) && /\.pdp__main \.pdp-img/.test(src);
  })());
  check('PDP gallery: single-image collapse rule exists in CSS', (function () {
    var src = fs.readFileSync('assets/styles.css', 'utf8');
    return /\.pdp__gal--solo\s*\{[^}]*grid-template-columns/.test(src) && /\.pdp__gal--solo \.pdp__thumbs\s*\{[^}]*display:\s*none/.test(src);
  })());
  check('PDP gallery: clicking a thumbnail actually swaps the main photo', (function () {
    var mainImg = makeEl('img'); mainImg.src = 'A.jpg'; mainImg.alt = 'Product';
    registry['.pdp__main .pdp-img'] = mainImg;   /* what $('.pdp__main .pdp-img') resolves to */
    var thumb = makeEl('button');
    thumb.dataset['data-img'] = 'B.jpg'; thumb.dataset['aria-label'] = 'Image 2';
    thumb.parentElement = registry['.pdp__thumbs'];
    var ev = { target: { closest: (s) => (s === '.pdp__thumb' ? thumb : null) } };
    try { (listeners['click'] || []).forEach((fn) => fn(ev)); } catch (e) { return false; }
    return mainImg.src === 'B.jpg' && thumb.classList.contains('is-on');
  })());

  /* ---------- personalisation on a bag line (edit it from the cart) ----------
     The spec is stored the same way as the bag: a localStorage map keyed by account,
     then by product name (the same key the cart aggregates lines on). */
  check('personalisation: cfgSpec() is null until something is set, then captures it', (function () {
    sandbox.EL.initConfigurator(sandbox.EL_PRODUCTS[0]);   /* default PDP item, embroidered */
    var empty = sandbox.EL.cfgSpec();
    var ev = { target: { id: 'cfgText', value: 'Amelia', closest: function () { return null; } } };
    (listeners['input'] || []).forEach(function (fn) { fn(ev); });
    var spec = sandbox.EL.cfgSpec();
    return empty === null && !!spec && spec.method === 'embroidered' && spec.text === 'Amelia' && /Amelia/.test(spec.summary);
  })());
  check('personalisation: the cart line shows the saved spec with Edit / Remove', (function () {
    sandbox.EL.setBag(0);
    sandbox.EL.addToBag('Beary Personalisable Baby Gift Set');
    sandbox.EL.savePers('Beary Personalisable Baby Gift Set', { method: 'embroidered', text: 'Amelia', summary: "'Amelia' \u00b7 Front centre" });
    /* cart.html has only #cartLines; #ckLines makes populateCartLines take the compact
       checkout branch, so drop the stub for this check to mirror the real cart page */
    var ck = registry['#ckLines']; delete registry['#ckLines'];
    sandbox.EL.populateCartLines();
    var html = registry['#cartLines']._html || '';
    registry['#ckLines'] = ck;
    return /Personalised:/.test(html) && /js-edit-pers/.test(html) && /js-clear-pers/.test(html);
  })());
  check('personalisation: a personalisable line with no spec offers to add one', (function () {
    sandbox.EL.savePers('Beary Personalisable Baby Gift Set', null);
    var ck = registry['#ckLines']; delete registry['#ckLines'];
    sandbox.EL.populateCartLines();
    var html = registry['#cartLines']._html || '';
    registry['#ckLines'] = ck;
    return /js-edit-pers/.test(html) && /Add a name \/ initials/.test(html) && !/Personalised:/.test(html);
  })());
  check('personalisation: removing the bag line drops its spec', (function () {
    sandbox.EL.savePers('Beary Personalisable Baby Gift Set', { method: 'embroidered', text: 'Amelia', summary: "'Amelia'" });
    var had = !!sandbox.EL.persFor('Beary Personalisable Baby Gift Set');
    sandbox.EL.removeFromBag('Beary Personalisable Baby Gift Set');
    return had && sandbox.EL.persFor('Beary Personalisable Baby Gift Set') === null;
  })());
  check('personalisation: the cart editor injects the real configurator controls', (function () {
    sandbox.EL.setBag(0);
    sandbox.EL.addToBag('Beary Personalisable Baby Gift Set');
    sandbox.EL.openPersEditor('Beary Personalisable Baby Gift Set');
    var html = registry['#persEditor']._html || '';
    var open = registry['#persEditor'].hidden === false && /js-save-pers/.test(html) && /js-cancel-pers/.test(html) &&
      /cfg-row/.test(html) && /id="cfgText"/.test(html) && /cfgSummary/.test(html);
    sandbox.EL.closePersEditor();
    return open && registry['#persEditor'].hidden === true;
  })());
  check('personalisation: specs are per profile, exactly like the bag', (function () {
    sandbox.EL.setBag(0);
    sandbox.EL.savePers('Beary Personalisable Baby Gift Set', { summary: 'guest spec' });
    var guest = sandbox.EL.persFor('Beary Personalisable Baby Gift Set');
    sandbox.ELSEG.signIn('tom-cook');
    var tom = sandbox.EL.persFor('Beary Personalisable Baby Gift Set');
    sandbox.ELSEG.signOut();
    return !!guest && tom === null;
  })());
  check('personalisation: adding a personalised PDP item stores its spec with the bag', (function () {
    sandbox.EL.setBag(0);
    sandbox.EL.initConfigurator(sandbox.EL_PRODUCTS[0]);
    var evIn = { target: { id: 'cfgText', value: 'Noah', closest: function () { return null; } } };
    (listeners['input'] || []).forEach(function (fn) { fn(evIn); });
    /* a realistic size chip: the PDP add reads data-size off the picked chip */
    var picked = {
      classList: { add: function () {}, remove: function () {}, contains: function () { return true; } },
      getAttribute: function (a) { return a === 'data-size' ? 'Set' : null; },
      textContent: 'Set'
    };
    var sizeSel = { querySelector: function (s) { return s === '.size-chip.is-on' ? picked : { value: '1' }; } };
    var buy = { getAttribute: function () { return null; }, closest: function () { return sizeSel; } };
    var ev = { target: { closest: function (s) { return s === '.js-buy' ? buy : null; } }, preventDefault: function () {} };
    try { (listeners['click'] || []).forEach(function (fn) { fn(ev); }); } catch (e) { return false; }
    var spec = sandbox.EL.persFor('Beary Personalisable Baby Gift Set');
    /* the gift set is single-variant ("Set"), so no size is attached and the entry
       stays the plain name — a listing quick-add would be the same line */
    return !!spec && spec.text === 'Noah' &&
      sandbox.EL.bagItems().indexOf('Beary Personalisable Baby Gift Set') >= 0;
  })());
  sandbox.EL.savePers('Beary Personalisable Baby Gift Set', null);
  sandbox.EL.setBag(0);
  check('personalisation: staff rows carry the customer\u2019s saved spec (and only theirs)', (function () {
    sandbox.EL.savePersForAccount('chloe-ng', 'Kids Tee - Doodle Mickey', {
      method: 'embroidered', text: 'Mia', placement: 'front', colourName: 'Navy', font: 'serif', fontSize: 'md', language: 'en', patches: []
    });
    var hers = sandbox.EL_STAFF.rowsFromNames(['Kids Tee - Doodle Mickey'], 'chloe-ng');
    var his = sandbox.EL_STAFF.rowsFromNames(['Kids Tee - Doodle Mickey'], 'tom-cook');
    var spec = sandbox.EL.persForAccount('chloe-ng', 'Kids Tee - Doodle Mickey');
    var out = hers.length === 1 && !!hers[0].pers && hers[0].pers.text === 'Mia' && his[0].pers === null &&
      !!spec.summary && /Mia/.test(spec.summary) && /Embroidered/.test(spec.summary);   /* summary rendered from the tables */
    sandbox.EL.savePersForAccount('chloe-ng', 'Kids Tee - Doodle Mickey', null);
    return out;
  })());
  check('staff drawer: the Name step is dropped for patches-only items', (function () {
    var embro = sandbox.EL_STAFF.drawerStepsFor(sandbox.EL_PRODUCTS[0]);   /* embroidered */
    var patches = sandbox.EL_STAFF.drawerStepsFor(sandbox.EL_PRODUCTS[1]); /* patches only */
    return embro.join(',') === '1,2,3' && patches.join(',') === '1,3';
  })());

  /* size runs come from the item — a gift/plush/pet must never offer baby months */
  check('sizeRun: item\u2019s own run wins (gift set -> Set)', JSON.stringify(sandbox.EL.sizeRun({ type: 'Gift set', sizes: ['Set'] })) === JSON.stringify(['Set']));
  check('sizeRun: pet item -> pet S/M/L, not months', JSON.stringify(sandbox.EL.sizeRun({ petSize: ['S \u2014 small', 'M \u2014 medium'] })) === JSON.stringify(['S \u2014 small', 'M \u2014 medium']));
  check('sizeRun: shoe item -> shoe sizes', JSON.stringify(sandbox.EL.sizeRun({ shoeSizes: ['Size 18\u201322'] })) === JSON.stringify(['Size 18\u201322']));
  check('sizeRun: unknown item safely falls back to One size', JSON.stringify(sandbox.EL.sizeRun({})) === JSON.stringify(['One size']));
  /* bag count consistency: one shared counter element in the injected header, one
     storage key, same value on every page (components.js injects it site-wide) */
  check('bag count element injected in shared header', typeof registry['#bagCount'] === 'object' && /id="bagCount"/.test(all));
  sandbox.EL.setBag(3);
  check('bag count shows 3 after setBag(3)', String(registry['#bagCount'].textContent) === '3' && registry['#bagCount'].hidden === false);
  check('bagCount() reads back the shared value', sandbox.EL.bagCount() === 3);
  sandbox.EL.refreshBag();
  check('refreshBag keeps the count in sync', String(registry['#bagCount'].textContent) === '3' && registry['#bagCount'].hidden === false);
  sandbox.EL.setBag(0);
  check('bag count hides at zero', String(registry['#bagCount'].textContent) === '0' && registry['#bagCount'].hidden === true);
  /* cart/checkout lines derive their count from the same elly-bag items */
  sandbox.EL.setBag(3);
  sandbox.EL.populateCartLines();
  /* repeated adds of the same item collapse into ONE line that carries the quantity */
  check('cart aggregates repeated items into one line with a quantity', (registry['#cartLines']._html || '').split('js-cart-line').length - 1 === 1 && /data-qty="3"/.test(registry['#cartLines']._html || ''));
  check('cart empty state hidden when items present', (registry['#cartEmpty'].style.display || '') === 'none');
  sandbox.EL.setBag(0);
  sandbox.EL.populateCartLines();
  check('cart page shows empty state at zero', (registry['#cartLines']._html || '').indexOf('js-cart-line') < 0 && (registry['#cartEmpty'].style.display || '') !== 'none');
  /* quantity: a PDP add carries its stepper value, and setBagQty re-scales a line */
  sandbox.EL.addToBag('Beary Personalisable Baby Gift Set', 3);
  check('addToBag(qty) stores one unit per quantity', sandbox.EL.bagCount() === 3 && sandbox.EL.bagItems().length === 3);
  sandbox.EL.setBagQty('Beary Personalisable Baby Gift Set', 1);
  check('setBagQty re-scales the line and the badge', sandbox.EL.bagCount() === 1);
  sandbox.EL.setBag(0);
  check('bag resets to zero for the item-name checks below', sandbox.EL.bagCount() === 0);
  /* bag tracks the actual items added, and removal keeps count + contents in sync */
  sandbox.EL.addToBag('Kids Tee - Doodle Mickey');
  sandbox.EL.addToBag('Beary Personalisable Baby Gift Set');
  check('bag stores the item names added', sandbox.EL.bagItems().indexOf('Kids Tee - Doodle Mickey') >= 0 && sandbox.EL.bagItems().length === 2);
  check('badge count follows added items', sandbox.EL.bagCount() === 2 && String(registry['#bagCount'].textContent) === '2');
  sandbox.EL.populateCartLines();
  check('cart renders the actual added items', (registry['#cartLines']._html || '').indexOf('Kids Tee - Doodle Mickey') >= 0 && (registry['#cartLines']._html || '').indexOf('Beary Personalisable Baby Gift Set') >= 0);
  check('remove drops the item from the bag', sandbox.EL.removeFromBag('Kids Tee - Doodle Mickey') === true && sandbox.EL.bagItems().length === 1 && sandbox.EL.bagItems().indexOf('Kids Tee - Doodle Mickey') < 0);
  check('badge count matches remaining items after remove', sandbox.EL.bagCount() === 1 && String(registry['#bagCount'].textContent) === '1');
  sandbox.EL.populateCartLines();
  check('cart line removed and remaining item shown', (registry['#cartLines']._html || '').indexOf('Kids Tee - Doodle Mickey') < 0 && (registry['#cartLines']._html || '').indexOf('Beary Personalisable Baby Gift Set') >= 0);

  /* ---------- same item, different sizes: one basket line per size ----------
     The size rides WITH the bag entry, so a matching family/twin set (one style in
     3Y and 5Y) is two lines with their own quantity — never "qty 2" of one line. */
  sandbox.EL.setBag(0);
  sandbox.EL.addToBag('Kids Tee - Doodle Mickey', 1, '3Y');
  sandbox.EL.addToBag('Kids Tee - Doodle Mickey', 1, '5Y');
  check('bag keeps the picked size with the entry', (function () {
    var items = sandbox.EL.bagItems();
    return items.length === 2 &&
      items.indexOf('Kids Tee - Doodle Mickey::3Y') >= 0 &&
      items.indexOf('Kids Tee - Doodle Mickey::5Y') >= 0 &&
      sandbox.EL.bagNames().join('|') === 'Kids Tee - Doodle Mickey|Kids Tee - Doodle Mickey';
  })());
  sandbox.EL.populateCartLines();
  /* NB: the harness registers #ckLines too, so populateCartLines renders the compact
     checkout line ("Size 3Y · qty 1"); the full cart line renders "Size: 3Y" */
  check('cart renders the same item in two sizes as two lines', (function () {
    var html = registry['#cartLines']._html || '';
    return (html.split('js-cart-line').length - 1) === 2 &&
      /Size:? 3Y/.test(html) && /Size:? 5Y/.test(html) &&
      (html.match(/data-qty="1"/g) || []).length === 2;
  })());
  check('cart lines are keyed by item + size, not just the item', (registry['#cartLines']._html || '').indexOf('data-entry="Kids Tee - Doodle Mickey::3Y"') >= 0 &&
    (registry['#cartLines']._html || '').indexOf('data-entry="Kids Tee - Doodle Mickey::5Y"') >= 0);
  check('adding the same size again still merges into that one line', (function () {
    sandbox.EL.addToBag('Kids Tee - Doodle Mickey', 1, '3Y');
    sandbox.EL.populateCartLines();
    var html = registry['#cartLines']._html || '';
    return (html.split('js-cart-line').length - 1) === 2 &&
      /data-entry="Kids Tee - Doodle Mickey::3Y" data-price="[^"]*" data-qty="2"/.test(html);
  })());
  check('stepping one size leaves the other size alone', (function () {
    sandbox.EL.setBagQty('Kids Tee - Doodle Mickey::3Y', 4);
    var items = sandbox.EL.bagItems();
    var three = items.filter(function (x) { return x === 'Kids Tee - Doodle Mickey::3Y'; }).length;
    var five = items.filter(function (x) { return x === 'Kids Tee - Doodle Mickey::5Y'; }).length;
    return three === 4 && five === 1 && sandbox.EL.bagCount() === 5;
  })());
  check('removing one size leaves the other in the basket', (function () {
    var removed = sandbox.EL.removeFromBag('Kids Tee - Doodle Mickey::3Y');
    var items = sandbox.EL.bagItems();
    sandbox.EL.populateCartLines();
    var html = registry['#cartLines']._html || '';
    return removed && items.length === 1 && items[0] === 'Kids Tee - Doodle Mickey::5Y' &&
      (html.split('js-cart-line').length - 1) === 1 && /Size:? 5Y/.test(html) && !/Size:? 3Y/.test(html);
  })());
  check('recommendations still exclude the item by NAME, whatever size is in the bag', (function () {
    var ex = sandbox.EL.bagNames();
    return ex.length === 1 && ex[0] === 'Kids Tee - Doodle Mickey';
  })());
  /* the PDP records the picked size — a multi-size item keeps the size it was added
     with, and the single-variant path (checked above) stays a plain name */
  check('PDP add stores the picked size for a multi-size item', (function () {
    sandbox.EL.setBag(0);
    var chip = {
      classList: { add: function () {}, remove: function () {}, contains: function () { return true; } },
      getAttribute: function (a) { return a === 'data-size' ? '3Y' : null; },
      textContent: '3Y'
    };
    var sizeSel = { querySelector: function (s) { return s === '.size-chip.is-on' ? chip : { value: '2' }; } };
    var buy = {
      getAttribute: function (a) { return a === 'data-p' ? 'Kids Tee - Doodle Mickey' : null; },
      closest: function () { return sizeSel; }
    };
    var ev = { target: { closest: function (s) { return s === '.js-buy' ? buy : null; } }, preventDefault: function () {} };
    try { (listeners['click'] || []).forEach(function (fn) { fn(ev); }); } catch (e) { return false; }
    var items = sandbox.EL.bagItems();
    var ok = items.length === 2 && items.every(function (x) { return x === 'Kids Tee - Doodle Mickey::3Y'; });
    sandbox.EL.savePers('Kids Tee - Doodle Mickey', null);
    sandbox.EL.setBag(0);
    return ok;
  })());
  /* the REAL cart page has no #ckLines, so it renders the full line ("Size: 3Y ·
     Colours: …"); the harness registers both ids, so drop the checkout summary
     briefly to exercise that path too */
  check('cart page line states the picked size beside the colour', (function () {
    var saved = registry['#ckLines'];
    delete registry['#ckLines'];
    sandbox.EL.setBag(0);
    sandbox.EL.addToBag('Kids Tee - Doodle Mickey', 1, '3Y');
    sandbox.EL.addToBag('Kids Tee - Doodle Mickey', 1, '5Y');
    sandbox.EL.populateCartLines();
    var html = registry['#cartLines']._html || '';
    registry['#ckLines'] = saved;
    return (html.split('js-cart-line').length - 1) === 2 &&
      /Size: 3Y \u00b7 Colours/.test(html) && /Size: 5Y \u00b7 Colours/.test(html) &&
      /qty-row/.test(html);
  })());
  sandbox.EL.setBag(0);

  /* ---------- in-store staff assist (PRD §12) — Workflows 1 & 2 ---------- */
  check('stock check: in-store item resolves to store', sandbox.EL_STAFF.checkStock('disney-1').loc === 'store');
  check('stock check: popular edit in-store (Bamboo set)', sandbox.EL_STAFF.checkStock('elly-1').loc === 'store');
  check('stock check: niche SKU is warehouse-only with wait time', (function () { var s = sandbox.EL_STAFF.checkStock('elly-24'); return s.loc === 'warehouse' && !!s.wait; })());
  check('stock check: warehouse carries popular + niche SKUs', sandbox.EL_STAFF.checkStock('elly-4').loc === 'warehouse' && sandbox.EL_STAFF.checkStock('disney-6').loc === 'warehouse');
  check('stock check: warehouse qty exceeds store qty for shared SKUs', (function () { var s = sandbox.EL_STAFF.stockSplit('disney-1'); return s.store > 0 && s.wh > s.store; })());
  check('stock check: warehouse covers more SKUs than the store edit', (function () {
    /* store edit is the curated popular list; anything not on it falls back to warehouse */
    var a = sandbox.EL_STAFF.stockSplit('elly-24'); /* niche swim shorts — not on the shelf */
    return a.store === 0 && a.wh > 0;
  })());
  check('stock check: unavailable item flagged (lost-sale path)', sandbox.EL_STAFF.checkStock('elly-20').loc === 'none');
  check('stock check: pop-up never offered as a source', ['disney-1', 'elly-24', 'elly-20'].every(function (id) { return sandbox.EL_STAFF.checkStock(id).loc !== 'popup'; }));
  check('character library: seeded KR/CN/EN entries', sandbox.EL_STAFF.library().length >= 7);
  check('character library: search filters by script/name', sandbox.EL_STAFF.searchLibrary('KR').length >= 1 && sandbox.EL_STAFF.searchLibrary('美娜').length >= 1);
  var staffOrder = sandbox.EL_STAFF_DAO.create({
    customerId: 'tom-cook', customerName: 'Tom Cook', occasion: 'Family Photoshoot',
    items: [{ name: 'Kids Tee - Doodle Mickey', size: '3Y', qty: 1 }],
    personalisation: 'Embroidered · Front centre · Amelia',
    wearer: { name: 'Amelia', ageSize: '3Y', rel: 'Child — daughter' },
    fulfilment: 'Pick up at One Holland Village'
  });
  check('draft order created with OHV ref + received status', /^OHV-\d+$/.test(staffOrder.ref) && staffOrder.status === 'received');
  check('draft order persisted + readable by ref', sandbox.EL_STAFF_DAO.byRef(staffOrder.ref) !== null);
  var advancedStaff = sandbox.EL_STAFF_DAO.advance(staffOrder.ref);
  check('order status advances (received → in production)', advancedStaff && advancedStaff.status === 'in production');
  var staffAccHTML = sandbox.EL_STAFF.accountOrdersHTML('tom-cook');
  check('account view: staff order + wearer + status ladder rendered', staffAccHTML.indexOf('Amelia') >= 0 && staffAccHTML.indexOf('in production') >= 0 && staffAccHTML.indexOf(staffOrder.ref) >= 0);
  check('account view: empty state for an account with no staff orders', sandbox.EL_STAFF.accountOrdersHTML('chloe-ng').indexOf('No staff-assisted orders yet') >= 0);

  /* build-the-set flow: search → photo confirm → per-item personalisation */
  check('catalog search: finds the Doodle Mickey tee', (function () {
    var hits = sandbox.EL_STAFF.searchItems('doodle');
    return hits.some(function (p) { return p.id === 'disney-1'; });
  })());
  check('catalog search: finds the niche swim shorts (warehouse item)', (function () {
    var hits = sandbox.EL_STAFF.searchItems('swim');
    return hits.some(function (p) { return p.id === 'elly-24'; });
  })());
  check('personalisation eligibility: tee yes, swim shorts no', (function () {
    return sandbox.EL_STAFF.isPersonalisable(sandbox.EL_STAFF.productById('disney-1')) === true &&
      sandbox.EL_STAFF.isPersonalisable(sandbox.EL_STAFF.productById('elly-24')) === false;
  })());
  check('persSummary formats a saved spec for chips/review', sandbox.EL_STAFF.persSummary({ text: 'Amelia', placement: 'left chest', colourName: 'Coral', font: 'serif', fontSize: 'md', language: 'en' }).indexOf('Amelia') >= 0);
  var perItemOrder = sandbox.EL_STAFF_DAO.create({
    customerId: 'tom-cook', customerName: 'Tom Cook', occasion: 'Family Photoshoot',
    items: [
      { name: 'Kids Tee - Doodle Mickey', size: '3Y', qty: 1, pers: { summary: "'Amelia' · left chest · Coral thread" }, wearer: { name: 'Amelia', ageSize: '3Y', rel: 'Child — daughter' } },
      { name: 'Adult Tee - Lion City', size: 'M', qty: 1, pers: { summary: "'Olivia' · sleeve · Navy thread" }, wearer: { name: 'Olivia', ageSize: 'M', rel: 'Self' } },
      { name: 'Swim Shorts - Turtles', size: '4Y', qty: 1 }
    ],
    fulfilment: 'Pick up at One Holland Village'
  });
  check('draft order stores per-item personalisation specs', perItemOrder.items.length === 3 && perItemOrder.items[0].pers && perItemOrder.items[0].pers.summary.indexOf('Amelia') >= 0 && perItemOrder.items[2].pers === null);
  var perItemHTML = sandbox.EL_STAFF.accountOrdersHTML('tom-cook');
  check('account view: each personalised item listed with its own name + wearer', perItemHTML.indexOf('Amelia') >= 0 && perItemHTML.indexOf('Olivia') >= 0 && perItemHTML.indexOf('2 personalised') >= 0 && perItemHTML.indexOf('wearer Amelia') >= 0);

  /* per-customer set = the customer's bag: the staff set and the online bag
     are ONE shared localStorage store (elly-bags), keyed by account id */
  check('per-customer bag: saves an item for an account and restores it', (function () {
    sandbox.EL_STAFF.bag.save('tom-cook', ['Kids Tee - Doodle Mickey']);
    var b = sandbox.EL_STAFF.bag.get('tom-cook');
    return b.length === 1 && b[0] === 'Kids Tee - Doodle Mickey';
  })());
  check('per-customer bag: a different customer has an empty set', sandbox.EL_STAFF.bag.get('chloe-ng').length === 0);
  check('per-customer bag: walk-in / new customer is never persisted', (function () {
    sandbox.EL_STAFF.bag.save('', ['Swim Shorts - Turtles']);
    return !('' in sandbox.EL_STAFF.bag.all());
  })());
  check('per-customer bag: names materialise into staff rows', (function () {
    var rows = sandbox.EL_STAFF.rowsFromNames(['Kids Tee - Doodle Mickey']);
    return rows.length === 1 && rows[0].name === 'Kids Tee - Doodle Mickey' && !!rows[0].img;
  })());
  check('per-customer bag: clearing the set empties it for the account', (function () {
    sandbox.EL_STAFF.bag.clear('tom-cook');
    return sandbox.EL_STAFF.bag.get('tom-cook').length === 0;
  })());
  /* a sized basket entry loads as one row per size, carrying the customer's size */
  check('per-customer bag: the saved size loads into the staff row', (function () {
    var rows = sandbox.EL_STAFF.rowsFromNames(['Kids Tee - Doodle Mickey::3Y', 'Kids Tee - Doodle Mickey::5Y'], 'tom-cook');
    return rows.length === 2 &&
      rows[0].name === 'Kids Tee - Doodle Mickey' && rows[0].size === '3Y' &&
      rows[1].name === 'Kids Tee - Doodle Mickey' && rows[1].size === '5Y' &&
      rows[0].img === rows[1].img;
  })());
  check('per-customer bag: dropping one size row keeps the other size', (function () {
    sandbox.EL_STAFF.bag.save('tom-cook', ['Kids Tee - Doodle Mickey::3Y', 'Kids Tee - Doodle Mickey::5Y']);
    sandbox.EL_STAFF.bag.remove('tom-cook', ['Kids Tee - Doodle Mickey::3Y']);
    var b = sandbox.EL_STAFF.bag.get('tom-cook');
    sandbox.EL_STAFF.bag.clear('tom-cook');
    return b.length === 1 && b[0] === 'Kids Tee - Doodle Mickey::5Y';
  })());

  /* step 2 → step 3: staff tick which set items the fulfilment covers.
     Everything is included by default; an unticked item stays in the set. */
  check('step 3 picker: every item in the set is part of the handoff by default', (function () {
    var rows = sandbox.EL_STAFF.rowsFromNames(['Kids Tee - Doodle Mickey', 'Swim Shorts - Turtles']);
    return rows.length === 2 && rows.every(function (r) { return r.include === true; }) &&
      sandbox.EL_STAFF.fulfilSelected(rows).length === 2 && sandbox.EL_STAFF.fulfilLeft(rows).length === 0 &&
      sandbox.EL_STAFF.fulfilCountLabel(rows).indexOf('2</b> of 2') >= 0;
  })());
  check('step 3 picker: unticking drops the item from the handoff, not from the set', (function () {
    var rows = sandbox.EL_STAFF.rowsFromNames(['A', 'B', 'C']);
    rows[1].include = false;
    return rows.length === 3 && sandbox.EL_STAFF.fulfilSelected(rows).length === 2 &&
      sandbox.EL_STAFF.fulfilLeft(rows).length === 1 && sandbox.EL_STAFF.fulfilLeft(rows)[0].name === 'B';
  })());
  check('step 3 picker: renders one checked box per item + a live count', (function () {
    sandbox.EL_STAFF.state.rows = sandbox.EL_STAFF.rowsFromNames(['Kids Tee - Doodle Mickey', 'Swim Shorts - Turtles']);
    sandbox.EL_STAFF.renderFulfilItems();
    var html = registry['#staffFulfilItems'].innerHTML;
    return (html.match(/type="checkbox"/g) || []).length === 2 && (html.match(/ checked>/g) || []).length === 2 &&
      html.indexOf('In this handoff') >= 0 &&
      (registry['#staffFulfilCount'].innerHTML || '').indexOf('2</b> of 2') >= 0;
  })());
  check('step 3 picker: an unticked row renders as left-in-basket and the count follows', (function () {
    sandbox.EL_STAFF.state.rows[1].include = false;
    sandbox.EL_STAFF.renderFulfilItems();
    var html = registry['#staffFulfilItems'].innerHTML;
    return html.indexOf('Left in basket') >= 0 && (html.match(/ checked>/g) || []).length === 1 &&
      (registry['#staffFulfilCount'].innerHTML || '').indexOf('1</b> of 2') >= 0;
  })());
  check('step 3 picker: the empty set renders a prompt, not a broken list', (function () {
    sandbox.EL_STAFF.state.rows = [];
    sandbox.EL_STAFF.renderFulfilItems();
    return registry['#staffFulfilItems'].innerHTML.indexOf('ticked by default') >= 0 &&
      (registry['#staffFulfilCount'].innerHTML || '') === '';
  })());
  check('step 3 picker: a partial handoff consumes only the ticked names from the set', (function () {
    sandbox.EL_STAFF.bag.save('tom-cook', ['A', 'B', 'C']);
    sandbox.EL_STAFF.bag.remove('tom-cook', ['A', 'C']);
    var b = sandbox.EL_STAFF.bag.get('tom-cook');
    var kept = b.length === 1 && b[0] === 'B';
    sandbox.EL_STAFF.bag.clear('tom-cook');
    return kept;
  })());
  /* end to end: hand the set to POS and the UNTICKED items must still be in the
     customer's basket — the shared elly-bags store the storefront cart reads (and
     the badge counts). Only the ticked items leave; nothing is dropped. */
  check('step 3 picker: unticked items remain in the customer basket after handoff', (function () {
    var ACC = 'basket-demo';
    var names = ['Kids Tee - Doodle Mickey', 'Swim Shorts - Turtles', 'Beary Personalisable Baby Gift Set'];
    sandbox.EL_STAFF.bag.save(ACC, names.slice());
    /* identify the customer + load their set, exactly as step 1 → step 2 does */
    sandbox.EL_STAFF.state.customer = { id: ACC, name: 'Basket Demo', countryName: 'Singapore', points: 10 };
    sandbox.EL_STAFF.state.rows = sandbox.EL_STAFF.rowsFromNames(names, ACC);
    sandbox.EL_STAFF.state.lost = [];
    /* hand over the tee only — the swim shorts + gift set stay behind */
    sandbox.EL_STAFF.state.rows[0].include = true;
    sandbox.EL_STAFF.state.rows[1].include = false;
    sandbox.EL_STAFF.state.rows[2].include = false;
    var order = sandbox.EL_STAFF.handoff();
    var bag = sandbox.EL_STAFF.bag.get(ACC);
    var basketKept = bag.length === 2 &&
      bag.indexOf('Swim Shorts - Turtles') >= 0 &&
      bag.indexOf('Beary Personalisable Baby Gift Set') >= 0 &&
      bag.indexOf('Kids Tee - Doodle Mickey') < 0;
    var draftOnlyTicked = !!order && order.items.length === 1 && order.items[0].name === 'Kids Tee - Doodle Mickey';
    var reported = (registry['#handoffResult']._html || '').indexOf('back in the customer&rsquo;s basket') >= 0;
    sandbox.EL_STAFF.bag.clear(ACC);
    sandbox.EL_STAFF.state.customer = null;
    sandbox.EL_STAFF.state.rows = [];
    return basketKept && draftOnlyTicked && reported;
  })());
  /* the wizard must actually route the selection (handoff + review read the ticked rows) */
  check('step 3 picker: handoff + review are driven by the ticked rows', (function () {
    var src = fs.readFileSync('assets/staff.js', 'utf8');
    var handoff = src.slice(src.indexOf('function handoff()'), src.indexOf('function renderLadder'));
    return handoff.indexOf('fulfilSelected(state.rows)') >= 0 && handoff.indexOf('removeNamesFromBag') >= 0 &&
      handoff.indexOf('removeNamesFromBag(sel') >= 0 &&
      src.indexOf("'staffFulfilCount'") >= 0 && src.indexOf('js-fulfil-item') >= 0;
  })());
  check('step 3 picker: the staff page hosts the picker above the fulfilment options', (function () {
    var src = fs.readFileSync('staff.html', 'utf8');
    var step3 = src.slice(src.indexOf('Step 3 · Fulfilment'), src.indexOf('Step 4 · Hand to POS'));
    return step3.indexOf('id="staffFulfilItems"') >= 0 &&
      step3.indexOf('staffFulfilItems') < step3.indexOf('aria-label="Fulfilment option"') &&
      step3.indexOf('ticked by default') >= 0;
  })());

  /* ---------- recently viewed (per profile; bag + purchase filtered) ----------
     Storage mirrors the bag: a localStorage map keyed by account id, '__guest'
     for anonymous. A synthetic profile proves the "already bought" rule against
     the stub catalog (the demo history rows don't all resolve to stub names). */
  sandbox.EL_ACCOUNTS.push({
    id: 'viewer-demo', name: 'Viewer Demo', residency: 'SG', country: 'SG', points: 0,
    history: [{ item: 'Kids Tee - Doodle Mickey \u00b7 M (him)' }],
    browse: ['Swim Shorts - Turtles']
  });
  sandbox.ELSEG.signIn('viewer-demo');
  check('recently viewed: per-profile trail, most-recent-first, seeded from profile browse', (function () {
    sandbox.EL.recordView('Beary Personalisable Baby Gift Set');
    var items = sandbox.EL.viewedItems();
    return items[0] === 'Beary Personalisable Baby Gift Set' && items.indexOf('Swim Shorts - Turtles') >= 0;
  })());
  check('recently viewed: never recommends what this profile already bought', (function () {
    sandbox.EL.recordView('Kids Tee - Doodle Mickey');   /* sits in the profile's history */
    return sandbox.EL.viewedItems().indexOf('Kids Tee - Doodle Mickey') >= 0 &&
      sandbox.EL.viewedRecommendations().every(function (p) { return p.n !== 'Kids Tee - Doodle Mickey'; });
  })());
  check('recently viewed: never recommends what is already in the bag', (function () {
    sandbox.EL.addToBag('Swim Shorts - Turtles');
    var hidden = sandbox.EL.viewedRecommendations().every(function (p) { return p.n !== 'Swim Shorts - Turtles'; });
    sandbox.EL.removeFromBag('Swim Shorts - Turtles');
    return hidden && sandbox.EL.viewedRecommendations().some(function (p) { return p.n === 'Swim Shorts - Turtles'; });
  })());
  check('recently viewed: guest trail stays separate from a signed-in profile', (function () {
    var signed = sandbox.EL.viewedItems().slice(0);
    sandbox.ELSEG.signOut();
    var guest = sandbox.EL.viewedItems();
    sandbox.ELSEG.signIn('viewer-demo');
    return signed.indexOf('Swim Shorts - Turtles') >= 0 && guest.indexOf('Swim Shorts - Turtles') < 0;
  })());
  check('recently viewed: chips + home rail + PDP row render it, never the current PDP product', (function () {
    sandbox.EL.applySegmentState();   /* the sign-in/out re-render hook */
    var chips = registry['#viewedChips']._html || '';
    var rail = registry['#viewedGrid']._html || '';
    var pdpRow = registry['#pdpViewedGrid']._html || '';
    return /Swim Shorts - Turtles/.test(chips) && /Swim Shorts - Turtles/.test(rail) && /Swim Shorts - Turtles/.test(pdpRow) &&
      (registry['#viewedRail'].style.display || '') !== 'none' &&
      registry['#pdpViewed'].hidden === false &&
      !/Beary Personalisable Baby Gift Set/.test(chips);
  })());
  sandbox.ELSEG.signOut();
  sandbox.EL_ACCOUNTS.pop();

  /* ---------- cross-sell (basket-building) ----------
     Scored from signals the catalog already carries (shared character, complementary
     type, intent, collection). Shares the recently-viewed exclusion rule, so no
     surface can recommend the seed, a bag item or a past purchase. */
  check('cross-sell: complementary type outranks another of the same category', (function () {
    var s = { n: 'Synthetic Seed Tee', k: 'disney', type: 'Tops & tees', characters: ['Mickey'], int: ['park'] };
    var list = sandbox.EL.crossSellFor(s, 4).map(function (p) { return p.n; });
    var swim = list.indexOf('Mickey Swim Shorts'), tee = list.indexOf('Kids Tee - Doodle Mickey Twin');
    return swim >= 0 && (tee < 0 || swim < tee);
  })());
  check('cross-sell: excludes the seed product and anything already in the bag', (function () {
    sandbox.EL.setBag(0);
    sandbox.EL.addToBag('Mickey Swim Shorts');
    var s = { n: 'Synthetic Seed Tee', k: 'disney', type: 'Tops & tees', characters: ['Mickey'], int: ['park'] };
    var names = sandbox.EL.crossSellFor(s, 6).map(function (p) { return p.n; });
    sandbox.EL.removeFromBag('Mickey Swim Shorts');
    return names.indexOf('Mickey Swim Shorts') < 0 && names.indexOf('Synthetic Seed Tee') < 0;
  })());
  check('cross-sell: pets only pair with pets (no consumer-catalog bleed)', (function () {
    var pets = sandbox.EL_PRODUCTS.filter(function (p) { return p.k === 'furkids'; });
    var list = sandbox.EL.crossSellFor(pets[0], 6);
    return list.length > 0 && list.every(function (p) { return p.k === 'furkids'; });
  })());
  check('cross-sell: PDP rail stays product-derived while recently viewed gets its own row', (function () {
    sandbox.ELSEG.signOut();          /* guest: no trail yet */
    sandbox.EL.setBag(0);
    sandbox.EL.renderViewedSurfaces();
    var noTrail = (registry['#pdpXsellTitle'].textContent || '') === 'Complete the look' &&
      (registry['#pdpXsellKicker'].textContent || '') === 'Goes well with this' &&
      registry['#pdpViewed'].hidden === true;
    sandbox.EL.recordView('Mickey Swim Shorts');
    sandbox.EL.renderViewedSurfaces();
    var both = registry['#pdpViewed'].hidden === false &&
      /data-p="Mickey Swim Shorts"/.test(registry['#pdpViewedGrid']._html || '') &&
      /* the cross-sell rail is NOT taken over by the trail any more */
      (registry['#pdpXsellTitle'].textContent || '') === 'Complete the look' &&
      (registry['#pdpXsellKicker'].textContent || '') === 'Goes well with this' &&
      (registry['#pdpXsellLink'].style.display || '') === '';
    return noTrail && both;
  })());
  check('cross-sell: cart block renders basket picks and hides when empty', (function () {
    sandbox.EL.setBag(0);
    sandbox.EL.populateCartLines();
    var hiddenEmpty = registry['#cartXsell'].hidden === true;
    sandbox.EL.addToBag('Kids Tee - Doodle Mickey');
    sandbox.EL.populateCartLines();
    var html = registry['#cartXsellGrid']._html || '';
    var shown = registry['#cartXsell'].hidden === false &&
      /data-p="Kids Tee - Doodle Mickey Twin"/.test(html) &&
      !/data-p="Kids Tee - Doodle Mickey"/.test(html);   /* the bag item itself never returns */
    sandbox.EL.setBag(0);
    sandbox.EL.populateCartLines();
    return hiddenEmpty && shown;
  })());

  /* ---------- visitor segments (PRD §5.1) — real signals ---------- */
  check('ELSEG resolver exported', typeof sandbox.ELSEG === 'object' && typeof sandbox.ELSEG.current === 'function');
  check('account DB: two seeded profiles', sandbox.EL_ACCOUNTS.length === 2);
  check('Tom Cook = overseas residency (tourist-return)', sandbox.EL_ACCOUNTS[0].residency === 'overseas' && sandbox.EL_ACCOUNTS[0].id === 'tom-cook' && sandbox.EL_ACCOUNTS[0].history.length >= 3);
  check('Chloe Ng = SG residency (local-return)', sandbox.EL_ACCOUNTS[1].residency === 'SG' && sandbox.EL_ACCOUNTS[1].id === 'chloe-ng' && sandbox.EL_ACCOUNTS[1].history.length >= 3);
  check('anonymous default = local-first (SG timezone hint)', sandbox.ELSEG.current().key === 'local-first' && sandbox.ELSEG.current().account === null);
  check('events eyebrow serves local-geo events', (registry['#eventsEyebrow']._html || '').indexOf('local families') >= 0 && (registry['#eventsEyebrow']._html || '').indexOf('Theme Park Vacation') < 0);

  /* live geo flips to overseas (the VPN test path) */
  sandbox.ELSEG.__setGeoHint({ country: 'US', countryName: 'United States', city: 'New York' });
  check('overseas live geo = tourist-first (anonymous)', sandbox.ELSEG.current().key === 'tourist-first');
  check('events eyebrow re-renders with travel events', (registry['#eventsEyebrow']._html || '').indexOf('Theme Park Vacation') >= 0);
  check('geo tier recorded as hint source', sandbox.ELGEO && typeof sandbox.ELGEO.flagFor === 'function' && sandbox.ELGEO.flagFor('US').length === 4); /* 🇺🇸 = 2 regional indicators */

  /* returning segments via the demo account DB (the future unified profile) */
  /* the site bag and the staff set share elly-bags — re-seed Tom's set here (the
     per-account checks above cleared it) so the sign-in's segment re-render shows
     it in both the badge and the cart lines */
  sandbox.EL_STAFF.bag.save('tom-cook', ['Kids Tee - Doodle Mickey']);
  check('signIn accepts a seeded account', sandbox.ELSEG.signIn('tom-cook') === true);
  check('Tom Cook resolves tourist-return by PROFILE residency', sandbox.ELSEG.current().key === 'tourist-return' && sandbox.ELSEG.current().account.name === 'Tom Cook');
  check('customer bag follows the account: staff set + site bag are one store', sandbox.EL.bagItems().indexOf('Kids Tee - Doodle Mickey') >= 0 && sandbox.EL.bagCount() === 1);
  check('cart lines follow the account: Toms saved set renders in the cart', (registry['#cartLines']._html || '').indexOf('Kids Tee - Doodle Mickey') >= 0);
  check('header greets the signed-in account', (registry['#signLbl'].textContent || '') === 'Hi, Tom');
  check('drawer pill shows account + points', (registry['#mAcctPill'].textContent || '').indexOf('Tom') >= 0 && (registry['#mAcctPill'].textContent || '').indexOf('310') >= 0);
  check('returning-tourist gets PRD welcome-back framing', (registry['#recTilesTitle'].textContent || '').indexOf('Welcome back') >= 0);
  check('rec rail visible for returning visitors', (registry['#recRail'].style.display || '') === '');
  check('search chips switch to history suggestions', (registry['#suggestLabel'].textContent || '').indexOf('history') >= 0);

  /* PRD §5.1 misclassification rule: a Singaporean on an overseas VPN
     (live geo = US here) must STAY local — profile residency wins */
  sandbox.ELSEG.signIn('chloe-ng');
  check('Chloe stays local-return despite overseas live geo (PRD rule)', sandbox.ELSEG.current().key === 'local-return' && sandbox.ELSEG.current().geo === 'local');
  check('cart lines follow the account: Chloes empty bag clears the cart lines', (registry['#cartLines']._html || '').indexOf('js-cart-line') < 0);
  check('rec rail title returns to history framing', (registry['#recTilesTitle'].textContent || '').indexOf('Recommended for you') >= 0);

  sandbox.ELSEG.signOut();
  check('signOut returns to anonymous first-time on live geo', sandbox.ELSEG.isSignedIn() === false && sandbox.ELSEG.current().key === 'tourist-first');
  check('header reverts to Sign In', (registry['#signLbl'].textContent || '') === 'Sign In');

  /* ---------- landing hero: the recommender links to a listing, not the account ----------
     For a signed-in profile the first banner IS the recommender's cross-sell (PRD
     \u00a75.1 priority #1), so its buttons must open the filtered listing the
     recommender picked \u2014 the account page is not a recommendation. `recos` on the
     profile is that ranked output; the hero and the recommender rail's header link
     both consume it, while a first-time visitor keeps the segment slides. */
  check('account DB carries the recommender\u2019s ranked listings per profile', (function () {
    return sandbox.EL_ACCOUNTS.length === 2 && sandbox.EL_ACCOUNTS.every(function (acc) {
      return Array.isArray(acc.recos) && acc.recos.length >= 2 && acc.recos.every(function (r) {
        return !!r.label && /\.html\?/.test(r.href) && !!r.why;
      });
    });
  })());
  check('recommender links land on a real, narrowed listing (never the account page)', (function () {
    var catCtx = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync('assets/products.js', 'utf8'), catCtx);
    var CAT = catCtx.window.EL_PRODUCTS.filter(function (p) { return p.availability !== 'b2b-only'; });
    var OCC = { 'Birthday': 'birthday', 'Newborn & Baby Shower': 'newborn', 'Twinning & Matching Sets': 'twin',
      'Theme Park Vacation': 'park', 'Family Photoshoot': 'photoshoot', 'Pajama Party / Sleepover': 'sleepover',
      'Holiday Gift Boxes': 'gift', 'Big Brother / Little Sister': 'sibling' };
    registry['body'].setAttribute('data-page', '');
    var bad = [];
    sandbox.EL_ACCOUNTS.forEach(function (acc) {
      (acc.recos || []).forEach(function (r) {
        if (/account\.html/.test(r.href)) { bad.push(r.label + ' \u2192 account page'); return; }
        var q = new URLSearchParams(r.href.slice(r.href.indexOf('?') + 1));
        var occIntent = OCC[q.get('occasion')] || '';
        var hits = CAT.filter(function (p) {
          if (occIntent && (p.int || []).indexOf(occIntent) < 0) return false;
          return q.getAll('f').every(function (spec) {
            var j = spec.indexOf(':');
            return sandbox.EL.facetMatch(p, spec.slice(0, j), spec.slice(j + 1));
          });
        }).length;
        if (!hits) bad.push(r.label + ' \u2192 0 items');
        else if (hits === CAT.length) bad.push(r.label + ' \u2192 no narrowing');
      });
    });
    if (bad.length) console.log('    \u21b3 ' + bad.join(' \u00b7 '));
    return bad.length === 0;
  })());
  check('signed-in hero links the recommender\u2019s listings (no account-page CTA)', (function () {
    sandbox.ELSEG.signIn('chloe-ng');
    sandbox.EL.applySegmentState();
    var html = registry['#heroSlides']._html || '';
    var chloe = sandbox.EL_ACCOUNTS.filter(function (a) { return a.id === 'chloe-ng'; })[0];
    var ok = html.indexOf(chloe.recos[0].href) >= 0 && html.indexOf(chloe.recos[1].href) >= 0 &&
      html.indexOf('Shop the birthday edit for your 6-year-old') >= 0 &&
      html.indexOf('Your 6-year-old\u2019s birthday is next month.') >= 0 &&
      html.indexOf('account.html') < 0;
    sandbox.ELSEG.signOut();
    return ok;
  })());
  check('recommender rail header link follows the same picks', (function () {
    sandbox.ELSEG.signIn('tom-cook');
    sandbox.EL.applySegmentState();
    var link = registry['#recRailLink'];
    var tom = sandbox.EL_ACCOUNTS.filter(function (a) { return a.id === 'tom-cook'; })[0];
    var signed = link.getAttribute('href') === tom.recos[0].href && link.textContent === 'Shop the recommended edit';
    sandbox.ELSEG.signOut();
    sandbox.EL.applySegmentState();
    var anon = link.getAttribute('href') === 'account.html' && link.textContent === 'View unified history';
    return signed && anon;
  })());
  check('first-time visitor keeps the segment hero (no account override)', (function () {
    sandbox.ELSEG.__setGeoHint({ country: 'SG', countryName: 'Singapore', city: 'Singapore' });
    sandbox.EL.applySegmentState();
    var s = sandbox.ELSEG.current();
    var html = registry['#heroSlides']._html || '';
    return s.account === null && s.guest === 'first' &&
      html.indexOf('Newborn & Baby Shower season') >= 0 && html.indexOf('account.html') < 0;
  })());

  /* ---------- visitor geo-location (assets/geo.js) ----------
     fetch is stubbed to reject, so the only working tiers are the
     ?geo= override (tier 1) and the timezone/locale hint (tier 5) —
     exactly the two paths that must never hit the network. */
  var geoAsyncDone = false;
  sandbox.location.search = '?geo=US';
  load('assets/geo.js'); /* fresh module instance picks up the URL override */
  check('ELGEO exported', typeof sandbox.ELGEO === 'object' && typeof sandbox.ELGEO.get === 'function');
  check('flagFor builds regional-indicator emoji flags', sandbox.ELGEO.flagFor('SG') === '\uD83C\uDDF8\uD83C\uDDEC' && sandbox.ELGEO.flagFor('US') === '\uD83C\uDDFA\uD83C\uDDF8');
  check('nameFor maps ISO codes to display names', sandbox.ELGEO.nameFor('JP') === 'Japan');
  sandbox.ELGEO.get().then(function (g) {
    geoAsyncDone = true;
    check('override ?geo=US resolves before any network call', !!g && g.country === 'US' && g.source === 'override');
    check('announcement chip shows US flag + country', (announceLoc.textContent || '').indexOf('\uD83C\uDDFA\uD83C\uDDF8') >= 0 && (announceLoc.textContent || '').indexOf('United States') >= 0);
    check('checkout country preselected to United States', countrySel.options[countrySel.selectedIndex].text === 'United States' && countrySel.getAttribute('data-geo-done') === '1');
    check('SG visitors keep the default (no country preselect)', sandbox.ELGEO.checkoutTarget({ country: 'SG' }) === null);
    check('unmapped country falls to the Other option', sandbox.ELGEO.checkoutTarget({ country: 'FR' }) === 'Other (20+ countries)');
    /* clear override + URL param + cache; fetch still rejects → must land on the hint */
    sandbox.location.search = '';
    sandbox.sessionStorage.removeItem('elly-geo-override');
    sandbox.sessionStorage.removeItem('elly-geo');
    return sandbox.ELGEO.override(null);
  }).then(function (g2) {
    check('no override + both network tiers down \u2192 timezone/locale hint', !!g2 && g2.source === 'locale-hint' && g2.country === 'SG');
  }).catch(function (e) { console.error('GEO ASYNC FAIL:', e && (e.stack || e.message) || e); failed = true; });
} catch (err) { console.error('UNCAUGHT:', err && err.stack || err); failed = true; }
/* the geo checks resolve on the promise microtask queue — give them a beat
   before exiting, otherwise process.exit would cut them off */
setTimeout(function () {
  if (!geoAsyncDone) { console.log('  FAIL geo async checks never completed'); failed = true; }
  process.exit(failed ? 1 : 0);
}, 250);
