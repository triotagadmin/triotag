import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const budgetDisplay = !budget || budget === "Flexible"
      ? "Flexible"
      : "₱" + Number(budget).toLocaleString();

    // Persist subscription record (unconfirmed until link clicked)
    const subscribeToken = crypto.randomUUID();
    const finalCampaignId = campaignId || `guest-${Date.now()}`;

    await supabase.from("campaign_subscriptions").upsert(
      {
        campaign_id: finalCampaignId,
        email: toEmail,
        subscribed: false,
        subscribe_token: subscribeToken,
      },
      { onConflict: "campaign_id,email" }
    );

    const subscribeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/subscribe-campaign?token=${subscribeToken}`;

    // 1) Confirmation + subscribe link to submitter via Lovable Emails
    const { error: confErr } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "campaign-confirmation",
        recipientEmail: toEmail,
        idempotencyKey: `campaign-conf-${finalCampaignId}-${toEmail}`,
        templateData: {
          campaignName, campaignType, location,
          startDate, endDate, budgetDisplay, subscribeUrl,
        },
      },
    });
    if (confErr) {
      console.error("send-transactional-email error:", confErr);
      throw new Error(confErr.message || "Failed to enqueue confirmation");
    }

    // 2) Internal admin notification (best-effort)
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "campaign-confirmation",
        recipientEmail: "tinystickyads@gmail.com",
        idempotencyKey: `campaign-admin-${finalCampaignId}`,
        templateData: {
          campaignName: `[ADMIN] ${campaignName} (${isGuest ? "Guest" : "Registered"})`,
          campaignType, location,
          startDate, endDate, budgetDisplay,
          subscribeUrl,
        },
      },
    });

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
