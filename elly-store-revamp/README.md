# The Elly Store — Revamp · demo prototype

A responsive, modernised prototype of the revamped theellystore.com, built from the PRD
(`elly-store-growth-engine-prd.md`) with brand fidelity to the live site (logo, palette,
typography). The catalog lives in a **product database** (`assets/products.js`,
`window.EL_PRODUCTS`) populated from the live theellystore.com feed (real names, prices,
Shopify-CDN photos) and drives the grids, PDP, search, recommender rails, facet filtering
and the B2B item rows. Third-party hooks (Smile, Klaviyo, Judge.me, payments) remain
clearly-labelled structure/demo.

## Product database

`assets/products.js` is the single source of truth for the whole site. Every record carries
metadata + tags so the catalog can be filtered and searched:

- **Pillars** — `k` (primary) + `kinds` (extra memberships, e.g. a Disney tee that is also customisable).
- **Facets** — `type` (product type), `age`, `characters` (Disney franchise), `colours`, `price` (numeric),
  `occasion`/`recipient`/`giftStyle` (gifting), `petSize` (FurKids), `shoeStage`/`shoeType`/`brand`/`shoeSizes`,
  and customization `method`/`custom` (embroidered vs iron-on patches, placements).
- **Availability** — `in-stock` · `concept` (FurKids concepts + Pre-Order art, flagged `concept` with a
  `conceptNote` disclosure) · `pre-order` (the 3 Singapore Pre-Order designs) · `b2b-only` (varsity tee —
  never surfaces in consumer browsing). Adult family-matching tees are real in-stock consumer items
  AND quotable in B2B (their `b2b.available` flag keeps them in the quote flow).
- **B2B** — `b2b: { available, unit, sizes, meta }` on B2B-applicable items. The B2B quote wizard
  derives its item dropdown from this flag, so it always quotes from the same catalog, limited to the
  items applicable to wholesale/corporate/event orders.
- **Intent-led categories** — `window.EL_INTENTS` defines the occasion/collection lenses
  (Newborn & Baby Shower, Holiday Gift Boxes, Big Brother/Little Sister, Theme Park
  Vacation, Pajama Party/Sleepover, Family Photoshoot, Birthday, CNY, Singapore,
  Personalisation, FurKids, **Twinning & Matching Sets**). Each product's `int`/`occasion`
  tags can put it in ANY number of them, so one item surfaces from every relevant
  entry point. **Twinning & Matching** (24 items) covers matching sets for the WHOLE
  family — twin gift sets, "Twin it" Mickey tees, sibling/CNY-family outfits (e.g. the
  Blue Cranes Tang Shirt + Cheongsam pair) — plus mums' & dads' versions of the kids'
  prints (Ladies Doodle Minnie, Adult Mickey Polaroid / Pastel Mickey Crew / Lion City,
  Ladies Nautical Polo Dress + Men's Nautical Polo Tee, Adult SG Checklist, sized
  XS–XXL) so the whole family can twin. Items keep their other intent tags too (a
  cheongsam is `twin` + `cny` + `photoshoot`).
