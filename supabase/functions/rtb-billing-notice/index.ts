import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * OpenRTB burl (billing notice) handler. Per spec, burl fires on the
 * actual billable event — the ad played and is being charged. This is
 * the record that counts as real spend and drives budget pacing in
 * rtb-bid-handler.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const campaign_id = url.searchParams.get("campaign_id");
    const ad_space_id = url.searchParams.get("ad_space_id");
    const priceRaw = url.searchParams.get("price");
    const bid_id = url.searchParams.get("bid_id") ?? "";

    if (!campaign_id || !ad_space_id || !priceRaw) {
      return new Response(null, { status: 400, headers: corsHeaders });
    }

    const amount = Number(priceRaw);
    if (!Number.isFinite(amount)) {
      // Unsubstituted macro or malformed — don't log garbage into spend.
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    await supabase.from("campaign_spend_ledger").insert({
      campaign_id,
      ad_space_id,
      bid_id,
      amount,
      event_type: "billed",
    });

    return new Response(null, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("rtb-billing-notice error:", err);
    return new Response(null, { status: 200, headers: corsHeaders });
  }
});
