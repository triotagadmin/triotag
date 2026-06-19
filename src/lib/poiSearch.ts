export interface POI {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address?: string;
}

export const POI_CATEGORY_COLORS: Record<string, string> = {
  "Coffee Shop": "#92400e",
  "Supermarket": "#2563eb",
  "Convenience Store": "#0ea5e9",
  "Nightclub": "#9333ea",
  "Bar": "#db2777",
  "Restaurant": "#ea580c",
  "Fast Food": "#f59e0b",
  "Gym": "#16a34a",
  "Salon": "#0891b2",
  "Pharmacy": "#dc2626",
  "Mall": "#7c3aed",
  "Clothing Store": "#e11d48",
  "Department Store": "#a16207",
  "Retail": "#6b7280",
};

export const POI_CATEGORY_EMOJI: Record<string, string> = {
  "Coffee Shop": "☕",
  "Supermarket": "🛒",
  "Convenience Store": "🏪",
  "Nightclub": "🌙",
  "Bar": "🍸",
  "Restaurant": "🍽️",
  "Fast Food": "🍔",
  "Gym": "💪",
  "Salon": "💇",
  "Pharmacy": "💊",
  "Mall": "🏬",
  "Clothing Store": "👕",
  "Department Store": "🏬",
  "Retail": "🏷️",
};

function mapTagsToCategory(tags: Record<string, string>): string {
  if (tags.amenity === "cafe" || tags.shop === "coffee") return "Coffee Shop";
  if (tags.shop === "supermarket") return "Supermarket";
  if (tags.shop === "convenience") return "Convenience Store";
  if (tags.amenity === "nightclub") return "Nightclub";
  if (tags.amenity === "bar") return "Bar";
  if (tags.amenity === "restaurant") return "Restaurant";
  if (tags.amenity === "fast_food") return "Fast Food";
  if (tags.leisure === "fitness_centre") return "Gym";
  if (tags.shop === "hairdresser") return "Salon";
  if (tags.amenity === "pharmacy") return "Pharmacy";
  if (tags.shop === "mall") return "Mall";
  if (tags.shop === "clothes") return "Clothing Store";
  if (tags.shop === "department_store") return "Department Store";
  return "Retail";
}

export async function searchPOIsInRadius(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<POI[]> {
  const tagFilters = [
    "amenity=cafe", "shop=coffee", "shop=supermarket", "shop=convenience",
    "amenity=nightclub", "amenity=bar", "amenity=restaurant", "amenity=fast_food",
    "leisure=fitness_centre", "shop=hairdresser", "amenity=pharmacy",
    "shop=mall", "shop=clothes", "shop=department_store",
  ];

  const query = `
    [out:json][timeout:25];
    (
      ${tagFilters.map((tag) => {
        const [key, value] = tag.split("=");
        return `node["${key}"="${value}"](around:${radiusMeters},${lat},${lng});`;
      }).join("\n")}
    );
    out body;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const data = await res.json();

  return (data.elements || [])
    .filter((el: any) => el.tags?.name)
    .map((el: any) => ({
      id: String(el.id),
      name: el.tags.name,
      category: mapTagsToCategory(el.tags),
      lat: el.lat,
      lng: el.lon,
      address: el.tags["addr:street"] || "",
    }));
}

export function haversineMeters(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
