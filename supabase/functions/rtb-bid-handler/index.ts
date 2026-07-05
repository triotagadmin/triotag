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
const PROJECT_REF = "jungfmgsxbayxzptvpky";
const WIN_NOTICE_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/rtb-win-notice`;
const BILLING_NOTICE_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/rtb-billing-notice`;

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
    // Resolve once per request — DOOH bid requests target a single screen,
    // so all imps share the same ad_space context.
    const resolved = await resolveCampaignCandidates(supabase, bidRequest);

    for (const imp of bidRequest.imp) {
      if (Date.now() > deadline - 15) {
        decisions.push({ bid: null, reasonDetail: "Aborted: time budget exhausted before processing all imps" });
        continue;
      }
      const decision = selectWinningCandidate(imp, resolved.candidates);

      // Attach nurl/burl to the winning bid so the exchange can call our
      // win/billing notice endpoints with ${AUCTION_PRICE} substituted.
      if (decision.bid && resolved.adSpaceId) {
        const campaignId = decision.bid.cid ?? "";
        const params = `campaign_id=${encodeURIComponent(campaignId)}&ad_space_id=${encodeURIComponent(resolved.adSpaceId)}&bid_id=${encodeURIComponent(decision.bid.id)}&price=\${AUCTION_PRICE}`;
        decision.bid.nurl = `${WIN_NOTICE_URL}?${params}`;
        decision.bid.burl = `${BILLING_NOTICE_URL}?${params}`;
      }

      decisions.push(decision);
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

interface ResolvedInventory {
  adSpaceId: string | null;
  candidates: CampaignCandidate[];
}

/**
 * Matches an incoming bid request to real campaigns using the actual
 * schema: ad_spaces (matched by external_ref_id, the exchange's own
 * screen ID) -> campaign_ad_space_targets -> brand_campaigns.
 *
 * remainingBudget is now the campaign's total budget minus the sum of
 * 'billed' events in campaign_spend_ledger for that campaign — this is
 * the real net-of-spend figure and drives budget pacing.
 *
 * KNOWN LIMITATIONS, intentionally left as-is:
 * - bidPriceCpm derives from ad_spaces.pricing (static listed rate).
 * - creativeUrl and advertiserDomain are left blank pending real
 *   brand_creative_sets and advertiser-domain linkage.
 * - brand_campaigns.status filtering assumes 'approved' is set by the
 *   AdminBrandCampaigns approval flow.
 */
async function resolveCampaignCandidates(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  bidRequest: BidRequest,
): Promise<ResolvedInventory> {
  const doohId = bidRequest.dooh?.id;
  if (!doohId) return { adSpaceId: null, candidates: [] };

  const { data: adSpace, error: spaceErr } = await supabase
    .from("ad_spaces")
    .select("id, pricing, specifications")
    .eq("external_ref_id", doohId)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (spaceErr || !adSpace) return { adSpaceId: null, candidates: [] };

  const { data: targets, error: targetErr } = await supabase
    .from("campaign_ad_space_targets")
    .select(
      `campaign_id,
       brand_campaigns!inner(id, status, budget)`,
    )
    .eq("ad_space_id", adSpace.id)
    .eq("brand_campaigns.status", "approved");

  if (targetErr || !targets) return { adSpaceId: adSpace.id, candidates: [] };

  const basePricing = adSpace.pricing || {};
  const listedCpm = Number(basePricing.cpm ?? basePricing.base_cpm ?? 0);

  // deno-lint-ignore no-explicit-any
  const campaignIds = targets.map((t: any) => t.campaign_id);
  const spendByCampaign = new Map<string, number>();

  if (campaignIds.length > 0) {
    const { data: spendRows } = await supabase
      .from("campaign_spend_ledger")
      .select("campaign_id, amount")
      .eq("event_type", "billed")
      .in("campaign_id", campaignIds);

    if (spendRows) {
      // deno-lint-ignore no-explicit-any
      for (const row of spendRows as any[]) {
        spendByCampaign.set(
          row.campaign_id,
          (spendByCampaign.get(row.campaign_id) ?? 0) + Number(row.amount ?? 0),
        );
      }
    }
  }

  // deno-lint-ignore no-explicit-any
  const candidates: CampaignCandidate[] = targets.map((t: any): CampaignCandidate => {
    const budget = Number(t.brand_campaigns?.budget ?? 0);
    const spent = spendByCampaign.get(t.campaign_id) ?? 0;
    return {
      campaignId: t.campaign_id,
      allocationId: `${t.campaign_id}-${adSpace.id}`,
      creativeId: t.campaign_id, // TODO: replace with real brand_creative_sets.id once linkage exists
      creativeUrl: "", // TODO: join brand_creative_sets.file_url once that linkage exists
      advertiserDomain: [], // TODO: populate from brand_advertiser_profiles once a domain field exists
      bidPriceCpm: listedCpm,
      remainingBudget: Math.max(budget - spent, 0),
      minSpotSeconds: adSpace.specifications?.min_spot_seconds,
      maxSpotSeconds: adSpace.specifications?.max_spot_seconds,
    };
  });

  return { adSpaceId: adSpace.id, candidates };
}
