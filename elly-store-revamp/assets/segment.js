/* ============================================================
   THE ELLY STORE — revamp prototype · visitor segment resolver
   Implements the PRD §5.1 four-segment decision logic on top of
   REAL signals (no demo toggle needed):

     1. Signed in?  → session account (Tom Cook / Chloe Ng demo DB)
        YES → returning, classified by the PROFILE's residency field
              — never live IP, so a Singaporean browsing through a
              VPN stays LOCAL (PRD's explicit misclassification rule)
        NO  → first-time (anonymous; PRD treats cookie-recognized
              repeats as first-time too), classified by LIVE geo
     2. Live geo → assets/geo.js chain (override → cache → Vercel
        edge → ipwho.is → timezone hint). SG = local, else tourist.

   Produces the exact keys the existing rendering engine already
   consumes:  local-first · tourist-first · local-return · tourist-return

   The demo bar is gone; explicit test overrides remain available:
     ?geo=XX (geo.js)   ·   ELSEG.debug.setGeo('tourist')
     ELSEG.signIn('tom-cook') / ELSEG.signOut()
   ============================================================ */
(function () {
  'use strict';

  var SKEY = 'elly-session';        /* signed-in account id (session) */
  var DGEO = 'elly-demo-geo';       /* explicit tester override only */
  var DGUEST = 'elly-demo-guest';   /* explicit tester override only */
  var GCACHE = 'elly-geo';          /* geo.js resolved-value cache (JSON object) —
       no collision: the old demo bar stored plain 'local'/'tourist' strings
       here; demo overrides now live in the elly-demo-* keys above instead */

  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function ssDel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  /* ---------- auth against the demo account DB ---------- */
  function dao() { return window.EL_ACCOUNTS_DAO || null; }
  function signedInId() { return ssGet(SKEY) || null; }
  function account() {
    var id = signedInId();
    if (!id || !dao()) return null;
    return dao().byId(id);
  }
  function signIn(id) {
    var acc = dao() && dao().byId(id);
    if (!acc) return false;
    ssSet(SKEY, acc.id);
    changed();
    return true;
  }
  function signOut() {
    ssDel(SKEY);
    changed();
  }

  /* ---------- live geo ---------- */
  var geoValue = null;          /* 'local' | 'tourist' */
  var forcedGeo = null;         /* tester override */
  var listeners = [];

  function geoCacheLookup() {
    var raw = ssGet(GCACHE);
    if (!raw) return null;
    try {
      var o = JSON.parse(raw);
      return o && o.country ? o : null;
    } catch (e) { return null; }
  }
  function geoHintFallback() {
    /* mirrors geo.js tier-5 default without duplicating its whole table:
       resolve via ELGEO if present, else the SG store default */
    if (window.ELGEO && typeof window.ELGEO.localeHint === 'function') {
      return window.ELGEO.localeHint();
    }
    return { country: 'SG', countryName: 'Singapore', city: 'Singapore' };
  }
  function currentGeo() {
    if (forcedGeo) return forcedGeo;
    var g = geoCacheLookup();
    if (!g) g = geoHintFallback();
    return g.country === 'SG' ? 'local' : 'tourist';
  }

  /* ---------- PRD §5.1 decision logic ---------- */
  function current() {
    var acc = account();
    if (acc) {
      var g = acc.residency === 'overseas' ? 'tourist' : 'local';
      return { geo: g, guest: 'return', account: acc, key: g + '-return' };
    }
    var geo = forcedGeo || (function () {
      var v = ssGet(DGEO);
      if (v === 'tourist' || v === 'local') return v;
      return currentGeo();
    })();
    var guest = (function () {
      var v = ssGet(DGUEST);
      return v === 'first' || v === 'returning' || v === 'return' ? (v === 'first' ? 'first' : 'return') : 'first';
    })();
    return { geo: geo, guest: guest, account: null, key: geo + '-' + guest };
  }

  function segKey() { return current().key; }
  function isSignedIn() { return !!account(); }

  /* ---------- live updates: geo may resolve after first render ---------- */
  function refreshGeo() {
    var next = currentGeo();
    if (geoValue !== null && geoValue !== next) changed();
    geoValue = next;
  }
  function changed() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](current()); } catch (e) {}
    }
    /* re-run the page renderer if the interaction engine is loaded */
    if (typeof window.EL === 'object' && window.EL && typeof window.EL.applySegmentState === 'function') {
      window.EL.applySegmentState();
    }
    /* keep the shared header + drawer honest about auth state */
    if (typeof window.EL === 'object' && window.EL && typeof window.EL.syncSignState === 'function') {
      try { window.EL.syncSignState(); } catch (e) {}
    }
  }
  function onChange(fn) { listeners.push(fn); }

  /* geo.js resolves asynchronously — subscribe once it exists.
     The FIRST resolution must broadcast too: the page may have rendered
     the fallback (local) while geo was still in flight, e.g. an overseas
     visitor's ipwho.is round-trip finishing after DOMContentLoaded. */
  function bindGeo() {
    if (window.ELGEO && typeof window.ELGEO.ready === 'function') {
      window.ELGEO.ready(function (g) {
        var next = g && g.country === 'SG' ? 'local' : 'tourist';
        if (geoValue !== next) { geoValue = next; changed(); }
      });
    } else {
      setTimeout(bindGeo, 150);
    }
  }

  /* ---------- tester overrides (replace the removed demo bar) ---------- */
  var debug = {
    setGeo: function (v) {
      if (v !== 'tourist' && v !== 'local' && v !== null) return;
      forcedGeo = v;
      if (v) ssSet(DGEO, v); else ssDel(DGEO);
      changed();
      return current();
    },
    setGuest: function (v) {
      if (v !== 'first' && v !== 'return' && v !== null) return;
      if (v) ssSet(DGUEST, v); else ssDel(DGUEST);
      changed();
      return current();
    },
    reset: function () { ssDel(DGEO); ssDel(DGUEST); forcedGeo = null; changed(); return current(); },
    describe: function () {
      var s = current();
      return s.key + (s.account ? ' (' + s.account.name + ')' : ' (anonymous)') +
        ' \u00b7 geo: ' + (forcedGeo ? forcedGeo + ' (forced)' : 'live') +
        ' \u00b7 override any page with ?geo=US';
    }
  };

  window.ELSEG = {
    current: current,
    segKey: segKey,
    isSignedIn: isSignedIn,
    account: account,
    signIn: signIn,
    signOut: signOut,
    refreshGeo: refreshGeo,
    onChange: onChange,
    debug: debug,
    /* smoke-test hook: inject a geo value without a real network.
       Fires changed() exactly like the real ELGEO.ready path, so late-
       resolving geo re-renders segment-driven content in production too. */
    __setGeoHint: function (o) {
      forcedGeo = null; geoValue = null;
      try { ssSet(GCACHE, JSON.stringify(o)); } catch (e) {}
      changed();
    }
  };

  bindGeo();

  /* late-boot broadcast: this file loads as a DYNAMIC script (async), so on
     every page navigation the shell + interaction engine boot BEFORE the
     resolver exists and render the anonymous "Sign In" fallback — even when
     a session is already stored. Re-render now that the resolver is live so
     a signed-in visitor sees "Hi, <name>" immediately, without clicking. */
  changed();
})();
