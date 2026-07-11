import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(SUPA_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPA_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await supabase.auth.getClaims(token);
    if (!claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const agentId = claims.claims.sub;

    const { subscriptionIds, subject, message, messageType } = await req.json();
    if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0 || !subject || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: subs, error: subsErr } = await admin
      .from("venue_subscriptions")
      .select("id, email, venue_name, contact_person, subscription_status")
      .eq("agent_id", agentId)
      .in("id", subscriptionIds);
    if (subsErr) throw subsErr;

    const { data: profile } = await admin.from("publisher_profiles").select("business_name").eq("user_id", agentId).maybeSingle();
    const agentName = profile?.business_name || "TrioTag Agent";

    const results: any[] = [];
    for (const sub of subs || []) {
      if (sub.subscription_status !== "active") {
        results.push({ subscriptionId: sub.id, skipped: "not_active" });
        continue;
      }
      const trackingToken = crypto.randomUUID();
      const trackUrl = `${SUPA_URL}/functions/v1/track-email-event?t=${trackingToken}`;
      const pixelUrl = `${trackUrl}&e=open`;

      const linkified = String(message)
        .replace(/\bhttps?:\/\/[^\s<]+/g, (u) => `${trackUrl}&e=click&u=${encodeURIComponent(u)}`)
        .replace(/\n/g, "<br/>");

      const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#0c0c0c">
        <h2 style="color:#16a34a;margin:0 0 12px">${subject}</h2>
        <p style="color:#333">Hi${sub.contact_person ? " " + sub.contact_person : ""},</p>
        <div style="color:#333;line-height:1.6">${linkified}</div>
        <p style="margin-top:24px;color:#333">— ${agentName}, via TrioTag</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="font-size:11px;color:#999">You are receiving this because you subscribed to advertising campaign invitations on TrioTag.</p>
        <img src="${pixelUrl}" width="1" height="1" style="display:none" alt=""/>
      </div>`;

      const { data: logged, error: logErr } = await admin.from("venue_subscription_messages").insert({
        subscription_id: sub.id,
        agent_id: agentId,
        subject,
        message,
        message_type: messageType || "campaign_invitation",
        tracking_token: trackingToken,
      }).select("id").single();
      if (logErr) { results.push({ subscriptionId: sub.id, error: logErr.message }); continue; }

      const emailResp = await resend.emails.send({
        from: "TrioTag <noreply@triotag.com>",
        to: [sub.email],
        subject,
        html,
      });

      if ((emailResp as any).error) {
        results.push({ subscriptionId: sub.id, error: (emailResp as any).error?.message });
      } else {
        await admin.from("venue_subscription_messages").update({ delivered: true }).eq("id", logged.id);
        await admin.from("venue_subscriptions").update({ last_contacted_at: new Date().toISOString(), campaign_status: messageType || "invited" }).eq("id", sub.id);
        results.push({ subscriptionId: sub.id, success: true });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
