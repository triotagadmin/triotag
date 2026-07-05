import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * OpenRTB nurl (win notice) handler. The exchange calls this URL when we
 * win an auction, substituting ${AUCTION_PRICE} with the real clearing
 * price. This is NOT the billable event — burl fires on actual play. We
 * still record it as a 'win' for observability.
 *
 * Returns 200 with an empty body. If Broadsign expects a 1x1 pixel,
 * swap the body accordingly once their docs are confirmed.
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

    // Exchange substitutes ${AUCTION_PRICE} with a real number. If it
    // arrives unsubstituted (the literal macro), skip logging rather
    // than inserting garbage.
    const amount = Number(priceRaw);
    if (!Number.isFinite(amount)) {
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
      event_type: "win",
    });

    return new Response(null, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("rtb-win-notice error:", err);
    return new Response(null, { status: 200, headers: corsHeaders });
  }
});
