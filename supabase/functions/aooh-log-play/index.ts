import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { aooh_campaign_id, venue_id, ad_space_id, duration_sec, completed, player_session_id, device_info } = body || {};
    if (!aooh_campaign_id || !ad_space_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { error: insErr } = await supabase.from("aooh_play_logs").insert({
      aooh_campaign_id, venue_id: venue_id || null, ad_space_id,
      duration_sec: duration_sec ?? null, completed: !!completed,
      player_session_id: player_session_id || null, device_info: device_info || null,
    });
    if (insErr) throw insErr;

    if (completed) {
      const { data: c } = await supabase.from("aooh_campaigns").select("total_plays").eq("id", aooh_campaign_id).maybeSingle();
      await supabase.from("aooh_campaigns").update({ total_plays: (c?.total_plays || 0) + 1 }).eq("id", aooh_campaign_id);
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
