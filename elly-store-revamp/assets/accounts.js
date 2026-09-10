/* ============================================================
   THE ELLY STORE — revamp prototype · demo account database
   Two profiles stand in for the future unified customer database
   (PRD §5.2: one profile per customer across online + in-store
   POS, keyed to the Smile loyalty account). They drive the two
   RETURNING visitor segments (PRD §5.1):

     Tom Cook  — residency: overseas (AU)  → TOURIST RETURN
                 Visits Singapore with his wife; buys Disney
                 matching tees for the two of them.
     Chloe Ng  — residency: SG             → LOCAL RETURN
                 Singaporean mum of a 3-month-old and a
                 6-year-old; buys Disney + Elly for the family.

   Shape mirrors a future accounts table: identity, residency
   (NOT live geo — PRD §5.1 returning rule), loyalty points,
   merged online/in-store history, browse trail and addresses.
   `item` names match catalog entries in products.js exactly so a
   real backend can hydrate them later without reshaping.

   Selection UI lives on account.html; the session flag + the
   segment resolver live in assets/segment.js.
   ============================================================ */
(function () {
  'use strict';

  function hist(item, src, date, status) {
    return { item: item, src: src, date: date, status: status };
  }

  window.EL_ACCOUNTS = [
    {
      id: 'tom-cook',
      name: 'Tom Cook',
      emoji: '\uD83C\uDDE6\uD83C\uDDFA',
      residency: 'overseas',
      country: 'AU',
      countryName: 'Australia',
      visitingSG: true,
      points: 310,
      pointsLabel: '= S$15.50 off at checkout \u00b7 100 pts = S$5 (Smile loyalty rules)',
      ordersNote: '3 online \u00b7 1 in-store (One Holland Village, last trip)',
      kids: 'No kids \u2014 shops Disney matching tees for himself and his wife while visiting Singapore',
      lastVisit: 'Aug 2026',
      recognition: 'Recognition on return: the Doodle Mickey tees you bought in-store on 21 Jan appear below in order history and already feed your recommendations \u2014 no re-entry, no paper receipt. (Illustrative demo row.)',
      history: [
        hist('Adult Tee - Doodle Mickey \u00b7 M (him)', 'store', '21 Jan 2026', 'Completed \u2014 POS sync via Smile'),
        hist('Ladies Tee - Doodle Minnie \u00b7 S (wife)', 'store', '21 Jan 2026', 'Completed \u2014 POS sync via Smile'),
        hist('Kids Tee - Mickey Polaroid \u00b7 gift (niece)', 'online', '18 Jan 2026', 'Delivered \u2014 shipped to home country'),
        hist('Adult Tee - Mickey Polaroid \u00b7 L', 'online', '2 Aug 2026', 'Delivered \u2014 collected at hotel')
      ],
      browse: ['Adult Tee - Pastel Mickey Crew', 'Ladies Polo Dress - Nautical Mickey', 'Men\u2019s Polo Tee - Nautical Mickey'],
      addresses: [
        { title: 'Melbourne, Australia (home)', note: 'Ship-to history \u2014 residency field: overseas.' },
        { title: 'Hotel / trip address \u00b7 Singapore', note: 'Tourist fulfilment option \u2014 ship to your hotel, or buy in-store.' }
      ]
    },
    {
      id: 'chloe-ng',
      name: 'Chloe Ng',
      emoji: '\uD83C\uDDF8\uD83C\uDDEC',
      residency: 'SG',
      country: 'SG',
      countryName: 'Singapore',
      visitingSG: false,
      points: 1240,
      pointsLabel: '= S$62 off at checkout \u00b7 100 pts = S$5 (Smile loyalty rules)',
      ordersNote: '8 online \u00b7 4 in-store / pop-up \u2014 all merged into this one profile',
      kids: 'Two daughters \u2014 3 months and 6 years old',
      lastVisit: '',
      recognition: 'Recognition on return: the Frozen dress you bought in-store on 12 Aug appears below in order history and already feeds your recommendations \u2014 no re-entry, no paper receipt. (Illustrative demo row.)',
      history: [
        hist('Frozen dress \u00b7 Elsa (12M) \u2014 baby daughter', 'store', '12 Aug 2026', 'Completed \u2014 POS sync via Smile'),
        hist('Nautical Mickey tee set (3\u20134Y) \u2014 elder daughter', 'online', '3 Jul 2026', 'Delivered'),
        hist('Keepsake box \u00b7 personalised (gift)', 'online', '18 Jun 2026', 'Delivered'),
        hist('Pop-up: Stitch romper (6M) \u2014 baby daughter', 'popup', '2 Jun 2026', 'Completed \u2014 matched by phone'),
        hist('Ladies Tee - Doodle Minnie \u00b7 S (mum)', 'store', '2 Jun 2026', 'Completed \u2014 POS sync via Smile')
      ],
      browse: ['Bamboo 2 Piece Set - Light Pink (Onesie & Sleepsuit)', 'Kids Tee - Doodle Minnie', 'Sleeping Bag - White Floral Bunny (0.2 TOG)'],
      addresses: [
        { title: 'Singapore (home)', note: 'Default shipping \u2014 free over S$100. Residency field: SG.' },
        { title: 'Hotel / trip address', note: 'Tourist fulfilment option \u2014 ship to your hotel, or buy in-store.' }
      ]
    }
  ];

  /* minimal DAO surface — a real backend replaces the bodies, not the callers */
  window.EL_ACCOUNTS_DAO = {
    list: function () { return (window.EL_ACCOUNTS || []).slice(0); },
    byId: function (id) {
      var list = window.EL_ACCOUNTS || [];
      for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
      return null;
    }
  };
})();
