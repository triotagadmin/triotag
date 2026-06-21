import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Loader2, MapPin, Package } from "lucide-react";

type MediaType = "OOH" | "DOOH" | "AOOH";

type Listing = {
  id: string;
  title: string;
  location: string | null;
  media_type: MediaType;
  units: number;
  materials: string[];
  approved_at: string | null;
};

const typeColor = (t: MediaType) =>
  t === "AOOH"
    ? "bg-green-500/20 text-green-400 border-green-500/40"
    : t === "DOOH"
    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
    : "bg-purple-500/20 text-purple-300 border-purple-500/40";

export default function AdvertiserReports() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;

      const { data, error } = await supabase
        .from("ad_spaces")
        .select("id, title, location, media_type, specifications, approved_at, advertiser_id, leased_advertiser_ids")
        .eq("approval_status", "approved")
        .or(`advertiser_id.eq.${uid},leased_advertiser_ids.cs.{${uid}}`)
        .order("approved_at", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const mapped: Listing[] = (data || []).map((r: any) => {
        const materials: string[] = Array.isArray(r.specifications?.ad_unit_materials)
          ? r.specifications.ad_unit_materials
          : [];
        const mt = (String(r.media_type || "OOH").toUpperCase() as MediaType);
        return {
          id: r.id,
          title: r.title || "Untitled",
          location: r.location,
          media_type: mt === "AOOH" || mt === "DOOH" ? mt : "OOH",
          units: materials.length,
          materials,
          approved_at: r.approved_at,
        };
      });
      setListings(mapped);
      setLoading(false);
    })();
  }, []);

  const totals = listings.reduce(
    (acc, l) => {
      acc[l.media_type].listings += 1;
      acc[l.media_type].units += l.units;
      return acc;
    },
    {
      OOH: { listings: 0, units: 0 },
      DOOH: { listings: 0, units: 0 },
      AOOH: { listings: 0, units: 0 },
    } as Record<MediaType, { listings: number; units: number }>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Active Media</h1>
            <p className="text-muted-foreground text-sm">
              Activated ad space inventory and unit counts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {(["OOH", "DOOH", "AOOH"] as MediaType[]).map((t) => (
            <Card key={t}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{t}</span>
                  <Badge variant="outline" className={typeColor(t)}>{t}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{totals[t].units}</div>
                    <div className="text-xs text-muted-foreground">total units</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-semibold">{totals[t].listings}</div>
                    <div className="text-xs text-muted-foreground">listings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" /> Activated Ad Space Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No activated ad space inventory yet.
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{l.title}</span>
                        <Badge variant="outline" className={typeColor(l.media_type)}>
                          {l.media_type}
                        </Badge>
                      </div>
                      {l.location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{l.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">OOH</div>
                        <div className="font-bold">{l.media_type === "OOH" ? l.units : 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">DOOH</div>
                        <div className="font-bold">{l.media_type === "DOOH" ? l.units : 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">AOOH</div>
                        <div className="font-bold">{l.media_type === "AOOH" ? l.units : 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
