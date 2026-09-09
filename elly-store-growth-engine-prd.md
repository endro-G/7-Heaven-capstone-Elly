# PRD: The Elly Store — Digital Discovery & Growth Engine
### Three growth pillars — Consumer (Acquire → Recognise → Convert → Retain), B2B Channels, and Elly FurKids — to triple Disney business (3x GMV in 18–24 months)

**Document owner:** Hazlee Jaafar (The Elly Store)
**Prepared for:** Coding AI / build team (high-fidelity prototype)
**Status:** v1.0 — for prototype build
**Related prior work:** Builds on and supersedes the earlier PRD covering Pre-Order Model, Customization Pillar, and Intent-Driven Discovery — those three initiatives are now Phase 1–2 components of this unified growth engine.

---

## 1. Executive Summary

The Elly Store is repositioning as **"Singapore's Disney design-house label."** This PRD defines a growth engine spanning **three pillars** to grow Disney-line revenue 3x over 18–24 months:

1. **Consumer Growth Engine** (§§4–9): the core Acquire → Recognise → Convert → Retain funnel layered onto theellystore.com, serving tourists and locals as one unified funnel.
2. **B2B Channels** (§10, new): bulk/wholesale, corporate, and corporate-event orders — a distinct demand source from individual consumer purchases, with its own quote/pricing flow. *Family/multi-child orders are treated as consumer (B2C) purchases and are not part of the B2B channel.*
3. **Elly FurKids** (§11, new): a Disney-branded pet products concept (blankets/mats, bows, apparel), riding the rising pet-ownership trend as a new category adjacent to the core kids' apparel business. *This is a concept only — the business has not applied for, and is not in the process of pursuing, Disney licensing for this category. See §11 for how the prototype represents this.*

Pillar 1 is the largest and most developed pillar in this PRD; Pillars 2 and 3 supplement it to help meet the overall 3x GMV objective through channels and categories the core funnel alone doesn't reach.

**In-Store Staff Assist Interface (§12, new):** a tablet-based interface for retail staff, addressing two specific in-store workflows identified in a business-process review (in-store matching family sets, and the personalisation paper-form loop) where manual, paper-based processes currently break the same recognition and data-capture the rest of this PRD relies on. This is not a fourth growth pillar in its own right — it's the in-store counterpart to Pillar 1's Recognise/Convert stages, closing a gap where today's customer-facing site has no staff-side equivalent at all.

The consumer pillar treats **tourists and locals as one funnel**, not two separate journeys: the same discovery, personalization, and loyalty infrastructure serves both, differentiated by signals (geo/IP, purchase history, browse history) rather than by separate site experiences.

**In scope:** the on-site/in-app experience once a visitor has landed (organic, referral, walk-in, or return visit), across all three pillars. **Out of scope:** upstream acquisition channels themselves (SEO, paid media, hotel partnerships) — the site must be *ready* to convert whoever those channels send, but building those channels is not part of this PRD.

---

## 2. Goals & Success Metrics

| Goal | Primary KPI | Supporting KPIs |
|---|---|---|
| **Grow revenue** | 3x Disney-line GMV in 18–24 months | Conversion rate, Average Order Value (AOV) |
| **Convert more efficiently** | Site-wide conversion rate | Time-to-purchase, cart abandonment rate, search→purchase rate |
| **Retain more customers** | Repeat purchase rate / 12-month LTV | Loyalty enrollment rate, win-back email conversion, post-purchase flow open/click rate |
| **Recognise across channels** | Cross-channel match rate (in-store purchase linked to online profile, or vice versa) | % of loyalty members with unified purchase history, time-to-recognition on return visit |

All four KPI families are weighted equally per stakeholder direction — the prototype and its analytics hooks must be able to demonstrate progress against all three of: (1) funnel efficiency, (2) retention, (3) cross-channel recognition.

---

## 3. Guiding Principles

1. **One funnel, not two.** Tourist and local journeys share the same architecture; segmentation happens via signals layered on top, not via a separate microsite.
2. **Recognition compounds.** Every touchpoint (online browse, online purchase, in-store purchase, loyalty scan) should feed the same unified customer profile.
3. **Keep the brand.** Existing theme, colour palette, logo, and brand identity are preserved — this is an experience and architecture upgrade, not a rebrand. Every screen in the prototype should be immediately recognisable as The Elly Store: same logo treatment, same colour palette and typography, applied to a cleaner, more modern interface — not a generic template with the logo swapped in.
4. **Human-centric, minimal friction.** Every flow is designed backward from "fewest clicks to what the customer wants." Before adding a step, screen, or click, ask whether it can be collapsed, pre-filled, or removed. This applies to browsing, search, checkout, and account creation alike.
5. **Responsive and reactive by default.** The prototype must work and feel native on tablet, phone, and laptop/PC — not a desktop layout that merely shrinks. Interactions (hover, tap, filter, search-as-you-type) should feel immediate and give visible feedback.
6. **Build on what exists.** Klaviyo (email), Smile (loyalty/rewards), Judge.me (reviews), and Chatty (basic chatbot) are integration points, not replacements.
7. **SGD/English only** for this phase — no multi-currency or multi-language requirement.

