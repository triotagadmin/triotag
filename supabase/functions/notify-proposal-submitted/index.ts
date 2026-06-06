import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM = "TrioTag <onboarding@resend.dev>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      campaignId, campaignName,
      proposerName, proposerEmail,
      proposerMessage, proposerVenue,
    } = await req.json();

    if (!campaignId || !proposerEmail) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: subscribers, error: subErr } = await supabaseAdmin
      .from("campaign_subscriptions")
      .select("email")
      .eq("campaign_id", campaignId)
      .eq("subscribed", true);

    if (subErr) throw subErr;

    // Always notify admin
    await resend.emails.send({
      from: FROM,
      to: ["tinystickyads@gmail.com"],
      subject: `[TrioTag] New Proposal on "${campaignName}"`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
          <h2>New Proposal Submitted</h2>
          <p><strong>Campaign:</strong> ${campaignName}</p>
          <p><strong>From:</strong> ${proposerName} (${proposerEmail})</p>
          ${proposerVenue ? `<p><strong>Venue/Space:</strong> ${proposerVenue}</p>` : ""}
          ${proposerMessage ? `<p><strong>Message:</strong><br/>${proposerMessage}</p>` : ""}
        </div>
      `,
    });

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await Promise.all(subscribers.map(async (sub) => {
      const r = await resend.emails.send({
        from: FROM,
        to: [sub.email],
        reply_to: proposerEmail,
        subject: `New Proposal on Your Campaign — ${campaignName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
            <h2 style="color:#16a34a;">You received a proposal! 📬</h2>
            <p>Someone submitted a proposal on your campaign <strong>${campaignName}</strong>.</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>From:</strong> ${proposerName}</p>
              <p style="margin:4px 0;"><strong>Email:</strong> ${proposerEmail}</p>
              ${proposerVenue ? `<p style="margin:4px 0;"><strong>Venue/Space:</strong> ${proposerVenue}</p>` : ""}
              ${proposerMessage ? `<p style="margin:4px 0;"><strong>Message:</strong><br/>${proposerMessage}</p>` : ""}
            </div>
            <p>Reply directly to <a href="mailto:${proposerEmail}" style="color:#16a34a;">${proposerEmail}</a> to respond.</p>
            <p><a href="https://triotag.com/campaigns" style="color:#16a34a;">View Marketplace</a></p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
            <p style="color:#888;font-size:12px;">TrioTag · Micro Advertising · www.triotag.com</p>
          </div>
        `,
      });
      if (r.error) console.error(`Resend error for ${sub.email}:`, r.error);
    }));

    return new Response(JSON.stringify({ ok: true, sent: subscribers.length }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("notify-proposal-submitted error", err);
    return new Response(JSON.stringify({ error: err?.message || "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
