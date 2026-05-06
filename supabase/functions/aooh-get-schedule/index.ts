import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { access_token } = await req.json();
    if (!access_token) return new Response(JSON.stringify({ error: "Missing access_token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: session, error: sErr } = await supabase
      .from("aooh_player_sessions")
      .select("id, venue_id, ad_space_id, label")
      .eq("access_token", access_token)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!session) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await supabase.from("aooh_player_sessions").update({ last_active_at: new Date().toISOString(), is_online: true }).eq("id", session.id);

    const today = new Date().toISOString().slice(0, 10);
    const { data: assignments } = await supabase
      .from("aooh_venue_assignments")
      .select("aooh_campaign_id, play_frequency_min, max_plays_per_day, dayparts, status, aooh_campaigns!inner(id, campaign_name, audio_file_url, audio_duration_sec, status, start_date, end_date, spot_duration)")
      .eq("ad_space_id", session.ad_space_id)
      .eq("status", "active");

    const schedule = (assignments || [])
      .filter((a: any) => a.aooh_campaigns.status === "active"
        && (!a.aooh_campaigns.start_date || a.aooh_campaigns.start_date <= today)
        && (!a.aooh_campaigns.end_date || a.aooh_campaigns.end_date >= today))
      .map((a: any) => ({
        aooh_campaign_id: a.aooh_campaign_id,
        source: "paid",
        campaign_name: a.aooh_campaigns.campaign_name,
        audio_file_url: a.aooh_campaigns.audio_file_url,
        audio_duration_sec: a.aooh_campaigns.audio_duration_sec,
        play_frequency_min: a.play_frequency_min,
        max_plays_per_day: a.max_plays_per_day,
        dayparts: a.dayparts,
      }));

    // Fill empty slots with active house ads (paid always wins; house only fills empties)
    const { data: houseRows } = await supabase
      .from("house_ad_schedules")
      .select("id, title, dayparts, retailer_creatives!inner(file_url, duration_sec, creative_type)")
      .eq("ad_space_id", session.ad_space_id)
      .eq("media_type", "aooh")
      .eq("status", "active")
      .lte("start_date", today);
    const house = (houseRows || [])
      .filter((r: any) => !r.end_date || r.end_date >= today)
      .map((r: any) => ({
        source: "house",
        schedule_id: r.id,
        campaign_name: r.title,
        audio_file_url: r.retailer_creatives.file_url,
        audio_duration_sec: r.retailer_creatives.duration_sec || 30,
        dayparts: r.dayparts,
      }));

    return new Response(JSON.stringify({ session: { id: session.id, label: session.label, venue_id: session.venue_id, ad_space_id: session.ad_space_id }, schedule: [...schedule, ...house] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