---

## 4. Customer Journey Overview

```
LAND → ACQUIRE (segment) → RECOGNISE (identify) → CONVERT (discover→buy) → RETAIN (loyalty→repeat)
```

The visitor enters at any point (first-time tourist, first-time local, or returning customer of either type) and the site adapts. Local vs. tourist classification uses a different signal depending on whether the visitor is a first-time or returning visitor — see the decision logic in §5.1.

| Visitor type | Signal used | Experience adaptation |
|---|---|---|
| Local, first-time | Live geo/IP = Singapore | Local-relevant occasion groupings (e.g. Newborn & Baby Shower, Sleepovers) |
| Tourist, first-time | Live geo/IP = overseas/roaming | Tourist-specific discovery: Theme Park Vacation, Family Photoshoot, "shop now / ship later" messaging |
| Local, returning | Logged in + stored profile (ship-to history/residency) = Singapore | Personalized recommendations from purchase/browse history first, local-relevant events second |
| Tourist, returning | Logged in + stored profile (ship-to history/residency) = overseas | Personalized recommendations from history, framed as "welcome back" with what's new since their last visit |
| Anonymous, cookie-recognized repeat visit | No account — treated as first-time for local/tourist purposes (live geo/IP), enriched with session-cached recently-viewed/searched items | Same as first-time above, plus session-based content — not full history-driven personalization, since a cookie can't reliably establish identity or location (cleared cookies, incognito, Safari's 7-day storage cap all reset it) |
| In-store purchaser (One Holland Village), later visits online | Loyalty account matched via phone/email at POS | Recognised online with in-store purchase history pre-loaded |

---

## 5. Feature Set by Stage

### 5.1 ACQUIRE (Landing & Segmentation)

*Scope note: this stage starts the moment a visitor is already on the site — not upstream channel-building.*

- **Geo/IP-based tourist detection** on landing: identify visitor as likely local vs. tourist by IP location and/or device locale, silently — no forced quiz or toggle that adds friction (a manual "I'm visiting Singapore 🏝️" self-declare option should still be available as an override/fallback for accuracy).
- **Visitor segmentation logic** — four segments, determined in two steps:
  1. **Returning check**: does the visitor have an account with purchase/browse history? A visitor recognized only by browser cookie (no account) is treated as first-time for segmentation purposes — a cookie can't reliably establish identity or location — but is enriched with session-cached recently-viewed/searched content (see guest session history cache, below).
  2. **Local vs. tourist check**, using a different signal depending on the answer to step 1:
     - **First-time (including anonymous cookie-recognized)**: live geo/IP location.
     - **Returning (logged in with history)**: the stored profile's ship-to country history and residency field (§5.2) — not live geo/IP, since a local customer traveling abroad would otherwise be misclassified as a tourist by live IP alone.
  - This produces four segments: **Local first-time, Tourist first-time, Local returning, Tourist returning.**
- **Dynamic hero banner, ranked by visitor signal** (max 3–4 rotating slides — enough to cover the priority list below without becoming a carousel nobody scrolls through):
  - **First-time visitor (no history)**, in priority order:
    1. Upcoming events relevant to detected segment (e.g. Disney Cruise season, D23 — tourist-geo visitors see Theme Park Vacation / Family Photoshoot-flavoured events; local-geo visitors see Newborn / Sleepover-flavoured events)
    2. Most-commonly-searched intent site-wide (e.g. "birthday present") — seeded from the occasion collections (§5.1) at launch, before enough real search volume exists to rank organically
    3. Available pre-order items currently open for the window
    4. Customization pillar banner
  - **Returning guest/member (has history)**, in priority order:
    1. Personalized cross-sell via recommender engine, using purchase + browse history and profile data — for the **returning tourist** segment specifically, framed as "welcome back" with what's new since their last visit or purchase, since this is a high-value repeat-visit opportunity distinct from a first-time tourist's introduction to the brand
    2. Upcoming events relevant to detected segment (same logic as above)
    3. Available pre-order items currently open for the window
    4. Customization pillar banner
