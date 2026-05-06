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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub;
    const { booking_id, action, rejection_reason } = await req.json();
    if (!booking_id || !["approved", "rejected"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: pub } = await admin.from("publisher_profiles").select("id").eq("user_id", userId).maybeSingle();
    if (!pub) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const newStatus = action === "approved" ? "approved" : "rejected";
    const updates: any = { status: newStatus, reviewed_at: new Date().toISOString(), reviewer_id: userId };
    if (action === "rejected" && rejection_reason) updates.rejection_reason = rejection_reason;

    const { data: booking, error: uErr } = await admin
      .from("activations")
      .update(updates)
      .eq("id", booking_id)
      .eq("publisher_id", pub.id)
      .select("advertiser_id")
      .maybeSingle();
    if (uErr) throw uErr;
    if (!booking) return new Response(JSON.stringify({ error: "Booking not found or not authorised" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Notification
    await admin.from("notifications").insert({
      user_id: booking.advertiser_id,
      title: action === "approved" ? "Booking approved" : "Booking rejected",
      message: action === "approved"
        ? "Your booking has been approved and your campaign is now scheduled."
        : `Your booking was rejected.${rejection_reason ? " Reason: " + rejection_reason : ""}`,
      type: action === "approved" ? "booking_approved" : "booking_rejected",
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
