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

    const { lat, lng, radiusMeters, keyword, type } = await req.json();

    if (typeof lat !== "number" || typeof lng !== "number" || !radiusMeters) {
      return json({ error: "Missing or invalid lat, lng, or radiusMeters" }, 400);
    }

    const radius = Math.min(Math.max(Number(radiusMeters), 1), 50000);

    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}` +
      `&radius=${radius}&key=${apiKey}` +
      (keyword ? `&keyword=${encodeURIComponent(String(keyword))}` : "") +
      (type ? `&type=${encodeURIComponent(String(type))}` : "");

    const res = await fetch(url);
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      console.error("[discover-nearby-places] HTTP error", res.status, text);
      return json({ error: `Google Places request failed (${res.status})`, details: text }, 502);
    }

    const data = await res.json();
    const status = data.status;

    if (status !== "OK" && status !== "ZERO_RESULTS") {
      console.error("[discover-nearby-places] API status", status, data.error_message);
      return json(
        {
          error: `Google Places API error: ${status}`,
          details: data.error_message ?? null,
        },
        502,
      );
    }

    const results = (data.results ?? []).map((r: any) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.vicinity,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      types: r.types ?? [],
      rating: r.rating ?? null,
    }));

    return json({ status, results });
  } catch (err: any) {
    console.error("[discover-nearby-places] Unexpected error", err);
    return json({ error: err?.message ?? "Unexpected error" }, 500);
  }
});
