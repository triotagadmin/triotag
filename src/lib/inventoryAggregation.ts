// Aggregation helpers for advertiser-facing inventory.
// CRITICAL: never expose venue names, publisher names, or specific addresses.
// Only aggregated counts grouped by city / area / venue_type are safe for advertisers.

import { supabase } from "@/integrations/supabase/client";

export type Channel = "OOH" | "DOOH" | "AOOH";

// Known city coordinate lookup. Used to place map bubbles for cities found in ad_spaces.location.
// Add cities here as the platform expands. Country and a flag are best-effort.
export const CITY_COORDS: Record<string, { lat: number; lng: number; country: string; flag: string; region?: string; timezone?: string; currency?: string }> = {
  // Metro Manila
  "Manila": { lat: 14.5995, lng: 120.9842, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Quezon City": { lat: 14.6760, lng: 121.0437, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Makati": { lat: 14.5547, lng: 121.0244, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Taguig": { lat: 14.5176, lng: 121.0509, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Pasig": { lat: 14.5764, lng: 121.0851, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Pasay": { lat: 14.5378, lng: 121.0014, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Mandaluyong": { lat: 14.5832, lng: 121.0409, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Caloocan": { lat: 14.6488, lng: 120.9678, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Parañaque": { lat: 14.4793, lng: 121.0198, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Las Piñas": { lat: 14.4500, lng: 120.9833, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Muntinlupa": { lat: 14.4081, lng: 121.0415, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Marikina": { lat: 14.6507, lng: 121.1029, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "San Juan": { lat: 14.6019, lng: 121.0355, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Valenzuela": { lat: 14.7000, lng: 120.9830, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Malabon": { lat: 14.6651, lng: 120.9568, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  "Navotas": { lat: 14.6667, lng: 120.9417, country: "Philippines", flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP" },
  // Major PH cities outside NCR
  "Cebu": { lat: 10.3157, lng: 123.8854, country: "Philippines", flag: "🇵🇭", region: "Central Visayas", timezone: "GMT+8", currency: "PHP" },
  "Davao": { lat: 7.1907, lng: 125.4553, country: "Philippines", flag: "🇵🇭", region: "Davao Region", timezone: "GMT+8", currency: "PHP" },
  "Iloilo": { lat: 10.7202, lng: 122.5621, country: "Philippines", flag: "🇵🇭", region: "Western Visayas", timezone: "GMT+8", currency: "PHP" },
  "Baguio": { lat: 16.4023, lng: 120.5960, country: "Philippines", flag: "🇵🇭", region: "Cordillera", timezone: "GMT+8", currency: "PHP" },
  "Cagayan de Oro": { lat: 8.4542, lng: 124.6319, country: "Philippines", flag: "🇵🇭", region: "Northern Mindanao", timezone: "GMT+8", currency: "PHP" },
  "Bacolod": { lat: 10.6713, lng: 122.9511, country: "Philippines", flag: "🇵🇭", region: "Western Visayas", timezone: "GMT+8", currency: "PHP" },
  "Zamboanga": { lat: 6.9214, lng: 122.0790, country: "Philippines", flag: "🇵🇭", region: "Zamboanga Peninsula", timezone: "GMT+8", currency: "PHP" },
  "Antipolo": { lat: 14.5878, lng: 121.1762, country: "Philippines", flag: "🇵🇭", region: "Calabarzon", timezone: "GMT+8", currency: "PHP" },
  "General Santos": { lat: 6.1164, lng: 125.1716, country: "Philippines", flag: "🇵🇭", region: "Soccsksargen", timezone: "GMT+8", currency: "PHP" },
  "Tacloban": { lat: 11.2543, lng: 125.0048, country: "Philippines", flag: "🇵🇭", region: "Eastern Visayas", timezone: "GMT+8", currency: "PHP" },
};

export interface CityMarker {
  city: string;
  country: string;
  lat: number;
  lng: number;
  flag: string;
  region: string;
  timezone: string;
  currency: string;
  inventory: number;       // approved ad spaces in this city
  activeVenues: number;    // distinct publishers in this city
  reachDaily: number | null; // null when not derivable
}

export interface MediaTypeCount { channel: Channel; count: number }

export interface ApprovedAdSpaceLite {
  id: string;
  publisher_id: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  media_type: Channel;
}

// Fetch all approved ad_spaces with the minimum set of fields needed for aggregation.
// Never expose: title, description, publisher business name, full address.
export async function fetchApprovedSpaces(): Promise<ApprovedAdSpaceLite[]> {
  const { data, error } = await supabase
    .from("ad_spaces")
    .select("id, publisher_id, location, latitude, longitude, media_type")
    .eq("approval_status", "approved")
    .or("agent_disconnected.is.null,agent_disconnected.eq.false");
  if (error || !data) return [];
  return data as ApprovedAdSpaceLite[];
}

// Detect which known city a free-text location string belongs to.
// Returns the canonical city name (key in CITY_COORDS) or null.
export function detectCity(location: string | null | undefined): string | null {
  if (!location) return null;
  const lower = location.toLowerCase();
  // Prefer longer matches first to avoid "Manila" matching inside "Quezon City...Manila"
  const keys = Object.keys(CITY_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key.toLowerCase())) return key;
  }
  return null;
}

// Build city markers from real DB data. Only cities present in CITY_COORDS will get a bubble.
export function aggregateByCity(spaces: ApprovedAdSpaceLite[]): CityMarker[] {
  const buckets = new Map<string, { inventory: number; publishers: Set<string> }>();
  for (const s of spaces) {
    const city = detectCity(s.location);
    if (!city) continue;
    const b = buckets.get(city) ?? { inventory: 0, publishers: new Set<string>() };
    b.inventory += 1;
    b.publishers.add(s.publisher_id);
    buckets.set(city, b);
  }
  const out: CityMarker[] = [];
  for (const [city, b] of buckets) {
    const meta = CITY_COORDS[city];
    if (!meta) continue;
    out.push({
      city,
      country: meta.country,
      lat: meta.lat,
      lng: meta.lng,
      flag: meta.flag,
      region: meta.region ?? "",
      timezone: meta.timezone ?? "",
      currency: meta.currency ?? "",
      inventory: b.inventory,
      activeVenues: b.publishers.size,
      reachDaily: null, // no foot_traffic_daily field on schema yet
    });
  }
  return out.sort((a, b) => b.inventory - a.inventory);
}

export function aggregateMediaTypes(spaces: ApprovedAdSpaceLite[]): MediaTypeCount[] {
  const counts: Record<Channel, number> = { OOH: 0, DOOH: 0, AOOH: 0 };
  for (const s of spaces) counts[s.media_type] = (counts[s.media_type] ?? 0) + 1;
  return (["OOH", "DOOH", "AOOH"] as Channel[]).map((c) => ({ channel: c, count: counts[c] }));
}

export function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}
export function areaSlug(area: string) {
  return area.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function findCityBySlug(slug: string): string | null {
  const target = slug.toLowerCase();
  const match = Object.keys(CITY_COORDS).find((k) => citySlug(k) === target);
  return match ?? null;
}

// Public landing-page totals (safe aggregates only).
export async function fetchLandingTotals(): Promise<{ approvedSpaces: number; activeVenues: number; activeCampaigns: number }> {
  const [{ count: approvedSpaces }, spacesRes, campaignsRes] = await Promise.all([
    supabase.from("ad_spaces").select("id", { count: "exact", head: true }).eq("approval_status", "approved"),
    supabase.from("ad_spaces").select("publisher_id").eq("approval_status", "approved"),
    supabase.from("activations").select("id", { count: "exact", head: true }).in("status", ["approved", "printing", "completed"] as any),
  ]);
  const publishers = new Set<string>();
  for (const r of (spacesRes.data ?? []) as any[]) if (r.publisher_id) publishers.add(r.publisher_id);
  return {
    approvedSpaces: approvedSpaces ?? 0,
    activeVenues: publishers.size,
    activeCampaigns: campaignsRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Compatibility shims for pages still using legacy imports.
// These intentionally return EMPTY/STATIC labels with NO hardcoded counts.
// ---------------------------------------------------------------------------

export interface AreaSummary {
  name: string;
  description: string;
  traffic: "High" | "Medium" | "Low";
  reachDaily: number | null;
  activeVenues: number;
  inventory: number;
  photo: string;
}

// Display labels only — no pct/spaces hardcoded.
// Display labels only — `pct` is 0 (no fake percentages). Real counts come from queries.
export const MEDIA_TYPE_BREAKDOWN: Array<{
  channel: Channel; label: string; desc: string; color: string; pct: number;
}> = [
  { channel: "OOH",  label: "OOH (Print)",    desc: "Posters, Billboards, Table Tents, Stickers, etc.", color: "bg-green-600", pct: 0 },
  { channel: "DOOH", label: "DOOH (Screens)", desc: "Digital Screens, TV, LED Displays",                color: "bg-blue-500",  pct: 0 },
  { channel: "AOOH", label: "AOOH (Audio)",   desc: "In-store Audio Ads, Announcements",                color: "bg-red-500",   pct: 0 },
];

// Built from real DB data; populated by callers.
export const VENUE_TYPE_BREAKDOWN: Array<{ name: string; emoji: string; pct: number; spaces: number }> = [];

export const SEED_CITIES: CityMarker[] = [];

export async function fetchLiveCityCounts(): Promise<Record<string, number>> {
  const spaces = await fetchApprovedSpaces();
  const out: Record<string, number> = {};
  for (const s of spaces) {
    const c = detectCity(s.location);
    if (c) out[c] = (out[c] ?? 0) + 1;
  }
  return out;
}

export function getCity(slug: string): CityMarker | undefined {
  const name = findCityBySlug(slug);
  if (!name) return undefined;
  const meta = CITY_COORDS[name];
  return {
    city: name,
    country: meta.country,
    lat: meta.lat,
    lng: meta.lng,
    flag: meta.flag,
    region: meta.region ?? "",
    timezone: meta.timezone ?? "",
    currency: meta.currency ?? "",
    inventory: 0,
    activeVenues: 0,
    reachDaily: null,
  };
}

export function getAreasForCity(_city: string): AreaSummary[] { return []; }
export function getArea(_citySlug: string, _areaSlug: string): { city: CityMarker; area: AreaSummary } | undefined { return undefined; }
