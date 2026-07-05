import type { BidRequest, Imp, Bid, BidResponse, NoBidReason } from "./openrtb-types.ts";
import { NoBidReason as NBR } from "./openrtb-types.ts";

/**
 * A campaign eligible to bid on a given impression, already resolved
 * from your DSP's own data model (ad_spaces + campaign_ad_space_targets
 * + brand_campaigns + brand_creative_sets). Resolving these BEFORE calling
 * into this module keeps this file free of Supabase/DB specifics, so it's
 * unit-testable without a live database and reusable if you add a second
 * SSP adapter later.
 */
export interface CampaignCandidate {
  campaignId: string;
  allocationId: string;
  creativeId: string; // maps to Bid.crid
  creativeUrl: string; // maps to Bid.adm
  advertiserDomain: string[]; // maps to Bid.adomain — required by most exchanges for brand safety review
  bidPriceCpm: number; // your actual bid — NEVER scale this by dooh qty.multiplier, exchange handles that
  remainingBudget: number; // remaining allocated spend for this campaign/inventory pairing, in the bid currency
  minSpotSeconds?: number;
  maxSpotSeconds?: number;
  creativeDurationSeconds?: number; // needed to check against min/max spot constraints
}

export interface BidDecision {
  bid: Bid | null;
  noBidReason?: NoBidReason;
  reasonDetail?: string; // for internal logging only — do not put in the response ext
}

/**
 * Selects which eligible campaign wins the impression, and validates it
 * against the actual spot/creative constraints before committing to a bid.
 *
 * v1 selection strategy: highest bidPriceCpm among candidates with
 * sufficient remaining budget wins. This mirrors the equal-weight /
 * highest-CPM allocation rule already used elsewhere in the DSP — keep
 * both consistent so the DSP's own math and the RTB bidding logic don't
 * silently diverge.
 */
export function selectWinningCandidate(
  imp: Imp,
  candidates: CampaignCandidate[],
): BidDecision {
  if (candidates.length === 0) {
    return {
      bid: null,
      noBidReason: NBR.NO_ELIGIBLE_MATCHING_CAMPAIGN,
      reasonDetail: "No campaigns matched this inventory/venue",
    };
  }

  // Filter out candidates that fail hard constraints before ranking by price.
  const eligible = candidates.filter((c) => {
    if (c.remainingBudget < c.bidPriceCpm / 1000) {
      // Can't afford even a single impression at this CPM
      return false;
    }
    if (
      c.minSpotSeconds !== undefined &&
      c.creativeDurationSeconds !== undefined &&
      c.creativeDurationSeconds < c.minSpotSeconds
    ) {
      return false;
    }
    if (
      c.maxSpotSeconds !== undefined &&
      c.creativeDurationSeconds !== undefined &&
      c.creativeDurationSeconds > c.maxSpotSeconds
    ) {
      return false;
    }
    // Respect the impression's own bid floor if the exchange set one.
    if (imp.bidfloor && c.bidPriceCpm < imp.bidfloor) {
      return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    return {
      bid: null,
      noBidReason: NBR.NO_ELIGIBLE_MATCHING_CAMPAIGN,
      reasonDetail: "Candidates existed but all failed budget/spot/floor constraints",
    };
  }

  const winner = eligible.reduce((best, c) => (c.bidPriceCpm > best.bidPriceCpm ? c : best));

  const bid: Bid = {
    id: `${imp.id}-${winner.allocationId}-${Date.now()}`,
    impid: imp.id,
    price: winner.bidPriceCpm,
    adm: winner.creativeUrl,
    adomain: winner.advertiserDomain,
    cid: winner.campaignId,
    crid: winner.creativeId,
  };

  return { bid };
}

/**
 * Builds the full BidResponse. Returns null when there is nothing to bid —
 * the caller (the edge function handler) is responsible for translating a
 * null return into an HTTP 204, which is the spec-correct way to signal
 * no-bid rather than returning a 200 with an empty seatbid array.
 */
export function buildBidResponse(
  request: BidRequest,
  decisions: BidDecision[],
  seat: string,
): BidResponse | null {
  const wonBids = decisions.map((d) => d.bid).filter((b): b is Bid => b !== null);

  if (wonBids.length === 0) {
    return null;
  }

  return {
    id: request.id, // MUST echo the request ID per spec
    cur: "PHP",
    seatbid: [
      {
        seat,
        bid: wonBids,
      },
    ],
  };
}
