import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const EVENTS = [
  "scan",
  "landing_view",
  "form_start",
  "form_submit",
  "otp_sent",
  "otp_verified",
  "lead_created",
  "offer_redeemed",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { qr_ref, event_type, session_id, landing_page, referrer } = await req.json();

    if (!qr_ref || typeof qr_ref !== "string" || !EVENTS.includes(event_type)) {
      return json({ error: "Invalid tracking payload" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: qr } = await supabase
      .from("qr_codes")
      .select("id, campaign_id, qr_type")
      .eq("qr_ref", qr_ref)
      .eq("qr_type", "MOBILE_QR")
      .maybeSingle();

    if (!qr) return json({ error: "QR not found" }, 404);

    await supabase.from("mobile_qr_events").insert({
      qr_id: qr.id,
      campaign_id: qr.campaign_id,
      event_type,
      session_id: typeof session_id === "string" ? session_id.slice(0, 64) : null,
      user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
      referrer: typeof referrer === "string" ? referrer.slice(0, 300) : null,
      landing_page: typeof landing_page === "string" ? landing_page.slice(0, 300) : null,
    });

    return json({ ok: true });
  } catch (e) {
    console.error("mobile-qr-track error", e);
    return json({ error: "Tracking failed" }, 500);
  }
});
