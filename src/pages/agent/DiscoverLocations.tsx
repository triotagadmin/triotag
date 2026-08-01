import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadiusMapPlanner } from "@/components/advertiser/RadiusMapPlanner";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search, MapPin, Star, Plus } from "lucide-react";

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Cafe", value: "cafe" },
  { label: "Gym", value: "gym" },
  { label: "Restaurant", value: "restaurant" },
  { label: "Retail Store", value: "store" },
  { label: "Night Club", value: "night_club" },
  { label: "Salon", value: "beauty_salon" },
];

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
}

export default function DiscoverLocations() {
  const navigate = useNavigate();
  const [center, setCenter] = useState({ lat: 14.5995, lng: 120.9842 });
  const [radiusMeters, setRadiusMeters] = useState(1000);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[] | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-nearby-places", {
        body: {
          lat: center.lat,
          lng: center.lng,
          radiusMeters,
          ...(category !== "all" ? { type: category } : {}),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data?.results ?? []);
    } catch (err: any) {
      console.error("[DiscoverLocations] search failed", err);
      toast({
        title: "Search failed",
        description: err?.message || "Could not fetch nearby businesses.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAsListing = (p: PlaceResult) => {
    navigate("/venue-registration", {
      state: { name: p.name, address: p.address, lat: p.lat, lng: p.lng },
    });
  };

  const prettyType = (types: string[]) =>
    (types?.[0] || "business").replace(/_/g, " ");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discover Locations</h1>
          <p className="text-sm text-muted-foreground">
            Find nearby businesses in an area and add them as ad space listings.
          </p>
        </div>

        <RadiusMapPlanner
          center={center}
          radiusMeters={radiusMeters}
          onCenterChange={setCenter}
          onRadiusChange={setRadiusMeters}
          markers={(results ?? []).map((r) => ({ lat: r.lat, lng: r.lng, name: r.name }))}
        />

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading} className="sm:w-48">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Search this area
          </Button>
          {results && !loading && (
            <span className="text-sm text-muted-foreground">{results.length} found</span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Searching nearby businesses...
          </div>
        )}

        {!loading && results && results.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No businesses found in this area — try a larger radius or different category.
            </CardContent>
          </Card>
        )}

        {!loading && results && results.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((p) => (
              <Card key={p.placeId}>
                <CardContent className="p-4 space-y-2">
                  <div className="font-semibold text-foreground">{p.name}</div>
                  <div className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{p.address}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="capitalize">{prettyType(p.types)}</Badge>
                    {p.rating != null && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current text-amber-500" />{p.rating}
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="w-full mt-1" onClick={() => addAsListing(p)}>
                    <Plus className="w-4 h-4 mr-1.5" /> Add as Listing
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
