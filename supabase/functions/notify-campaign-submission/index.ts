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
      toEmail, campaignName, campaignType,
      location, startDate, endDate, budget,
      isGuest, campaignId,
    } = await req.json();

    if (!toEmail) {
      return new Response(JSON.stringify({ error: "toEmail required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const budgetDisplay = !budget || budget === "Flexible"
      ? "Flexible"
      : "₱" + Number(budget).toLocaleString();

    // Generate a unique subscribe token and persist subscription (unconfirmed)
    const subscribeToken = crypto.randomUUID();
    const finalCampaignId = campaignId || `guest-${Date.now()}`;

    await supabaseAdmin.from("campaign_subscriptions").upsert(
      {
        campaign_id: finalCampaignId,
        email: toEmail,
        subscribed: false,
        subscribe_token: subscribeToken,
      },
      { onConflict: "campaign_id,email" }
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const subscribeUrl = `${supabaseUrl}/functions/v1/subscribe-campaign?token=${subscribeToken}`;

    const detailsBlock = `
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;font-family:Arial,sans-serif;">
        <p style="margin:4px 0;"><strong>Campaign:</strong> ${campaignName}</p>
        <p style="margin:4px 0;"><strong>Type:</strong> ${campaignType}</p>
        <p style="margin:4px 0;"><strong>Location:</strong> ${location || "—"}</p>
        <p style="margin:4px 0;"><strong>Dates:</strong> ${startDate || "?"} → ${endDate || "?"}</p>
        <p style="margin:4px 0;"><strong>Budget:</strong> ${budgetDisplay}</p>
      </div>
    `;

    // 1) Confirmation + Subscribe link to submitter
    const conf = await resend.emails.send({
      from: FROM,
      to: [toEmail],
      subject: "Your Campaign is Live — Confirm your listing subscription",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
          <h2 style="color:#16a34a;">Your Campaign Request is Live! 🎉</h2>
          <p>Your campaign has been posted on the TrioTag Marketplace. To receive proposal notifications at this email, click the button below to confirm your subscription.</p>
          ${detailsBlock}
          <div style="text-align:center;margin:24px 0;">
            <a href="${subscribeUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
              ✓ Subscribe to Proposals
            </a>
          </div>
          <p style="color:#555;font-size:13px;">Once subscribed, you'll receive an email every time a retailer or ad space owner submits a proposal on your campaign.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#888;font-size:12px;">TrioTag · Micro Advertising · <a href="https://triotag.com/campaigns" style="color:#16a34a;">View Marketplace</a></p>
        </div>
      `,
    });
    if (conf.error) {
      console.error("Resend confirmation error:", conf.error);
      throw new Error(conf.error.message);
    }

    // 2) Internal notification (best-effort)
    const admin = await resend.emails.send({
      from: FROM,
      to: ["tinystickyads@gmail.com"],
      subject: `[TrioTag] New Campaign Request — ${campaignName} (${campaignType})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
          <h2>New Campaign Request</h2>
          <p><strong>Submitter:</strong> ${toEmail}</p>
          <p>${isGuest ? "Guest user (email verified via OTP)." : "Registered user."}</p>
          ${detailsBlock}
        </div>
      `,
    });
    if (admin.error) console.error("Resend admin error:", admin.error);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("notify-campaign-submission error", err);
    return new Response(JSON.stringify({ error: err?.message || "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
