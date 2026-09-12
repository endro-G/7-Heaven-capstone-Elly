/* ============================================================
   THE ELLY STORE — revamp prototype · shared shell components
   Injects (in order): announcement bar, sticky header with an
   always-visible brand + search row, 6-pillar mega navigation,
   a Quince-style search dropdown panel, mobile drawer and footer.

   The shell auto-injects itself on load; highlight the active
   pillar from <body data-page="…">.
   ============================================================ */
(function () {
  'use strict';

  var I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1.2 12.2a1.8 1.8 0 0 1-1.8 1.6H9a1.8 1.8 0 0 1-1.8-1.6L6 8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    caret: '<svg class="caret" viewBox="0 0 24 24" fill="currentColor"><path d="M12 16L5 9h14z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5z"/></svg>'
  };

  var PILLARS = [
    {
      key: 'elly-label', label: 'Elly Label', url: 'elly-label.html', tint: 'elly', emoji: '\uD83C\uDF38',
      tagline: 'In-house prints. Premium fabrics. Designed in Singapore.',
      blurb: 'The Elly Store\u2019s own clothing label for babies, kids (0\u201314) and grown-ups \u2014 soft fabrics, playful prints, timeless family style.',
      groups: [
        { title: 'Shop by age', links: ['Baby (0\u20132Y)', 'Girls (1\u201314Y)', 'Boys (1\u201314Y)', 'Adults', 'Mummy & Me / Daddy & Me'] },
        { title: 'Shop by type', links: ['Newborn essentials', 'Dresses & sets', 'Tops & bottoms', 'Sleepwear', 'Swimwear', 'Outerwear'] },
        { title: 'Collections', links: ['New In', 'Wear Your SG', 'Occasionwear', 'Matching family outfits'] }
      ],
      note: 'Facets in this category: age \u00b7 product type \u00b7 colour \u00b7 character-free (Elly Label is non-Disney).'
    },
    {
      key: 'disney-elly', label: 'Disney | elly', url: 'disney-elly.html', tint: 'disney', emoji: '\u2728',
      tagline: 'Disney magic meets elly style.',
      blurb: 'Exclusive Disney collections designed in Singapore \u2014 for holidays, twinning and every Disney adventure. Includes the Disney Pre-Order programme for brand-new designs.',
      groups: [
        { title: 'Shop by character', links: ['Mickey & Friends', 'Disney Princess', 'Frozen', 'Winnie the Pooh', 'Stitch', 'All Disney'] },
        { title: 'Shop by age', links: ['Baby Disney (0\u20132Y)', 'Girls (1\u201314Y)', 'Boys (1\u201314Y)', 'Disney for adults'] },
        { title: 'Pre-order & more', links: ['Disney Pre-Order (new designs)', 'Singapore exclusives', 'Disney family outfits', 'Disney swimwear', 'Personalisable Disney gifts'] }
      ],
      note: 'Every Disney | elly item is produced under official Disney licensing.'
    },
    {
      key: 'shoe', label: 'Shoe Boutique', url: 'shoe-boutique.html', tint: 'shoe', emoji: '\uD83D\uDC5F',
      tagline: 'Carefully curated footwear for every stage of little feet.',
      blurb: 'Soft soles to first walkers and beyond \u2014 a curated edit of stage-appropriate, healthy-foot shoes in sizes for every little adventurer.',
      groups: [
        { title: 'Shop by stage', links: ['Soft soles & pre-walkers', 'First walkers', 'Confident walkers'] },
        { title: 'Shop by type', links: ['Sneakers', 'Sandals', 'Ballet flats & Mary Janes', 'Adventure shoes', 'Waterplay'] },
        { title: 'Shop by brand', links: ['Biomecanics', 'Bobux', 'Garvalin', 'KEEN', 'Native', 'Old Soles'] }
      ],
      note: 'Facets in this category: stage \u00b7 shoe type \u00b7 brand \u00b7 size \u00b7 colour.'
    },
    {
      key: 'gift', label: 'Gifting Hub', url: 'gifting-hub.html', tint: 'gift', emoji: '\uD83C\uDF81',
      tagline: 'Thoughtful edits for every milestone.',
      blurb: 'Curated by occasion, age and budget \u2014 baby gift sets from $80, deluxe keepsake sets, and gift cards. For babies, kids and the grown-ups who love them.',
      groups: [
        { title: 'Shop by occasion', links: ['Newborn & baby shower', 'Full month', 'Birthday', 'First birthday', 'Christmas & festive'] },
        { title: 'Shop by recipient', links: ['Baby girls & boys', 'Kids (3\u201314Y)', 'Parents & grandparents', 'Twins & multiples'] },
        { title: 'Gift ideas', links: ['Gift sets from $80', 'Deluxe keepsake sets', 'Personalisable gifts', 'Digital gift card'] }
      ],
      note: 'Milestone moments: New Baby \u00b7 Full Month \u00b7 Baby Shower \u00b7 Birthdays.'
    },
    {
      key: 'custom', label: 'Customization', url: 'customization.html', tint: 'custom', emoji: '\uD83E\uDDF5',
      tagline: 'Make it truly theirs.',
      blurb: 'One place for Customization & Personalization \u2014 embroidered initials with placement & thread colour, or iron-on patches from a pre-set selection, across Elly Label, Disney | elly and gifts.',
      groups: [
        { title: 'Top-level type', links: ['Embroidered', 'Iron-on patches'] },
        { title: 'Personalise with', links: ['Name', 'Initials', 'Number', 'Thread colour', 'Placement'] },
        { title: 'Popular to personalise', links: ['Varsity tees & bombers', 'Robes & pullovers', 'Keepsake boxes', 'Baby gift sets'] }
      ],
      note: 'Customization is offered at checkout on eligible items \u2014 no separate flow needed.'
    },
    {
      key: 'furkids', label: 'Elly FurKids', url: 'furkids.html', tint: 'furkids', emoji: '\uD83D\uDC3E',
      tagline: 'Comfort for the furry members of the family.',
      blurb: 'Blankets that double as mats, bows and pet apparel \u2014 the same elly warmth, sized for S/M/L pets. Shown as a concept line only \u2014 not a Disney-licensed product.',
      groups: [
        { title: 'Shop by type', links: ['Blankets & mats', 'Bows', 'Pet apparel'] },
        { title: 'Shop by size', links: ['Small pets', 'Medium pets', 'Large pets'] },
        { title: 'Gift the pet owner', links: ['Pet gift sets', 'Personalised name tag', 'Matching family + pet looks'] }
      ],
      note: 'Concept line only \u2014 not a Disney-licensed product. Nothing here is confirmed product.',
      concept: true
    }
  ];

  /* ---------- sub-pillar links ----------
     Every sub-pillar item (desktop mega, mobile drawer, quick-shop panel) links to a
     FILTERED listing instead of its pillar's full grid:
       <pillar>.html?f=<Facet>:<Value>[&f=<Facet>:<Value>][&fl=<pill label>]
     Repeated `f` entries AND together; `|` inside a value ORs ("Baby girls|Baby boys").
     A value this page also renders as a facet control gets pre-ticked (visible and
     undoable in the panel); anything else rides as a removable pill — see
     applyFacetQuery in app.js. _smoke.js replays every entry against the product
     database and fails if a link no longer narrows its pillar grid.
     Deliberately absent: labels with nothing in the catalogue to filter by
     ("Outerwear", "New In", "Personalised name tag", "Matching family + pet looks").
     "All Disney" is the pillar itself, so it stays unfiltered on purpose. */
  var SUB_FACET = {
    /* Elly Label — age, type, and the editorial collections */
    'elly-label|Baby (0–2Y)': [['Age', 'Baby (0–2Y)']],
    /* Girls/Boys are audience edits (kids minus the girls-only / boys-only cuts), not a
       plain "Kids (1–14Y)" bucket — see the Age case in app.js facetMatch */
    'elly-label|Girls (1–14Y)': [['Age', 'Girls (1–14Y)']],
    'elly-label|Boys (1–14Y)': [['Age', 'Boys (1–14Y)']],
    'elly-label|Adults': [['Age', 'Adults']],
    'elly-label|Mummy & Me / Daddy & Me': [['Intent', 'twin', 'Mummy & Me / Daddy & Me']],
    'elly-label|Newborn essentials': [['Age', 'Newborn (0–12M)', 'Newborn essentials']],
    'elly-label|Dresses & sets': [['Type', 'Dresses', 'Dresses & sets']],
    'elly-label|Tops & bottoms': [['Type', 'Tops & tees', 'Tops & bottoms']],
    'elly-label|Sleepwear': [['Type', 'Sleepwear']],
    'elly-label|Swimwear': [['Type', 'Swimwear']],
    'elly-label|Wear Your SG': [['Collection', 'Wear Your SG']],
    'elly-label|Occasionwear': [['Collection', 'Occasionwear']],
    'elly-label|Matching family outfits': [['Intent', 'twin', 'Matching family outfits']],

    /* Disney | elly — characters first (the sub-pillar shoppers look for) */
    'disney-elly|Mickey & Friends': [['Character', 'Mickey & Friends']],
    'disney-elly|Disney Princess': [['Character', 'Disney Princess']],
    'disney-elly|Frozen': [['Character', 'Frozen']],
    'disney-elly|Winnie the Pooh': [['Character', 'Winnie the Pooh']],
    'disney-elly|Stitch': [['Character', 'Stitch']],
    'disney-elly|Baby Disney (0–2Y)': [['Age', 'Baby Disney (0–2Y)']],
    'disney-elly|Girls (1–14Y)': [['Age', 'Girls (1–14Y)']],
    'disney-elly|Boys (1–14Y)': [['Age', 'Boys (1–14Y)']],
    'disney-elly|Disney for adults': [['Age', 'Adults', 'Disney for adults']],
    'disney-elly|Singapore exclusives': [['Collection', 'Singapore', 'Singapore exclusives']],
    'disney-elly|Disney family outfits': [['Intent', 'twin', 'Disney family outfits']],
    'disney-elly|Disney swimwear': [['Type', 'Swimwear', 'Disney swimwear']],
    'disney-elly|Personalisable Disney gifts': [['Style', 'Personalisable', 'Personalisable Disney gifts']],

    /* Shoe Boutique — stage / type / brand */
    'shoe|Soft soles & pre-walkers': [['Stage', 'Soft soles / pre-walkers', 'Soft soles & pre-walkers']],
    'shoe|First walkers': [['Stage', 'First walkers']],
    'shoe|Confident walkers': [['Stage', 'Confident walkers']],
    'shoe|Sneakers': [['Type', 'Sneakers']],
    'shoe|Sandals': [['Type', 'Sandals']],
    'shoe|Ballet flats & Mary Janes': [['Type', 'Ballet flats & Mary Janes']],
    'shoe|Adventure shoes': [['Type', 'Adventure shoes']],
    'shoe|Waterplay': [['Type', 'Beach & waterplay', 'Waterplay']],
    'shoe|Biomecanics': [['Brand', 'Biomecanics']],
    'shoe|Bobux': [['Brand', 'Bobux']],
    'shoe|Garvalin': [['Brand', 'Garvalin']],
    'shoe|KEEN': [['Brand', 'KEEN']],
    'shoe|Native': [['Brand', 'Native']],
    'shoe|Old Soles': [['Brand', 'Old Soles']],

    /* Gifting Hub — occasion / recipient / gift style / budget */
    'gift|Newborn & baby shower': [['Occasion', 'Newborn & baby shower']],
    'gift|Full month': [['Occasion', 'Full month']],
    'gift|Birthday': [['Occasion', 'Birthday']],
    'gift|First birthday': [['Occasion', 'Birthday', 'First birthday']],
    'gift|Christmas & festive': [['Occasion', 'Festive / Christmas', 'Christmas & festive']],
    'gift|Baby girls & boys': [['Recipient', 'Baby girls|Baby boys', 'Baby girls & boys']],
    'gift|Kids (3–14Y)': [['Recipient', 'Kids (3–14Y)']],
    'gift|Parents & grandparents': [['Recipient', 'Parents & grandparents']],
    'gift|Twins & multiples': [['Recipient', 'Twins & multiples']],
    'gift|Gift sets from $80': [['Budget', '$80–$150|$150–$300|$300+', 'Gift sets from $80']],
    'gift|Deluxe keepsake sets': [['Style', 'Keepsake box', 'Deluxe keepsake sets']],
    'gift|Personalisable gifts': [['Style', 'Personalisable']],
    'gift|Digital gift card': [['Style', 'Digital gift card']],

    /* Customization — method / what you personalise / placement */
    'custom|Embroidered': [['Method', 'Embroidered']],
    'custom|Iron-on patches': [['Method', 'Iron-on', 'Iron-on patches']],
    'custom|Name': [['Detail', 'Name']],
    'custom|Initials': [['Detail', 'Initials']],
    'custom|Number': [['Detail', 'Number']],
    'custom|Thread colour': [['Method', 'Embroidered', 'Thread colour']],
    'custom|Placement': [['Placement', 'Chest / pocket|Back / yoke|Sleeve / cuff|Keepsake box lid', 'Placement']],
    'custom|Varsity tees & bombers': [['Type', 'Tops & tees', 'Varsity tees & bombers']],
    'custom|Robes & pullovers': [['Type', 'Tops & tees|Sleepwear', 'Robes & pullovers']],
    'custom|Keepsake boxes': [['Type', 'Keepsake box', 'Keepsake boxes']],
    'custom|Baby gift sets': [['Type', 'Gift set', 'Baby gift sets']],

    /* Elly FurKids — type, pet size, gifting intent */
    'furkids|Blankets & mats': [['Type', 'Blankets & mats']],
    'furkids|Bows': [['Type', 'Bows']],
    'furkids|Pet apparel': [['Type', 'Pet apparel']],
    'furkids|Small pets': [['Pet size', 'S — small', 'Small pets']],
    'furkids|Medium pets': [['Pet size', 'M — medium', 'Medium pets']],
    'furkids|Large pets': [['Pet size', 'L — large', 'Large pets']],
    'furkids|Pet gift sets': [['Intent', 'gift', 'Pet gift sets']]
  };

  /* sub-pillar label → href (one resolver for mega, drawer and quick-shop) */
  function subHref(pillar, label) {
    if (/pre-order/i.test(label)) return 'pre-order.html';
    var specs = SUB_FACET[pillar.key + '|' + label];
    if (!specs || !specs.length) return pillar.url;
    var parts = specs.map(function (f) {
      var q = 'f=' + encodeURIComponent(f[0] + ':' + f[1]);
      if (f[2] && f[2] !== f[1]) q += '&fl=' + encodeURIComponent(f[2]);
      return q;
    });
    return pillar.url + '?' + parts.join('&');
  }
  window.EL_SUBHREF = subHref;   /* app.js's quick-shop panel renders the same links */

  var FOOT = {
    shop: {
      title: 'Shop',
      links: [
        ['Elly Label', 'elly-label.html'], ['Disney | elly', 'disney-elly.html'], ['Shoe Boutique', 'shoe-boutique.html'],
        ['Gifting Hub', 'gifting-hub.html'], ['Customization', 'customization.html'], ['Elly FurKids (concept)', 'furkids.html'],
        ['Disney Pre-Order', 'pre-order.html']
      ]
    },
    help: {
      title: 'Help',
      links: [['Shipping & delivery', '#'], ['30-day exchanges', '#'], ['Pre-Order explained', 'pre-order.html'], ['Elly Rewards & points', 'account.html'], ['Care guide', '#'], ['Contact us', '#']]
    },
    about: {
      title: 'About',
      links: [['The elly story', '#'], ['Our brands', '#'], ['Where to find us', '#'], ['Careers', '#'], ['Our blog', '#']]
    }
  };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- mega panel with intro column ---------- */
  function megaHTML(p) {
    var intro =
      '<div class="mega__intro">' +
      '<div class="mega__eyebrow"><span class="mega__emoji" style="background:var(--tint-' + p.tint + ')">' + p.emoji + '</span>' +
      '<span class="mega__kicker">' + esc(p.label) + '</span></div>' +
      '<h3>' + esc(p.tagline) + '</h3>' +
      '<p>' + esc(p.blurb) + '</p>' +
      '<div class="mega__cta"><a class="btn btn--coral btn--sm" href="' + p.url + '">Shop all ' + esc(p.label) + '</a>' +
      (p.concept ? '<span class="concept-tag concept-tag--solid">Concept only \u00b7 not Disney-licensed</span>' : '') +
      '</div>' +
      (p.key === 'disney-elly' ? '<a class="link-arrow link-arrow--light" href="pre-order.html">Preview the Disney Pre-Order flow</a>' : '') +
      '</div>';
    var cols = p.groups.map(function (g) {
      return '<div class="mega__group"><h4>' + esc(g.title) + '</h4><ul>' +
        g.links.map(function (l) {
          return '<li><a href="' + esc(subHref(p, l)) + '">' + esc(l) + '</a></li>';
        }).join('') + '</ul></div>';
    }).join('');
    var note = p.concept
      ? '<span class="concept-tag">Concept only \u2014 not a Disney-licensed product</span>'
      : '<span class="mega__note-ico">' + I.bolt + '</span>';
    return '<div class="mega">' +
      '<div class="wrap mega__in">' + intro +
      '<div class="mega__right">' +
      '<div class="mega__cols">' + cols + '</div>' +
      '<div class="mega__note">' + note + '<span>' + esc(p.note) + '</span></div>' +
      '</div></div></div>';
  }

  /* ---------- top nav row (pillar tabs + hover mega) ---------- */
  function navRow(activeKey) {
    var items = PILLARS.map(function (p) {
      var current = p.key === activeKey ? ' aria-current="page"' : '';
      var flag = p.concept ? '<span class="nav-flag">Concept only</span>' : '';
      var tip = p.concept ? ' title="Concept only \u2014 not a Disney-licensed product"' : '';
      return '<li class="has-mega"><a class="navlink"' + current + tip + ' href="' + p.url + '">' + esc(p.label) + flag + I.caret + '</a>' + megaHTML(p) + '</li>';
    }).join('');
    return '<nav class="hdr-nav" aria-label="Primary"><ul class="hdr-nav__in wrap">' + items + '</ul></nav>';
  }

  /* ---------- search dropdown panel (Quince-style) ---------- */
  function pillarQuickLinks() {
    return PILLARS.map(function (p) {
      return '<a class="q-ql q-ql--' + p.tint + '" href="' + p.url + '">' +
        '<span class="q-ql__em">' + p.emoji + '</span>' +
        '<span class="q-ql__tx"><b>' + esc(p.label) + '</b><i>Shop the range</i></span>' +
        I.arrow + '</a>';
    }).join('');
  }

  /* compact pillar links for the search rail */
  function pillarMiniLinks() {
    return PILLARS.map(function (p) {
      return '<a class="p-mini" href="' + p.url + '"><span>' + p.emoji + '</span>' + esc(p.label) +
        (p.concept ? '<em>concept</em>' : '') + '</a>';
    }).join('');
  }

  function searchLayerHTML() {
    return '<div class="search-layer" id="searchLayer" role="dialog" aria-modal="false" aria-label="Search">' +
      '<div class="search-layer__head"><span>Search the store</span>' +
      '<span class="search-layer__hint">Type to filter \u00b7 Esc to close</span>' +
      '<button type="button" class="search-layer__close js-close-search" aria-label="Close search">' + I.close + '</button></div>' +
      '<div class="search-layer__body search-layer__body--grid">' +
      '<aside class="search-rail">' +
      '<div class="chips-group" id="recentChipsWrap" hidden><span class="chips-label">Recently searched</span><div class="chip-row" id="recentChips"></div></div>' +
      '<div class="chips-group" id="viewedChipsWrap" hidden><span class="chips-label">Recently viewed</span><div class="chip-row chip-row--col" id="viewedChips"></div></div>' +
      '<div class="chips-group" id="popularKeywordsWrap"><span class="chips-label">Most searched · keywords</span><div class="chip-row" id="popularKeywords"></div></div>' +
      '<div class="chips-group" id="suggestChipsWrap"><span class="chips-label" id="suggestLabel">Suggested searches</span><div class="chip-row chip-row--col" id="suggestChips"></div></div>' +
      '<div class="chips-group" id="occasionChipsWrap"><span class="chips-label">Most popular intent-led categories</span><div class="chip-row chip-row--col" id="occasionChips"></div></div>' +
      '<div class="chips-group"><span class="chips-label">Or jump to a category</span><div class="search-pillars">' + pillarMiniLinks() + '</div></div>' +
      '</aside>' +
      '<div class="search-main">' +
      '<div class="search-idle">' +
      '<div class="search-rec-head"><span class="chips-label" style="margin:0">Recommended for you</span><span class="search-rec-why" id="recWhy"></span></div>' +
      '<div class="product-grid search-rec-grid" id="recGrid"></div>' +
      '</div>' +
      '<div class="search-results" id="searchResults">' +
      '<div class="grid-head"><div><span class="chips-label" style="margin:0">Results</span></div>' +
      '<span class="grid-count" id="resultCount"></span></div>' +
      '<div class="product-grid" id="resultGrid"></div>' +
      '</div>' +
      '</div></div></div>';
  }

  /* ---------- drawer (mobile) ---------- */
  function drawerHTML(activeKey) {
    var links = PILLARS.map(function (p) {
      var flag = p.concept ? '<span class="flag concept-tag">Concept</span>' : '';
      var sub = p.groups.map(function (g) {
        return g.links.map(function (l) {
          return '<a href="' + esc(subHref(p, l)) + '">' + esc(l) + '</a>';
        }).join('');
      }).join('');
      /* the pillar NAME goes straight to its product listing; the caret is a separate
         control that opens the sub-categories (one shared button used to do neither) */
      return '<div><div class="m-row">' +
        '<a class="m-navlink" href="' + p.url + '"' + (p.key === activeKey ? ' style="color:var(--coral)"' : '') + '>' + esc(p.label) + flag + '</a>' +
        '<button type="button" class="m-subtoggle" data-m-sub-toggle aria-expanded="false" aria-label="Show ' + esc(p.label) + ' categories">' + I.caret + '</button>' +
        '</div>' +
        '<div class="m-sub">' + sub + '</div></div>';
    }).join('');
    return '<aside class="m-drawer" id="mDrawer" aria-hidden="true">' +
      '<div class="m-drawer__top"><a href="index.html" class="brand"><img src="assets/elly-logo.webp" alt="The Elly Store"></a>' +
      '<button type="button" class="icon-btn js-close-drawer" aria-label="Close menu">' + I.close + '</button></div>' +
      '<nav class="m-drawer__nav">' +
      '<a class="acc-pill" href="account.html">' + I.user + ' <span id="mAcctPill">My account \u00b7 sign in (demo accounts)</span></a>' +
      links +
      '<div class="foot-note"><a class="btn btn--ghost btn--sm" href="cart.html">' + I.bag + ' View bag</a></div>' +
      '</nav></aside>';
  }

  /* ---------- header ----------
     Layout: brand left · expanding search right of centre · then Sign In + Cart
     On focus the search field grows and the brand/icons shrink (Quince-style). */
  /* ---------- B2B banner (PRD §10 entry point — replaces the old utility pill) ----------
     Slim full-width band at the very top of every page; scrolls away with the page
     (not part of the sticky header). Desktop shows the full sub-line; phones get a
     condensed sub-line so the band stays ~50–70px tall. */
  function b2bBannerHTML() {
    return '<div class="b2b-banner">' +
      '<div class="wrap b2b-banner__in">' +
      '<div class="b2b-banner__copy">' +
      '<b>Bulk and corporate orders, made simple</b>' +
      '<span class="b2b-banner__sub">Tell us what you need once \u2014 get tiered pricing and a quote back, no back and forth emails</span>' +
      '<span class="b2b-banner__sub b2b-banner__sub--short">Tell us once \u2014 get tiered pricing and a quote, no back-and-forth emails</span>' +
      '</div>' +
      '<a class="btn btn--coral btn--sm b2b-banner__cta" href="b2b.html">Start your quote ' + I.arrow + '</a>' +
      '</div></div>';
  }

  function headerHTML(activeKey) {
    return '<header class="site-head" id="siteHead">' +
      '<div class="hdr-util" id="hdrUtil">' +
      '<div class="wrap hdr-util__in">' +
      '<button type="button" class="icon-btn burger js-burger" aria-label="Open menu">' + I.menu + '</button>' +
      '<a href="index.html" class="brand brand--stack" aria-label="The Elly Store \u2014 home">' +
      '<img src="assets/elly-logo.webp" alt="The Elly Store">' +
      '<span class="brand__tag">Kids \u00b7 0\u201314 \u00b7 Family</span></a>' +
      '<div class="hdr-search" id="hdrSearch">' +
      '<form role="search" class="search-field js-open-search" action="#" onsubmit="return false">' +
      '<span class="sf-ico">' + I.search + '</span>' +
      '<input type="search" id="bigSearch" placeholder="Search outfits, occasions, gifts, Disney\u2026" autocomplete="off" aria-label="Search the store">' +
      '<span class="sf-kbd" aria-hidden="true">/</span>' +
      '<button type="submit" class="sf-go" aria-label="Search">' + I.arrow + '</button>' +
      '</form></div>' +
      '<div class="hdr-util__tools">' +
      '<a class="tool-link" href="account.html" id="signLink" aria-label="Sign in to your account">' +
      '<span class="tool-ico">' + I.user + '</span><span class="tool-lbl" id="signLbl">Sign In</span></a>' +
      '<a class="tool-link" href="cart.html" aria-label="Shopping bag">' +
      '<span class="tool-ico">' + I.bag + '<span class="count" id="bagCount" hidden>0</span></span>' +
      '<span class="tool-lbl">Bag</span></a>' +
      /* sign-in panel lives INSIDE the tools cluster → it anchors to the
         account icon's edge, not the full-width header bar, so it stays
         aligned at every aspect ratio */
      signPanelHTML() +
      '</div></div>' +
      searchLayerHTML() +
      '</div>' +
      navRow(activeKey) +
      '</header>';
  }

  /* ---------- footer ---------- */
  function footerHTML() {
    var col = function (c) {
      return '<div class="foot-col"><h4>' + c.title + '</h4><ul>' +
        c.links.map(function (l) { return '<li><a href="' + l[1] + '">' + esc(l[0]) + '</a></li>'; }).join('') +
        '</ul></div>';
    };
    var socials = ['Facebook', 'Instagram', 'TikTok', 'Pinterest'].map(function (n) {
      var g = n === 'Facebook' ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.6-.1-1.4-.2-2.4-.2-2.4 0-4 1.4-4 4V11H7.5v3h2.5v7z"/></svg>'
        : n === 'Instagram' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>'
        : n === 'TikTok' ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2 1.7 3.4 3.9 3.6v3c-1.5 0-2.8-.5-3.9-1.3v6.2a6.6 6.6 0 1 1-6.6-6.6c.4 0 .7 0 1.1.1v3.2a3.4 3.4 0 1 0 2.4 3.2V3z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-2.5 0-4.5 2-4.5 4.5v3H5V21h7v-6.5h3.5V21H18V9.5h-4.5v-3c0-.8.7-1.5 1.5-1.5h3V2z"/></svg>';
      return '<a href="#" aria-label="' + n + '">' + g + '</a>';
    }).join('');
    return '<footer class="site-foot">' +
      '<div class="wrap">' +
      '<div class="foot-main">' +
      '<div class="foot-brand">' +
      '<div class="foot-wordmark">elly</div>' +
      '<p>Singapore\u2019s Disney design-house label \u2014 designed in Singapore, loved everywhere. Kids\u2019 &amp; family clothing, shoes, gifts and more for 0\u201314 years.</p>' +
      '<div class="socials">' + socials + '</div>' +
      '</div>' +
      col(FOOT.shop) + col(FOOT.help) + col(FOOT.about) +
      '<div class="foot-col"><h4>Stay in the loop</h4><p style="font-size:13px;color:rgba(255,255,255,.75);margin-bottom:14px">New designs, pre-orders and member-only offers. No spam.</p>' +
      '<form class="newsletter js-newsletter" action="#"><input type="email" required placeholder="Email address" aria-label="Email address"><button type="submit">Join</button></form>' +
      '<p class="small" style="color:rgba(255,255,255,.6);margin-top:12px">Mon\u2013Fri 9am\u20135pm SGT \u00b7 WhatsApp (65) 9628 1037</p>' +
      '</div>' +
      '</div>' +
      '<div class="foot-sub"><div class="foot-sub__in"><span>\u00a9 2026 The Elly Store \u00b7 Prototype demo \u2014 catalog populated from theellystore.com \u00b7 not a live store</span>' +
      '<ul><li><a href="#">Terms</a></li><li><a href="#">Privacy</a></li><li><a href="#">Accessibility</a></li><li><a href="admin.html" style="opacity:.7">Demo admin</a></li><li><a href="staff.html" style="opacity:.7">Staff assist</a></li></ul></div></div>' +
      '</div></footer>';
  }

  /* ---------- announcement (above header) ---------- */
  function announcementHTML() {
    return '<div class="announce"><div class="announce__in">' +
      '<span class="announce__loc">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="10" r="5"/><path d="M8.5 14.5L6 21l6-2.5L18 21l-2.5-6.5"/></svg>' +
      ' Singapore \u00b7 ships worldwide</span>' +
      '<span class="announce__msg"><b>Prototype preview</b></span>' +
      '<span class="announce__sep">\u00b7</span>' +
      '<span>Free SG standard shipping over <b>$100</b> \u00b7 30-day exchange</span>' +
      '</div></div>';
  }

  /* ---------- injection ---------- */
  /* ---------- demo sign-in (PRD §5.1/§5.2 returning-segment signal) ----------
     Two seeded accounts (assets/accounts.js) stand in for the future unified
     customer database: Tom Cook (overseas residency → tourist-return) and
     Chloe Ng (SG residency → local-return). Selection lives here so every
     page can sign in; the session flag + resolver live in segment.js. */
  /* panel body is rebuilt on every open — the accounts script loads async and
     may land after the shell injected, so cards must not be baked in stale.
     Signed OUT → account pickers. Signed IN → segment status, switch-to-
     other-account, profile link and Sign out — sign-out is always reachable. */
  function signCardsHTML() {
    var list = (window.EL_ACCOUNTS_DAO ? window.EL_ACCOUNTS_DAO.list() : []);
    var seg = typeof window.ELSEG === 'object' && window.ELSEG ? window.ELSEG : null;
    var acc = seg && seg.isSignedIn() ? seg.account() : null;
    var head, intro, chips;
    if (acc) {
      var segName = acc.residency === 'overseas' ? 'tourist-return' : 'local-return';
      head = 'Signed in as ' + esc(acc.name);
      intro = 'Serving the <b>' + segName + '</b> segment — content follows this profile\u2019s residency, not your network.';
      chips = list.filter(function (a) { return a.id !== acc.id; }).map(function (a) {
        var tag = a.residency === 'overseas' ? 'overseas residency' : 'SG residency';
        return '<button type="button" class="chip js-signin" data-acc="' + a.id + '">' + a.emoji + ' Switch to <b>' + esc(a.name) + '</b> \u00b7 ' + tag + '</button>';
      }).join('');
      chips += '<a class="chip" href="account.html">View full profile \u2192</a>';
    } else {
      head = 'Sign in as a demo account';
      intro = 'Simulates the unified customer database. Your choice sets the returning segment: Tom → tourist-return, Chloe → local-return.';
      chips = list.map(function (a) {
        var tag = a.residency === 'overseas' ? 'visiting Singapore · overseas residency' : 'Singapore · SG residency';
        return '<button type="button" class="chip js-signin" data-acc="' + a.id + '">' + a.emoji + ' <b>' + esc(a.name) + '</b> \u00b7 ' + tag + '</button>';
      }).join('');
    }
    if (!list.length) chips = '<span class="small muted">Loading demo accounts\u2026</span>';
    /* the Sign out button carries its display inline: signed out → hidden,
       signed in → visible. (A stylesheet hide + style.display='' can never
       reveal it — the empty inline style just falls back to the CSS rule.) */
    return '<b>' + head + '</b>' +
      '<p class="small muted">' + intro + '</p>' +
      '<div class="chip-row">' + chips + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">' +
      '<button type="button" class="chip chip--coral js-signout"' + (acc ? '' : ' style="display:none"') + '>Sign out</button>' +
      '<button type="button" class="chip js-signin-close">Close</button>' +
      '</div>';
  }

  function signPanelHTML() {
    return '<div class="sign-panel" id="signPanel" hidden>' +
      '<div class="sign-panel__card">' + signCardsHTML() + '</div></div>';
  }

  function syncSignState() {
    var signedIn = typeof window.ELSEG === 'object' && window.ELSEG ? window.ELSEG.isSignedIn() : false;
    var acc = signedIn && window.ELSEG ? window.ELSEG.account() : null;
    var lbl = document.getElementById('signLbl');
    if (lbl) lbl.textContent = acc ? 'Hi, ' + acc.name.split(' ')[0] : 'Sign In';
    var pill = document.getElementById('mAcctPill');
    if (pill) pill.textContent = acc ? 'Hi, ' + acc.name.split(' ')[0] + ' \u00b7 ' + acc.points.toLocaleString() + ' pts' : 'My account \u00b7 sign in (demo accounts)';
    /* panel content (incl. Sign out visibility) is rebuilt from live state
       every time the panel OPENS — see the #signLink click handler */
  }

  document.addEventListener('click', function (e) {
    var open = e.target.closest('#signLink');
    if (open) {
      /* signed out → account picker; signed in → status + switch + sign out.
         The profile page stays reachable via the panel's "View full profile". */
      e.preventDefault();
      var p = document.getElementById('signPanel');
      if (p) {
        var card = p.querySelector ? p.querySelector('.sign-panel__card') : null;
        if (card) card.innerHTML = signCardsHTML(); /* fresh cards at open time */
        p.hidden = !p.hidden;
        syncSignState();
      }
      return;
    }
    var pick = e.target.closest('.js-signin');
    if (pick && typeof window.ELSEG === 'object' && window.ELSEG) {
      window.ELSEG.signIn(pick.getAttribute('data-acc'));
      var panel = document.getElementById('signPanel');
      if (panel) panel.hidden = true;
      return;
    }
    if (e.target.closest('.js-signout') && typeof window.ELSEG === 'object' && window.ELSEG) {
      window.ELSEG.signOut();
      var panel2 = document.getElementById('signPanel');
      if (panel2) panel2.hidden = true;
      return;
    }
    if (e.target.closest('.js-signin-close')) {
      var panel3 = document.getElementById('signPanel');
      if (panel3) panel3.hidden = true;
      return;
    }
    if (!e.target.closest('.sign-panel') && !e.target.closest('#signLink')) {
      var panel4 = document.getElementById('signPanel');
      if (panel4 && !panel4.hidden) panel4.hidden = true;
    }
  });

  /* dropdown hygiene: close on Escape and on viewport resize — a fixed-
     position panel can drift from its anchor across breakpoints, so the
     standard behaviour is to dismiss rather than fight the reflow */
  function closeSignPanel() {
    var p = document.getElementById('signPanel');
    if (p && !p.hidden) p.hidden = true;
  }
  window.addEventListener('resize', closeSignPanel);
  document.addEventListener('keydown', function (e) {
    if (e && (e.key === 'Escape' || e.key === 'Esc')) closeSignPanel();
  });

  function injectShell(activeKey) {
    if (document.getElementById('siteHead')) return; /* guard double inject */
    var b = document.body;
    var headWrap = document.createElement('div');
    /* skip the B2B banner on the B2B page itself — visitors are already there */
    /* skip the B2B banner on the B2B page (visitors are already there) and the
       staff tablet (a "Start your quote" CTA is noise for shop-floor staff) */
    var noBanner = (b.getAttribute('data-page') || '') === 'b2b' || (b.getAttribute('data-page') || '') === 'staff';
    headWrap.innerHTML = (noBanner ? '' : b2bBannerHTML()) + announcementHTML() + headerHTML(activeKey || '');
    /* move EVERY injected child (announcement + <header>) to the top of <body>
       — inserting only headWrap.firstChild used to drop the header entirely */
    while (headWrap.firstChild) b.insertBefore(headWrap.firstChild, b.firstChild);

    var footWrap = document.createElement('div');
    footWrap.innerHTML = footerHTML() + drawerHTML(activeKey || '') + '<div class="drawer-scrim js-scrim" data-for="drawer"></div><div class="toast" id="toast" role="status"></div>';
    b.appendChild(footWrap);
    syncSignState();

    var fxWrap = document.createElement('div');
    fxWrap.innerHTML = pageFxHTML();
    b.appendChild(fxWrap.firstChild);
  }

  /* ---------- page transitions (modern fade + brand flash) ---------- */
  function pageFxHTML() {
    return '<div class="page-fx" id="pageFx" aria-hidden="true"><div class="page-fx__logo">' +
      '<span class="pf-word">elly</span><span class="pf-name">The Elly Store</span></div></div>';
  }

  function isInternalLink(href) {
    if (!href) return false;
    if (href.charAt(0) === '#') return false;
    if (/^(https?:|mailto:|tel:|javascript:)/i.test(href)) return false;
    if (href === '#') return false;
    return true;
  }

  /* every same-site navigation fades out → brand flash → new page fades in */
  document.addEventListener('click', function (e) {
    /* the header account tool ALWAYS opens the sign-in/panel dropdown
       (sign in, switch account, sign out) — never the page transition */
    if (e.target.closest && e.target.closest('#signLink')) return;
    var a = e.target.closest('a[href]');
    if (!a) return;
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!isInternalLink(href)) return;
    e.preventDefault();
    var fx = document.getElementById('pageFx');
    if (fx) fx.classList.add('show');
    document.body.classList.add('is-leaving');
    setTimeout(function () { window.location.href = a.href; }, 330);
  });

  function pageToKey() {
    var page = document.body ? (document.body.getAttribute('data-page') || '') : '';
    for (var i = 0; i < PILLARS.length; i++) {
      if (PILLARS[i].key === page) return PILLARS[i].key;
    }
    return '';
  }

  /* ---------- visitor geo-location (assets/geo.js) ----------
     Loaded once, after the shell exists: applies the "Delivering to" chip in
     the announcement bar and preselects the checkout country. Silent —
     no permission prompts; chain: override → cache → /api/geo (Vercel) →
     ipwho.is → timezone hint. See assets/geo.js for the full chain. */
  function loadGeo() {
    if (typeof window.ELGEO !== 'undefined') return;
    var s = document.createElement('script');
    s.src = 'assets/geo.js';
    s.defer = true;
    (document.head || document.body).appendChild(s);
  }

  /* ---------- visitor segments + demo account DB ----------
     Order matters: accounts.js (the "database") must exist before
     segment.js resolves the signed-in account. segment.js re-renders
     the page via EL.applySegmentState when the session/geo changes. */
  function loadSegments() {
    if (typeof window.ELSEG !== 'undefined') return;
    var acc = document.createElement('script');
    acc.src = 'assets/accounts.js';
    acc.async = false; /* dynamic scripts ignore defer — async=false keeps execution order */
    (document.head || document.body).appendChild(acc);
    var seg = document.createElement('script');
    seg.src = 'assets/segment.js';
    seg.async = false;
    (document.head || document.body).appendChild(seg);
  }

  function boot() {
    if (!document.body) return;
    injectShell(pageToKey());
    loadGeo();
    loadSegments();
    /* expose first-run hook for interactions */
    if (typeof window.__ellyShellReady === 'function') window.__ellyShellReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else boot();

  window.EL = { PILLARS: PILLARS, icons: I, injectShell: injectShell, megaHTML: megaHTML, pageToKey: pageToKey, pageFxHTML: pageFxHTML, loadGeo: loadGeo, syncSignState: syncSignState, signCardsHTML: signCardsHTML };
})();
