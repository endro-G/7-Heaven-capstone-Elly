/* ============================================================
   THE ELLY STORE — revamp prototype · Vercel edge geo endpoint
   Deployed automatically as /api/geo on Vercel (free Hobby plan).

   Vercel stamps every incoming request with x-vercel-ip-* headers
   derived from the visitor's IP at the nearest edge node — no API
   key, no rate limits, no third-party dependency. This function
   just relays them as JSON for assets/geo.js to consume.

   Locally (`node server.js`) there is no /api/geo route and none
   of these headers exist — assets/geo.js detects the failure and
   falls back to the ipwho.is lookup, so both environments work
   with the same frontend code.
   ============================================================ */
'use strict';

module.exports = function (req, res) {
  var h = req.headers || {};
  var dec = function (v) {
    if (!v) return '';
    try { return decodeURIComponent(v); } catch (e) { return v; }
  };
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    source: 'vercel',
    country: h['x-vercel-ip-country'] || null,
    countryRegion: h['x-vercel-ip-country-region'] || null,
    city: dec(h['x-vercel-ip-city']),
    lat: h['x-vercel-ip-latitude'] || null,
    lng: h['x-vercel-ip-longitude'] || null,
    postal: h['x-vercel-ip-postal-code'] || null,
    timeZone: h['x-vercel-ip-timezone'] || null
  }));
};
