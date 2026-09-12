// Shared helpers for marketplace inventory rows (brand advertiser views).
export type MarketplaceRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  media_type?: string | null;
  media_types?: string[] | null;
  media_urls?: any;
  specifications?: any;
  pricing?: any;
  total_ad_units?: number | null;
  availability_status?: string | null;
  activation_fee?: number | null;
  monthly_rate?: number | null;
  contact_verified_at?: string | null;
  media_owner_name?: string | null;
  [key: string]: any;
};

export function firstImage(mediaUrls: any): string | null {
  if (!mediaUrls) return null;
  const arr = Array.isArray(mediaUrls) ? mediaUrls : mediaUrls?.images || mediaUrls?.urls || [];
  if (!Array.isArray(arr)) return null;
  for (const x of arr) {
    const url = typeof x === "string" ? x : x?.url;
    if (url) return url;
  }
  return null;
}

export function monthlyRate(row: MarketplaceRow): number {
  const direct = Number(row.monthly_rate ?? 0);
  if (direct > 0) return direct;
  const p = row.pricing;
  if (p && typeof p === "object") {
    for (const key of ["monthly", "monthly_rate", "per_month", "price_monthly"]) {
      const v = Number((p as any)[key] ?? 0);
      if (v > 0) return v;
    }
  }
  return 0;
}

export function venueTypeOf(row: MarketplaceRow): string {
  const s = row?.specifications && typeof row.specifications === "object" ? row.specifications : {};
  const v =
    s.venue_type || s.place_type || s.category || s.business_type ||
    (row as any)?.venue_type || (row as any)?.category || "";
  return String(v || "").trim();
}
