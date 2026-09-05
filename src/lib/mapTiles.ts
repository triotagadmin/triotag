/**
 * Shared basemap configuration for every Leaflet map in the app.
 * Free/open OpenStreetMap raster tiles — no API key, no paid provider.
 */
export const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION = "© OpenStreetMap contributors";
export const OSM_MAX_ZOOM = 19;

export const OSM_TILE_OPTIONS = {
  attribution: OSM_ATTRIBUTION,
  maxZoom: OSM_MAX_ZOOM,
};
