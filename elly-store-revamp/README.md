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
- **Personalisable** — ONE field decides it: a non-empty `custom.methods` (`embroidered` / `patches`).
  `products.js` derives everything else from it at load — the `custom` pillar membership (`k`/`kinds`), the
  `custom` intent tag (`int`) and the card overlay — and `window.EL.isPersonalisable` is the single predicate
  asked by the Customization grid, the Gifting "Personalisable" filter, search/listings and the staff tablet.
  There is no stored `method` facet and no `giftStyle: 'Personalisable'` flag to drift out of sync.
- **Options are item-shaped, not global** — `custom.placements` is the only placement a configurator may
  offer, so **"only placements that work on this item" is enforced by data, not copy**: a blanket offers
  just Blanket corner, a keepsake box just its lid, a swim robe just Hood. Every placement key resolves to a
  label + character booking in `CUSTOM_PLACEMENTS`, and for **non-Latin scripts the booking scales with the
  placement** (`cfgLangMaxFor` — 9 characters on a 12-character corner or lid, 11 on a full back, and never
  below the 8 the site already shipped, so no existing booking got tighter) instead of a flat 8-character
  ceiling that clipped the roomier surfaces. **Scripts are EN / 中文 / 日本語 / 한국어**,
  matching the approved-character library (PRD §12: Korean, Chinese, English); the staff library's Chinese
  entry carries `lang: 'cn'` so tapping *Use* lights the Chinese chip, never the Korean one, and a script
  added to `CUSTOM_LANGS` is immediately selectable on the PDP, the cart editor, the staff drawer and the
  B2B quote form because they all read that one table.
- **Where the badge shows** — the `Personalisable` chip is overlaid on every listing card (category, intent,
  occasion and search grids, and the curated rails) so eligibility is visible **before** the shopper opens a
  product. The **PDP deliberately carries no badge** — the configurator and the "Add a name / initials"
  button are the signal there. The PDP's "Personalisation" accordion is rendered only for eligible items,
  with its copy built from that item's own methods/placements (a patches-only tee never advertises
  embroidery). Searching "personalisable" (or personalised / embroidery / initials / patches) resolves to
  the Personalisation intent and returns all eligible items.
- **Facets** — `type` (product type), `age`, `characters` (Disney franchise), `colours`, `price` (numeric),
  `occasion`/`recipient`/`giftStyle` (gifting), `petSize` (FurKids), `shoeStage`/`shoeType`/`brand`/`shoeSizes`,
  and customization `custom` (embroidered vs iron-on patches, placements — see **Personalisable** above).
  Every item also carries a
  `sizes` run matching its kind — baby months, kid years, adult XS–XXL, `One size`/`Set` for
  blankets, gifts, plush and toys, pet S/M/L for FurKids — so a gift never shows baby months as a size
  (drives the PDP chips and the staff tablet size selector; B2B uses `b2b.sizes`).
