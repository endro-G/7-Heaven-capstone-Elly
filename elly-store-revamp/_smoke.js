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
 '#b2bQty', '#b2bSub', '#b2bSave', '#b2bTotal', '#b2bUnit', '#rushNote', '#artName', '#decoPanes', '#b2bDate', '#artFile', '#b2bRequest']
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
} catch (err) { console.error('UNCAUGHT:', err && err.stack || err); failed = true; }
process.exit(failed ? 1 : 0);