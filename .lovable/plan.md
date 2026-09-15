# Redesign `/industries/sspsource`

## Outcome
Rebuild the existing page as a premium outsourced advertising agency page that immediately communicates TRIOTAG’s full advertising operation and retail media advantage. Keep the existing URL, global navigation, and footer unchanged.

## Page structure
- Replace the current supply-side and retailer-focused content with the requested agency positioning and copy.
- Build a full-height opening section with the exact headline, two working calls to action, and an animated advertising ecosystem connecting TRIOTAG to digital, creative, analytics, OOH, DOOH, and retail media channels.
- Add the requested sections: value proposition, eight service capabilities, digital + retail media differentiator, in-house comparison, managed operation model, four-step process, audience segments, implemented TRIOTAG technology, conceptual managed packages, and final call to action.
- Use `/contact` for “Talk to TRIOTAG” and an in-page services anchor for “Explore Advertising Services” / “Explore Our Services.”

## Visual direction
- Preserve TRIOTAG’s black and neon-green AdTech identity with restrained glass surfaces, thin borders, compact rounded corners, subtle grid/connection effects, and motion that respects reduced-motion preferences.
- Use interface-like media diagrams rather than stock photography, generic office imagery, fake dashboards, fake numbers, testimonials, clients, or pricing.
- Make social advertising and retail media prominent, with responsive layouts that avoid horizontal overflow on mobile and tablet.

## SEO and accuracy
- Set the supplied page title and description, self-referencing canonical URL, matching Open Graph tags, and focused keyword metadata at this route’s current page-level metadata layer.
- Show only platform capabilities confirmed in the current TRIOTAG product. Avoid unsupported savings claims or promises of dedicated full-time specialists.

## Technical details
- Rewrite `src/pages/industries/Brands.tsx` only; do not add or change routes.
- Reuse `Navigation`, `Footer`, the shared `Button`, existing typography, and semantic theme roles where practical.
- Validate compilation, inspect diagnostics, and test the live page at desktop and mobile widths, including CTA destinations, metadata, overflow, and visible layout.
