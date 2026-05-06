import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function currentDaypart(d = new Date()): string {
  const h = d.getHours();
  if (h >= 6 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "late_night";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { access_token } = await req.json();
    if (!access_token) {
      return new Response(JSON.stringify({ error: "Missing access_token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: session } = await supabase
      .from("dooh_player_sessions")
      .select("id, venue_id, ad_space_id, label")
      .eq("access_token", access_token)
      .maybeSingle();
    if (!session) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("dooh_player_sessions").update({ last_active_at: new Date().toISOString(), is_online: true }).eq("id", session.id);

    const today = new Date().toISOString().slice(0, 10);
    const dp = currentDaypart();

    // Paid campaigns first (none defined for DOOH yet — placeholder empty)
    const paid: any[] = [];

    // House ads fill empty slots
    const { data: houseRows } = await supabase
      .from("house_ad_schedules")
      .select("id, creative_id, title, dayparts, priority, retailer_creatives!inner(id, file_url, thumbnail_url, duration_sec, creative_type)")
      .eq("ad_space_id", session.ad_space_id)
      .eq("media_type", "dooh")
      .eq("status", "active")
      .lte("start_date", today);

    const house = (houseRows || [])
      .filter((r: any) => !r.end_date || r.end_date >= today)
      .filter((r: any) => Array.isArray(r.dayparts) ? r.dayparts.includes(dp) : true)
      .map((r: any) => ({
        schedule_id: r.id,
        source: "house",
        title: r.title,
        file_url: r.retailer_creatives.file_url,
        thumbnail_url: r.retailer_creatives.thumbnail_url,
        duration_sec: r.retailer_creatives.duration_sec || 15,
        creative_type: r.retailer_creatives.creative_type,
      }));

    return new Response(JSON.stringify({
      session: { id: session.id, label: session.label, venue_id: session.venue_id, ad_space_id: session.ad_space_id },
      schedule: [...paid, ...house],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
