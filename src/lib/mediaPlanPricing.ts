export type CampaignType = "OOH" | "DOOH" | "AOOH";

export interface FormatVariant {
  id: string;
  label: string;
  category: CampaignType;
  price: number; // per unit, per campaign run
  specs: Record<string, string>;
  airTime?: string; // DOOH/AOOH only
  billingType: "monthly" | "per_campaign";
  exampleImage: string;
  exampleCaption: string;
}

export const OOH_VARIANTS: FormatVariant[] = [
  {
    id: "ooh_table_tent",
    label: "Table Tent",
    category: "OOH",
    price: 350,
    specs: { Size: "A5 (148 × 210mm)", Material: "300gsm matte cardstock", Print: "Full color, double-sided" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    exampleCaption: "Table tent card placed at cafe/restaurant table — high dwell-time placement at point of dining.",
  },
  {
    id: "ooh_sticker",
    label: "Sticker",
    category: "OOH",
    price: 250,
    specs: { Size: "4R (4 × 6in)", Material: "Vinyl, waterproof", Print: "Full color, gloss/matte" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    exampleCaption: "Small format vinyl sticker on retail counter or window — waterproof, eye-level placement.",
  },
  {
    id: "ooh_sticker_large",
    label: "Sticker — Large Format",
    category: "OOH",
    price: 450,
    specs: { Size: "A4 (210 × 297mm)", Material: "Vinyl, waterproof", Print: "Full color, gloss/matte" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    exampleCaption: "Large format A4 sticker on wall or shopfront — maximum visibility, waterproof vinyl.",
  },
  {
    id: "ooh_poster",
    label: "Poster",
    category: "OOH",
    price: 600,
    specs: { Size: "A3 (297 × 420mm)", Material: "150gsm art paper", Print: "Full color" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    exampleCaption: "A3 poster in high-traffic venue — full color print in waiting areas, corridors, and retail walls.",
  },
  {
    id: "ooh_tarpaulin_small",
    label: "Tarpaulin — Small",
    category: "OOH",
    price: 900,
    specs: { Size: "2ft × 3ft", Material: "13oz tarpaulin, UV resistant", Print: "Full color, outdoor grade" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1586892477838-2b96e85e0f96?w=800&q=80",
    exampleCaption: "Small tarpaulin (2×3ft) — outdoor-grade UV resistant print for storefronts and facades.",
  },
  {
    id: "ooh_tarpaulin_medium",
    label: "Tarpaulin — Medium",
    category: "OOH",
    price: 1800,
    specs: { Size: "4ft × 6ft", Material: "13oz tarpaulin, UV resistant", Print: "Full color, outdoor grade" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1586892477838-2b96e85e0f96?w=800&q=80",
    exampleCaption: "Medium tarpaulin (4×6ft) — high-visibility print for exterior walls, gates, and event areas.",
  },
  {
    id: "ooh_tarpaulin_large",
    label: "Tarpaulin — Large",
    category: "OOH",
    price: 3200,
    specs: { Size: "8ft × 10ft", Material: "13oz tarpaulin, UV resistant", Print: "Full color, outdoor grade, grommets included" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1586892477838-2b96e85e0f96?w=800&q=80",
    exampleCaption: "Large tarpaulin (8×10ft) — maximum outdoor impact for high-footfall roads and event spaces.",
  },
  {
    id: "ooh_flyer",
    label: "Flyer",
    category: "OOH",
    price: 1500,
    specs: { Size: "DL (99 × 210mm)", Material: "150gsm gloss", Print: "Full color, single-sided" },
    billingType: "per_campaign",
    exampleImage: "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80",
    exampleCaption: "DL flyer — distributed at checkout counters and venue entrances at point of purchase.",
  },
];

export const DOOH_VARIANTS: FormatVariant[] = [
  {
    id: "dooh_static_15",
    label: "Static Display — 15 sec loop",
    category: "DOOH",
    price: 2500,
    specs: { Resolution: "1920×1080 (16:9)", Format: "JPG / PNG", "Loop Duration": "15 seconds" },
    airTime: "12 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1567967455389-e432b4a7e67c?w=800&q=80",
    exampleCaption: "Static display on digital screen — 15-second loop shown inside gyms, salons, and retail venues.",
  },
  {
    id: "dooh_static_30",
    label: "Static Display — 30 sec loop",
    category: "DOOH",
    price: 3500,
    specs: { Resolution: "1920×1080 (16:9)", Format: "JPG / PNG", "Loop Duration": "30 seconds" },
    airTime: "24 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1567967455389-e432b4a7e67c?w=800&q=80",
    exampleCaption: "Static display — 30-second extended loop with more brand messaging real estate per cycle.",
  },
  {
    id: "dooh_video_15",
    label: "Video Ad — 15 seconds",
    category: "DOOH",
    price: 4500,
    specs: { Resolution: "1920×1080 (16:9)", Format: "MP4, H.264", "Video Duration": "15 seconds" },
    airTime: "12 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    exampleCaption: "15-second video ad on venue digital screen — full motion creative in high-dwell environments.",
  },
  {
    id: "dooh_video_30",
    label: "Video Ad — 30 seconds",
    category: "DOOH",
    price: 6500,
    specs: { Resolution: "1920×1080 (16:9)", Format: "MP4, H.264", "Video Duration": "30 seconds" },
    airTime: "24 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    exampleCaption: "30-second video ad — longer brand story with more time to drive message recall.",
  },
  {
    id: "dooh_video_60",
    label: "Video Ad — 60 seconds",
    category: "DOOH",
    price: 9500,
    specs: { Resolution: "1920×1080 (16:9)", Format: "MP4, H.264", "Video Duration": "60 seconds" },
    airTime: "48 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80",
    exampleCaption: "60-second video ad — premium long-form placement for brand awareness and product demos.",
  },
  {
    id: "dooh_vertical_video_15",
    label: "Vertical Video — 15 seconds",
    category: "DOOH",
    price: 4800,
    specs: { Resolution: "1080×1920 (9:16)", Format: "MP4, H.264", "Video Duration": "15 seconds" },
    airTime: "12 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1567967455389-e432b4a7e67c?w=800&q=80",
    exampleCaption: "Vertical 9:16 video — optimised for portrait digital screens in salons, clinics, and waiting areas.",
  },
];

export const AOOH_VARIANTS: FormatVariant[] = [
  {
    id: "aooh_spot_15",
    label: "Audio Spot — 15 seconds",
    category: "AOOH",
    price: 1200,
    specs: { Format: "MP3 / WAV", "Audio Duration": "15 seconds", "Voice-Over": "Required" },
    airTime: "12 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
    exampleCaption: "15-second in-store audio spot — played through venue speakers at point of purchase decision.",
  },
  {
    id: "aooh_spot_30",
    label: "Audio Spot — 30 seconds",
    category: "AOOH",
    price: 2000,
    specs: { Format: "MP3 / WAV", "Audio Duration": "30 seconds", "Voice-Over": "Required" },
    airTime: "24 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80",
    exampleCaption: "30-second audio spot — extended message with voice-over, played in retail store playlists.",
  },
  {
    id: "aooh_jingle_15",
    label: "Jingle + VO — 15 seconds",
    category: "AOOH",
    price: 1600,
    specs: { Format: "MP3 / WAV", "Audio Duration": "15 seconds", "Voice-Over": "Optional, jingle included" },
    airTime: "12 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
    exampleCaption: "15-second branded jingle with voice-over — memorable audio identity at the point of sale.",
  },
  {
    id: "aooh_jingle_30",
    label: "Jingle + VO — 30 seconds",
    category: "AOOH",
    price: 2600,
    specs: { Format: "MP3 / WAV", "Audio Duration": "30 seconds", "Voice-Over": "Optional, jingle included" },
    airTime: "24 minutes total air time / unit",
    billingType: "monthly",
    exampleImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
    exampleCaption: "30-second jingle + voice-over — full brand audio experience inside supermarkets and pharmacies.",
  },
];

export const ALL_VARIANTS: FormatVariant[] = [...OOH_VARIANTS, ...DOOH_VARIANTS, ...AOOH_VARIANTS];

export interface SelectedVariant {
  variantId: string;
  quantity: number;
}

export interface MediaPlanEstimate {
  selections: SelectedVariant[];
  radiusMeters: number;
  radiusKm: number;
  radiusPercent: number;
  unitCost: number;
  radiusFee: number;
  totalEstimate: number;
  tier: "Starter" | "Growth" | "Domination";
  totalUnits: number;
}

export const MAX_RADIUS_METERS = 5000;
export const BASE_RADIUS_FEE = 65000;
export const MAX_RADIUS_FEE = 3500000;

export function calculateMediaPlanEstimate(
  selections: SelectedVariant[],
  radiusMeters: number,
): MediaPlanEstimate {
  const radiusKm = radiusMeters / 1000;
  const radiusPercent = Math.min(100, Math.round((radiusMeters / MAX_RADIUS_METERS) * 100));
  const radiusFee = Math.round(BASE_RADIUS_FEE + (radiusPercent / 100) * (MAX_RADIUS_FEE - BASE_RADIUS_FEE));


  let unitCost = 0;
  let totalUnits = 0;

  for (const sel of selections) {
    if (sel.quantity <= 0) continue;
    const variant = ALL_VARIANTS.find((v) => v.id === sel.variantId);
    if (!variant) continue;
    unitCost += variant.price * sel.quantity;
    totalUnits += sel.quantity;
  }

  const totalEstimate = unitCost + radiusFee;

  let tier: MediaPlanEstimate["tier"] = "Starter";
  if (totalUnits > 10) tier = "Growth";
  if (totalUnits > 30) tier = "Domination";

  return { selections, radiusMeters, radiusKm, radiusPercent, unitCost, radiusFee, totalEstimate, tier, totalUnits };
}
