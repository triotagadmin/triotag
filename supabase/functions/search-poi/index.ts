import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TAG_FILTERS = [
  "amenity=cafe", "shop=coffee", "shop=supermarket", "shop=convenience",
  "amenity=nightclub", "amenity=bar", "amenity=restaurant", "amenity=fast_food",
  "leisure=fitness_centre", "shop=hairdresser", "amenity=pharmacy",
  "shop=mall", "shop=clothes", "shop=department_store",
];

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lng, radiusMeters } = await req.json();
    if (lat == null || lng == null || !radiusMeters) {
      return new Response(JSON.stringify({ error: "Missing lat, lng, or radiusMeters", elements: [] }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const query = `[out:json][timeout:25];(${TAG_FILTERS.map((tag) => {
      const [key, value] = tag.split("=");
      return `node["${key}"="${value}"](around:${radiusMeters},${lat},${lng});`;
    }).join("")});out body;`;

    console.log("[search-poi] Querying Overpass", { lat, lng, radiusMeters });

    let lastStatus = 0;
    let lastBody = "";
    for (const url of ENDPOINTS) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
        });
        if (!res.ok) {
          lastStatus = res.status;
          lastBody = (await res.text()).slice(0, 300);
          console.warn("[search-poi] endpoint failed", url, res.status);
          continue;
        }
        const data = await res.json();
        const elements = data.elements || [];
        console.log("[search-poi] OK", url, "elements:", elements.length);
        return new Response(JSON.stringify({ elements }), {
          status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch (e: any) {
        console.warn("[search-poi] endpoint threw", url, e?.message);
        lastBody = e?.message || String(e);
      }
    }

    console.error("[search-poi] All endpoints failed", lastStatus, lastBody);
    return new Response(JSON.stringify({
      error: `Overpass unavailable (last status ${lastStatus})`, elements: [],
    }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("[search-poi] Fatal:", error);
    return new Response(JSON.stringify({ error: error?.message || "unknown", elements: [] }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
