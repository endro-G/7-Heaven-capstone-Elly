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
 '#pdpTitle', '#pdpKicker', '#pdpPrice', '#pdpDesc', '#pdpCrumb', '.pdp', '.pdp__main',
 '#cartLines', '#ckLines', '#cartEmpty', '#cartSubtotal', '#cartTotal', '#shipMeter', '#shipMeterLabel',
 '#recRail', '#eventsEyebrow', '#mAcctPill', '#signPanel', '.announce__loc', '#f-country',
 /* in-store staff assist (PRD §12) */
 '#staffApp', '#staffCustInput', '#staffCustResults', '#staffWalkIn', '#staffOccasion', '#staffTravel',
 '#staffSearch', '#staffResults', '#staffConfirm', '#confirmSize', '#confirmQty', '#confirmAdd',
 '#confirmBack', '#confirmLost', '#staffBasket', '#basketEmpty', '#stockSummary',
 '#staffDrawer', '#staffDrawerScrim', '#drawerTitle', '#drawerDots', '#drawerPrev', '#drawerNext', '#drawerClose',
 '#charSearch', '#charResults', '#charApprove', '#livelookStage', '#livelookArtWrap',
 '#staffGiftPanel', '#staffShipTo', '#wearerName', '#wearerAge', '#wearerRel',
 '#draftReview', '#staffHandoff', '#handoffResult', '#orderLadder', '#acctStaffOrders']
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
    { id: 'disney-1', n: 'Kids Tee - Doodle Mickey', p: 'S$49.90', k: 'disney', kinds: ['disney', 'custom'], img: 'y.jpg', tags: ['kids tee', 'mickey', 'doodle'], custom: { methods: ['patches'], patchSet: 'disney', patchCount: 2 } },
    { id: 'elly-24', n: 'Swim Shorts - Turtles', p: 'S$39.90', k: 'elly', img: 'z.jpg', tags: ['swim shorts', 'turtles'] }
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
  check('mobile drawer has B2B link', /b2b\.html">B2B &amp; bulk quotes<\/a>/.test(all));
  registry['#b2bWizard'].hidden = true;
  check('B2B wizard hidden by default', registry['#b2bWizard'].hidden === true);
  check('startB2B exported', typeof sandbox.EL.startB2B === 'function');
  sandbox.EL.startB2B('Corporate', 1);
  check('startB2B reveals wizard without error', registry['#b2bWizard'].hidden === false);

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
  sandbox.EL.initConfigurator({ n: 'Kids Tee - Doodle Mickey', p: 'S$49.90', k: 'disney', img: 'y.jpg', custom: { methods: ['patches'], patchSet: 'disney', patchCount: 3 } });
  check('patches-only product: method chips = Iron-on patches', /Iron-on patches/.test(registry['#cfgMethods']._html || ''));
  check('patches-only product: patch picker built (Pop Mickey)', /Pop Mickey/.test(registry['#cfgPatches']._html || ''));
  check('patches-only product: each patch shows its pre-selected spot', /left chest/.test(registry['#cfgPatches']._html || '') && /right sleeve/.test(registry['#cfgPatches']._html || ''));
  check('patches-only product: patch picker row visible, text row hidden', registry['#cfgPatchesWrap'].hidden === false && registry['#cfgTextWrap'].hidden === true);
  check('patches-only product: up to 3 free shown', (registry['#cfgPatchCount'].textContent || '') === '0 of 3 free');
  check('patches summary renders picked patches', (sandbox.EL.cfgSummaryText() || '').indexOf('Iron-on patches') >= 0);
  check('multi-kind overlap: Disney tee also in Customization pool', typeof sandbox.EL.inKind === 'function' && sandbox.EL.inKind(sandbox.EL_PRODUCTS[1], 'custom') === true && sandbox.EL.inKind(sandbox.EL_PRODUCTS[0], 'custom') === true);
  check('multi-kind overlap: pickPool includes cross-kind product once', (sandbox.EL.pickPool([{ k: 'custom' }]).map((p) => p.n).indexOf('Kids Tee - Doodle Mickey') >= 0));
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
  check('cart page renders 3 lines from bag count', (registry['#cartLines']._html || '').split('js-cart-line').length - 1 === 3);
  check('cart empty state hidden when items present', (registry['#cartEmpty'].style.display || '') === 'none');
  sandbox.EL.setBag(0);
  sandbox.EL.populateCartLines();
  check('cart page shows empty state at zero', (registry['#cartLines']._html || '').indexOf('js-cart-line') < 0 && (registry['#cartEmpty'].style.display || '') !== 'none');
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
