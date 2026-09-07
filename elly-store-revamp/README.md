# The Elly Store — Revamp · demo prototype

A responsive, modernised prototype of the revamped theellystore.com, built from the PRD
(`elly-store-growth-engine-prd.md`) with brand fidelity to the live site (logo, palette,
typography). The demo catalog in `assets/products.js` is populated from the live
theellystore.com feed (real names, prices, Shopify-CDN photos) and drives the grids,
PDP, search, recommender rails and B2B item rows. Facets/sort and the third-party hooks
(Smile, Klaviyo, Judge.me, payments) remain clearly-labelled structure/demo.

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
| `customization.html` | Embroidered (initial + placement + thread colour) / iron-on patches (pre-set SG or Disney selection) methods, live PDP configurator with preview |
| `pre-order.html` | Disney Pre-Order PDP: design selector (3 Singapore concepts), full-payment model, 8-week timeline, disclosure tags |
| `pdp.html` | Product detail with the **personalisation configurator** (embroidered initial / iron-on patches) + sizes, qty, add-to-bag demo, accordions, cross-sell |
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
  real product cards; facet filtering and sorting are UI-only for now (wired, not yet
  connected to the catalog).
- **Demo disclosure**: badge/ribbon pattern `Concept only — not a Disney-licensed product` marks
  FurKids; `Concept design — prototype illustration only` marks Pre-Order art (per PRD §§5.3, 8, 11).
- All prices/discounts/tiers/points are **illustrative placeholders** (PRD §12 open items).

## Next step

- Connect the facet filters and sort controls on the 6 listing pages to the live catalog
  (UI is wired and grid-ready).
- Build the guided-gifting flow on `gifting-hub.html` (currently structure-only).
- Wire the reserved third-party hooks: Smile loyalty + POS sync, Klaviyo flows, Judge.me
  reviews, live payments, and fill Pre-Order PDP pricing.
- Swap B2B illustrative decoration add-ons / tier discounts for confirmed quote pricing.
