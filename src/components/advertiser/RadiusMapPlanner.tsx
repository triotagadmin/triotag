import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin, AlertTriangle } from "lucide-react";
import {
  isWithinServiceArea,
  getCombinedMaxBounds,
  getDefaultMapView,
  getActiveAreaNamesText,
} from "@/lib/serviceAreas";
import { toast } from "@/hooks/use-toast";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface RadiusMapPlannerProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
  onCenterChange: (c: { lat: number; lng: number }) => void;
  onRadiusChange: (r: number) => void;
  onServiceAreaChange?: (withinServiceArea: boolean) => void;
  onLocationSet?: (displayName: string) => void;
  markers?: { lat: number; lng: number; name: string }[];
}


const PRESETS = [250, 500, 1000, 2000, 5000];

export function RadiusMapPlanner({
  center, radiusMeters, onCenterChange, onRadiusChange, onServiceAreaChange, onLocationSet, markers,
}: RadiusMapPlannerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOutsideServiceArea, setIsOutsideServiceArea] = useState(
    !isWithinServiceArea(center.lat, center.lng),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const reportPin = useCallback(
    (lat: number, lng: number) => {
      const within = isWithinServiceArea(lat, lng);
      setIsOutsideServiceArea(!within);
      onServiceAreaChange?.(within);
      onCenterChange({ lat, lng });
    },
    [onCenterChange, onServiceAreaChange],
  );

  // Init map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapContainerRef.current || mapRef.current) return;
      LRef.current = L;

      const defaultView = getDefaultMapView();
      const within = isWithinServiceArea(center.lat, center.lng);
      const initialCenter: [number, number] = within
        ? [center.lat, center.lng]
        : defaultView.center;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: within ? 13 : defaultView.zoom,
        scrollWheelZoom: true,
        minZoom: 5,
        maxBounds: getCombinedMaxBounds() as any,
        maxBoundsViscosity: 1.0,
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
        reportPin(p.lat, p.lng);
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
        reportPin(e.latlng.lat, e.latlng.lng);
      });

      // Report initial state
      onServiceAreaChange?.(within);
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
    const within = isWithinServiceArea(center.lat, center.lng);
    setIsOutsideServiceArea(!within);
  }, [center.lat, center.lng]);

  // Render result markers
  useEffect(() => {
    const L = LRef.current;
    if (!L || !mapRef.current) return;
    if (markersLayerRef.current) {
      markersLayerRef.current.remove();
      markersLayerRef.current = null;
    }
    if (!markers || markers.length === 0) return;
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:9999px;background:#0ea5e9;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    });
    const group = L.layerGroup(
      markers.map((m) => L.marker([m.lat, m.lng], { icon }).bindTooltip(m.name)),
    );
    group.addTo(mapRef.current);
    markersLayerRef.current = group;
  }, [markers]);

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius(radiusMeters);
  }, [radiusMeters]);

  useEffect(() => {
    if (!mapRef.current || !circleRef.current) return;
    const bounds = circleRef.current.getBounds();
    mapRef.current.fitBounds(bounds.pad(0.2));
  }, [radiusMeters, center.lat, center.lng]);

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
    if (!isWithinServiceArea(lat, lng)) {
      toast({
        title: "Location not available",
        description: `TrioTag currently only operates in ${getActiveAreaNamesText()}. Please search for a location within our service area.`,
        variant: "destructive",
      });
      setSuggestions([]);
      return;
    }
    reportPin(lat, lng);
    setSearchText(s.display_name);
    onLocationSet?.(s.display_name);
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

      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-[480px] rounded-xl border border-gray-200 overflow-hidden z-0"
        />
        {isOutsideServiceArea && (
          <div className="absolute top-3 left-3 right-3 z-[500] bg-amber-50 border border-amber-300 rounded-lg shadow-md px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <strong className="font-semibold">Outside service area.</strong>{" "}
              TrioTag currently only operates in {getActiveAreaNamesText()}. Please select a location within our service area.
            </div>
          </div>
        )}
      </div>

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
