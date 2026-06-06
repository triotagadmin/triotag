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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const templateData = {
      campaignName, proposerName, proposerEmail, proposerVenue, proposerMessage,
    };

    // Always notify admin
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "proposal-received",
        recipientEmail: "tinystickyads@gmail.com",
        idempotencyKey: `proposal-admin-${campaignId}-${proposerEmail}-${Date.now()}`,
        templateData,
      },
    });

    // Send to subscribed campaign owners
    const { data: subscribers, error: subErr } = await supabase
      .from("campaign_subscriptions")
      .select("email")
      .eq("campaign_id", campaignId)
      .eq("subscribed", true);

    if (subErr) throw subErr;

    let sent = 0;
    if (subscribers && subscribers.length > 0) {
      await Promise.all(subscribers.map(async (sub) => {
        const { error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "proposal-received",
            recipientEmail: sub.email,
            idempotencyKey: `proposal-${campaignId}-${proposerEmail}-${sub.email}-${Date.now()}`,
            templateData,
          },
        });
        if (error) console.error(`enqueue error for ${sub.email}:`, error);
        else sent++;
      }));
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
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
