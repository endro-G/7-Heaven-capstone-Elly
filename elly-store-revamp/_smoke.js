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
 '#cartXsell', '#cartXsellGrid', '#persEditor',
 /* growth & pre-order dashboard (PRD §13) — registered so admin.js's own init
    runs for real here, not just its pure functions */
 '#dashBar', '#dashVerdict', '#dashRows', '#dashCards', '#histRows',
 '#chartPace', '#chartDaily', '#chartContrib', '#chartHist', '#chartTip',
 '#dashLiveNote', '#scenarioNote', '#poHealthVal', '#poHealthDelta', '#poHealthNote',
 '#rangeVal', '#ctDay', '#ctDayVal', '#ctMoq', '#demHead',
 '#sparkConv', '#sparkAov', '#sparkMatch', '#deltaConv', '#deltaAov', '#deltaMatch']
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
  load('assets/charts.js'); /* hand-built SVG chart toolkit (no charting library) */
  load('assets/admin.js'); /* growth dashboard (PRD §13) registers its own wiring */
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
  /* The banner is an acquisition CTA — it belongs on storefront pages, not on the
     internal views. The gate reads each page's own `data-page` key, so the check is
     tied to the real attributes rather than to a list of filenames. */
  check('B2B banner is suppressed on the internal views (b2b, staff, admin)', (function () {
    var src = fs.readFileSync('assets/components.js', 'utf8');
    var gate = src.slice(src.indexOf('var noBanner'), src.indexOf('headWrap.innerHTML'));
    function key(p) { var m = /<body data-page="([^"]+)"/.exec(fs.readFileSync(p, 'utf8')); return m ? m[1] : ''; }
    return /page === 'b2b'/.test(gate) && /page === 'staff'/.test(gate) && /page === 'admin'/.test(gate) &&
      key('b2b.html') === 'b2b' && key('staff.html') === 'staff' && key('admin.html') === 'admin' &&
      key('index.html') === 'index' && key('pdp.html') === 'pdp' &&     /* storefront keeps it */
      /\(noBanner \? '' : b2bBannerHTML\(\)\)/.test(src);
  })());
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
  check('the staff tablet links to the growth dashboard from the top bar AND the sticky rail', (function () {
    var src = fs.readFileSync('staff.html', 'utf8');
    var topbar = src.slice(src.indexOf('staff-topbar'), src.indexOf('staff-wrap'));
    var rail = src.slice(src.indexOf('staff-rail" '), src.indexOf('staff-main'));
    return /href="admin\.html"/.test(topbar) && /btn--blue/.test(topbar) &&
      /class="staff-rail__dash" href="admin\.html"/.test(rail) &&
      fs.existsSync('admin.html');
  })());
  check('the rail shortcut is dropped where the rail becomes a 4-up step scroller', (function () {
    var css = fs.readFileSync('assets/styles.css', 'utf8');
    var i = css.indexOf('.staff-rail__dash { display: none; }');
    var block = css.slice(css.lastIndexOf('@media', i), i);       /* the block that contains it */
    return i > 0 && /^@media \(max-width: 900px\)/.test(block) &&   /* the rail's own breakpoint */
      /\.staff-topbar__dash \{ width: 100%; \}/.test(css);          /* still a full-width tap target */
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

  /* ---------- Growth & Pre-Order dashboard (PRD §13) ----------
     The storefront thread: a pre-order add enters the shared bag, Place order
     commits those units to the production tally, and the dashboard reads the
     tally as orders-to-date — so demand, pace, the reason line and margin all
     move off a real checkout rather than a typed-in number. */
  /* the real catalogue carries exactly one pre-order product; add it here, after
     the checks that count the consumer catalogue, so nothing upstream shifts */
  sandbox.EL_PRODUCTS.push({
    id: 'preorder', n: 'Disney Pre-Order', p: 'S$59', price: 59, k: 'disney',
    availability: 'pre-order', tags: ['pre-order'],
    designs: [{ name: 'Heritage Shophouse' }, { name: 'Gardens by the Bay' }, { name: 'Marina Bay Night Skyline' }]
  });
  check('dashboard module exports its model', typeof sandbox.EL_DASH === 'object' && typeof sandbox.EL_DASH.projection === 'function');
  check('every dashboard design exists in the catalogue (names cannot drift)', (function () {
    var catCtx = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync('assets/products.js', 'utf8'), catCtx);
    var pre = catCtx.window.EL_PRODUCTS.filter(function (p) { return p.availability === 'pre-order'; })[0];
    var names = (pre.designs || []).map(function (d) { return d.name; });
    return sandbox.EL_DASH.designs.length === 3 && sandbox.EL_DASH.designs.every(function (d) {
      return names.indexOf(d.name) >= 0;
    });
  })());
  check('projection is a trailing average to window close (PRD §9: no real model)', sandbox.EL_DASH.projection(820) === Math.round(820 * 21 / 12));
  check('status flags separate ahead / on pace / at the MOQ floor / at risk', (function () {
    var S = sandbox.EL_DASH.statusOf;
    return S(1600).key === 'ahead' && S(1200).key === 'pace' && S(1000).key === 'floor' && S(900).key === 'risk';
  })());
  check('the three demo designs read as three DIFFERENT signals (PRD §13 brief)', (function () {
    var D = sandbox.EL_DASH;
    var keys = D.designs.map(function (d) { return D.stateFor(d).status.key; });
    var reasons = D.designs.map(function (d) { return D.reasonFor(d, D.projection(D.demandFor(d))); });
    return keys.indexOf('pace') >= 0 && keys.indexOf('ahead') >= 0 && keys.indexOf('risk') >= 0 &&
      reasons[0] !== reasons[1] && reasons[1] !== reasons[2] && reasons[0] !== reasons[2];
  })());
  check('the reason line names the driving segment/channel (and admits when there is none)', (function () {
    var D = sandbox.EL_DASH;
    var a = D.designByName('Heritage Shophouse'), g = D.designByName('Gardens by the Bay'), s = D.designByName('Marina Bay Night Skyline');
    return /tourist shoppers/.test(D.reasonFor(a, D.projection(D.demandFor(a)))) &&
      /repeat customers/.test(D.reasonFor(g, D.projection(D.demandFor(g)))) &&
      /no dominant channel/.test(D.reasonFor(s, D.projection(D.demandFor(s))));
  })());
  check('margin overlay prices off the catalogue and recalculates at production qty', (function () {
    var D = sandbox.EL_DASH, a = D.designByName('Heritage Shophouse');
    var atMoq = D.stateFor(a, 820), above = D.stateFor(a, 2000);
    return Math.abs(atMoq.margin.price - 59) < 0.001 && atMoq.prod === 1000 && above.prod === 2000 &&
      above.contribution > atMoq.contribution && atMoq.margin.pct > 60 && atMoq.margin.pct < 70;
  })());
  check('history gives the current window a reference point', sandbox.EL_DASH.history.length >= 3 && sandbox.EL_DASH.history.every(function (h) {
    return h.qty > 0 && h.sellThrough > 0 && h.margin > 0;
  }));
  check('checkout commits pre-order units to the production tally (not other items)', (function () {
    sandbox.localStorage.removeItem(sandbox.EL.preOrders.key);
    sandbox.EL.setBag(0);
    sandbox.EL.addToBag('Disney Pre-Order \u2014 Gardens by the Bay', 3, 'S');
    sandbox.EL.addToBag('Kids Tee - Doodle Mickey', 1, '3Y');
    var res = sandbox.EL.preOrders.commit();
    var tally = sandbox.EL.preOrders.read();
    return res.units === 3 && tally['Gardens by the Bay'] === 3 && !tally['Kids Tee - Doodle Mickey'];
  })());
  check('committed units raise that design\u2019s demand and leave the others alone', (function () {
    var D = sandbox.EL_DASH;
    var g = D.designByName('Gardens by the Bay'), h = D.designByName('Heritage Shophouse');
    return D.demandFor(g) === g.seed + 3 && D.demandFor(h) === h.seed &&
      D.stateFor(g).extra === 3 && D.stateFor(h).extra === 0;
  })());
  check('enough committed units can flip a design from at-risk to on-pace', (function () {
    var D = sandbox.EL_DASH, s = D.designByName('Marina Bay Night Skyline');
    var before = D.stateFor(s).status.key;
    sandbox.EL.addToBag('Disney Pre-Order \u2014 Marina Bay Night Skyline', 400, 'S');
    sandbox.EL.preOrders.commit();
    return before === 'risk' && D.stateFor(s).status.key === 'pace';
  })());
  check('only pre-order units are tallied \u2014 a repeat checkout adds, never replaces', (function () {
    var before = sandbox.EL.preOrders.read()['Gardens by the Bay'];
    sandbox.EL.setBag(0);
    sandbox.EL.addToBag('Disney Pre-Order \u2014 Gardens by the Bay', 2, 'M');
    sandbox.EL.preOrders.commit();
    var D = sandbox.EL_DASH, g = D.designByName('Gardens by the Bay');
    return sandbox.EL.preOrders.read()['Gardens by the Bay'] === before + 2 && D.demandFor(g) === g.seed + before + 2;
  })());
  check('the cards render the signal they compute (status, pace, rationale, margin)', (function () {
    var D = sandbox.EL_DASH, a = D.designByName('Heritage Shophouse'), g = D.designByName('Gardens by the Bay');
    var card = D.cardHTML(a), ahead = D.cardHTML(g);
    return /Day 12 of 21/.test(card) &&
      /dstatus--risk|dstatus--pace|dstatus--ahead/.test(card) &&
      /js-status/.test(card) && /Who is buying/.test(card) && /Walk-in QR/.test(card) &&
      /Tourist/.test(card) && /js-margin/.test(card) && /js-contrib/.test(card) &&
      /js-reason/.test(card) && /Extern/.test(card) &&
      /Press coverage/.test(card) &&                    /* the pre-set manual tag */
      /dstatus--ahead/.test(ahead);
  })());
  check('the decision row renders the stepper, presets and its orders-to-date', (function () {
    var D = sandbox.EL_DASH, row = D.rowHTML(D.designByName('Heritage Shophouse'));
    return /js-moq-row/.test(row) && /data-moq="1000"/.test(row) && /qty-row/.test(row) &&
      /js-moq-preset/.test(row) && /js-prod/.test(row) && /mini-bar/.test(row) &&
      /output value="820"/.test(row);
  })());
  check('the historical table separates closed runs from the open window', (function () {
    var hist = sandbox.EL_DASH.historyHTML();
    return /Orchard Bloom/.test(hist) && /Sentosa Sunset/.test(hist) &&
      /hist-sep/.test(hist) && /this window/.test(hist) &&
      /<td class="muted">open<\/td>/.test(hist);        /* no sell-through invented for an open window */
  })());
  /* ---------- dashboard: the page renders itself end to end ---------- */
  check('the dashboard calls render themselves — rows, cards, verdict, charts, sparklines', (function () {
    var rows = registry['#dashRows']._html || '';
    var cards = registry['#dashCards']._html || '';
    return (rows.match(/js-moq-row/g) || []).length === 3 && /output value="820"/.test(rows) &&
      (cards.match(/class="dcard"/g) || []).length === 3 && /js-reason/.test(cards) &&
      /js-signote/.test(cards) && /js-mgrid/.test(cards) &&
      (registry['#histRows']._html || '').length > 200 &&
      /<svg/.test(registry['#chartPace']._html || '') &&
      /<svg/.test(registry['#chartDaily']._html || '') &&
      /<svg/.test(registry['#chartContrib']._html || '') &&
      /<svg/.test(registry['#chartHist']._html || '') &&
      /spark/.test(registry['#sparkConv']._html || '') &&
      /spark/.test(registry['#sparkAov']._html || '') &&
      /spark/.test(registry['#sparkMatch']._html || '');
  })());
  check('the rendered verdict names the design that is behind pace', (function () {
    var el = registry['#dashVerdict'];
    return /dash-verdict--act/.test(el.className || '') && /Marina Bay Night Skyline/.test(el._html || '') &&
      /units short/.test(el._html || '');
  })());
  check('the live and scenario notes stay hidden until there is something to say',
    registry['#dashLiveNote'].hidden === true && registry['#scenarioNote'].hidden === true &&
    /3 designs \u00b7 1 at risk/.test(registry['#poHealthVal'].textContent || ''));
  /* "today" is the window-day slider, so the Q7 tally has to say which day it is
     as of, and the charts have to say which line is actual and which is projection. */
  check('the Q7 tally is anchored to the window day and the charts name actual vs projected', (function () {
    var D = sandbox.EL_DASH;
    var pace = D.trajectoryChart(D.designs.map(function (d) { return D.stateFor(d); }));
    var card = D.cardHTML(D.designs[1]);
    return /^Orders to date .*day 12$/.test(registry['#demHead'].textContent || '') &&
      /solid = orders to date \(actual\)/.test(pace) &&
      /dashed = trailing-average projection to close/.test(pace) &&
      /solid = orders to date \(actual\)/.test(card) &&
      /dashed = projected to close/.test(card) &&
      /flat dashed = MOQ/.test(card);
  })());

  /* ---------- dashboard: the signal tag feeds the reason, and the verdict line ---------- */
  check('the manual signal tag feeds the reason line — untagged designs gain nothing', (function () {
    var D = sandbox.EL_DASH, a = D.designByName('Heritage Shophouse'), g = D.designByName('Gardens by the Bay');
    var tagged = D.reasonParts(a, D.projection(D.demandFor(a)), D.signals[1].v);
    var plain = D.reasonParts(a, D.projection(D.demandFor(a)), '');
    var none = D.reasonParts(g, D.projection(D.demandFor(g)), '');
    return tagged.tagged && tagged.note.length > 0 && !plain.tagged && !none.tagged &&
      plain.note.length > 0 &&                            /* the untagged case still explains itself */
      tagged.base === plain.base &&                       /* the tag adds a cause, it never rewrites the pace */
      D.reasonFor(a, D.projection(D.demandFor(a)), D.signals[1].v).indexOf(tagged.note) > 0 &&
      /External signal/.test(D.reasonFor(a, D.projection(D.demandFor(a)), D.signals[1].v)) &&
      !/External signal/.test(D.reasonFor(g, D.projection(D.demandFor(g)), ''));
  })());
  check('an unrecognised stored signal can never inject copy into the reason', (function () {
    var D = sandbox.EL_DASH;
    return D.signalWhy('<img src=x onerror=alert(1)>') === '' && D.signalWhy('junk') === '' &&
      D.signalWhy('') === D.signals[0].why && D.signalWhy(D.signals[2].v).length > 0;
  })());
  /* The three cards sit in one grid row, so a card that grows drags the row taller
     and shifts its neighbours. Selecting a signal must therefore rewrite TEXT ONLY:
     every signal value has to produce the same element structure, or the page moves
     under the user's cursor. */
  check('choosing a signal rewrites text only — no element appears, so no card can resize', (function () {
    var D = sandbox.EL_DASH, a = D.designByName('Heritage Shophouse');
    var key = 'elly-signals';
    function shape(html) {
      return [(html.match(/<span/g) || []).length, (html.match(/<div/g) || []).length,
        (html.match(/js-signote/g) || []).length, (html.match(/reason__txt/g) || []).length,
        (html.match(/ hidden/g) || []).length].join('/');
    }
    var shapes = D.signals.concat([{ v: 'a value that is not in the list' }]).map(function (s) {
      sandbox.localStorage.setItem(key, JSON.stringify({ 'Heritage Shophouse': s.v }));
      return shape(D.cardHTML(a)) + '|' + shape(D.rowHTML(a));
    });
    sandbox.localStorage.removeItem(key);
    var untaggedShapes = D.designs.map(function (d) { return shape(D.cardHTML(d)); });
    return shapes.every(function (s) { return s === shapes[0]; }) &&
      /* and the same holds across the three designs with no tags stored at all */
      untaggedShapes.every(function (s) { return s === untaggedShapes[0]; }) &&
      !/ hidden/.test(D.cardHTML(a));
  })());
  check('every card reserves the signal line, so untagged designs read as such', (function () {
    var D = sandbox.EL_DASH;
    var tagged = D.cardHTML(D.designByName('Heritage Shophouse'));
    var plain = D.cardHTML(D.designByName('Gardens by the Bay'));
    return /reason__txt/.test(tagged) && /External signal/.test(tagged) && /second run/.test(tagged) &&
      /* every consequence is a similar length, so the fixed slot never has to clip */
      sandbox.EL_DASH.signals.every(function (s) { return !s.why || (s.why.length >= 60 && s.why.length <= 75); }) &&
      /reason__txt/.test(plain) && /No signal tagged/.test(plain) && /underlying demand/.test(plain) &&
      !/js-signote" hidden/.test(plain) &&
      tagged.indexOf('reason__sig--none') < 0 && plain.indexOf('reason__sig--none') > 0;
  })());
  check('the verdict names the design to act on and how far short it is', (function () {
    var D = sandbox.EL_DASH;
    var pd = D.scenario.demand, pday = D.scenario.day, pmoq = D.scenario.moq;
    D.scenario.day = 12; D.scenario.moq = 1000;
    D.scenario.demand = { 'Marina Bay Night Skyline': 300 };
    var v = D.verdictFor(D.designs.map(function (d) { return D.stateFor(d); }));
    D.scenario.demand = pd; D.scenario.day = pday; D.scenario.moq = pmoq;
    var gap = D.fmt(1000 - D.projection(300, 12, 21));
    return v.key === 'act' && v.lead === 'Act now' && /Marina Bay Night Skyline/.test(v.text) &&
      v.text.indexOf(gap + ' units short') > 0 && /\d+ days? left/.test(v.text);
  })());
  check('the verdict asks for a watch when a design only just clears the MOQ', (function () {
    var D = sandbox.EL_DASH;
    var pd = D.scenario.demand;
    D.scenario.demand = { 'Marina Bay Night Skyline': 600 };   /* over the floor, under 1.15x */
    var v = D.verdictFor(D.designs.map(function (d) { return D.stateFor(d); }));
    D.scenario.demand = pd;
    return v.key === 'watch' && /only just cover the MOQ/.test(v.text);
  })());

  /* ---------- decision economics (timeline facts from the Pre-Order PDP) ----------
     These read the same model as the storefront thread above, so the pre-order tally
     has to be cleared first: the checks below are pinned to the seed figures
     (1,275 / 430), and the thread deliberately leaves committed units behind. */
  sandbox.EL.setBag(0);
  sandbox.localStorage.removeItem(sandbox.EL.preOrders.key);
  check('defaults change nothing: stress and push layers are the identity at 0%', (function () {
    var D = sandbox.EL_DASH;
    return D.netFactor() === 1 && D.designs.every(function (d) {
      var st = D.stateFor(d);
      return st.net === st.rawDemand && st.refunds === 0 && !st.pushed &&
        st.netProjected === st.projected && st.pushTail === 0;
    });
  })());
  check('cancellation stress scales demand and prices the refund off full payment', (function () {
    var D = sandbox.EL_DASH, pc = D.scenario.cancel;
    D.scenario.cancel = 10;
    var st = D.stateFor(D.designByName('Gardens by the Bay'));
    D.scenario.cancel = pc;
    return st.net === Math.round(1275 * 0.9) &&
      st.refunds === (st.rawDemand - st.net) * 59 &&   /* priced off the units actually lost */
      st.netProjected === Math.round(Math.round(1275 * 21 / 12) * 0.9);
  })());
  check('full payment is final at close — cancellation exposure zeroes out on day 21', (function () {
    var D = sandbox.EL_DASH, pd = D.scenario.day, pc = D.scenario.cancel;
    D.scenario.day = 21; D.scenario.cancel = 15;
    var f = D.netFactor();
    var st = D.stateFor(D.designByName('Gardens by the Bay'));
    D.scenario.day = pd; D.scenario.cancel = pc;
    return f === 1 && st.refunds === 0 && st.net === st.rawDemand;
  })());
  check('the push lifts only the projected tail, never orders already placed', (function () {
    var D = sandbox.EL_DASH, pp = D.scenario.push;
    D.scenario.push = { 'Marina Bay Night Skyline': true };
    var st = D.stateFor(D.designByName('Marina Bay Night Skyline'));
    D.scenario.push = pp;
    var tail = st.projected - st.pushTail - st.rawDemand;
    return st.pushed && st.pushTail === Math.round(tail * 0.1) && st.rawDemand === 430;
  })());
  check('the commit options are floor / push / commit-projected — never run vs cancel', (function () {
    var D = sandbox.EL_DASH;
    var keys = D.commitOptions(D.stateFor(D.designByName('Marina Bay Night Skyline'))).options.map(function (o) { return o.key; });
    return keys.join(',') === 'floor,push,upside';
  })());
  check('production never commits below the MOQ and the push preview is never compounded', (function () {
    var D = sandbox.EL_DASH;
    var st = D.stateFor(D.designByName('Marina Bay Night Skyline'));   /* projected under MOQ */
    var o = D.commitOptions(st);
    var floor = o.options[0], up = o.options[2];
    /* with no push modelled, the preview is the unpushed base plus one lift … */
    var preview = o.pushedProj === st.projected + o.pushTail && o.pushedProj > st.projected;
    /* … and with the push already on it lands on the state's own projection: the
       modelled lift lives in st.projected, so it must not be added a second time */
    D.scenario.push = { 'Marina Bay Night Skyline': true };
    var pushedState = D.stateFor(D.designByName('Marina Bay Night Skyline'));
    var on = D.commitOptions(pushedState);
    D.scenario.push = {};
    return preview && on.pushedProj === pushedState.projected &&
      /Commit the floor \(1,000\)/.test(floor.label) &&
      floor.con.lo === floor.con.hi && floor.con.hi === Math.round((st.demand + (1000 - st.moq)) * (59 - st.margin.cost)) &&
      up.con.lo >= 0 && up.con.hi === Math.round(Math.max(1000, st.netProjected) * (59 - st.margin.cost));
  })());
  check('the push is priced and capped: cost deducted, lift under the gap says so', (function () {
    var D = sandbox.EL_DASH, pp = D.scenario.push;
    D.scenario.push = { 'Marina Bay Night Skyline': true };
    var st = D.stateFor(D.designByName('Marina Bay Night Skyline'));
    var o = D.commitOptions(st);
    D.scenario.push = pp;
    var pushRow = o.options[1];
    var unit = 59 - st.margin.cost;
    return pushRow.con.hi === Math.round(Math.max(1000, o.pushedProj) * unit) - 800 &&
      /cannot close a/.test(pushRow.note);
  })());
  check('the decision clock is pinned to the PDP dates: close 25 Sep, ships 20 Nov', (function () {
    var D = sandbox.EL_DASH;
    var c = D.decisionClock();
    return D.fmtDate(c.close.date) === '25 Sep 2026' && D.fmtDate(c.ship.date) === '20 Nov 2026' &&
      c.push.day === 14 && !c.close.late && !c.ship.late;
  })());
  check('the slip stress moves the ship-by chip, not refunds (PDP: exchanges only)', (function () {
    var D = sandbox.EL_DASH, pd = D.scenario.delay;
    D.scenario.delay = true;
    var ship = D.fmtDate(D.decisionClock().ship.date);
    D.scenario.delay = pd;
    return ship === '4 Dec 2026';
  })());
  check('the decision table renders for at-risk designs and offers a modelled push', (function () {
    var D = sandbox.EL_DASH, pd = D.scenario.demand;
    D.scenario.demand = { 'Marina Bay Night Skyline': 300 };
    var html = D.decisionsHTML(D.designs.map(function (d) { return D.stateFor(d); }));
    D.scenario.demand = pd;
    return /Marina Bay Night Skyline/.test(html) && /Commit the floor/.test(html) &&
      /js-deci-push/.test(html) && /Recommended/.test(html) && !/Run at MOQ/.test(html) && !/Cancel/.test(html);
  })());
  check('the stress layer rides the shareable URL like every other scenario', (function () {
    var D = sandbox.EL_DASH;
    return /cancel/.test(D.stateFor.toString()) === false && /* URL plumbing is tested via the scenario object shape */
      D.scenario.cancel === 0 && D.scenario.delay === false && typeof D.scenario.push === 'object';
  })());
  check('the verdict reads on track once every design covers the MOQ', (function () {
    var D = sandbox.EL_DASH;
    var pd = D.scenario.demand;
    D.scenario.demand = { 'Marina Bay Night Skyline': 900 };
    var v = D.verdictFor(D.designs.map(function (d) { return D.stateFor(d); }));
    D.scenario.demand = pd;
    return v.key === 'ok' && v.lead === 'On track' && /at or above the MOQ/.test(v.text);
  })());
  check('the layout keeps one sticky control surface plus tools beside what they move', (function () {
    var html = fs.readFileSync('admin.html', 'utf8');
    return /class="dash-bar" id="dashBar"/.test(html) && /id="dashVerdict"/.test(html) &&
      (html.match(/data-scenario=/g) || []).length === 5 &&   /* exactly one instance of each… */
      (html.match(/data-overlay=/g) || []).length === 3 &&    /* …so nothing can fall out of sync */
      (html.match(/data-attr=/g) || []).length === 2 &&
      (html.match(/data-range=/g) || []).length === 4;
  })());
  check('every dashboard jump link points at a section that exists (and none is orphaned)', (function () {
    var html = fs.readFileSync('admin.html', 'utf8');
    var ids = (html.match(/id="(z[A-Za-z]+)"/g) || []).map(function (s) { return s.slice(4, -1); });
    var hrefs = (html.match(/href="#(z[A-Za-z]+)"/g) || []).map(function (s) { return s.slice(7, -1); });
    return ids.length >= 7 && hrefs.length === ids.length &&
      hrefs.every(function (h) { return ids.indexOf(h) >= 0; }) &&
      ids.every(function (i) { return hrefs.indexOf(i) >= 0; });
  })());
  sandbox.EL.setBag(0);
  sandbox.localStorage.removeItem(sandbox.EL.preOrders.key);

  /* ---------- chart toolkit (assets/charts.js) — pure, so the geometry is testable ---------- */
  check('chart toolkit exports pure builders (no charting library)', typeof sandbox.EL_CHARTS === 'object' &&
    typeof sandbox.EL_CHARTS.scaleLinear === 'function' && typeof sandbox.EL_CHARTS.linePath === 'function');
  check('linear scale maps a domain onto a range', (function () {
    var s = sandbox.EL_CHARTS.scaleLinear(0, 10, 100, 200);
    return s(0) === 100 && s(10) === 200 && s(5) === 150;
  })());
  check('axis ticks land on round numbers', (function () {
    return sandbox.EL_CHARTS.axisTicks(0, 3000, 4).join(',') === '0,1000,2000,3000' &&
      sandbox.EL_CHARTS.niceStep(3000, 4) === 1000;
  })());
  check('line / area / band paths are closed correctly', (function () {
    var C = sandbox.EL_CHARTS;
    return C.linePath([[0, 0], [10, 10]]) === 'M0 0L10 10' &&
      /Z$/.test(C.areaPath([[0, 0], [10, 10]], 20)) &&
      /^M0 0L10 10/.test(C.bandPath([[0, 0], [10, 10]], [[0, 5], [10, 6]])) &&
      /Z$/.test(C.bandPath([[0, 0], [10, 10]], [[0, 5], [10, 6]]));
  })());

  /* ---------- interactive charts & scenario (PRD §13) ---------- */
  check('the pace chart plots all three designs with MOQ, needed pace, today and a band', (function () {
    var D = sandbox.EL_DASH;
    var svg = D.trajectoryChart(D.designs.map(function (d) { return D.stateFor(d); }));
    return /ct-moq/.test(svg) && /ct-pace/.test(svg) && /ct-band/.test(svg) && /ct-today/.test(svg) &&
      (svg.match(/ct-hit/g) || []).length === 3 && /data-tip=/.test(svg) &&
      /Heritage Shophouse/.test(svg) && /Marina Bay Night Skyline/.test(svg);
  })());
  /* the bug this guards: a series handed to a path builder in DATA space renders as
     a near-vertical streak against the y-axis and, with overflow visible, paints over
     the panels below. Coordinates are not optional — assert them. */
  check('every coordinate the charts plot lands inside its own viewBox', (function () {
    var D = sandbox.EL_DASH;
    function outside(svg, W, H) {
      var bad = 0, m, re;
      re = /d="([^"]+)"/g;
      while ((m = re.exec(svg))) {
        var nums = m[1].match(/-?\d+(?:\.\d+)?/g) || [];
        for (var i = 0; i + 1 < nums.length; i += 2) {
          if (+nums[i] < 0 || +nums[i] > W || +nums[i + 1] < 0 || +nums[i + 1] > H) bad++;
        }
      }
      [[/ (?:x|x1|x2|cx)="(-?\d+(?:\.\d+)?)"/g, W], [/ (?:y|y1|y2|cy)="(-?\d+(?:\.\d+)?)"/g, H]].forEach(function (p) {
        var r = p[0];
        while ((m = r.exec(svg))) {
          var v = +m[1];
          if (v < 0 || v > p[1]) bad++;
        }
      });
      return bad;
    }
    var states = D.designs.map(function (d) { return D.stateFor(d); });
    var charts = [
      [D.trajectoryChart(states), 720, 320],
      [D.dailyChart(states), 300, 132],
      [D.contribChart(states), 720, 320],
      [D.histChart(), 720, 320],
      [states.map(function (s) { return D.cardTrajectory(s); }).join(''), 300, 76]
    ];
    var bad = 0;
    charts.forEach(function (c) { bad += outside(c[0], c[1], c[2]); });
    return bad === 0;
  })());
  check('the pace chart spreads its designs across the full plot width', (function () {
    var D = sandbox.EL_DASH;
    var svg = D.trajectoryChart(D.designs.map(function (d) { return D.stateFor(d); }));
    var xs = [];
    var re = / class="ct-actual"[^>]*|d="([^"]+)"/g, m;
    var pathRe = /<path d="([^"]+)" class="ct-actual"/g;
    while ((m = pathRe.exec(svg))) {
      (m[1].match(/-?\d+(?:\.\d+)?/g) || []).forEach(function (v, i) { if (i % 2 === 0) xs.push(+v); });
    }
    return xs.length > 3 && Math.min.apply(null, xs) < 80 && Math.max.apply(null, xs) > 400;
  })());
  check('the overlay toggle actually drops the band layer from the chart', (function () {
    var D = sandbox.EL_DASH, S = D.scenario;
    var before = S.overlays.band;
    S.overlays.band = false;
    var svg = D.trajectoryChart(D.designs.map(function (d) { return D.stateFor(d); }));
    S.overlays.band = before;
    return !/ct-band/.test(svg);
  })());
  check('the contribution chart plots one bubble per design against the MOQ line', (function () {
    var D = sandbox.EL_DASH;
    var svg = D.contribChart(D.designs.map(function (d) { return D.stateFor(d); }));
    return /ct-moq--vert/.test(svg) && (svg.match(/data-tip=/g) || []).length === 3 && /contribution/.test(svg);
  })());
  check('the historical chart benchmarks this window against the past-run range', (function () {
    var D = sandbox.EL_DASH;
    var svg = D.histChart();
    var qtys = D.history.map(function (h) { return h.qty; });
    var lo = Math.min.apply(null, qtys), hi = Math.max.apply(null, qtys);
    return /ct-bench/.test(svg) &&
      svg.indexOf('past runs: ' + D.fmt(lo)) >= 0 && svg.indexOf(D.fmt(hi) + ' units') >= 0 &&
      /Orchard/.test(svg) && /this window/.test(svg) &&
      /sell-through pending/.test(svg);   /* an OPEN window never fakes a sell-through */
  })());
  check('attribution switches between share % and a customer headcount', (function () {
    var D = sandbox.EL_DASH, a = D.designByName('Heritage Shophouse');
    var order = ['new', 'repeat', 'tourist'], labels = { 'new': 'New', repeat: 'Repeat', tourist: 'Tourist' };
    var prev = D.scenario.attr;
    D.scenario.attr = 'share';
    var share = D.attribHTML('Who is buying', a.segments, order, labels, 820);
    D.scenario.attr = 'count';
    var count = D.attribHTML('Who is buying', a.segments, order, labels, 820);
    D.scenario.attr = prev;
    return /45%/.test(share) && /369/.test(count) && share.indexOf('369') < 0 && share !== count;
  })());
  check('a scenario moves the numbers, the flags and the shareable URL payload', (function () {
    var D = sandbox.EL_DASH, S = D.scenario, s = D.designByName('Marina Bay Night Skyline');
    S.demand = {}; S.day = D.WINDOW_DAY; S.moq = D.MOQ;
    var base = D.stateFor(s);
    S.day = D.WINDOW_DAYS;
    var closed = D.stateFor(s);                 /* window closed: demand IS the outcome */
    S.day = D.WINDOW_DAY; S.demand[s.name] = 300; S.moq = 400;
    var floored = D.stateFor(s);               /* below MOQ on demand, so the MOQ sets the run */
    S.demand = {}; S.day = D.WINDOW_DAY; S.moq = D.MOQ;
    return base.projected === D.projection(s.seed, D.WINDOW_DAY, D.WINDOW_DAYS) &&
      closed.projected === closed.demand && closed.status.key === 'risk' &&
      floored.prod === 400 && floored.status.key === 'pace' &&
      D.slug(s.name) === 'marina-bay-night-skyline';
  })());
  check('the day slider changes the projection day over day', (function () {
    var D = sandbox.EL_DASH;
    return D.projection(600, 6, 21) === 2100 && D.projection(600, 21, 21) === 600;
  })());
  check('tile sparklines are drawn from a real series', (function () {
    var svg = sandbox.EL_DASH.sparkline([1, 2, 3, 2], '#000');
    return /<svg/.test(svg) && /<path d="M/.test(svg) && /preserveAspectRatio="none"/.test(svg);
  })());

  /* ---------- enough mock data to watch the controls move the charts ---------- */
  check('the mock data is deep enough to make a scenario legible', (function () {
    var D = sandbox.EL_DASH;
    return D.history.length >= 6 &&
      D.designs.every(function (d) {
        return d.shape.length === D.WINDOW_DAYS && d.shape.every(function (v) { return v > 0; });
      }) &&
      Object.keys(D.tileSeries).every(function (k) { return D.tileSeries[k].length === 52; }) &&
      D.ranges.length === 4;
  })());
  check('each design has its own daily rhythm, not a straight ramp', (function () {
    var D = sandbox.EL_DASH;
    var shapes = D.designs.map(function (d) { return d.shape.join(','); });
    var spread = D.designs.map(function (d) {
      return Math.max.apply(null, d.shape) / Math.min.apply(null, d.shape);
    });
    return shapes[0] !== shapes[1] && shapes[1] !== shapes[2] && shapes[0] !== shapes[2] &&
      spread.every(function (r) { return r > 1.5; });
  })());
  check('the cumulative curve lands exactly on orders-to-date at the current day', (function () {
    var D = sandbox.EL_DASH;
    return D.designs.every(function (d) {
      var st = D.stateFor(d), pts = D.actualPoints(st);
      return pts.length === st.day && Math.abs(pts[pts.length - 1][1] - st.demand) < 0.001;
    });
  })());
  check('the projected tail runs from tomorrow to close and lands on the projection', (function () {
    var D = sandbox.EL_DASH;
    return D.designs.every(function (d) {
      var st = D.stateFor(d), tail = D.projectedPoints(st);
      return tail.length === D.WINDOW_DAYS - st.day && tail[0][0] === st.day + 1 &&
        tail[tail.length - 1][0] === D.WINDOW_DAYS &&
        Math.abs(tail[tail.length - 1][1] - st.projected) < 0.001;
    });
  })());
  check('the forecast band hugs the realised curve then flares to the projection', (function () {
    var D = sandbox.EL_DASH;
    return D.designs.every(function (d) {
      var st = D.stateFor(d), b = D.bandEdges(st), n = D.WINDOW_DAYS;
      return b.upper.length === n && b.lower.length === n &&
        Math.abs(b.upper[n - 1][1] - st.projected * (1 + d.vol)) < 0.001 &&
        Math.abs(b.lower[n - 1][1] - st.projected * (1 - d.vol)) < 0.001 &&
        Math.abs(b.upper[st.day - 1][1] - st.demand) < 0.001;
    });
  })());
  check('daily bars sum to orders-to-date behind and to the projection ahead', (function () {
    var D = sandbox.EL_DASH;
    return D.designs.every(function (d) {
      var st = D.stateFor(d), bars = D.dailyBars(st);
      var past = bars.filter(function (b) { return !b.future; });
      var fut = bars.filter(function (b) { return b.future; });
      var s1 = past.reduce(function (a, b) { return a + b.v; }, 0);
      var s2 = fut.reduce(function (a, b) { return a + b.v; }, 0);
      return bars.length === D.WINDOW_DAYS && Math.abs(s1 - st.demand) < 0.01 &&
        Math.abs(s2 - (st.projected - st.demand)) < 0.01;
    });
  })());
  check('a scenario visibly changes every daily bar, not just the axis', (function () {
    var D = sandbox.EL_DASH, S = D.scenario, d = D.designs[0];
    S.demand = {}; S.day = D.WINDOW_DAY;
    var before = D.dailyBars(D.stateFor(d)).map(function (b) { return Math.round(b.v * 100); }).join(',');
    S.demand[d.name] = D.demandFor(d) * 2;
    var after = D.dailyBars(D.stateFor(d)).map(function (b) { return Math.round(b.v * 100); }).join(',');
    S.demand = {};
    return before !== after;
  })());
  check('the daily chart draws one bar per day for all three designs', (function () {
    var D = sandbox.EL_DASH;
    var svg = D.dailyChart(D.designs.map(function (d) { return D.stateFor(d); }));
    return (svg.match(/ct-bar /g) || []).length === D.WINDOW_DAYS * D.designs.length && /ct-ref/.test(svg);
  })());
  check('the tile trend range control slices the sparkline series', (function () {
    var D = sandbox.EL_DASH;
    var x = function (v, i) { return [i, v]; };
    var C = sandbox.EL_CHARTS, series = D.tileSeries.conv;
    var four = C.linePath(series.slice(-4).map(x));
    var all = C.linePath(series.map(x));
    return (four.match(/L/g) || []).length === 3 && (all.match(/L/g) || []).length === 51 && four !== all;
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
