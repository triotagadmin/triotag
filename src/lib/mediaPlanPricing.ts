export type CampaignType = "OOH" | "DOOH" | "AOOH";

export interface MediaPlanEstimate {
  venueCount: number;
  radiusKm: number;
  basePrice: number;
  perVenuePrice: number;
  totalEstimate: number;
  tier: "Starter" | "Growth" | "Domination";
}

export function calculateMediaPlanEstimate(
  venueCount: number,
  radiusMeters: number,
  campaignType: CampaignType,
): MediaPlanEstimate {
  const radiusKm = radiusMeters / 1000;
  const baseRates: Record<CampaignType, number> = { OOH: 150, DOOH: 350, AOOH: 100 };
  const perVenuePrice = baseRates[campaignType] ?? 150;
  const basePrice = Math.round(2000 + radiusKm * 1500);
  const billableVenues = Math.min(venueCount, 80);
  const venueFee = billableVenues * perVenuePrice;
  const totalEstimate = basePrice + venueFee;

  let tier: MediaPlanEstimate["tier"] = "Starter";
  if (venueCount > 15) tier = "Growth";
  if (venueCount > 40) tier = "Domination";

  return { venueCount, radiusKm, basePrice, perVenuePrice, totalEstimate, tier };
}