- **Search bar above the top nav**, with dual suggestion mechanism (pattern: type-ahead + suggestion chips shown on focus, before any text is typed):
  - **Recently searched** (session-level, works for every visitor including first-time/anonymous — resets each session).
  - **Suggested searches**, sourced differently by visitor type:
    - First-time visitor: pre-selected chips from the most-commonly-searched intents site-wide (same source as hero priority #2 above).
    - Returning guest/member: pre-selected chips from the recommender engine's cross-sell suggestions, based on history and profile.
- **Occasion-based discovery groupings** (Phase 1 set): Newborn & Baby Shower, Holiday Gift Boxes, Big Brother/Little Sister, Theme Park Vacation, Pajama Party/Sleepover, Family Photoshoot. Tourist-geo visitors are weighted toward Theme Park Vacation / Family Photoshoot / Gifting; local-geo visitors weighted toward Newborn/Sleepover/Big-Sibling.
- **Guest session history cache**: even anonymous visitors get a session-level "recently viewed / recently searched" cache that informs same-session recommendations and the search bar's "recently searched" chips.

### 5.2 RECOGNISE (Identity & Cross-Channel Unification)

This is the connective tissue of the whole engine — without it, tourists who buy in-store are invisible online, and vice versa.

- **Unified customer profile**: one profile per customer spanning online account and in-store POS purchases (One Holland Village), keyed on the Smile loyalty account (matched via phone number or email at checkout/POS). Includes **ship-to country history and a residency field**, used to classify returning visitors as local vs. tourist for the segmentation logic in §5.1 (in preference to live geo/IP, which is unreliable for a logged-in visitor who happens to be traveling). Pop-up store purchases are out of scope — pop-up inventory is consigned out and isn't reflected in the centralized system, and pop-up purchases don't currently earn loyalty points in the real Elly Rewards program either (§5.4), so there's no basis to sync them into this profile.
- **Loyalty capture at every channel**:
  - Online: existing account login/signup.
  - In-store POS (One Holland Village): staff prompt to capture phone/email at point of sale, syncing into Smile and back into the unified profile.
- **Cross-channel recognition on return**: a customer who bought in-store, then visits online later (even from a different device, once logged in) sees their in-store purchase reflected in order history and gets recommendations informed by it.
- **Recognition logic for personalization** (see full four-segment decision logic in §5.1):
  - Returning/logged-in: purchase + browse history first, event-driven (e.g. "Disney Cruise season") second — with "welcome back" framing for the returning-tourist segment specifically.
  - Anonymous first-time (including cookie-recognized repeat visits): event-driven/occasion-based only, enriched with session-cached content where available — no purchase history to draw on.
- **Prototype KPI hook**: a visible (admin/demo-only) indicator showing "cross-channel match rate" — % of profiles with both online and in-store purchase records — to demonstrate this metric is trackable.

### 5.3 CONVERT (Discovery → Purchase)

- **Intent-driven search**: dynamic, pre-filled search suggestions based on session/profile signals (not static category search).
- **Disney Pre-Order Model** (new Disney designs only):
  - Designs approved by Disney, produced via approved factories, up to 8-week lead time.
  - Full payment upfront (all pre-orders guaranteed fulfilled — no partial/deposit model).
  - Each pre-order design is **independent** — production quantity is not allocated by splitting demand across a product line. For each design, production quantity = whichever is **higher** of (a) actual pre-order demand for that design, or (b) the factory's Minimum Order Quantity (MOQ). This guarantees every approved design gets produced at least at MOQ, even if demand alone wouldn't justify a production run.
  - **MOQ assumption for prototype**: 1,000 units per design (business/back-end assumption only). This number is **never shown to the customer anywhere in the prototype** — it exists only to drive the admin/demo view's production-quantity calculation described in §8.
  - Applies only to new Disney designs — not to Elly Label or Customization items, which remain in-stock/made-to-order as today.
  - **Prototype demo artwork**: three Singapore-themed Mickey concept designs (heritage/shophouse, Gardens by the Bay, Marina Bay night skyline — see supplied reference images) are to be used as pre-order PDP artwork in the prototype. These are **illustrative concepts only, not Disney-approved final designs** — the prototype must visibly label them as such (e.g. a "Concept design — for prototype illustration only" tag/watermark on the PDP), so nothing in the demo is mistaken for approved production art.
- **Customization pillar** (new 5th top-level nav pillar, alongside Elly Label, Disney|elly, Shoe Boutique, Gifting Hub):
  - Consolidates "Customization" and "Personalization" into one pillar.
  - Top-level type filter: Embroidered, Iron-on, or **Patch** — the live site's own copy ("personalised with a name, number or patch") confirms patch as a real option missing from the earlier version of this PRD. *Note: it's not confirmed from the site copy alone whether "patch" is a third application technique (alongside embroidered/iron-on) or a distinct decorative element — worth a quick check with the business before the coding AI builds the filter logic; flagged in Open Items.*
  - Attribute filters: content type (**name, number, or initials** — "number" added to match live-site copy, relevant for jersey-style personalization), thread colour (embroidered only), placement.
- **Interactive customization configurator** — improves on the current live-site flow, where personalization is a generic text field chosen at checkout after the item is already in the cart, with no visual feedback on what the customer will actually receive. The configurator moves this to the **product page, before add-to-cart**:
  1. Type selection: Embroidered, Iron-on, or Patch.
  2. Placement selection, shown against that specific product's image — only placements valid for that product are offered (e.g. left chest, full back, sleeve).
  3. Text entry (name, number, or initials), with live character-count validation matching what the chosen placement/size can accommodate.
  4. Thread colour selection (embroidered only).
  5. **Live preview**: the product image updates to show an approximate rendering of the chosen text, placement, and colour, so the customer sees what they're ordering rather than guessing from a text field.
  - **Unified for customer and staff use**: the same configurator interface is usable both by a customer self-serve online, and by a sales assistant on a tablet/POS in-store — replacing whatever manual or ad hoc process currently captures in-store customization orders. One interface for both channels means staff don't need a separate system to learn, in-store customization orders are captured with the same structured data as online ones, and — per the unified profile in §5.2 — the resulting order feeds into the customer's cross-channel history regardless of which channel it was placed on.
- **Tourist-specific fulfillment options at checkout** — all offered, selectable by the customer:
  1. **Ship to SG address/hotel** (e.g. before they fly home)
  2. **Ship to home country** (after they've left Singapore)
  3. **Buy in-store, pickup at One Holland Village** (no shipping; immediate pickup) — pop-up pickup is excluded, since pop-up stock isn't centrally tracked and online checkout has no way to verify availability there (§5.2, §12).
- **AOV-boosting cross-sell**: Gifting Hub and Customization surfaced contextually at cart/PDP (e.g. "add a name to this" on a Disney item, or "complete the gift set").

### 5.4 RETAIN (Loyalty & Repeat)

- **Unified loyalty view**: points/rewards balance in Smile reflects combined online + One Holland Village store spend (pop-up stores are excluded from loyalty capture — see §12 for why).
- **Real Elly Rewards rules** (confirmed from the live program at theellystore.com/pages/elly-rewards — replaces the earlier placeholder figures in this PRD):
  - Earn rate: 1 point per S$1 spent on completed orders.
  - Account creation: 50 points.
  - Completing your profile: 30 points.
  - Referral: 100 points once referred; the referred friend also gets 10% off their first order.
  - Social follows: 10 points each for following on Facebook and Instagram.
  - Expiry: points expire after 6 months of inactivity — the clock resets on any shop, redemption, or new points earned.
  - Redemption: points are exchanged for discounts/promotional items via a coupon code; the code is valid 90 days from redemption. Cannot be combined with other discount codes.
  - Points can currently only be earned via the online store and the physical store at One Holland Village — not via pop-up stores or stockists (Tangs, Motherswork, Takashimaya). Guest checkout does not earn points.
  - No membership tiers in the current program.
- **Recommended additions for the prototype** (not part of the real program today — kept separate so nothing here is mistaken for confirmed behaviour; replace or drop before production as the business decides):
  - Birthday bonus: e.g. 50 points, auto-applied in birthday month.
  - Review bonus: e.g. 20 points per verified review submitted (ties into Judge.me).
  - Restriction: points not redeemable against Disney Pre-Order items (full-payment-upfront model, tied to MOQ economics in §5.3).
- **Post-purchase Klaviyo flows**, upgraded with segment awareness:
  - Tourist segment: post-trip remarketing flow (e.g. "here's what's new for your next SG trip" or restock/new-design alerts timed to next likely visit).
  - Local segment: standard win-back / replenishment flows.
- **Review capture via Judge.me** integrated into post-purchase flow, feeding back into product discovery (social proof on PDPs, especially valuable for tourist trust-building on first purchase).
- **Chatty upgrade path (noted, not built in this phase)**: current chatbot handles basic enquiries only; flagged as a future phase to handle order status / pre-order lead-time questions, which will grow in volume as pre-order model scales.

---

## 6. Information Architecture — Taxonomy Model

The catalog spans Disney and non-Disney items across many attributes (product type, character/franchise, age, size, colour, customization type). Rather than one rigid category tree, the site uses **one catalog organised by two lenses**, plus a curated overlay — this keeps top-nav browsing simple while still letting customers filter precisely, and lets a single product surface correctly from multiple entry points without being duplicated in the catalog.

**Layer 1 — Top-level pillars (nav).** Kept minimal, product-line based, answers "what kind of thing am I shopping for":
1. Elly Label
2. Disney|elly *(includes Pre-Order flow for new designs)*
3. Shoe Boutique
4. Gifting Hub
5. **Customization** *(consolidates "Customization" and "Personalization")*
6. **Elly FurKids** *(new — see §11; Disney-branded pet products concept, clearly marked as a concept only — no license applied for or in progress — per §11)*

**Layer 2 — Cross-cutting facets (filters, not categories).** Applied within any pillar or search result, not as separate nav items:
- **Character/franchise** (Mickey, Minnie, Princess, Toy Story, etc.) — this absorbs what would otherwise be endless Disney sub-categories.
- **Product type** (romper, tee, dress, shoes, bag)
- **Age/size**
- **Colour**
- **Customization type** (Embroidered, Iron-on, or Patch, within the Customization pillar)

Every product carries multiple tags across these facets so it can appear correctly regardless of which filter or entry point a customer starts from (e.g. a Frozen-embroidered romper surfaces under Disney|elly, under a "Newborn" occasion collection, and under a Frozen character filter — without being listed three separate times).

**Layer 3 — Occasion collections (curated overlay).** Cuts across both layers above; this is the primary entry point for customers who think in terms of "what am I here for" rather than product category (especially tourists and gift-shoppers) — surfaced on the homepage/landing hero and as a "Shop by Occasion" rail, not in top nav. See §5.1 for the Phase 1 occasion set.

---

## 7. Phasing

| Phase | Scope | Rationale |
|---|---|---|
| **Phase 1** | Recognise foundation (unified profile, loyalty sync online+in-store) + Acquire foundation (geo/IP detection, adaptive landing, occasion groupings) | Recognition is the dependency for everything downstream — build the plumbing first |
| **Phase 2** | Convert: Customization pillar, intent-driven search, tourist fulfillment options at checkout | Highest direct impact on conversion/AOV |
| **Phase 3** | Convert: Disney Pre-Order model (production-allocation logic, upfront payment flow) | Higher complexity (factory/allocation logic), can launch after core UX is proven |
| **Phase 4** | Retain: segment-aware Klaviyo flows, cross-channel loyalty reporting, Judge.me integration into discovery | Compounds on a working Recognise + Convert layer |

*For the prototype: build all phases' UI/UX end-to-end with mock/imported product data, since the deliverable is a full working prototype demonstrating all functionality — phasing above is for the real build roadmap, not for what's shown in the prototype.*

---

## 8. Prototype Requirements (for the Coding AI)

- **Fidelity**: high-fidelity, clickable/interactive prototype — not a static mockup.
- **Data**: the coding AI has discretion to select/generate representative product data (names, images, prices) to populate the catalog — up to 10 items per sub-category is sufficient to demonstrate every pillar, occasion grouping, and filter combination realistically. No manual product data export is required from the stakeholder.
- **Brand fidelity**: follow The Elly Store's original site (theellystore.com) directly as the style reference — logo, colour palette, and typography as currently live on the site. Clean and modern in execution, but immediately recognisable as the brand, not a generic template.
- **Responsive across devices**: the prototype must be built and tested against phone, tablet, and laptop/PC breakpoints — layouts adapt (not just scale down), and touch targets/tap areas are sized appropriately on mobile/tablet.
- **Interactive and reactive**: interface responses (filter changes, search-as-you-type, hover/tap states, cart updates) should feel immediate, with visible feedback — no dead clicks or unexplained waits.
- **Human-centric, minimal-click acceptance bar**: for each core journey below, the coding AI should be able to point to specifically which steps were removed, pre-filled, or collapsed relative to a naive implementation. Core journeys to minimise friction on:
  - Anonymous visitor → product discovery (via hero, occasion rail, or search) → PDP → cart, in as few taps/clicks as the taxonomy model (§6) allows.
  - Returning member → recognised and shown personalized content → checkout with saved details pre-filled.
  - Tourist → detected → relevant fulfillment options surfaced at checkout without extra steps to "find" them.
- **Must demonstrate, interactively**:
  1. Landing page adapting visibly across all four segments from §5.1 (local first-time, tourist first-time, local returning, tourist returning) via a demo toggle — including the "welcome back" framing distinct for returning tourists.
  2. Search bar on focus showing recently-searched chips plus segment-appropriate suggestion chips (trending intents for first-time, recommender-based for returning).
  3. Top nav reflecting the pillar/facet taxonomy model (§6): pillars in nav, facets as in-page filters.
  4. Occasion-based browse groupings, each populated with real products.
  5. The interactive customization configurator on a product page: type selection → placement → text entry with validation → thread colour (embroidered) → live preview updating on the product image — demonstrated as usable in the same interface by both a customer view and a staff/POS view.
  6. Disney Pre-Order PDP flow: design → lead-time messaging → full-payment checkout, with an admin/demo view showing per-design production quantity resolving to whichever is higher of demand or MOQ (independently per design, not split across a product line).
  7. Checkout flow showing all three tourist fulfillment options.
  8. A logged-in account view showing unified purchase history (mock in-store + online records) and loyalty points balance.
  9. A simple admin/demo panel showing the three KPI families (conversion/AOV, repeat rate, cross-channel match rate) as illustrative dashboard tiles — not live data, but structured to show where real analytics would plug in.
  10. The B2B self-serve RFQ flow (§10): order-type selection → item/quantity → live tiered pricing → quote summary.
  11. The Elly FurKids pillar (§11): product listing, PDP, and cart/checkout, with the concept-only disclosure badge visible throughout.
  12. The same core journeys above, working cleanly at phone, tablet, and laptop/PC breakpoints.
- **Tech assumption**: no multi-currency/multi-language build needed. Open to custom/headless approach; does not need to be constrained to Shopify's native theme system for the prototype.

---

## 9. Out of Scope (this PRD)

- Upstream acquisition/marketing channel build (ads, SEO, hotel/mall partnerships) — the engine must be *ready* to receive that traffic, but building the channels is separate work.
- Multi-currency and multi-language support.
- Chatty AI upgrade (flagged for future phase only).
- Physical POS system changes beyond the loyalty-capture prompt described in §5.2.
- Actual Disney licensing application or negotiation for the Elly FurKids category (§11) — no application has been made or is in progress; this is a legal/business-development workstream for the future, not a prototype deliverable.
- Live Shopify Draft Order/Admin API integration, invoicing, or ERP/ordering-system integration for B2B quotes (§10) — the prototype demonstrates the self-serve quote *experience*, not the backend Shopify wiring, which is a production-build task.
- Shopify Plus-exclusive B2B features (native company accounts, self-serve Net terms, multi-location profiles) — not required for the RFQ flow as scoped in §10.
- Workflows 3 (online order fulfillment/warehouse packing), 4 (stock/restocking and CSV-based stock transfer), and 5 (marketing data consolidation across tools) from the business-process review referenced in §12 — reviewed by the stakeholder but explicitly excluded from this project.

---

## 10. Growth Pillar 2 — B2B Channels

Bulk/wholesale, corporate, and corporate-event orders are a distinct demand source from individual consumer purchases — larger order sizes, different buying process (quote-driven, not impulse), and a different success metric (deal size, not conversion rate). **Scope: B2B covers bulk/wholesale (company) orders and corporate orders/corporate events only — family and multi-child orders are considered B2C and are excluded from this channel.** Replaces the traditional "contact a person for bulk orders" model with a structured, self-serve intake — this removes the 2–3 clarifying-email cycle that normally precedes a quote by capturing everything the production team needs upfront.

- **Entry point**: a persistent, visually distinct **banner at the top of every page** ("Bulk and corporate orders, made simple" with a "Start your quote" CTA — not mixed into the product-browsing pillars in §6), so it's discoverable site-wide regardless of which page a business buyer lands on first. This leads to a **dedicated B2B landing page** (value proposition, trust signals, and use-case cards for Bulk/wholesale, Corporate gifting, and Corporate events) with a "Start your quote" CTA into the wizard below — appropriate since a buyer arriving via the banner hasn't necessarily specified what they need yet.
- **Contextual nudges** on relevant product/pillar pages (e.g. a "Ordering 10 or more?" banner on the Customization pillar) skip the landing page entirely and **deep-link straight into the RFQ wizard with that item pre-selected** — this visitor has already shown specific intent, so the landing page would be an extra, unnecessary step (consistent with the minimal-click principle in §3).
- **Self-serve quote/RFQ flow**, entirely on-site, as a multi-step form (not a single long page) with conditional fields — e.g. selecting "Embroidery" as decoration method reveals placement and thread-colour fields; selecting "Screen print" would show different fields instead:
  1. **Event/order details**: order type (Bulk/Wholesale, Corporate, Corporate event), event date or deadline (flags rush-fee territory for sales review, not an automatic surcharge in the prototype).
  2. **Product and decoration**: garment/item selection (from the same catalog as consumer browsing, including Customization pillar items), decoration method (Embroidery / Screen print / Iron-on / DTG), with method-specific conditional fields (placement, thread colour, etc.).
  3. **Quantity by size**: a matrix field (size × quantity), with a running total, since bulk pricing tiers are based on total units.
  4. **Artwork upload and shipping**: file upload for logos/artwork (high-res formats), and shipping logistics (single bulk shipment vs. split shipping to multiple locations).
- **Live tiered bulk pricing**, updating as quantity is adjusted, shown as an instant estimate. Placeholder tiers for prototype (illustrative — replace with real pricing before production):
  - 10–49 units: 10% off
  - 50–99 units: 15% off
  - 100–299 units: 20% off
  - 300+ units: "Custom quote" — flags for manual sales follow-up rather than an automatic discount
- **Two-stage quote-to-checkout (recommended over full straight-through automation)**: the form generates an **instant estimate**, not an instant payment link. For anything beyond a standard catalog item at standard decoration (i.e. most bulk/corporate orders — custom artwork, placement, or a rush date), production feasibility and true cost still need a human check before money changes hands. Flow: **instant estimate shown on-site → submission creates a Shopify Draft Order (via Admin API) with all captured specs and artwork attached → sales reviews and confirms/adjusts → confirmed checkout link sent to the customer** (card, bank transfer, or Net terms if available). This keeps the "no back-and-forth email" benefit while avoiding an auto-sent checkout link on a quote the factory can't actually deliver at that price.
- **Platform note**: theellystore.com runs on Shopify (plan tier to be confirmed). Draft Order creation via the Admin API is available on all Shopify plans, so this flow does not depend on Shopify Plus. Plus-exclusive features (native B2B company accounts, self-serve Net terms, multi-location company profiles) are **not required** for this flow and are out of scope for now (see §9) — worth revisiting only if the business later wants self-serve net-terms billing for repeat corporate accounts.
- **Build approach recommendation**: a custom-built form (theme extension or custom Liquid template) wired to the Admin API via webhook, rather than a third-party form-builder app. A generic form-builder app's UI will not match the brand fidelity and interaction quality required elsewhere in this PRD (§3) — it will read as a bolted-on widget rather than a native part of the site.
- **Cross-sell awareness**: the RFQ flow should surface Customization options contextually (e.g. "add names or a logo for the whole order") given wholesale/corporate/corporate-event orders are natural customization use-cases.
- **Prototype demonstration**: the full flow above, end-to-end, with the same brand fidelity and responsive requirements as §8.

---

## 11. Growth Pillar 3 — Elly FurKids

A Disney-branded pet products concept (not a Disney-licensed line) — blankets/mats, bows, and pet apparel — riding the rising pet-ownership trend as a category adjacent to the core kids' apparel business.

**Licensing status — read before building:** This pillar is a **concept only**. The business has **not applied for, and is not in the process of pursuing**, Disney licensing for the pet-products category — there is no application, negotiation, or approval underway. Per stakeholder direction, the prototype nonetheless represents this as a **full Disney-branded FurKids concept**, built as an aspirational demo — but it must be **clearly and consistently disclosed as a concept, not a real or in-progress product line**, everywhere it appears. This is a hard requirement, not a nice-to-have, so the prototype is never mistaken for a confirmed or pending licensing arrangement:
- A persistent badge/ribbon on the FurKids nav pillar and every FurKids page (e.g. "Concept only — not a Disney-licensed product"). Avoid any wording implying an application, review, or approval process is underway (e.g. do not use "pending," "under review," or "awaiting approval").
- The same disclosure pattern used for the Pre-Order concept artwork (§5.3) — consistent visual language for "this is illustrative, not confirmed" across the whole prototype.

- **6th top-level nav pillar** (alongside Elly Label, Disney|elly, Shoe Boutique, Gifting Hub, Customization — see §6).
- **Product range**: blankets (doubling as mats), bows, and pet apparel.
- **Taxonomy**: follows the same pillar/facet model as §6 — facets for pet size (S/M/L), product type (blanket-mat/bow/apparel), and character/franchise, consistent with how the rest of the catalog is organised.
- **Cross-sell opportunity**: surfaced contextually in Gifting Hub (pet-owner gift sets) and Customization (e.g. name tag/bandana personalization), consistent with the AOV cross-sell pattern already used elsewhere (§5.3).
- **Prototype demonstration**: full pillar with product listing, PDP, and cart/checkout consistent with the rest of the site — with the concept-only disclosure badge visible throughout.

---

## 12. In-Store Staff Assist Interface (Workflows 1 & 2)

**Source and scope.** A business-process review (client session 28 Aug 2026, client comments 4 Sep 2026) documented five current in-store/operational workflows. **This PRD covers only two of them: Workflow 1 (in-store matching family set) and Workflow 2 (the personalisation paper loop, including the 2b form contents and 2c pay-in-store-ship-elsewhere gifting scenario). Workflows 3 (online order fulfillment), 4 (stock/restocking), and 5 (marketing data consolidation) are explicitly excluded from this project's scope** — noted here so nothing from the source review is silently assumed in-scope.

Both in-scope workflows share the same root problem: today's customer-facing site has no staff-side equivalent at all. A retail associate assisting an in-store customer works entirely on paper and phone calls, disconnected from the systems (Shopify, Smile, Klaviyo) that already capture everything on the online side. This section is the in-store counterpart to Pillar 1's Recognise and Convert stages (§§5.2–5.3) — reusing that architecture rather than inventing a parallel one.

- **Device**: a tablet, carried by staff to the customer (not a fixed kiosk or POS-embedded screen) — mirrors the in-store "greet and build the set" pattern from Workflow 1 rather than requiring the customer to come to a counter.
- **Occasion/context capture at greet**: replaces the current "asked, never recorded" pattern — occasion and travel date captured on the tablet feed directly into the same unified customer profile the online site personalizes from (§5.2), so an in-store conversation can inform what that customer sees online later, and vice versa.
- **Unified stock check**: a single multi-item lookup (not one lookup per SKU) that checks **in-store inventory first, falling back to warehouse if an item isn't found in-store** — replacing the current pattern of phoning the warehouse because staff don't trust the one-click Shopify view. When an item must come from warehouse, the interface shows an **estimated wait time**, and the customer chooses to either wait in-store or complete payment at POS and have the item delivered later. **Pop-up store stock is explicitly out of scope for this check** — pop-up inventory is consigned out and not reflected in the centralized warehouse system, so there is no live inventory visibility into it to check against.
- **Lost-sale logging**: when a desired set can't be completed and gets rebuilt around available stock, the originally-desired unavailable item(s) are logged internally for demand/analytics visibility — not surfaced to the customer as a waitlist or back-in-stock signup in this phase. This replaces the current pattern where a rebuilt set is indistinguishable from a fully-satisfied one, so lost demand is invisible.
- **Personalization, staff-facing**: reuses the same interactive customization configurator already specified for the customer-facing site (§5.3 — type → placement → text entry → thread colour → live preview), now used by staff on the tablet in place of the paper vinyl/embroidery forms. This directly replaces Workflow 2's paper form, whose fields (item, design, name, letter case, thread/vinyl colour, placement, tee number/swoosh length) currently exist nowhere except on paper, joined to the sale only by a handwritten invoice number.
- **Wearer profile capture**: the personalisation "wearer" (frequently the buyer's child, not the buyer) is captured as a **structured record saved to the customer's account** — name, approximate age/size, relationship to account — rather than a one-off order field. Kept lightweight for the prototype: a simple list under the account view ("Past personalizations for: [names]"), not a full profile-management screen with editing/merging — that's a reasonable production-phase addition, not a prototype requirement.
- **Approved-character library**: replaces the current ad hoc process (photographing or messaging an unusual name to whichever specialist is on shift, with no record of past decisions). The prototype includes a **searchable, reusable library of approved characters** (Korean, Chinese, English, and any others confirmed per Open Items) paired with font, size, and colour — so a name approved once doesn't need re-approval from scratch, and any staff member (not just whoever is on shift) can confirm a name is supported.
- **Order handoff to POS**: the tablet builds a Shopify Draft Order carrying the customer's profile, loyalty context, and full personalization/wearer specs — the same pattern already specified for B2B quotes in §10, reused here rather than inventing a second mechanism. Payment itself stays on the existing Shopify POS terminal; the cashier retrieves the draft order (by customer lookup or order reference) to complete the sale, eliminating re-keying and the paper-to-sale link that currently depends on a handwritten invoice number.
- **Gift from counter (Workflow 2c)**: buy in-store, ship to someone else. Reuses the **same ship-to/recipient-address logic already built for online checkout** (§5.3's fulfillment options), triggered from the tablet rather than redone by hand on paper — closing the gap where staff currently manually replicate the website's stock check, address capture, and shipping choice.
- **Order status tracking**: personalization order status (received → in production → ready for pickup/shipped) is tracked in the same system and **visible both to staff and to the customer in their account** — extending the unified purchase history view already specified in §8, rather than a status that's invisible once the item leaves the counter.
- **Explicitly out of scope for this section** (see also §9): any changes to online order fulfillment/warehouse packing (Workflow 3), restocking/CSV stock-transfer logic (Workflow 4), or cross-tool marketing data consolidation (Workflow 5) — all were covered by the source review but are not part of this project.
- **Prototype demonstration**: a staff-view flow on tablet-sized viewport covering greet/occasion capture → unified stock check with wait-time indicator → configurator-based personalization with wearer capture → approved-character library lookup → draft order handoff → and the resulting order status visible in a customer account view, alongside the gift-from-counter (2c) flow reusing the online ship-to options.

---

## 13. Open Items / Needs From Stakeholder

- [ ] Typical MOQ figures from approved factories, to reflect realistically in the pre-order demand-vs-MOQ demo logic. *(Resolved for prototype purposes — see §5.3, assumption of 1,000 units.)*
- [x] Smile loyalty program's current point-earning/redemption rules. *(Resolved — see §5.4; confirmed against the real, published Elly Rewards program rather than a placeholder. The additional bonuses/restriction listed separately in §5.4 are recommendations, not confirmed program rules.)*
- [ ] Confirm whether "Patch" (§5.3/§6) is a third application technique alongside Embroidered/Iron-on, or a distinct decorative element — the live site's copy doesn't make this unambiguous.
- [ ] Actual bulk/corporate pricing tiers and discount thresholds for B2B (§10) — prototype uses illustrative placeholder tiers.
- [ ] Whether the business wants to pursue Disney licensing for the pet-products category for Elly FurKids (§11) at all — this is a real open business question (no application has been made or started), not just a prototype placeholder.
- [ ] Elly FurKids product range and pricing, if different from placeholder assumptions in §11.
- [ ] Realistic warehouse-to-store transfer times, to reflect accurately in the wait-time estimate shown in §12 — prototype uses a placeholder estimate.
- [ ] Full list of scripts/languages the approved-character library (§12) should cover beyond Korean, Chinese, and English, if any.

---

*End of PRD.*
