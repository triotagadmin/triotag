import { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Crosshair, Loader2 } from "lucide-react";

interface LocationSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (lat: number, lng: number) => void;
  radiusKm?: number;
}

const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842]; // Manila, Philippines

export const LocationSearchModal = ({
  open,
  onOpenChange,
  onSearch,
  radiusKm = 50,
}: LocationSearchModalProps) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const updateMarkerAndCircle = useCallback(
    (map: any, L: any, lat: number, lng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
          icon: L.divIcon({
            className: "custom-map-pin",
            html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="hsl(142, 76%, 36%)" stroke="white" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white" stroke="hsl(142, 76%, 36%)"/></svg></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          }),
        }).addTo(map);

        markerRef.current.on("dragend", () => {
          const pos = markerRef.current.getLatLng();
          setSelectedPosition([pos.lat, pos.lng]);
          if (circleRef.current) {
            circleRef.current.setLatLng([pos.lat, pos.lng]);
          }
        });
      }

      if (circleRef.current) {
        circleRef.current.setLatLng([lat, lng]);
      } else {
        circleRef.current = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: "hsl(142, 76%, 36%)",
          fillColor: "hsl(142, 76%, 36%)",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "6 4",
        }).addTo(map);
      }

      setSelectedPosition([lat, lng]);
    },
    [radiusKm]
  );

  useEffect(() => {
    if (!open) {
      // Clean up on close
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
      return;
    }

    // Initialize map after dialog renders
    const timeout = setTimeout(async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = await import("leaflet");

      const map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, 10);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on("click", (e: any) => {
        updateMarkerAndCircle(map, L, e.latlng.lat, e.latlng.lng);
      });

      // Force a resize after mount
      setTimeout(() => map.invalidateSize(), 100);
    }, 200);

    return () => clearTimeout(timeout);
  }, [open, updateMarkerAndCircle]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const L = await import("leaflet");
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 12);
          updateMarkerAndCircle(mapInstanceRef.current, L, lat, lng);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchArea = () => {
    if (selectedPosition) {
      onSearch(selectedPosition[0], selectedPosition[1]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Search by Location
          </DialogTitle>
          <DialogDescription>
            Click on the map or drag the pin to select a location. Results within {radiusKm} km will be shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button
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

          <div
            ref={mapContainerRef}
            className="w-full h-[350px] rounded-lg border overflow-hidden"
            style={{ zIndex: 0 }}
          />

          {selectedPosition && (
            <p className="text-xs text-muted-foreground text-center">
              📍 {selectedPosition[0].toFixed(4)}, {selectedPosition[1].toFixed(4)} — {radiusKm} km radius
            </p>
          )}

          <Button
            onClick={handleSearchArea}
            disabled={!selectedPosition}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Search this area
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
