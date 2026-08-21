# Business Prospecting & Website Gap Finder

Internal admin tool at `/admin/business-prospecting` that searches Google Places, flags businesses with **"No website listed on Google"**, scores them, and lets verified admins save/manage prospects — integrated into the existing TrioTag admin stack (no standalone app, no scraping, no outreach automation).

## Entry points (button on the selected div)

- `src/pages/AdminDashboard.tsx` — add a "Business Prospecting" outline button to the header button row (the selected div, next to Ad Orders / Total Inventory / Blog / News), navigating to `/admin/business-prospecting`.
- `src/components/shared/AppSidebar.tsx` — add a "Business Prospecting" item (icon: `Target`) to the admin nav group.
- `src/App.tsx` — register route `/admin/business-prospecting` wrapped in `<ProtectedAdminRoute>` (existing verified-admin guard).

## Database (migration)

Three new public tables, each with GRANTs (authenticated + service_role), RLS enabled, admin-only policies via existing `public.is_verified_admin(auth.uid())`, and `updated_at` triggers:

1. **`prospect_searches`** — search history + API-cost cache: `search_key` (normalized keyword|location|radius|filters, unique), `searched_by`, keyword, location_text, lat/lng, radius_km, min_rating, min_reviews, result_limit, results_count, website_gap_count, created_at.
2. **`prospect_places`** — Google Place Details cache keyed by `google_place_id` (PK): name, category, address, city/region/country, phone, rating, review_count, website_url, website_status (`listed`/`not_listed`), lat/lng, maps_url, business_status, details_fetched_at. Prevents re-fetching Place Details for a place already fetched (cost control).
3. **`business_prospects`** — saved leads: `google_place_id` UNIQUE (dedupe), business fields mirrored from the place cache, opportunity_score, prospect_status (`new/reviewed/contacted/qualified/proposal/won/lost`, text + CHECK), notes, assigned_to (references auth user, nullable), source (`google_places`), search_id FK, saved_by, discovered_at, saved_at.

## Backend: new edge function `business-prospecting-search`

Reuses the existing `GOOGLEPLACESAPIKEY` secret (same env names as `search-places`); key never leaves the server. `verify_jwt = false` with in-code JWT validation + `is_verified_admin` check — non-admins get 403.

Flow: validate input → build `search_key` → if an equivalent search exists within the cache window (24h), return its stored results **without calling Google** → otherwise geocode the location, run Places Text Search, fetch Place Details only for places not already in `prospect_places`, upsert cache + `prospect_searches`, compute scores, return results. Handles ZERO_RESULTS, quota/auth errors with clean admin-facing messages.

**Cost protections:** 24h equivalent-search cache; per-place details cache; hard caps (radius ≤ 50 km, limit ≤ 20 results); per-admin rate limit (min 15s between live searches, enforced server-side); loading state + disabled button client-side to block double-clicks.

## Opportunity Score (deterministic, documented in UI tooltip + code comments)

- No website listed on Google: **+50** (primary signal)
- Reviews ≥100 / ≥50 / ≥10: **+20 / +12 / +6**
- Rating ≥4.5 / ≥4.0: **+10 / +6**
- Business status OPERATIONAL: **+5**
- Capped at 100. Labeled "Opportunity Score" — never presented as business-quality truth.

## Admin page: `src/pages/admin/AdminBusinessProspecting.tsx`

Styled like `AdminLocalListings.tsx` (existing cards/tables/dialogs/badges, Navigation header). Title "Business Prospecting", subtitle "Find businesses with website opportunities using Google Places data."

- **Summary cards:** Businesses Found, Website Opportunities, Saved Prospects, High-Opportunity Prospects (from real DB counts).
- **Tabs: Search / Saved Prospects / Search History**
- **Search tab:** config panel (category/keyword, location, radius, optional min rating, min reviews, business type, result limit) with a "Searching Google Places…" loading state; results table (Select, Business, Category, Location, Rating, Reviews, Website Status badge — "Website Listed" vs highlighted "No Website Listed", Opportunity Score, Google Maps link, Save Prospect / Saved). Results are NOT auto-saved; admin selects which to save. Duplicates blocked by the unique place constraint.
- **Careful language everywhere:** "No website listed on Google" + helper text "a potential website opportunity, not proof the business has no website."
- **Prospect detail dialog:** full business data, Place ID, dates, discovering search, editable notes, prospect status select, assigned admin dropdown.
- **Saved Prospects tab:** filters (website status, prospect status, category, score high/low, rating, reviews) + sorting + status editing + notes + remove/archive + **CSV export** (name, category, address, phone, rating, reviews, website status/URL, score, Maps URL, status, dates — no internal fields).
- **Search History tab:** date, term, location, radius, results, opportunities found, saved count, searching admin; "Reopen" reuses cached results (no new API call inside the cache window).

## Reused vs. new

- **Reused:** `ProtectedAdminRoute`, `is_verified_admin`/`has_role`, `GOOGLEPLACESAPIKEY` secret + existing Places calling pattern, `Navigation`, shadcn UI kit, admin sidebar/dashboard conventions. No duplicate Places integration; no reuse of `local_listing_clients` (different concept — kept separate per spec).
- **New:** 3 tables, 1 edge function, 1 admin page, 2 nav/button entries, 1 route.

## Verification

- Migration applied with GRANTs/RLS; edge function deployed; typecheck + build log clean.
- Playwright: admin dashboard shows the button → route loads for admin; confirm unauthorized access redirects; run a live search (cached second run hits no Google call), save a prospect, change status, export CSV, check history row.
- Confirm no API key in client bundle and no regression to existing pages.

## Explicitly out of scope (per spec)

Scraping of any kind, automated email/SMS/outreach, auto status changes, AI scoring, campaign creation. Schema stays future-ready (source column, notes, assigned_to, activity via updated_at) for later enrichment/CRM phases.
