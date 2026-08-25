import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

// --- Cost controls ---
const CACHE_WINDOW_HOURS = 24; // equivalent searches within this window reuse cached results
const MIN_SEARCH_INTERVAL_MS = 15_000; // per-admin rate limit between live Google searches
const MAX_RADIUS_KM = 50;
const MAX_RESULTS = 20;
const PLACE_CACHE_DAYS = 30; // Place Details are re-fetched only after this many days

/**
 * Deterministic Opportunity Score (documented in the admin UI):
 *   No website listed on Google : +50 (primary prospecting signal)
 *   Review count >= 100 / 50 / 10 : +20 / +12 / +6
 *   Rating >= 4.5 / >= 4.0        : +10 / +6
 *   Business status OPERATIONAL   : +5
 * Capped at 100. This is a lead-prioritization heuristic, not a business-quality metric.
 */
function computeOpportunityScore(p: {
  website_url: string | null;
  review_count: number | null;
  google_rating: number | null;
  business_status: string | null;
}): number {
  let score = 0;
  if (!p.website_url) score += 50;
  const reviews = p.review_count ?? 0;
  if (reviews >= 100) score += 20;
  else if (reviews >= 50) score += 12;
  else if (reviews >= 10) score += 6;
  const rating = p.google_rating ?? 0;
  if (rating >= 4.5) score += 10;
  else if (rating >= 4.0) score += 6;
  if ((p.business_status ?? "").toUpperCase() === "OPERATIONAL") score += 5;
  return Math.min(score, 100);
}

function normalizeKey(parts: Array<string | number | null | undefined>): string {
  return parts
    .map((p) => String(p ?? "").trim().toLowerCase())
    .join("|");
}

