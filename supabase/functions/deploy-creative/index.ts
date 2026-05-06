import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub;
    const body = await req.json();
    const { creative_id, ad_space_id, media_type, title, start_date, end_date, dayparts, priority } = body;
    if (!creative_id || !ad_space_id || !media_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: pub } = await admin.from("publisher_profiles").select("id").eq("user_id", userId).maybeSingle();
    if (!pub) return new Response(JSON.stringify({ error: "Publisher not found" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: creative } = await admin.from("retailer_creatives").select("creative_type, used_in_count").eq("id", creative_id).eq("publisher_id", pub.id).maybeSingle();
    if (!creative) return new Response(JSON.stringify({ error: "Creative not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const validForDooh = creative.creative_type === "image" || creative.creative_type === "video";
    const validForAooh = creative.creative_type === "audio";
    if ((media_type === "dooh" && !validForDooh) || (media_type === "aooh" && !validForAooh)) {
      return new Response(JSON.stringify({ error: "Creative type does not match media type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: sched, error: schedErr } = await admin.from("house_ad_schedules").insert({
      publisher_id: pub.id,
      creative_id,
      ad_space_id,
      media_type,
      title: title || "Untitled house ad",
      start_date: start_date || new Date().toISOString().slice(0, 10),
      end_date: end_date || null,
      dayparts: dayparts || ["morning", "afternoon", "evening", "late_night"],
      priority: priority || 1,
      status: "active",
    }).select("id").single();
    if (schedErr) throw schedErr;

    await admin.from("retailer_creatives").update({
      last_deployed_at: new Date().toISOString(),
      used_in_count: (creative.used_in_count || 0) + 1,
    }).eq("id", creative_id);

    return new Response(JSON.stringify({ success: true, schedule_id: sched.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
