import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin } from "lucide-react";
import { POI, POI_CATEGORY_COLORS } from "@/lib/poiSearch";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface RadiusMapPlannerProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
  pois: POI[];
  onCenterChange: (c: { lat: number; lng: number }) => void;
  onRadiusChange: (r: number) => void;
}

const PRESETS = [500, 1000, 2000, 5000];

export function RadiusMapPlanner({
  center, radiusMeters, pois, onCenterChange, onRadiusChange,
}: RadiusMapPlannerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const poiLayerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      LRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 13,
        scrollWheelZoom: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO", maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:34px;height:34px;border-radius:9999px;
          background:#22c55e;border:3px solid #fff;
          box-shadow:0 4px 12px rgba(34,197,94,0.5);
        "></div>`,
        iconSize: [34, 34], iconAnchor: [17, 17],
      });

      const marker = L.marker([center.lat, center.lng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current = marker;
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onCenterChange({ lat: p.lat, lng: p.lng });
      });

      const circle = L.circle([center.lat, center.lng], {
        radius: radiusMeters,
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 0.08,
        weight: 2,
      }).addTo(map);
      circleRef.current = circle;

      map.on("click", (e: any) => {
        onCenterChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      poiLayerRef.current = L.layerGroup().addTo(map);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker + circle with props
  useEffect(() => {
    if (!markerRef.current || !circleRef.current) return;
    markerRef.current.setLatLng([center.lat, center.lng]);
    circleRef.current.setLatLng([center.lat, center.lng]);
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radiusMeters);
  }, [radiusMeters]);

  // Fit bounds when radius or center changes (gently)
  useEffect(() => {
    if (!mapRef.current || !circleRef.current) return;
    const bounds = circleRef.current.getBounds();
    mapRef.current.fitBounds(bounds.pad(0.2));
  }, [radiusMeters, center.lat, center.lng]);

  // Render POI dots
  useEffect(() => {
    const L = LRef.current;
    if (!L || !poiLayerRef.current) return;
    poiLayerRef.current.clearLayers();
    pois.forEach((p) => {
      const color = POI_CATEGORY_COLORS[p.category] || "#6b7280";
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:14px;height:14px;border-radius:9999px;
          background:${color};border:2px solid #fff;
          box-shadow:0 2px 4px rgba(0,0,0,0.25);
        "></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });
      L.marker([p.lat, p.lng], { icon }).addTo(poiLayerRef.current)
        .bindTooltip(`<strong>${p.name}</strong><br/>${p.category}`, { direction: "top" });
    });
  }, [pois]);

  // Nominatim search
  const handleSearchChange = useCallback((v: string) => {
    setSearchText(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(v)}&limit=5`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 400);
  }, []);

  const pickSuggestion = (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    onCenterChange({ lat, lng });
    setSearchText(s.display_name);
    setSuggestions([]);
  };

  const radiusLabel = radiusMeters >= 1000
    ? `${(radiusMeters / 1000).toFixed(radiusMeters % 1000 === 0 ? 0 : 1)} km radius`
    : `${radiusMeters} m radius`;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 z-[1]" />
        <Input
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search an address or area..."
          className="pl-9 h-10 bg-white border-gray-200 rounded-lg"
        />
        {searching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 animate-spin" />}
        {suggestions.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <MapPin className="inline w-3 h-3 mr-1 text-green-600" />
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-[480px] rounded-xl border border-gray-200 overflow-hidden z-0"
      />

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">Search radius</span>
          <span className="text-sm font-bold text-green-600">{radiusLabel}</span>
        </div>
        <Slider
          min={250} max={5000} step={250}
          value={[radiusMeters]}
          onValueChange={(v) => onRadiusChange(v[0])}
          className="mb-3"
        />
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <Button
              key={p}
              type="button"
              variant={radiusMeters === p ? "default" : "outline"}
              size="sm"
              onClick={() => onRadiusChange(p)}
              className={radiusMeters === p ? "bg-green-600 hover:bg-green-500 text-white" : ""}
            >
              {p >= 1000 ? `${p / 1000}km` : `${p}m`}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