- **Availability** — `in-stock` · `concept` (FurKids concepts + Pre-Order art, flagged `concept` with a
  `conceptNote` disclosure) · `pre-order` (the Singapore Pre-Order item — one catalog entry with 3
  selectable designs, chosen on the Pre-Order PDP) · `b2b-only` (varsity tee —
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

Push to GitHub and Vercel picks it up automatically: static pages are served
as-is and `api/geo.js` deploys as a serverless function (free Hobby plan).
On Vercel, geo comes from the edge headers via `/api/geo`; on localhost the
same frontend falls back to the `ipwho.is` free lookup — nothing to configure
in either environment.

### Testing geo-location

- **Any country, no VPN:** add `?geo=US` (or any ISO code) to any page URL,
  or run `ELGEO.override('JP')` / `ELGEO.clearOverride()` in the console.
  The announcement bar chip and checkout preselect update instantly.
- **Sanity checks:** `await ELGEO.get()` returns `{ country, countryName, city,
  lat, lng, source }` — `source` tells you which tier resolved it
  (`override` · `vercel-edge` · `ip-lookup` · `locale-hint`; cached entries
  keep the source that originally resolved them).
- **Offline path:** block `ipwho.is` in DevTools (Network request blocking) and
  reload — the chip must still appear via the timezone hint, never an error.
- **CI-style:** `node _smoke.js` also exercises the geo module (override tier,
  chip injection, checkout preselect, fallback to the timezone hint).

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Brand-led landing: **4-slide live rotating hero banner** with real Elly Store imagery (segment-aware PRD slide order, auto-advances continuously with a coral progress fill on the active dot), **recommender tiles below the banner**, demo controls, feature bands, Pre-Order spotlight, value props |
| `elly-label.html` … `furkids.html` | The 6 category listings: grids populated from the live catalog; **facet UI wired** (filters, colour swatches, clear-all, empty states) but filtering/sort connect in a later step |
| `disney-elly.html` | Disney | elly listing + Pre-Order strip |
| `furkids.html` | FurKids: 5 **real pet accessories** from the store's Pet Accessories collection (photos/prices from theellystore.com) beside **6 concept pieces** (blankets, mat, apparel — Elly FurKids concept renders shipped under `assets/furkids/`), persistent **“Concept only — not a Disney-licensed product”** disclosure |
| `customization.html` | Embroidered (initial + placement + thread colour + curated **font range, font size, script EN/CN/JP/KR** — the approved-character library's scripts, PRD §12) / iron-on patches (up to 3 free from the item's range — Disney patches for Disney products, non-Disney otherwise — each on a **pre-selected spot**) methods, live PDP configurator with on-image + in-configurator **live look** preview |
| `pre-order.html` | Disney Pre-Order PDP: design selector (3 Singapore concepts), full-payment model, 8-week timeline, disclosure tags |
| `pdp.html` | Product detail with a **click-to-swap image gallery** (thumbnails built from the item's own images; a single-image item collapses the rail instead of showing placeholders) + the **personalisation configurator** (embroidered initial — font/size/script/thread/placement; iron-on patches — up to 3, pre-set spots) + sizes, qty, add-to-bag demo, accordions, cross-sell |
| `cart.html` / `checkout.html` | Bag + checkout with **all 3 tourist fulfilment options** (ship to SG/hotel · ship home · buy in-store/pop-up) |
| `b2b.html` | B2B landing (use-case cards) → 5-step RFQ: order type/date → **item rows with a product dropdown** (sizes + **per-item decoration options** appear under the selected item — gated to what that item can take, with a shape-correct placement diagram; add/remove rows) → artwork/shipping → your details → **review & confirm** (the validated details are frozen and echoed back; Request and printable Download live on this step) → two-stage confirmation + printable quote sheet |
| `account.html` | Unified profile: in-store + online order history merged, loyalty points (Smile placeholder rules), and **Personalisation orders & wearers** fed by the staff tablet (PRD §12) |
| `staff.html` | **In-store staff assist tablet (PRD §12)**: a 4-stage loop — greet/occasion capture → **build the set** (search the catalog → tap a result to show the item photo for customer confirmation → add; the basket mixes personalisable and plain items, and each eligible item opens the configurator in a slide-over drawer with its own name, placement, font, colour **and wearer**, PRD §12; **the set is the matched customer's bag** — ONE store with the online site (per-account, localStorage): items added online show up on the staff tablet, staff additions land in the customer's bag, switching customers swaps sets, and walk-in/new customers start empty) → fulfilment (pickup or gift-from-counter reusing checkout ship-to; the step lists the set and staff **tick which items this fulfilment covers** — every item is ticked by default, and anything unticked stays in the customer's basket for a later order while the POS draft carries only the ticked items) → draft-order handoff to POS. Stock is two-tier: **One Holland Village first** (the shelf carries the popular edit in sufficient quantity, ~35% of sales) with **warehouse fallback** (more SKUs popular + niche, larger quantities, ~65% of sales are online; wait-time estimate, pop-up excluded, lost-sale logging). The left rail is clickable to jump between stages, and the order-status ladder tracks back in the customer's account |
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
- **Visitor geo-location**: `assets/geo.js` (loaded site-wide by the shell) resolves the
  visitor's country/city **silently — no GPS, no permission prompts, session-only storage**.
  Chain: `?geo=XX` dev override → sessionStorage cache → `/api/geo` (Vercel edge headers,
  serverless function in `api/geo.js`) → `ipwho.is` free IP lookup (localhost path) →
  timezone/browser-locale hint (offline-safe). It personalises the announcement bar
  ("🇸🇬 Singapore · ships worldwide") and preselects the checkout country for
  non-SG visitors (skipped once the shopper touches the field, and for SG where
  ship-to-Singapore is already the default).
- **Recently viewed (per profile)**: recording starts on any PDP view and is stored the same way as
  the bag — a `localStorage` map keyed by the signed-in account id (`__guest` when anonymous). Each
  profile therefore keeps its own trail, signing in/out swaps the bucket, and nothing needs a server.
  It surfaces in three places — **search-panel chips**, the **homepage rail** and a dedicated
  **"Recently viewed" row on the PDP** — and all three read the one filtered list,
  `viewedRecommendations()`, so it **never recommends an item already in the bag or already bought
  by that profile**. A signed-in trail is seeded from the profile's own `browse` array in
  `accounts.js`, and matching stays exact so a purchase can't exclude the wrong product.
- **Cross-sell (basket-building)**: the **PDP "Complete the look"** rail and the **cart
  "Complete the set"** block are filled by `crossSellFor()` / `crossSellPool()` in `assets/app.js`,
  which score every catalog item against the product on screen (or against the whole bag) on
  **shared character, a complementary product type (tee → bottoms/shoes/hat, never more tees),
  shared intent and collection**, with pillar and overlapping age as tie-breakers. Pet items only
  pair with pet items, b2b-only products never surface, and both rails share the recently-viewed
  exclusion rule — the seed, anything in the bag and anything already bought are left out. The PDP
  cross-sell is **always product-derived** (its own row), so a browsing history can never push it
  off the page.
- **The landing hero links to what the recommender picked (signed-in visitors)**: the first
  banner is the PRD §5.1 priority-1 recommender slide, so for a signed-in profile its two
  buttons open **filtered listings** — the `?occasion=` / `?f=` deep links the facet engine
  already reads — instead of the account page. Chloe's banner opens the birthday edit for her
  6-year-old plus newborn picks for her 3-month-old; Tom's opens adult matching sets plus the
  Singapore exclusives new since his last trip. `recos` on each profile in `accounts.js` is
  that ranked output (`{label, href, why}`, `why` being the reason shown in the banner), and
  the "Because you shopped with us" rail's header link follows the same top pick. A profile
  with no picks falls back to the segment's default listings, and first-time visitors keep the
  segment slides unchanged.
- **The embroidery font range is scoped to the script**: every face declares the character set it
  can draw (`script: latin / cn / kr / jp` on `CUSTOM_FONTS`) and the picker shows only the range
  matching the selected script. The four Latin calligraphy faces carry no Chinese/Korean/Japanese
  glyphs, so a native name picked against one previewed in a system fallback face — nothing like
  what would be embroidered. 中文 gets a Ming serif and a brush kai (ZCOOL XiaoWei, Ma Shan Zheng),
  한국어 a classic Myeongjo and a soft Batang (Nanum Myeongjo, Gowun Batang), 日本語 a Mincho (Noto
  Serif JP) — all chosen to hold up both printed and embroidered. Each chip carries a native sample
  glyph, the name field previews the chosen face, switching script snaps off a face that can't draw
  the name, and the B2B **Font type** select follows the **Script** select by the same rule (the
  option value stays the label, so the quote payload is unchanged). The CJK faces come from Google
  Fonts with unicode-range slicing, so only the slices holding the typed characters download.
- **B2B decoration is item-aware, and specced like the store**: the method chips, the placement
  list, the diagram, the thread palette, the font/script ranges and the per-placement character
  limit all come from the same tables the PDP configurator uses. A tee gets
  Embroidery/Iron-on/Screen print/DTG with its own chest/sleeve/full-back placements; a keepsake
  box or gift set gets **lid embroidery only**; a blanket or pet mat gets **corner only**; a beanie
  or pet bandana gets a front patch; a pet bow-tie is offered **no decoration at all** and says so.
  The embroidery pane takes per-unit names (one per line, counted live against the line's
  quantities, and carried on the quote sheet as `decorationParams.names`) so a 50-tee named run is
  capturable in one line — the copy already promised "per-group names for personalisation".
- **Same item, different sizes = different cart lines**: a bag entry is the product name plus the
  size picked on the PDP (`"<name>::<size>"`, `assets/app.js`), so a matching family/twin set — one
  style in **3Y and 5Y** — renders as **two lines with their own size, quantity and price** instead of
  collapsing into "qty 2". Each line carries its own `data-entry`, so the qty stepper and **Remove**
  act on exactly that size, while adding the same size twice still merges into one line. Everything
  that resolves the catalogue (recommendations, the recently-viewed trail, the staff set) works off
  the **name** via `bagNames()`, so a size can never leak into a product lookup. The staff tablet
  round-trips the size the customer chose, and the POS draft carries it.
- **Personalisation on a bag line (edit it from the cart)**: the configurator's spec — method,
  placement, text, thread colour, font, size, script, or the picked patches — is stored with the
  bag as a `localStorage` map keyed by account id then **product name** (the cart aggregates its
  LINES on item + size, but one spec covers every size of that item), mirroring `elly-bags`. So a personalisable item already in the bag can be
  **edited in place** from the cart (an inline editor reopens the same configurator on that line and
  re-populates it), its personalisation can be **removed without dropping the item**, and a
  quick-added personalisable item offers **"Add a name / initials"** right on its line. Removing the
  line drops its spec **once no size of that item is left in the bag**, and specs follow the signed-in
  profile exactly like the bag. The **staff
  tablet** reads and writes the same map **by account id**, so opening a customer's item pre-fills
  the drawer with the spec they already chose, and an in-store capture lands back in their cart. The
  drawer only lists the steps that APPLY to the item — one that takes patches but not embroidery has
  no **Name** step.
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
  reviews, and live payments.
- Swap B2B illustrative decoration add-ons / tier discounts for confirmed quote pricing.
- Replace the staff tablet's placeholder inventory + wait times (PRD §12 Open Items) with
  real warehouse-to-store transfer data, and swap the sessionStorage draft-order store
  for the Shopify Draft Order API (same pattern as the B2B quote flow, §10).
