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
2. **B2B Channels** (§10, new): bulk, family, event, and corporate orders — a distinct demand source from individual consumer purchases, with its own quote/pricing flow.
3. **Elly FurKids** (§11, new): a Disney-licensed pet products line (blankets/mats, bows, apparel), riding the rising pet-ownership trend as a new category adjacent to the core kids' apparel business. *Disney licensing feasibility for this pillar is unconfirmed — see §11 for how this is handled in the prototype.*

Pillar 1 is the largest and most developed pillar in this PRD; Pillars 2 and 3 supplement it to help meet the overall 3x GMV objective through channels and categories the core funnel alone doesn't reach.

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

The visitor enters at any point (first-time tourist, first-time local, or returning customer of either type) and the site adapts:

| Visitor type | Signal used | Experience adaptation |
|---|---|---|
| First-time, anonymous, SG-located | IP/geo = local | Local-relevant occasion groupings (e.g. Newborn & Baby Shower, Sleepovers) |
| First-time, anonymous, tourist-located (geo/IP = overseas or roaming) | IP/geo = overseas | Tourist-specific discovery: Theme Park Vacation, Family Photoshoot, "shop now / ship later" messaging |
| Returning, logged in (loyalty account) | Account + purchase/browse history | Personalized recommendations from history first, event-driven second |
| In-store / pop-up purchaser, later visits online | Loyalty account matched via phone/email at POS | Recognised online with in-store purchase history pre-loaded |

---

## 5. Feature Set by Stage

### 5.1 ACQUIRE (Landing & Segmentation)

*Scope note: this stage starts the moment a visitor is already on the site — not upstream channel-building.*

- **Geo/IP-based tourist detection** on landing: identify visitor as likely local vs. tourist by IP location and/or device locale, silently — no forced quiz or toggle that adds friction (a manual "I'm visiting Singapore 🏝️" self-declare option should still be available as an override/fallback for accuracy).
- **Dynamic hero banner, ranked by visitor signal** (max 3–4 rotating slides — enough to cover the priority list below without becoming a carousel nobody scrolls through):
  - **First-time visitor (no history)**, in priority order:
    1. Upcoming events relevant to detected segment (e.g. Disney Cruise season, D23 — tourist-geo visitors see Theme Park Vacation / Family Photoshoot-flavoured events; local-geo visitors see Newborn / Sleepover-flavoured events)
    2. Most-commonly-searched intent site-wide (e.g. "birthday present") — seeded from the occasion collections (§5.1) at launch, before enough real search volume exists to rank organically
    3. Available pre-order items currently open for the window
    4. Customization pillar banner
  - **Returning guest/member (has history)**, in priority order:
    1. Personalized cross-sell via recommender engine, using purchase + browse history and profile data
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

- **Unified customer profile**: one profile per customer spanning online account, in-store POS purchases, and pop-up purchases, keyed on the Smile loyalty account (matched via phone number or email at checkout/POS).
- **Loyalty capture at every channel**:
  - Online: existing account login/signup.
  - In-store/pop-up POS: staff prompt to capture phone/email at point of sale, syncing into Smile and back into the unified profile.
- **Cross-channel recognition on return**: a customer who bought in-store, then visits online later (even from a different device, once logged in) sees their in-store purchase reflected in order history and gets recommendations informed by it.
- **Recognition logic for personalization**:
  - Returning/logged-in: purchase + browse history first, event-driven (e.g. "Disney Cruise season") second.
  - Anonymous first-time visitor: event-driven/occasion-based only (no history to draw on).
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
  - Top-level type filter: Embroidered vs. Iron-on.
  - Attribute filters: name, initials, thread colour (embroidered only), placement.
