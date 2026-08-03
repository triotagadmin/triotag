import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey =
      Deno.env.get("GOOGLE_PLACES_API_KEY") ?? Deno.env.get("GOOGLEPLACESAPIKEY");
    if (!apiKey) return json({ error: "Google Places API key is not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const lat = typeof body?.lat === "number" ? body.lat : null;
    const lng = typeof body?.lng === "number" ? body.lng : null;

    // Reverse geocoding mode: lat/lng provided without a query
    if (!query && lat != null && lng != null) {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = geoRes.ok ? await geoRes.json() : null;
      const top = geoData?.status === "OK" ? (geoData.results ?? [])[0] : null;
      if (top?.formatted_address) {
        return json({ status: "OK", address: top.formatted_address, placeId: top.place_id ?? null });
      }
      console.warn("[search-places] geocode unavailable", geoData?.status, geoData?.error_message);

      // Fallback: nearest place via Places Nearby Search
      const nearUrl =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}` +
        `&rankby=distance&key=${apiKey}`;
      const nearRes = await fetch(nearUrl);
      if (!nearRes.ok) return json({ error: "Reverse lookup failed" }, 502);
      const nearData = await nearRes.json();
      const place = (nearData.results ?? [])[0];
      if (!place) return json({ status: "ZERO_RESULTS", address: null });
      const address = place.vicinity
        ? `${place.name} — ${place.vicinity}`
        : place.name ?? null;
      return json({ status: "OK", address, placeId: place.place_id ?? null });
    }

    if (query.length < 3 || query.length > 200) {
      return json({ error: "Query must be between 3 and 200 characters" }, 400);
    }

    const url =
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}` +
      `&region=ph&key=${apiKey}` +
      (lat != null && lng != null ? `&location=${lat},${lng}&radius=50000` : "");

    const res = await fetch(url);
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      console.error("[search-places] HTTP error", res.status, text);
      return json({ error: `Google Places request failed (${res.status})`, details: text }, 502);
    }

    const data = await res.json();
    const status = data.status;
    if (status !== "OK" && status !== "ZERO_RESULTS") {
      console.error("[search-places] API status", status, data.error_message);
      return json({ error: `Google Places API error: ${status}`, details: data.error_message ?? null }, 502);
    }

    const results = (data.results ?? []).slice(0, 6).map((r: any) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address ?? r.vicinity ?? "",
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
    }));

    return json({ status, results });
  } catch (err: any) {
    console.error("[search-places] Unexpected error", err);
    return json({ error: err?.message ?? "Unexpected error" }, 500);
  }
});
