import { OSM_TILE_URL, OSM_TILE_OPTIONS } from "@/lib/mapTiles";
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2, Crosshair, X, Plus } from "lucide-react";

export interface PinnedLocation {
  id: string;
  lat: number;
  lng: number;
  address: string;
}

interface Props {
  pins: PinnedLocation[];
  onChange: (pins: PinnedLocation[]) => void;
  min?: number;
  max?: number;
  mapHeight?: string;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842];

export const MultiPinLocationMap = ({
  pins,
  onChange,
  min = 1,
  max = 15,
  mapHeight = "420px",
}: Props) => {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const pinsRef = useRef<PinnedLocation[]>(pins);
  const onChangeRef = useRef(onChange);

  useEffect(() => { pinsRef.current = pins; }, [pins]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }, []);

  const addPinAt = useCallback(async (lat: number, lng: number, addressOverride?: string) => {
    const current = pinsRef.current;
    if (current.length >= max) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const address = addressOverride || (await reverseGeocode(lat, lng));
    const next = [...current, { id, lat, lng, address }];
    onChangeRef.current(next);
  }, [max, reverseGeocode]);

  // Init map once
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!mapContainerRef.current || mapRef.current || cancelled) return;
      const L = await import("leaflet");
      const map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, 6);
      L.tileLayer(OSM_TILE_URL, OSM_TILE_OPTIONS).addTo(map);
      mapRef.current = map;

      map.on("click", (e: any) => {
        addPinAt(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => map.invalidateSize(), 100);
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(t);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
      }
    };
  }, [addPinAt]);

  // Sync markers with pins
  useEffect(() => {
    (async () => {
      const map = mapRef.current;
      if (!map) return;
      const L = await import("leaflet");
      const existing = markersRef.current;
      const nextIds = new Set(pins.map(p => p.id));

      // remove gone
      for (const [id, marker] of existing) {
        if (!nextIds.has(id)) {
          marker.remove();
          existing.delete(id);
        }
      }
      // add/update
      pins.forEach((p, idx) => {
        if (existing.has(p.id)) {
          existing.get(p.id).setLatLng([p.lat, p.lng]);
          return;
        }
        const marker = L.marker([p.lat, p.lng], {
          draggable: true,
          icon: L.divIcon({
            className: "multi-pin",
            html: `<div style="position:relative;width:36px;height:42px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4))"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 24 28" fill="hsl(142, 76%, 36%)" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 16-8 16s-8-10-8-16a8 8 0 0 1 16 0Z"/></svg><div style="position:absolute;top:4px;left:0;right:0;text-align:center;color:white;font-weight:700;font-size:12px;line-height:14px;">${idx + 1}</div></div>`,
            iconSize: [36, 42],
            iconAnchor: [18, 42],
          }),
        }).addTo(map);
        marker.on("dragend", async () => {
          const pos = marker.getLatLng();
          const address = await reverseGeocode(pos.lat, pos.lng);
          const updated = pinsRef.current.map(x =>
            x.id === p.id ? { ...x, lat: pos.lat, lng: pos.lng, address } : x
          );
          onChangeRef.current(updated);
        });
        existing.set(p.id, marker);
      });
    })();
  }, [pins, reverseGeocode]);

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        setSuggestions((await res.json()) || []);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const selectSuggestion = async (s: Suggestion) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchText("");
    setSuggestions([]);
    if (mapRef.current) mapRef.current.setView([lat, lng], 14);
    if (pins.length < max) addPinAt(lat, lng, s.display_name);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) mapRef.current.setView([latitude, longitude], 14);
        if (pins.length < max) addPinAt(latitude, longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const removePin = (id: string) => {
    onChange(pins.filter(p => p.id !== id));
  };

  const atMax = pins.length >= max;
  const belowMin = pins.length < min;

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            placeholder="Search a city, area, or address to pin..."
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            disabled={atMax}
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />}
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl shadow-lg overflow-hidden max-h-[220px] overflow-y-auto">
            {suggestions.map(s => (
              <button
                key={s.place_id}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 flex items-start gap-2 text-white"
              >
                <Plus className="h-4 w-4 mt-0.5 shrink-0 text-green-400" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleUseMyLocation}
        disabled={locating || atMax}
        className="w-full"
      >
        {locating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Crosshair className="h-4 w-4 mr-2" />}
        {locating ? "Detecting..." : "Pin My Current Location"}
      </Button>

      <div
        ref={mapContainerRef}
        className="w-full rounded-xl border border-white/10 overflow-hidden"
        style={{ height: mapHeight, zIndex: 0 }}
      />

      <div className="flex items-center justify-end text-sm">
        <span className="text-xs text-zinc-500">Tap the map to add a pin</span>
      </div>

      {pins.length > 0 && (
        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
          {pins.map((p, i) => (
            <div key={p.id} className="flex items-start gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white line-clamp-2">{p.address}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  <MapPin className="inline w-3 h-3 mr-1" />
                  {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removePin(p.id)}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                aria-label="Remove pin"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiPinLocationMap;
