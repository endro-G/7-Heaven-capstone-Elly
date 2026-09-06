# The Elly Store — Revamp · UI structure prototype

A responsive, modernised, **structure-only** prototype of the revamped theellystore.com,
built from the PRD (`elly-store-growth-engine-prd.md`) with brand fidelity to the live site
(logo, palette, typography). **No product items are loaded yet** — every product surface is
a clearly-labelled placeholder so the UI, design and look & feel can be reviewed first.

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
| `elly-label.html` … `furkids.html` | The 6 category listings with **working facet UI** (filters, colour swatches, clear-all, empty states) |
| `disney-elly.html` | Disney | elly listing + Pre-Order strip |
| `furkids.html` | Full FurKids page with the persistent **“Concept only — not a Disney-licensed product”** disclosure |
| `customization.html` | Embroidered (initial + placement + thread colour) / iron-on patches (pre-set SG or Disney selection) methods, live PDP configurator with preview |
| `pre-order.html` | Disney Pre-Order PDP: design selector (3 Singapore concepts), full-payment model, 8-week timeline, disclosure tags |
| `pdp.html` | Product detail with the **personalisation configurator** (embroidered initial / iron-on patches) + sizes, qty, add-to-bag demo, accordions, cross-sell |
| `cart.html` / `checkout.html` | Bag + checkout with **all 3 tourist fulfilment options** (ship to SG/hotel · ship home · buy in-store/pop-up) |
| `b2b.html` | B2B landing (use-case cards) → 5-step RFQ: order type/date → items → decoration (conditional fields) → **size×qty matrix + live tiered pricing** → artwork/shipping → two-stage quote confirmation |
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
  visitor demo toggle, search chips, ghost grids, facets, tabs, qty steppers, B2B tiers,
  fulfilment options, admin MOQ demo).
- **Ghost cards**: `data-ghost-grid` fills placeholder product cards — swap the filler for
  real product data next; all facets/grid code is already wired to receive it.
- **Demo disclosure**: badge/ribbon pattern `Concept only — not a Disney-licensed product` marks
  FurKids; `Concept design — prototype illustration only` marks Pre-Order art (per PRD §§5.3, 8, 11).
- All prices/discounts/tiers/points are **illustrative placeholders** (PRD §12 open items).

## Next step

Populate the catalog: product data + images + occasion tags feed the existing grids, PDPs,
facets and search — no UI restructuring required.