// Extract city/region/country from Google address_components
function parseAddressComponents(components: any[] | undefined) {
  const get = (type: string) =>
    components?.find((c: any) => c.types?.includes(type))?.long_name ?? null;
  return {
    city: get("locality") ?? get("sublocality") ?? get("administrative_area_level_2"),
    region: get("administrative_area_level_1"),
    country: get("country"),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const apiKey =
      Deno.env.get("GOOGLE_PLACES_API_KEY") ?? Deno.env.get("GOOGLEPLACESAPIKEY");
    if (!apiKey) return json({ error: "Google Places API key is not configured" }, 500);

    // --- Auth: must be a signed-in verified admin ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Invalid or expired session" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    // --- Validate input ---
    const body = await req.json().catch(() => ({}));
    const keyword = typeof body?.keyword === "string" ? body.keyword.trim() : "";
    const locationText = typeof body?.location === "string" ? body.location.trim() : "";
    const radiusKm = Math.min(Math.max(Number(body?.radiusKm) || 5, 0.5), MAX_RADIUS_KM);
    const minRating = body?.minRating != null ? Number(body.minRating) : null;
    const minReviews = body?.minReviews != null ? Math.max(0, Math.floor(Number(body.minReviews))) : null;
    const businessType = typeof body?.businessType === "string" && body.businessType.trim()
      ? body.businessType.trim() : null;
    const resultLimit = Math.min(Math.max(Math.floor(Number(body?.limit)) || MAX_RESULTS, 1), MAX_RESULTS);
    const forceRefresh = body?.forceRefresh === true;

    // Optional map-pin coordinates: when provided they are used directly as the
    // search center and the geocoding step is skipped entirely.
    const bodyLat = typeof body?.lat === "number" && Number.isFinite(body.lat) ? body.lat : null;
    const bodyLng = typeof body?.lng === "number" && Number.isFinite(body.lng) ? body.lng : null;
    const hasCoords =
      bodyLat != null && bodyLng != null && Math.abs(bodyLat) <= 90 && Math.abs(bodyLng) <= 180;

    if (keyword.length < 2 || keyword.length > 120) {
      return json({ error: "Business category / keyword must be between 2 and 120 characters" }, 400);
    }
    if (locationText.length > 200 || (!hasCoords && locationText.length < 2)) {
      return json({ error: "Location must be between 2 and 200 characters" }, 400);
    }
    if (minRating != null && (isNaN(minRating) || minRating < 0 || minRating > 5)) {
      return json({ error: "Minimum rating must be between 0 and 5" }, 400);
    }

    const locationKey = hasCoords ? `map:${bodyLat!.toFixed(3)},${bodyLng!.toFixed(3)}` : locationText;
    const searchKey = normalizeKey([keyword, locationKey, radiusKm, minRating, minReviews, businessType, resultLimit]);

    // --- Cache: equivalent search within the window returns stored results (no Google call) ---
    if (!forceRefresh) {
      const cacheCutoff = new Date(Date.now() - CACHE_WINDOW_HOURS * 3600 * 1000).toISOString();
      const { data: cachedSearch } = await admin
        .from("prospect_searches")
        .select("id, created_at, results_count, website_gap_count")
        .eq("search_key", searchKey)
        .gte("created_at", cacheCutoff)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedSearch) {
        const { data: cachedPlaces } = await admin
          .from("prospect_places")
          .select("*")
          .order("opportunity_score", { ascending: false })
          .limit(500);
        // Filter to the places that belonged to that search via business_prospects-free snapshot:
        // we store per-search place ids on the search row instead.
        const { data: searchRow } = await admin
          .from("prospect_searches")
          .select("place_ids")
          .eq("id", cachedSearch.id)
          .single();
        const placeIds: string[] = searchRow?.place_ids ?? [];
        const places = (cachedPlaces ?? []).filter((p: any) => placeIds.includes(p.google_place_id));
        return json({
          status: "OK",
          cached: true,
          searchId: cachedSearch.id,
          searchedAt: cachedSearch.created_at,
          results: places,
        });
      }
    }

    // --- Rate limit: block rapid repeated live searches per admin ---
    const { data: recentSearch } = await admin
      .from("prospect_searches")
      .select("created_at")
      .eq("searched_by", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recentSearch) {
      const elapsed = Date.now() - new Date(recentSearch.created_at).getTime();
      if (elapsed < MIN_SEARCH_INTERVAL_MS) {
        return json(
          { error: `Please wait ${Math.ceil((MIN_SEARCH_INTERVAL_MS - elapsed) / 1000)}s before running another search` },
          429,
        );
      }
    }

    // --- Resolve the search center: use map-pin coordinates directly when
    // provided, otherwise geocode the location text ---
    let lat: number;
    let lng: number;
    if (hasCoords) {
      lat = bodyLat!;
      lng = bodyLng!;
    } else {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationText)}&key=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = geoRes.ok ? await geoRes.json() : null;
      if (geoData?.status !== "OK" || !geoData.results?.[0]) {
        console.error("[prospecting] geocode failed", geoData?.status, geoData?.error_message);
        return json({ error: "Could not locate that area. Try a more specific location (e.g. 'Makati City')." }, 400);
      }
      const loc = geoData.results[0].geometry.location;
      lat = loc.lat;
      lng = loc.lng;
    }
    const radiusMeters = Math.round(radiusKm * 1000);

    // --- Places Text Search ---
    const query = businessType ? `${keyword} ${businessType}` : keyword;
    const tsUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}` +
      `&location=${lat},${lng}&radius=${radiusMeters}&key=${apiKey}`;
    const tsRes = await fetch(tsUrl);
    if (!tsRes.ok) return json({ error: "Google Places request failed. Please try again." }, 502);
    const tsData = await tsRes.json();

    if (tsData.status === "ZERO_RESULTS") {
      return json({ status: "ZERO_RESULTS", results: [], cached: false });
    }
    if (tsData.status !== "OK") {
      console.error("[prospecting] textsearch status", tsData.status, tsData.error_message);
      if (tsData.status === "OVER_QUERY_LIMIT") {
        return json({ error: "Google API quota reached. Please try again later." }, 429);
      }
      if (tsData.status === "REQUEST_DENIED") {
        return json({ error: "Google API authentication failed. Contact an administrator." }, 502);
      }
      return json({ error: "Google Places search failed. Please try again." }, 502);
    }

    const candidates = (tsData.results ?? []).slice(0, resultLimit);
    const placeIds = candidates.map((r: any) => r.place_id).filter(Boolean);

    // Which places already have fresh cached details?
    const placeCacheCutoff = new Date(Date.now() - PLACE_CACHE_DAYS * 24 * 3600 * 1000).toISOString();
    const { data: existingPlaces } = await admin
      .from("prospect_places")
      .select("*")
      .in("google_place_id", placeIds.length ? placeIds : ["__none__"]);
    const freshCache = new Map<string, any>();
    for (const p of existingPlaces ?? []) {
      if (p.details_fetched_at >= placeCacheCutoff) freshCache.set(p.google_place_id, p);
    }

    // --- Fetch Place Details only for places not freshly cached (cost control) ---
    const upsertRows: any[] = [];
    for (const r of candidates) {
      const pid = r.place_id as string;
      if (!pid || freshCache.has(pid)) continue;
      try {
        const detUrl =
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(pid)}` +
          `&fields=name,formatted_address,address_components,formatted_phone_number,international_phone_number,rating,user_ratings_total,website,url,business_status,geometry,types&key=${apiKey}`;
        const detRes = await fetch(detUrl);
        const detData = detRes.ok ? await detRes.json() : null;
        const d = detData?.status === "OK" ? detData.result : null;
        if (!d) continue;

        const parts = parseAddressComponents(d.address_component);
        const websiteUrl = d.website ?? null;
        const row = {
          google_place_id: pid,
          business_name: d.name ?? r.name ?? "Unknown",
          category: (d.types ?? r.types ?? [])[0]?.replace(/_/g, " ") ?? null,
          address: d.formatted_address ?? r.formatted_address ?? null,
          city: parts.city,
          region: parts.region,
          country: parts.country,
          phone: d.formatted_phone_number ?? d.international_phone_number ?? null,
          google_rating: d.rating ?? r.rating ?? null,
          review_count: d.user_ratings_total ?? r.user_ratings_total ?? null,
          website_url: websiteUrl,
          website_status: websiteUrl ? "listed" : "not_listed",
          latitude: d.geometry?.location?.lat ?? r.geometry?.location?.lat ?? null,
          longitude: d.geometry?.location?.lng ?? r.geometry?.location?.lng ?? null,
          google_maps_url: d.url ?? (pid ? `https://www.google.com/maps/place/?q=place_id:${pid}` : null),
          business_status: d.business_status ?? r.business_status ?? null,
          opportunity_score: 0,
          details_fetched_at: new Date().toISOString(),
        };
        row.opportunity_score = computeOpportunityScore(row);
        upsertRows.push(row);
      } catch (e) {
        console.error("[prospecting] details fetch failed for", pid, e);
      }
    }

    if (upsertRows.length) {
      const { error: upsertError } = await admin
        .from("prospect_places")
        .upsert(upsertRows, { onConflict: "google_place_id" });
      if (upsertError) console.error("[prospecting] place cache upsert failed", upsertError);
    }

    // Merge fresh results: newly upserted + previously cached
    const { data: allPlaces } = await admin
      .from("prospect_places")
      .select("*")
      .in("google_place_id", placeIds.length ? placeIds : ["__none__"]);

    let results = (allPlaces ?? []) as any[];
    // Optional filters applied post-fetch (no extra API cost)
    if (minRating != null) results = results.filter((p) => (p.google_rating ?? 0) >= minRating);
    if (minReviews != null) results = results.filter((p) => (p.review_count ?? 0) >= minReviews);
    results.sort((a, b) => b.opportunity_score - a.opportunity_score);

    const websiteGapCount = results.filter((p) => p.website_status === "not_listed").length;

    // --- Record the search (history + cache) ---
    const { data: searchInsert, error: searchError } = await admin
      .from("prospect_searches")
      .upsert({
        search_key: searchKey,
        searched_by: user.id,
        keyword,
        location_text: locationText || `Map pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
        radius_km: radiusKm,
        min_rating: minRating,
        min_reviews: minReviews,
        business_type: businessType,
        result_limit: resultLimit,
        results_count: results.length,
        website_gap_count: websiteGapCount,
        place_ids: results.map((p) => p.google_place_id),
      }, { onConflict: "search_key" })
      .select("id, created_at")
      .single();
    if (searchError) console.error("[prospecting] search record failed", searchError);

    return json({
      status: "OK",
      cached: false,
      searchId: searchInsert?.id ?? null,
      searchedAt: searchInsert?.created_at ?? new Date().toISOString(),
      results,
    });
  } catch (err: any) {
    console.error("[business-prospecting-search] Unexpected error", err);
    return json({ error: "Unexpected error running the search. Please try again." }, 500);
  }
});
