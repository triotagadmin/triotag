import { OSM_TILE_URL, OSM_TILE_OPTIONS } from "@/lib/mapTiles";
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Search, Loader2, MapPin, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  isWithinServiceArea,
  getCombinedMaxBounds,
  getDefaultMapView,
  getActiveAreaNamesText,
} from "@/lib/serviceAreas";
import { toast } from "@/hooks/use-toast";

interface Suggestion {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface PlaceMarker {
  lat: number;
  lng: number;
  name: string;
  category?: string;
}

interface RadiusMapPlannerProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
  onCenterChange: (c: { lat: number; lng: number }) => void;
  onRadiusChange: (r: number) => void;
  onServiceAreaChange?: (withinServiceArea: boolean) => void;
  onLocationSet?: (displayName: string) => void;
  markers?: PlaceMarker[];
  markersLoading?: boolean;
}

const PRESETS = [250, 500, 1000, 2000, 5000];

export const CATEGORY_STYLES: Record<string, { label: string; color: string }> = {
  cafe: { label: "Cafe", color: "#f97316" },
  restaurant: { label: "Restaurant", color: "#ef4444" },
  gym: { label: "Gym", color: "#3b82f6" },
  night_club: { label: "Night Club", color: "#a855f7" },
  store: { label: "Retail Store", color: "#0ea5e9" },
  beauty_salon: { label: "Salon", color: "#ec4899" },
  coworking: { label: "Co-working", color: "#14b8a6" },
  other: { label: "Other", color: "#64748b" },
};

const styleFor = (c?: string) => CATEGORY_STYLES[c ?? "other"] ?? CATEGORY_STYLES.other;

export function RadiusMapPlanner({
  center, radiusMeters, onCenterChange, onRadiusChange, onServiceAreaChange, onLocationSet,
  markers, markersLoading,
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
  const [reverseLoading, setReverseLoading] = useState(false);
  const reverseSeqRef = useRef(0);
  const [isOutsideServiceArea, setIsOutsideServiceArea] = useState(
    !isWithinServiceArea(center.lat, center.lng),
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const onLocationSetRef = useRef(onLocationSet);
  useEffect(() => {
    onLocationSetRef.current = onLocationSet;
  }, [onLocationSet]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const seq = ++reverseSeqRef.current;
    setReverseLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { lat, lng },
      });
      if (error) throw error;
      const address = (data as any)?.address as string | undefined;
      if (seq === reverseSeqRef.current && address) {
        setSearchText(address);
        setSuggestions([]);
        onLocationSetRef.current?.(address);
      }
    } catch (e) {
      console.error("[RadiusMapPlanner] reverse geocode failed", e);
    } finally {
      if (seq === reverseSeqRef.current) setReverseLoading(false);
    }
  }, []);

  const reportPin = useCallback(
    (lat: number, lng: number) => {
      const within = isWithinServiceArea(lat, lng);
      setIsOutsideServiceArea(!within);
      onServiceAreaChange?.(within);
      onCenterChange({ lat, lng });
      void reverseGeocode(lat, lng);
    },
    [onCenterChange, onServiceAreaChange, reverseGeocode],
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

      L.tileLayer(OSM_TILE_URL, OSM_TILE_OPTIONS).addTo(map);

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

  // Render result markers, coloured by category
  useEffect(() => {
    const L = LRef.current;
    if (!L || !mapRef.current) return;
    if (markersLayerRef.current) {
      markersLayerRef.current.remove();
      markersLayerRef.current = null;
    }
    if (!markers || markers.length === 0) return;
    const group = L.layerGroup(
      markers.map((m) => {
        const s = styleFor(m.category);
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:9999px;background:${s.color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        });
        return L.marker([m.lat, m.lng], { icon })
          .bindTooltip(`${m.name} · ${s.label}`)
          .bindPopup(
            `<div style="font-size:13px"><strong>${m.name}</strong><br/><span style="color:${s.color}">${s.label}</span></div>`,
          );
      }),
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
        const { data, error } = await supabase.functions.invoke("search-places", {
          body: { query: v, lat: center.lat, lng: center.lng },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        setSuggestions(((data as any)?.results ?? []) as Suggestion[]);
      } catch (e) {
        console.error("[RadiusMapPlanner] place search failed", e);
        setSuggestions([]);
      }
      setSearching(false);
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng]);

  const selectFirstSuggestion = () => {
    const first = suggestions[0];
    if (first) pickSuggestion(first);
  };

  const pickSuggestion = (s: Suggestion) => {
    const lat = Number(s.lat);
    const lng = Number(s.lng);
    if (!isWithinServiceArea(lat, lng)) {
      toast({
        title: "Location not available",
        description: `TrioTag currently only operates in ${getActiveAreaNamesText()}. Please search for a location within our service area.`,
        variant: "destructive",
      });
      setSuggestions([]);
      return;
    }
    const display = s.address ? `${s.name} — ${s.address}` : s.name;
    reportPin(lat, lng);
    // Pan map immediately so the user sees the selected location
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
    }
    // cancel any in-flight reverse lookup so it can't overwrite the picked name
    reverseSeqRef.current++;
    setReverseLoading(false);
    setSearchText(display);
    onLocationSet?.(display);
    setSuggestions([]);
  };

  const radiusLabel = radiusMeters >= 1000
    ? `${(radiusMeters / 1000).toFixed(radiusMeters % 1000 === 0 ? 0 : 1)} km radius`
    : `${radiusMeters} m radius`;

  const legendCategories = Array.from(
    new Set((markers ?? []).map((m) => m.category ?? "other")),
  );

  return (
    <div className="space-y-3">
      {/* Unified location + radius card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Choose Your Location</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Search for an address or business, then set how far around it your campaign should reach.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 z-[1]" />
          <Input
            value={reverseLoading ? "" : searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={reverseLoading ? "Getting address…" : "Search an address, business or area..."}
            disabled={reverseLoading}
            className="pl-9 h-11 bg-white text-gray-900 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500"
          />
          {(searching || reverseLoading) && (
            <Loader2 className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
          )}
          {suggestions.length > 0 && (
            <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  onClick={() => pickSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                >
                  <MapPin className="inline w-3 h-3 mr-1 text-green-600" />
                  <span className="font-medium text-gray-900">{s.name}</span>
                  {s.address && <span className="text-gray-500"> — {s.address}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
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
        {markersLoading && (
          <div className="absolute bottom-3 left-3 z-[500] bg-white/95 border border-gray-200 rounded-lg shadow px-3 py-1.5 text-xs text-gray-600 flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" /> Finding nearby locations…
          </div>
        )}
      </div>

      {legendCategories.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            RETAIL MEDIA &nbsp;CATEGORY({markers?.length ?? 0})
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {legendCategories.map((c) => {
              const s = styleFor(c);
              return (
                <span key={c} className="inline-flex items-center gap-1.5 text-xs text-gray-700">
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white shadow"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
