// Aggregation helpers for advertiser-facing inventory.
// CRITICAL: never expose venue names, publisher names, or specific addresses.
// Only aggregated counts grouped by city / area / venue_type are safe for advertisers.

import { supabase } from "@/integrations/supabase/client";

export type Channel = "OOH" | "DOOH" | "AOOH";

export interface CityMarker {
  city: string;
  country: string;
  lat: number;
  lng: number;
  flag: string;
  region: string;
  timezone: string;
  currency: string;
  inventory: number; // total ad spaces in this city
  reachDaily: number; // synthetic estimate
  activeVenues: number;
}

// Demo cities the advertiser can browse. Counts get overlaid with real DB data when available.
export const SEED_CITIES: CityMarker[] = [
  { city: "Manila", country: "Philippines", lat: 14.5995, lng: 120.9842, flag: "🇵🇭", region: "Metro Manila", timezone: "GMT+8", currency: "PHP", inventory: 452, reachDaily: 1_240_000, activeVenues: 386 },
  { city: "Jakarta", country: "Indonesia", lat: -6.2088, lng: 106.8456, flag: "🇮🇩", region: "DKI Jakarta", timezone: "GMT+7", currency: "IDR", inventory: 280, reachDaily: 980_000, activeVenues: 214 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, flag: "🇸🇬", region: "Central", timezone: "GMT+8", currency: "SGD", inventory: 178, reachDaily: 640_000, activeVenues: 142 },
  { city: "New York", country: "USA", lat: 40.7128, lng: -74.006, flag: "🇺🇸", region: "Northeast", timezone: "GMT-5", currency: "USD", inventory: 620, reachDaily: 2_140_000, activeVenues: 502 },
  { city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708, flag: "🇦🇪", region: "Middle East", timezone: "GMT+4", currency: "AED", inventory: 306, reachDaily: 870_000, activeVenues: 248 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, flag: "🇦🇺", region: "NSW", timezone: "GMT+11", currency: "AUD", inventory: 210, reachDaily: 720_000, activeVenues: 180 },
  { city: "London", country: "UK", lat: 51.5074, lng: -0.1278, flag: "🇬🇧", region: "Europe", timezone: "GMT+0", currency: "GBP", inventory: 86, reachDaily: 410_000, activeVenues: 70 },
  { city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333, flag: "🇧🇷", region: "South America", timezone: "GMT-3", currency: "BRL", inventory: 64, reachDaily: 320_000, activeVenues: 52 },
  { city: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, flag: "🇰🇪", region: "East Africa", timezone: "GMT+3", currency: "KES", inventory: 32, reachDaily: 180_000, activeVenues: 26 },
];

export interface AreaSummary {
  name: string;
  description: string;
  traffic: "High" | "Medium" | "Low";
  reachDaily: number;
  activeVenues: number;
  inventory: number;
  photo: string;
}

export const SEED_AREAS: Record<string, AreaSummary[]> = {
  Manila: [
    { name: "Makati CBD", description: "Central Business District", traffic: "High", reachDaily: 450_000, activeVenues: 152, inventory: 392, photo: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80" },
    { name: "Quezon City", description: "Commercial & Residential", traffic: "High", reachDaily: 280_000, activeVenues: 98, inventory: 254, photo: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80" },
    { name: "BGC / Taguig", description: "Business & Lifestyle District", traffic: "High", reachDaily: 220_000, activeVenues: 86, inventory: 228, photo: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80" },
    { name: "Manila Bay Area", description: "Tourist & Leisure Zone", traffic: "Medium", reachDaily: 120_000, activeVenues: 54, inventory: 118, photo: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80" },
    { name: "Pasig", description: "Commercial Hub", traffic: "Medium", reachDaily: 85_000, activeVenues: 41, inventory: 76, photo: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80" },
  ],
};

export function getAreasForCity(city: string): AreaSummary[] {
  return SEED_AREAS[city] || [];
}

export function getCity(slug: string): CityMarker | undefined {
  return SEED_CITIES.find((c) => c.city.toLowerCase().replace(/\s+/g, "-") === slug.toLowerCase());
}

export function getArea(citySlug: string, areaSlug: string): { city: CityMarker; area: AreaSummary } | undefined {
  const city = getCity(citySlug);
  if (!city) return undefined;
  const area = getAreasForCity(city.city).find(
    (a) => a.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === areaSlug.toLowerCase()
  );
  if (!area) return undefined;
  return { city, area };
}

export function citySlug(city: string) {
  return city.toLowerCase().replace(/\s+/g, "-");
}
export function areaSlug(area: string) {
  return area.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

// Fetch live aggregated counts. Returns map of city -> count.
// Uses ONLY counts; never returns titles, addresses, or publisher info.
export async function fetchLiveCityCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("ad_spaces")
    .select("location")
    .eq("approval_status", "approved");
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    const loc = (row.location || "").toString();
    if (!loc) continue;
    // Try to match a known city by substring
    for (const c of SEED_CITIES) {
      if (loc.toLowerCase().includes(c.city.toLowerCase())) {
        counts[c.city] = (counts[c.city] || 0) + 1;
        break;
      }
    }
  }
  return counts;
}

export const VENUE_TYPE_BREAKDOWN = [
  { name: "Cafés / Coffee Shops", emoji: "☕", pct: 38, spaces: 469 },
  { name: "Retail Stores", emoji: "🛍️", pct: 24, spaces: 298 },
  { name: "Gyms & Fitness", emoji: "💪", pct: 16, spaces: 199 },
  { name: "Hotels", emoji: "🏨", pct: 12, spaces: 149 },
  { name: "Coworking Spaces", emoji: "💼", pct: 10, spaces: 131 },
];

export const MEDIA_TYPE_BREAKDOWN = [
  { channel: "OOH" as Channel, label: "OOH (Print)", desc: "Posters, Billboards, Table Tents, Stickers, etc.", pct: 52, color: "bg-green-600" },
  { channel: "DOOH" as Channel, label: "DOOH (Screens)", desc: "Digital Screens, TV, LED Displays", pct: 29, color: "bg-blue-500" },
  { channel: "AOOH" as Channel, label: "AOOH (Audio)", desc: "In-store Audio Ads, Announcements", pct: 19, color: "bg-red-500" },
];