- **Tourist-specific fulfillment options at checkout** — all three offered, selectable by the customer:
  1. **Ship to SG address/hotel** (e.g. before they fly home)
  2. **Ship to home country** (after they've left Singapore)
  3. **Buy in-store / pop-up** (no shipping; immediate pickup)
- **AOV-boosting cross-sell**: Gifting Hub and Customization surfaced contextually at cart/PDP (e.g. "add a name to this" on a Disney item, or "complete the gift set").

### 5.4 RETAIN (Loyalty & Repeat)

- **Unified loyalty view**: points/rewards balance in Smile reflects combined online + in-store spend.
- **Placeholder loyalty rules for prototype** (no real Smile configuration was available — these are illustrative defaults so the coding AI builds correct *mechanics*, not placeholder-shaped UI; replace with actual Smile rules before production):
  - Earn rate: 1 point per S$1 spent, same rate online and in-store.
  - Redemption: 100 points = S$5 off, redeemable at checkout above a S$0 minimum, no partial-point redemption.
  - Sign-up bonus: 100 points on account creation.
  - Birthday bonus: 50 points, auto-applied in birthday month.
  - Review bonus: 20 points per verified review submitted (ties into Judge.me, §5.4).
  - Referral bonus: 100 points once a referred friend completes their first purchase.
  - Expiry: points expire after 12 months of account inactivity.
  - Restriction: points cannot be redeemed against Disney Pre-Order items (full-payment-upfront model, tied to MOQ economics in §5.3).
  - No membership tiers in this phase — single flat program, kept simple for the prototype.
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
6. **Elly FurKids** *(new — see §11; Disney-branded pet products, clearly marked as pending licensing per §11)*

**Layer 2 — Cross-cutting facets (filters, not categories).** Applied within any pillar or search result, not as separate nav items:
- **Character/franchise** (Mickey, Minnie, Princess, Toy Story, etc.) — this absorbs what would otherwise be endless Disney sub-categories.
- **Product type** (romper, tee, dress, shoes, bag)
- **Age/size**
- **Colour**
- **Customization type** (Embroidered vs. Iron-on, within the Customization pillar)

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
  1. Landing page adapting visibly between a simulated "tourist" and "local" visitor (toggle for demo purposes, backed by the geo/IP logic described in §5.1), and between "first-time" and "returning/member" hero priority states.
  2. Search bar on focus showing recently-searched chips plus segment-appropriate suggestion chips (trending intents for first-time, recommender-based for returning).
  3. Top nav reflecting the pillar/facet taxonomy model (§6): pillars in nav, facets as in-page filters.
  4. Occasion-based browse groupings, each populated with real products.
  5. Customization pillar with working Embroidered/Iron-on filter + name/initials/thread colour/placement attributes.
  6. Disney Pre-Order PDP flow: design → lead-time messaging → full-payment checkout, with an admin/demo view showing per-design production quantity resolving to whichever is higher of demand or MOQ (independently per design, not split across a product line).
  7. Checkout flow showing all three tourist fulfillment options.
  8. A logged-in account view showing unified purchase history (mock in-store + online records) and loyalty points balance.
  9. A simple admin/demo panel showing the three KPI families (conversion/AOV, repeat rate, cross-channel match rate) as illustrative dashboard tiles — not live data, but structured to show where real analytics would plug in.
  10. The B2B self-serve RFQ flow (§10): order-type selection → item/quantity → live tiered pricing → quote summary.
  11. The Elly FurKids pillar (§11): product listing, PDP, and cart/checkout, with the pending-licensing badge visible throughout.
  12. The same core journeys above, working cleanly at phone, tablet, and laptop/PC breakpoints.
- **Tech assumption**: no multi-currency/multi-language build needed. Open to custom/headless approach; does not need to be constrained to Shopify's native theme system for the prototype.

---

## 9. Out of Scope (this PRD)

- Upstream acquisition/marketing channel build (ads, SEO, hotel/mall partnerships) — the engine must be *ready* to receive that traffic, but building the channels is separate work.
- Multi-currency and multi-language support.
- Chatty AI upgrade (flagged for future phase only).
- Physical POS system changes beyond the loyalty-capture prompt described in §5.2.
- Actual Disney licensing negotiation/confirmation for the Elly FurKids category (§11) — this is a legal/business-development workstream, not a prototype deliverable.
- Live payment processing, invoicing, or ERP/ordering-system integration for B2B quotes (§10) — the prototype demonstrates the self-serve quote *experience*, not backend order fulfillment.

---

## 10. Growth Pillar 2 — B2B Channels

Bulk, family, event, and corporate orders are a distinct demand source from individual consumer purchases — larger order sizes, different buying process (quote-driven, not impulse), and a different success metric (deal size, not conversion rate).

- **Self-serve quote/RFQ flow**, entirely on-site (not routed to a contact form):
  1. **Order-type selector**: Bulk/Wholesale, Family (multi-child/sibling sets), Event (e.g. birthday party favours), or Corporate (corporate gifting).
  2. **Item + quantity selection**, drawing from the same product catalog as consumer browsing (including Customization pillar items, since bulk+customized is a common combination for events/corporate).
  3. **Live tiered bulk pricing**, updating as quantity is adjusted. Placeholder tiers for prototype (illustrative — replace with real pricing before production):
     - 10–49 units: 10% off
     - 50–99 units: 15% off
     - 100–299 units: 20% off
     - 300+ units: "Custom quote" — flags for manual sales follow-up rather than an automatic discount
  4. **Quote summary screen**: itemized list, tier discount applied, total — presented as a downloadable/shareable quote, not an immediate checkout (this is a quote-request flow, not a live payment flow; see Out of Scope, §9).
- **Cross-sell awareness**: the RFQ flow should surface Customization options contextually (e.g. "add names for the whole group") given family/event/corporate orders are natural customization use-cases.
- **Prototype demonstration**: the full flow above, end-to-end, with the same brand fidelity and responsive requirements as §8.

---

## 11. Growth Pillar 3 — Elly FurKids

A Disney-licensed pet products line — blankets/mats, bows, and pet apparel — riding the rising pet-ownership trend as a category adjacent to the core kids' apparel business.

**Licensing status — read before building:** Disney licensing feasibility for pet products is **unconfirmed**. Per stakeholder direction, the prototype represents this as a **full Disney-branded FurKids line**, built as an aspirational demo, but it must be **clearly and consistently marked as pending licensing approval** everywhere it appears — this is a hard requirement, not a nice-to-have, so the prototype is never mistaken for a confirmed product line:
- A persistent badge/ribbon on the FurKids nav pillar and every FurKids page (e.g. "Concept — Pending Disney License Approval").
- The same disclosure pattern used for the Pre-Order concept artwork (§5.3) — consistent visual language for "this is illustrative, not confirmed" across the whole prototype.

- **6th top-level nav pillar** (alongside Elly Label, Disney|elly, Shoe Boutique, Gifting Hub, Customization — see §6).
- **Product range**: blankets (doubling as mats), bows, and pet apparel.
- **Taxonomy**: follows the same pillar/facet model as §6 — facets for pet size (S/M/L), product type (blanket-mat/bow/apparel), and character/franchise, consistent with how the rest of the catalog is organised.
- **Cross-sell opportunity**: surfaced contextually in Gifting Hub (pet-owner gift sets) and Customization (e.g. name tag/bandana personalization), consistent with the AOV cross-sell pattern already used elsewhere (§5.3).
- **Prototype demonstration**: full pillar with product listing, PDP, and cart/checkout consistent with the rest of the site — with the pending-licensing badge visible throughout.

---

## 12. Open Items / Needs From Stakeholder

- [ ] Typical MOQ figures from approved factories, to reflect realistically in the pre-order demand-vs-MOQ demo logic. *(Resolved for prototype purposes — see §5.3, assumption of 1,000 units.)*
- [ ] Smile loyalty program's current point-earning/redemption rules. *(Resolved for prototype purposes — see §5.4, placeholder rules to be replaced with real Smile configuration before production.)*
- [ ] Actual bulk/corporate pricing tiers and discount thresholds for B2B (§10) — prototype uses illustrative placeholder tiers.
- [ ] Confirmation of Disney's willingness to license the pet-products category for Elly FurKids (§11) — this is a real open business question, not just a prototype placeholder.
- [ ] Elly FurKids product range and pricing, if different from placeholder assumptions in §11.

---

*End of PRD.*
