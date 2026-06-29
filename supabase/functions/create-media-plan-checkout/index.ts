import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      mediaPlanRequestId,
      campaignName,
      campaignType,
      estimatedPrice,
      requesterEmail,
      requesterName,
      successUrl,
      cancelUrl,
    } = await req.json();

    const PAYMONGO_SECRET = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!PAYMONGO_SECRET) throw new Error("PayMongo secret key not configured.");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const capRes = await fetch("https://api.paymongo.com/v1/merchants/capabilities/payment_methods", {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(PAYMONGO_SECRET + ":")}`,
      },
    });
    let paymentMethodTypes = ["gcash", "paymaya", "card"];
    if (capRes.ok) {
      const capData = await capRes.json();
      if (Array.isArray(capData?.data)) {
        const types = capData.data
          .map((m: any) => m?.attributes?.payment_method_type)
          .filter(Boolean);
        if (types.length > 0) paymentMethodTypes = types;
      }
    }

    const checkoutRes = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(PAYMONGO_SECRET + ":")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: {
              email: requesterEmail,
              name: requesterName || "TrioTag Advertiser",
            },
            line_items: [
              {
                currency: "PHP",
                amount: Math.round(estimatedPrice * 100),
                name: `Media Plan: ${campaignName}`,
                description: `${campaignType} campaign — TrioTag Retail Advertising`,
                quantity: 1,
              },
            ],
            payment_method_types: paymentMethodTypes,
            success_url: successUrl,
            cancel_url: cancelUrl,
            statement_descriptor: "TRIOTAG MEDIA PLAN",
            metadata: {
              media_plan_request_id: mediaPlanRequestId,
              campaign_name: campaignName,
            },
          },
        },
      }),
    });

    if (!checkoutRes.ok) {
      const err = await checkoutRes.text();
      console.error("[create-media-plan-checkout] PayMongo error:", err);
      throw new Error(`PayMongo checkout creation failed: ${err}`);
    }

    const checkoutData = await checkoutRes.json();
    const checkoutId = checkoutData?.data?.id;
    const checkoutUrl = checkoutData?.data?.attributes?.checkout_url;

    if (!checkoutUrl) throw new Error("No checkout URL returned from PayMongo.");

    await supabaseAdmin
      .from("media_plan_requests")
      .update({
        paymongo_checkout_id: checkoutId,
        requester_email: requesterEmail,
        status: "pending_payment",
      })
      .eq("id", mediaPlanRequestId);

    console.log("[create-media-plan-checkout] Checkout created:", checkoutId);

    return new Response(JSON.stringify({ checkoutUrl, checkoutId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("[create-media-plan-checkout] Fatal error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
