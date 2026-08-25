import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export interface ProspectMapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  opportunity: boolean;
  saved: boolean;
}

interface ProspectMapProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
  markers: ProspectMapMarker[];
  selectedId: string | null;
  searching?: boolean;
  /** Fired when the admin clicks the map, drags the pin, or pans/zooms the map. */
  onCenterChange: (c: { lat: number; lng: number }, source: "pin" | "pan") => void;
  onSelect: (id: string) => void;
}

const COLORS = {
  opportunity: "#f59e0b",
  listed: "#0ea5e9",
  saved: "#16a34a",
  selected: "#111827",
};

function markerColor(m: ProspectMapMarker) {
  if (m.saved) return COLORS.saved;
  return m.opportunity ? COLORS.opportunity : COLORS.listed;
}

export function ProspectMap({
  center, radiusMeters, markers, selectedId, searching, onCenterChange, onSelect,
}: ProspectMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const pinRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  // True while the map view is being changed by code, so programmatic moves
  // are not reported back as user pans (which would loop searches).
  const programmaticRef = useRef(false);
  const cbRef = useRef({ onCenterChange, onSelect });
  useEffect(() => { cbRef.current = { onCenterChange, onSelect }; });

  // ---- init ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom: 14,
        scrollWheelZoom: true,
        zoomControl: true,
        minZoom: 3,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO",
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="width:26px;height:26px;border-radius:9999px;background:#16a34a;border:3px solid #fff;box-shadow:0 3px 10px rgba(22,163,74,.55)"></div>`,
        iconSize: [26, 26], iconAnchor: [13, 13],
      });
      const pin = L.marker([center.lat, center.lng], { icon: pinIcon, draggable: true }).addTo(map);
      pinRef.current = pin;
      pin.on("dragend", () => {
        const p = pin.getLatLng();
        cbRef.current.onCenterChange({ lat: p.lat, lng: p.lng }, "pin");
      });

      const circle = L.circle([center.lat, center.lng], {
        radius: radiusMeters,
        color: "#16a34a",
        fillColor: "#16a34a",
        fillOpacity: 0.07,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      map.on("click", (e: any) => {
        cbRef.current.onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng }, "pin");
      });

      map.on("moveend", () => {
        if (programmaticRef.current) { programmaticRef.current = false; return; }
        const c = map.getCenter();
        cbRef.current.onCenterChange({ lat: c.lat, lng: c.lng }, "pan");
      });

      // Ensure correct sizing inside a flex layout.
      setTimeout(() => map.invalidateSize(), 150);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- keep pin + circle in sync, recentre only when needed ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pinRef.current || !circleRef.current) return;
    pinRef.current.setLatLng([center.lat, center.lng]);
    circleRef.current.setLatLng([center.lat, center.lng]);
    circleRef.current.setRadius(radiusMeters);
    const mc = map.getCenter();
    const drifted = map.distance(mc, [center.lat, center.lng]) > radiusMeters * 0.35;
    if (drifted) {
      programmaticRef.current = true;
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center.lat, center.lng, radiusMeters]);

  // ---- business markers ----
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (layerRef.current) { layerRef.current.remove(); layerRef.current = null; }
    if (!markers.length) return;

    const group = L.layerGroup(
      markers.map((m) => {
        const isSelected = m.id === selectedId;
        const color = isSelected ? COLORS.selected : markerColor(m);
        const size = isSelected ? 22 : m.opportunity ? 18 : 13;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);${isSelected ? "outline:3px solid rgba(17,24,39,.25);" : ""}"></div>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2],
        });
        return L.marker([m.lat, m.lng], { icon, zIndexOffset: isSelected ? 1000 : m.opportunity ? 500 : 0 })
          .bindTooltip(
            `${m.name}${m.saved ? " · Saved" : m.opportunity ? " · Website opportunity" : ""}`,
            { direction: "top" },
          )
          .on("click", () => cbRef.current.onSelect(m.id));
      }),
    );
    group.addTo(map);
    layerRef.current = group;
  }, [markers, selectedId]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {searching && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-white border border-gray-300 rounded-full shadow-md px-4 py-1.5 text-xs font-medium text-gray-800 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-green-600" /> Searching this area…
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[500] bg-white/95 border border-gray-300 rounded-lg shadow px-3 py-2">
        <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Legend</div>
        <div className="flex flex-col gap-1 text-xs text-gray-800">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-white shadow" style={{ background: COLORS.opportunity }} />
            Website opportunity
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white shadow" style={{ background: COLORS.listed }} />
            Website listed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-white shadow" style={{ background: COLORS.saved }} />
            Saved prospect
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-white shadow" style={{ background: COLORS.selected }} />
            Selected
          </span>
        </div>
      </div>
    </div>
  );
}