- **Search** — the header search works in two modes: **intent** (a query or popular
  alias like "birthday present", "baby shower", "sleepover PJs", "sg", "pjs" resolves
  to an intent-led category and returns everything tagged with it — longest phrase
  wins when aliases overlap) or **keywords** (every token must appear across the
  product's name, `tags`, characters, type, collection or colours). No matches falls
  back to popular picks. Suggestion chips (per visitor segment) all resolve through
  this same engine.
- **Popularity in the search panel** — opening the search shows the **most searched
  keywords** (highest-frequency searchable terms computed from the catalog, e.g.
  "mickey", "dress", "cheongsam", each with a match count) and the **most popular
  intent-led categories** (every `EL_INTENTS` category ranked by catalog size, with
  icon + product count). Clicking either chip runs the real search for that
  keyword/category — counts are derived live from the product database.
- **Search results page** (`search.html?q=…`) — pressing **Enter** (or the submit
  arrow) in the header search, or clicking any suggestion chip, opens a dedicated
  results page laid out exactly like a pillar listing: every match rendered in the
  grid with the **facet panel on the left** (Character / Age / Type incl. availability
  &amp; Concept / Occasion / Colour / Price) plus sort — the facets narrow the searched
  results live, exactly like a category page. The header field stays prefilled so
  the query can be refined, and zero-match / no-query states show real empty states.
  Typing in the header still shows instant live results inside the overlay.

The facet panels and sort controls on the 6 listing pages filter this database live
(no more structure-only placeholders).

## Run it

```bash
node server.js
# → http://localhost:4173
```

(No dependencies, no build step. Works in any modern browser.)

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Brand-led landing: **4-slide live rotating hero banner** with real Elly Store imagery (segment-aware PRD slide order, auto-advances continuously with a coral progress fill on the active dot), **recommender tiles below the banner**, demo controls, feature bands, Pre-Order spotlight, value props |
| `elly-label.html` … `furkids.html` | The 6 category listings: grids populated from the live catalog; **facet UI wired** (filters, colour swatches, clear-all, empty states) but filtering/sort connect in a later step |
| `disney-elly.html` | Disney | elly listing + Pre-Order strip |
| `furkids.html` | FurKids: 5 **real pet accessories** from the store's Pet Accessories collection (photos/prices from theellystore.com) beside **6 concept pieces** (blankets, mat, apparel — Elly FurKids concept renders shipped under `assets/furkids/`), persistent **“Concept only — not a Disney-licensed product”** disclosure |
| `customization.html` | Embroidered (initial + placement + thread colour + curated **font range, font size, language EN/JP/KR**) / iron-on patches (up to 3 free from the item's range — Disney patches for Disney products, non-Disney otherwise — each on a **pre-selected spot**) methods, live PDP configurator with on-image + in-configurator **live look** preview |
| `pre-order.html` | Disney Pre-Order PDP: design selector (3 Singapore concepts), full-payment model, 8-week timeline, disclosure tags |
| `pdp.html` | Product detail with the **personalisation configurator** (embroidered initial — font/size/language/thread/placement; iron-on patches — up to 3, pre-set spots) + sizes, qty, add-to-bag demo, accordions, cross-sell |
| `cart.html` / `checkout.html` | Bag + checkout with **all 3 tourist fulfilment options** (ship to SG/hotel · ship home · buy in-store/pop-up) |
| `b2b.html` | B2B landing (use-case cards) → 5-step RFQ: order type/date → **item rows with a product dropdown** (sizes + decoration options appear under the selected item; add/remove rows) → artwork/shipping → your details → **review & confirm** (the validated details are frozen and echoed back; Request and printable Download live on this step) → two-stage confirmation + printable quote sheet |
| `account.html` | Unified profile: in-store + online order history merged, loyalty points (Smile placeholder rules) |
| `admin.html` | Demo dashboard: 3 KPI families + interactive **demand vs MOQ** per Pre-Order design |

## Brand system (from live theellystore.com)

- Logo: `assets/elly-logo.webp` (official wordmark, captured from the live site)
- Colours: coral `#FF6070` · blue `#4D6EB5` · cream `#FCF6EE` · ink `#000`
- Type: **Ovo** (serif headings) · Helvetica/Arial (body) · uppercase letterspaced buttons (square)
- Footer: brand blue with white text

## Prototype conventions

- **Shell**: `assets/components.js` auto-injects on every page (from `<body data-page>`):
  announcement bar, scrolling **B2B banner** ("Bulk and corporate orders, made simple" ·
  "Start your quote" CTA, PRD §10), sticky header —
  brand left, **larger Sign In + Cart icons** and an
  **always-visible search field right of centre** (no scrolling needed) that **grows on
  focus while the brand/icons shrink** (Quince-style), Quince-style **search dropdown**
  with a suggestion rail + **recommender product grid** (per-visitor-segment picks),
  six-category **hover mega menus**, mobile drawer and footer.
- **Page transitions**: every same-site navigation fades the page out through a brand
  flash (elly wordmark) and fades the next page in; in-page anchors smooth-scroll.
- **Landing quick discovery**: the header search (with the PRD recommender panel) and the
  six-category top navigation work on every page, so shoppers reach any category in one click.
- **Interactions**: `assets/app.js` (live-rotating hero with dots/arrows + animated
  progress fill on the active dot, search open/close/typing, recommender engine per segment,
  visitor demo toggle, search chips, catalog-populated grids, facets (UI only), tabs, qty
  steppers, B2B tiers, fulfilment options, admin MOQ demo).
- **Catalog grids**: `data-ghost-grid` containers are filled from `assets/products.js` with
  real product cards; the facet panels (age · type · character · colour · price · method ·
  placement · pet size · shoe stage/brand/size · occasion · recipient · style · budget) and
  sort controls on the 6 listing pages filter the product database live, with active-filter
  pills, result counts and real empty states.
- **Demo disclosure**: badge/ribbon pattern `Concept only — not a Disney-licensed product` marks
  FurKids; `Concept design — prototype illustration only` marks Pre-Order art (per PRD §§5.3, 8, 11).
- All prices/discounts/tiers/points are **illustrative placeholders** (PRD §12 open items).

## Next step

- Build the guided-gifting flow on `gifting-hub.html` (currently structure-only).
- Wire the reserved third-party hooks: Smile loyalty + POS sync, Klaviyo flows, Judge.me
  reviews, live payments, and fill Pre-Order PDP pricing.
- Swap B2B illustrative decoration add-ons / tier discounts for confirmed quote pricing.
