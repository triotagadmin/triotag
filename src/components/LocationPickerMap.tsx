import { OSM_TILE_URL, OSM_TILE_OPTIONS } from "@/lib/mapTiles";
import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2, Crosshair, Check } from "lucide-react";

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  place_name: string;
}

interface LocationPickerMapProps {
  onConfirm: (location: LocationData) => void;
  initialLocation?: { lat: number; lng: number } | null;
  mapHeight?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onLocationSelect?: (location: LocationData) => void;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

export const LocationPickerMap = ({
  onConfirm,
  initialLocation,
  mapHeight = "450px",
  searchValue,
  onSearchChange,
  onLocationSelect,
}: LocationPickerMapProps) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => { onLocationSelectRef.current = onLocationSelect; }, [onLocationSelect]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{ address: string; place_name: string }> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return {
        address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        place_name: data.address?.amenity || data.address?.building || data.address?.road || data.display_name?.split(",")[0] || "",
      };
    } catch {
      return { address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, place_name: "" };
    }
  }, []);

  const placePin = useCallback(
    async (map: any, L: any, lat: number, lng: number, skipGeocode = false) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({
            className: "location-picker-pin",
            html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="hsl(142, 76%, 36%)" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="hsl(142, 76%, 36%)"/></svg></div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          }),
        }).addTo(map);

        markerRef.current.on("dragend", async () => {
          const pos = markerRef.current.getLatLng();
          const geo = await reverseGeocode(pos.lat, pos.lng);
          const loc = { lat: pos.lat, lng: pos.lng, ...geo };
          setLocation(loc);
          setConfirmed(false);
          onLocationSelectRef.current?.(loc);
        });
      }

      if (!skipGeocode) {
        const geo = await reverseGeocode(lat, lng);
        const loc = { lat, lng, ...geo };
        setLocation(loc);
        onLocationSelectRef.current?.(loc);
      }
      setConfirmed(false);
    },
    [reverseGeocode]
  );

  // Init map
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      if (!mapContainerRef.current || mapRef.current) return;
      const L = await import("leaflet");

      const center = initialLocation
        ? [initialLocation.lat, initialLocation.lng] as [number, number]
        : DEFAULT_CENTER;

      const map = L.map(mapContainerRef.current).setView(center, initialLocation ? 15 : 10);
      L.tileLayer(OSM_TILE_URL, OSM_TILE_OPTIONS).addTo(map);

      mapRef.current = map;

      map.on("click", async (e: any) => {
        const L2 = await import("leaflet");
        placePin(map, L2, e.latlng.lat, e.latlng.lng);
        map.setView([e.latlng.lat, e.latlng.lng], Math.max(map.getZoom(), 14));
      });

      if (initialLocation && !cancelled) {
        placePin(map, L, initialLocation.lat, initialLocation.lng);
        map.setView([initialLocation.lat, initialLocation.lng], 15);
      }

      setTimeout(() => map.invalidateSize(), 100);
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autocomplete search
  const handleSearchChange = (val: string) => {
    setSearchText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectSuggestion = async (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchText(s.display_name);
    onSearchChange?.(s.display_name);
    setSuggestions([]);
    const L = await import("leaflet");
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16);
      placePin(mapRef.current, L, lat, lng, true);
      const loc = {
        lat,
        lng,
        address: s.display_name,
        place_name: s.display_name.split(",")[0],
      };
      setLocation(loc);
      onLocationSelect?.(loc);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const L = await import("leaflet");
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
          placePin(mapRef.current, L, lat, lng);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (location) {
      setConfirmed(true);
      onConfirm(location);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar with autocomplete */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search address, business name, or landmark..."
            value={searchValue !== undefined ? searchValue : searchText}
            onChange={(e) => {
              const val = e.target.value;
              onSearchChange?.(val);
              handleSearchChange(val);
            }}
            className="pl-9"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-[14px] shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s.place_id}
                type="button"
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-start gap-2"
                onClick={() => selectSuggestion(s)}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Use My Location */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUseMyLocation}
        disabled={locating}
        className="w-full"
      >
        {locating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Crosshair className="h-4 w-4 mr-2" />
        )}
        {locating ? "Detecting location..." : "Use My Location"}
      </Button>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-[14px] border overflow-hidden"
        style={{ height: mapHeight, zIndex: 0 }}
      />

      {/* Selected address display */}
      {location && (
        <div className="bg-muted/30 border border-border rounded-[14px] p-3 space-y-1">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
            <div className="min-w-0">
              {location.place_name && (
                <p className="text-sm font-medium truncate">{location.place_name}</p>
              )}
              <p className="text-xs text-muted-foreground line-clamp-2">{location.address}</p>
              <p className="text-xs text-muted-foreground mt-1">
                📍 {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <Button
        type="button"
        onClick={handleConfirm}
        disabled={!location}
        className="w-full"
        variant={confirmed ? "outline" : "default"}
      >
        {confirmed ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Location Confirmed
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4 mr-2" />
            Confirm Location
          </>
        )}
      </Button>
    </div>
  );
};
