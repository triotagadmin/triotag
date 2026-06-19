export type CampaignType = "OOH" | "DOOH" | "AOOH";

export interface UnitCounts {
  ooh: number;
  dooh: number;
  aooh: number;
}

export interface MediaPlanEstimate {
  unitCounts: UnitCounts;
  radiusMeters: number;
  radiusKm: number;
  radiusPercent: number; // 0-100, radius as % of max (5000m)
  unitCost: number;
  radiusFee: number;
  totalEstimate: number;
  tier: "Starter" | "Growth" | "Domination";
}

// Per-unit base rates
const UNIT_RATES: Record<CampaignType, number> = {
  OOH: 1500,
  DOOH: 4500,
  AOOH: 1200,
};

// Max radius the slider supports — used to calculate % for pricing
export const MAX_RADIUS_METERS = 5000;
// Full radius (100%) adds this much to the total
export const MAX_RADIUS_FEE = 65000;

export function calculateMediaPlanEstimate(
  unitCounts: UnitCounts,
  radiusMeters: number,
): MediaPlanEstimate {
  const radiusKm = radiusMeters / 1000;
  const radiusPercent = Math.min(100, Math.round((radiusMeters / MAX_RADIUS_METERS) * 100));

  const unitCost =
    unitCounts.ooh * UNIT_RATES.OOH +
    unitCounts.dooh * UNIT_RATES.DOOH +
    unitCounts.aooh * UNIT_RATES.AOOH;

  const radiusFee = Math.round((radiusPercent / 100) * MAX_RADIUS_FEE);

  const totalEstimate = unitCost + radiusFee;
  const totalUnits = unitCounts.ooh + unitCounts.dooh + unitCounts.aooh;

  let tier: MediaPlanEstimate["tier"] = "Starter";
  if (totalUnits > 10) tier = "Growth";
  if (totalUnits > 30) tier = "Domination";

  return {
    unitCounts,
    radiusMeters,
    radiusKm,
    radiusPercent,
    unitCost,
    radiusFee,
    totalEstimate,
    tier,
  };
}
