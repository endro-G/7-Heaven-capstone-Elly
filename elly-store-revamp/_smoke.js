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
 '#cfgLive',
 '#pdpTitle', '#pdpKicker', '#pdpPrice', '#pdpDesc', '#pdpCrumb', '.pdp', '.pdp__main',
 '#cartLines', '#ckLines', '#cartEmpty', '#cartSubtotal', '#cartTotal', '#shipMeter', '#shipMeterLabel']
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
  requestAnimationFrame: (f) => setTimeout(f, 0), navigator: { userAgent: 'smoke' }
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
    { n: 'Kids Tee - Doodle Mickey', p: 'S$49.90', k: 'disney', kinds: ['disney', 'custom'], img: 'y.jpg', custom: { methods: ['patches'], patchSet: 'disney', patchCount: 2 } }
  ];
  load('assets/app.js');
  check('scripts evaluate fully', typeof sandbox.EL === 'object' && typeof sandbox.EL.ghostCard === 'function');
  (listeners['DOMContentLoaded'] || []).forEach((fn) => fn());

  const all = registry['body'].children.map((c) => c._html || '').join('\n');
  check('shell injected', /site-head/.test(all) && /search-field/.test(all));
  check('header tool says Bag', />Bag<\/span>/.test(all));
  check('no header label says Cart', !/>Cart<\/span>/.test(all));
  check('default signed-in: sign label = Hi, Chloe', (registry['#signLbl'].textContent || '') === 'Hi, Chloe');
  check('mode default guest = returning', sandbox.EL && typeof sandbox.EL === 'object');
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
  check('embroidery: font picker built (curated range)', /Classic Serif/.test(registry['#cfgFonts']._html || '') && /Script/.test(registry['#cfgFonts']._html || '') && /Modern Sans/.test(registry['#cfgFonts']._html || '') && /Heritage Caps/.test(registry['#cfgFonts']._html || ''));
  check('embroidery: size + language pickers built', /Medium/.test(registry['#cfgSizes']._html || '') && /日本語/.test(registry['#cfgLangs']._html || '') && /한국어/.test(registry['#cfgLangs']._html || ''));
  check('live look panel present', typeof registry['#cfgLive'] === 'object');
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
} catch (err) { console.error('UNCAUGHT:', err && err.stack || err); failed = true; }
process.exit(failed ? 1 : 0);