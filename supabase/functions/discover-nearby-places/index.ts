import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

type Place = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  source: "google" | "triotag";
};

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;
function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function tokens(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 2);
}

/** Fallback: real approved TRIOTAG inventory from the database. */
async function inventoryPlaces(
  lat: number,
  lng: number,
  radius: number,
  match: string,
): Promise<Place[]> {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await admin
    .from("ad_spaces")
    .select("id, title, location, latitude, longitude, media_types, specifications")
    .eq("approval_status", "approved")
    .eq("availability_status", "available")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) {
    console.error("[discover-nearby-places] inventory query failed", error.message);
    return [];
  }

  const wanted = tokens(match);

  return (data ?? [])
    .map((row: any) => {
      const spec = row.specifications ?? {};
      const venueTypes: string[] = [
        spec.venue_type,
        ...(Array.isArray(spec.venue_types) ? spec.venue_types : []),
        spec.custom_venue_type,
        spec.environment_details?.venueType,
        spec.industry_category,
      ].filter(Boolean);
      return { row, venueTypes };
    })
    .filter(({ row }) => haversine(lat, lng, Number(row.latitude), Number(row.longitude)) <= radius)
    .filter(({ venueTypes }) => {
      if (wanted.length === 0) return true;
      const hay = tokens(venueTypes.join(" "));
      return wanted.some((w) => hay.some((h) => h.includes(w) || w.includes(h)));
    })
    .map(({ row, venueTypes }): Place => ({
      placeId: `triotag-${row.id}`,
      name: row.title ?? "TRIOTAG advertising location",
      address: row.location ?? "",
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      types: venueTypes,
      rating: null,
      source: "triotag",
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body", results: [], status: "INVALID_REQUEST" }, 400);
    }

    const { lat, lng, radiusMeters, keyword, type } = body;
    if (typeof lat !== "number" || typeof lng !== "number" || !radiusMeters) {
      return json(
        { error: "Missing or invalid lat, lng, or radiusMeters", results: [], status: "INVALID_REQUEST" },
        400,
      );
    }
    const radius = Math.min(Math.max(Number(radiusMeters), 1), 50000);
    const match = String(keyword ?? type ?? "");

    // Identify the caller when a session is present (logged for auditing; the
    // search itself is available to signed-out planners too).
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const anon = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
        );
        const { data } = await anon.auth.getUser();
        if (data?.user) console.log("[discover-nearby-places] caller", data.user.id);
      } catch (_e) {
        // an invalid/expired token must not break the public search
      }
    }

    const apiKey =
      Deno.env.get("GOOGLE_PLACES_API_KEY") ?? Deno.env.get("GOOGLEPLACESAPIKEY");

    let googlePlaces: Place[] = [];
    let googleStatus = "SKIPPED";

    if (apiKey) {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}` +
          `&radius=${radius}&key=${apiKey}` +
          (keyword ? `&keyword=${encodeURIComponent(String(keyword))}` : "") +
          (type ? `&type=${encodeURIComponent(String(type))}` : "");
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          googleStatus = data.status ?? "UNKNOWN";
          if (googleStatus === "OK" || googleStatus === "ZERO_RESULTS") {
            googlePlaces = (data.results ?? [])
              .filter((r: any) => typeof r.geometry?.location?.lat === "number")
              .map((r: any): Place => ({
                placeId: r.place_id,
                name: r.name,
                address: r.vicinity ?? "",
                lat: r.geometry.location.lat,
                lng: r.geometry.location.lng,
                types: r.types ?? [],
                rating: r.rating ?? null,
                source: "google",
              }));
          } else {
            console.error(
              "[discover-nearby-places] Google status",
              googleStatus,
              data.error_message ?? "",
            );
          }
        } else {
          googleStatus = `HTTP_${res.status}`;
          console.error(
            "[discover-nearby-places] Google HTTP error",
            res.status,
            (await res.text()).slice(0, 300),
          );
        }
      } catch (e) {
        googleStatus = "FETCH_ERROR";
        console.error("[discover-nearby-places] Google fetch failed", String(e));
      }
    } else {
      console.warn("[discover-nearby-places] no Google Places key configured");
    }

    // Always merge in real approved TRIOTAG inventory; it is also the fallback
    // whenever the Google lookup is unavailable.
    const inventory = await inventoryPlaces(lat, lng, radius, match);

    const merged: Place[] = [...googlePlaces];
    for (const inv of inventory) {
      const dup = merged.some((p) => haversine(p.lat, p.lng, inv.lat, inv.lng) <= 60);
      if (!dup) merged.push(inv);
    }

    return json({
      status: merged.length ? "OK" : "ZERO_RESULTS",
      results: merged,
      sources: {
        google: { status: googleStatus, count: googlePlaces.length },
        triotag: { count: inventory.length },
      },
    });
  } catch (err: any) {
    console.error("[discover-nearby-places] Unexpected error", err);
    // Never surface internals to the browser; details stay in function logs.
    return json({ error: "LOCATION_SEARCH_FAILED", results: [], status: "ERROR" }, 500);
  }
});
