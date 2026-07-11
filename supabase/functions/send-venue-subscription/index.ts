import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const agentId = claims.claims.sub;

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const venueName = body.venueName ? String(body.venueName) : null;
    const contactPerson = body.contactPerson ? String(body.contactPerson) : null;
    const adSpaceId = body.adSpaceId || null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get agent display name
    const { data: profile } = await admin.from("publisher_profiles").select("business_name").eq("user_id", agentId).maybeSingle();
    const agentName = profile?.business_name || "TrioTag Agent";

    // Prevent duplicate active pending: reuse row if exists, refresh token & expiry
    const verificationToken = crypto.randomUUID() + "-" + crypto.randomUUID().replace(/-/g, "");
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: existing } = await admin
      .from("venue_subscriptions")
      .select("id, subscription_status")
      .eq("agent_id", agentId)
      .eq("email", email)
      .maybeSingle();

    let subscriptionId: string;
    if (existing) {
      if (existing.subscription_status === "active") {
        return new Response(JSON.stringify({ error: "This email is already subscribed and verified." }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error: upErr } = await admin.from("venue_subscriptions").update({
        verification_token: verificationToken,
        verification_sent_at: new Date().toISOString(),
        verification_expiry: expiry,
        subscription_status: "pending",
        email_verified: false,
        venue_name: venueName,
        contact_person: contactPerson,
        ad_space_id: adSpaceId,
      }).eq("id", existing.id);
      if (upErr) throw upErr;
      subscriptionId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await admin.from("venue_subscriptions").insert({
        agent_id: agentId,
        ad_space_id: adSpaceId,
        venue_name: venueName,
        contact_person: contactPerson,
        email,
        verification_token: verificationToken,
        verification_expiry: expiry,
      }).select("id").single();
      if (insErr) throw insErr;
      subscriptionId = inserted.id;
    }

    const verifyUrl = `https://triotag.com/verify?subscription_token=${verificationToken}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0c0c0c">
        <h1 style="color:#16a34a;margin:0 0 12px">You've been invited to subscribe</h1>
        <p>Hi${contactPerson ? " " + contactPerson : ""},</p>
        <p><strong>${agentName}</strong> would like to subscribe <strong>${venueName || "your venue"}</strong> (${email}) to receive advertising campaign invitations on TrioTag.</p>
        <p>By verifying below, you confirm ownership of this email and consent to receive campaign requests, briefs, and media kits from Agent accounts.</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${verifyUrl}" style="background:#16a34a;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;display:inline-block">Verify &amp; Subscribe</a>
        </p>
        <p style="font-size:12px;color:#666">Or paste this link: ${verifyUrl}</p>
        <p style="font-size:12px;color:#666">This link expires in 7 days. If you didn't expect this, ignore this email.</p>
      </div>`;

    const emailResp = await resend.emails.send({
      from: "TrioTag <noreply@triotag.com>",
      to: [email],
      subject: `${agentName} invited you to subscribe on TrioTag`,
      html,
    });

    if ((emailResp as any).error) {
      const err = (emailResp as any).error;
      return new Response(JSON.stringify({ error: `Email failed: ${err.message || JSON.stringify(err)}` }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, subscriptionId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
