export interface ServiceArea {
  code: string; // ISO 3166-1 alpha-2 country code
  name: string;
  active: boolean; // set to false to disable a region without deleting it
  bounds: {
    north: number;
    south: number;
    west: number;
    east: number;
  };
  mapCenter: [number, number];
  mapZoom: number;
}

// Add new countries here when TrioTag expands to new markets.
// Set `active: true` to enable a region for campaign submissions.
export const SERVICE_AREAS: ServiceArea[] = [
  {
    code: "PH",
    name: "Philippines",
    active: true,
    bounds: { north: 21.3, south: 4.5, west: 116.7, east: 127.0 },
    mapCenter: [12.8797, 121.7740],
    mapZoom: 6,
  },
  // Example for future expansion — flip `active: true` when ready:
  // {
  //   code: "SG",
  //   name: "Singapore",
  //   active: false,
  //   bounds: { north: 1.48, south: 1.13, west: 103.6, east: 104.1 },
  //   mapCenter: [1.3521, 103.8198],
  //   mapZoom: 11,
  // },
];

export function getActiveServiceAreas(): ServiceArea[] {
  return SERVICE_AREAS.filter((a) => a.active);
}

export function findServiceArea(lat: number, lng: number): ServiceArea | null {
  return (
    getActiveServiceAreas().find(
      (area) =>
        lat >= area.bounds.south &&
        lat <= area.bounds.north &&
        lng >= area.bounds.west &&
        lng <= area.bounds.east,
    ) || null
  );
}

export function isWithinServiceArea(lat: number, lng: number): boolean {
  return findServiceArea(lat, lng) !== null;
}

// Combined bounding box across all active areas — used to constrain map panning.
export function getCombinedMaxBounds(): [[number, number], [number, number]] {
  const active = getActiveServiceAreas();
  if (active.length === 0) {
    return [[-60, -180], [75, 180]];
  }
  const south = Math.min(...active.map((a) => a.bounds.south));
  const north = Math.max(...active.map((a) => a.bounds.north));
  const west = Math.min(...active.map((a) => a.bounds.west));
  const east = Math.max(...active.map((a) => a.bounds.east));
  return [[south, west], [north, east]];
}

export function getDefaultMapView(): { center: [number, number]; zoom: number } {
  const active = getActiveServiceAreas();
  if (active.length === 0) return { center: [12.8797, 121.7740], zoom: 6 };
  return { center: active[0].mapCenter, zoom: active[0].mapZoom };
}

export function getActiveAreaNamesText(): string {
  const names = getActiveServiceAreas().map((a) => a.name);
  if (names.length === 0) return "any region";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}
