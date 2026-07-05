import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import type { BidRequest } from "../_shared/openrtb-types.ts";
import { validateBidRequest, effectiveTimeBudgetMs } from "../_shared/openrtb-validate.ts";
import {
  selectWinningCandidate,
  buildBidResponse,
  type CampaignCandidate,
  type BidDecision,
} from "../_shared/dooh-bid-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEAT_ID = "triotag-dsp";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(null, { status: 400, headers: corsHeaders });
  }

  const validation = validateBidRequest(body);
  if (!validation.valid) {
    console.warn("Bid request failed validation:", validation.errors, JSON.stringify(body).slice(0, 500));
    return new Response(null, { status: 400, headers: corsHeaders });
  }

  const bidRequest = body as BidRequest;
  const timeBudgetMs = effectiveTimeBudgetMs(bidRequest.tmax);
  const deadline = startTime + timeBudgetMs;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const decisions: BidDecision[] = [];

    for (const imp of bidRequest.imp) {
      if (Date.now() > deadline - 15) {
        decisions.push({ bid: null, reasonDetail: "Aborted: time budget exhausted before processing all imps" });
        continue;
      }
      const candidates = await resolveCampaignCandidates(supabase, bidRequest);
      decisions.push(selectWinningCandidate(imp, candidates));
    }

    const response = buildBidResponse(bidRequest, decisions, SEAT_ID);

    if (!response) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("rtb-bid-handler error:", err);
    return new Response(null, { status: 204, headers: corsHeaders });
  }
});

/**
 * Matches an incoming bid request to real campaigns using the actual
 * schema: ad_spaces (matched by external_ref_id, the exchange's own
 * screen ID) -> campaign_ad_space_targets -> brand_campaigns.
 *
 * KNOWN LIMITATIONS, intentionally left as-is for this first version:
 * - bidPriceCpm derives from ad_spaces.pricing (a static listed rate),
 *   not from any live budget-pacing calculation. There is currently no
 *   allocation engine tracking how much of a campaign's budget has
 *   already been spent, so this will happily keep bidding at the same
 *   price even if the campaign's budget is technically exhausted.
 * - creativeUrl and advertiserDomain are left blank pending a real
 *   linkage between a campaign and a specific creative asset per ad
 *   space — brand_creative_sets exists but isn't joined here yet.
 * - brand_campaigns.status filtering assumes 'approved' is a value
 *   that gets set somewhere — confirm there's actually an admin action
 *   that sets brand_campaigns.status to 'approved' before relying on
 *   this filter, since no such admin approval UI was found in the
 *   repo as of this build.
 */
async function resolveCampaignCandidates(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  bidRequest: BidRequest,
): Promise<CampaignCandidate[]> {
  const doohId = bidRequest.dooh?.id;
  if (!doohId) return [];

  const { data: adSpace, error: spaceErr } = await supabase
    .from("ad_spaces")
    .select("id, pricing, specifications")
    .eq("external_ref_id", doohId)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (spaceErr || !adSpace) return [];

  const { data: targets, error: targetErr } = await supabase
    .from("campaign_ad_space_targets")
    .select(
      `campaign_id,
       brand_campaigns!inner(id, status, budget)`,
    )
    .eq("ad_space_id", adSpace.id)
    .eq("brand_campaigns.status", "approved");

  if (targetErr || !targets) return [];

  const basePricing = adSpace.pricing || {};
  // Adjust this extraction if your pricing jsonb shape differs —
  // check a real ad_spaces row's pricing column to confirm the key name.
  const listedCpm = Number(basePricing.cpm ?? basePricing.base_cpm ?? 0);

  // deno-lint-ignore no-explicit-any
  return targets.map((t: any): CampaignCandidate => ({
    campaignId: t.campaign_id,
    allocationId: `${t.campaign_id}-${adSpace.id}`,
    creativeId: t.campaign_id, // TODO: replace with real brand_creative_sets.id once linkage exists
    creativeUrl: "", // TODO: join brand_creative_sets.file_url once that linkage exists
    advertiserDomain: [], // TODO: populate from brand_advertiser_profiles once a domain field exists
    bidPriceCpm: listedCpm,
    remainingBudget: Number(t.brand_campaigns?.budget ?? 0), // NOTE: total budget, not net of spend — no spend tracking exists yet
    minSpotSeconds: adSpace.specifications?.min_spot_seconds,
    maxSpotSeconds: adSpace.specifications?.max_spot_seconds,
  }));
}
