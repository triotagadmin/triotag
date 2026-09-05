import { OSM_TILE_URL, OSM_TILE_OPTIONS } from "@/lib/mapTiles";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export interface ScannerMapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  verified: boolean;
  score: number;
}

interface Props {
  center: { lat: number; lng: number } | null;
  radiusMeters: number;
  markers: ScannerMapMarker[];
  selectedId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
}

const COLORS = {
  verified: "#22c55e",
  predicted: "#f59e0b",
  selected: "#ffffff",
};

const DEFAULT_CENTER = { lat: 14.5547, lng: 121.0244 }; // Makati

export function SocialScannerMap({
  center, radiusMeters, markers, selectedId, loading, onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const markerIndex = useRef<Map<string, any>>(new Map());
  const selectRef = useRef(onSelect);
  useEffect(() => { selectRef.current = onSelect; });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;
      const start = center ?? DEFAULT_CENTER;
      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom: 12,
        scrollWheelZoom: true,
        minZoom: 3,
      });
      mapRef.current = map;
      L.tileLayer(OSM_TILE_URL, OSM_TILE_OPTIONS).addTo(map);
      setTimeout(() => map.invalidateSize(), 150);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // search area circle + recentre
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !center) return;
    if (circleRef.current) { circleRef.current.remove(); circleRef.current = null; }
    circleRef.current = L.circle([center.lat, center.lng], {
      radius: radiusMeters,
      color: "#22c55e",
      fillColor: "#22c55e",
      fillOpacity: 0.06,
      weight: 2,
    }).addTo(map);
    map.setView([center.lat, center.lng], radiusMeters > 20000 ? 10 : radiusMeters > 8000 ? 11 : 13);
  }, [center?.lat, center?.lng, radiusMeters]);

  // business markers
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) { layerRef.current.remove(); layerRef.current = null; }
    markerIndex.current.clear();
    if (!markers.length) return;

    const group = L.layerGroup(
      markers.map((m) => {
        const isSelected = m.id === selectedId;
        const color = isSelected ? COLORS.selected : m.verified ? COLORS.verified : COLORS.predicted;
        const size = isSelected ? 24 : 18;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #0c0c0c;box-shadow:0 2px 8px rgba(0,0,0,.5);${m.verified ? "" : "opacity:.9;"}${isSelected ? "outline:3px solid rgba(34,197,94,.5);" : ""}"></div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        });
        const mk = L.marker([m.lat, m.lng], { icon, zIndexOffset: isSelected ? 1000 : m.verified ? 500 : 0 })
          .bindTooltip(`${m.name} · ${m.score}/100 · ${m.verified ? "Verified" : "Predicted"} location`, { direction: "top" })
          .on("click", () => selectRef.current(m.id));
        markerIndex.current.set(m.id, mk);
        return mk;
      }),
    );
    group.addTo(map);
    layerRef.current = group;
  }, [markers, selectedId]);

  // focus selected marker
  useEffect(() => {
    const map = mapRef.current;
    const mk = selectedId ? markerIndex.current.get(selectedId) : null;
    if (!map || !mk) return;
    map.setView(mk.getLatLng(), Math.max(map.getZoom(), 14), { animate: true });
    mk.openTooltip?.();
  }, [selectedId]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {loading && (
        <div className="absolute left-1/2 top-3 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/80 px-4 py-1.5 text-xs font-medium text-white">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-green-400" /> Scanning this area…
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[500] rounded-lg border border-white/15 bg-black/85 px-3 py-2">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">Location status</div>
        <div className="flex flex-col gap-1 text-xs text-gray-100">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: COLORS.verified }} /> Verified location
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: COLORS.predicted }} /> Predicted location
          </span>
        </div>
      </div>
    </div>
  );
}
