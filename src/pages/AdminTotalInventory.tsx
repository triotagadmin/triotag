import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart3, Loader2, MapPin, Package, Search, Building2 } from "lucide-react";

type MediaType = "OOH" | "DOOH" | "AOOH";

type Listing = {
  id: string;
  title: string;
  location: string | null;
  media_type: MediaType;
  units: number;
  retailer_name: string;
  retailer_email: string | null;
  approved_at: string | null;
};

const typeColor = (t: MediaType) =>
  t === "AOOH"
    ? "bg-green-500/20 text-green-400 border-green-500/40"
    : t === "DOOH"
    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
    : "bg-purple-500/20 text-purple-300 border-purple-500/40";

export default function AdminTotalInventory() {
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1. Get all users with retailer role
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "retailer");

      if (rolesErr) {
        console.error(rolesErr);
        setLoading(false);
        return;
      }

      const retailerIds = (roles || []).map((r: any) => r.user_id);
      if (retailerIds.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      // 2. Fetch retailer profile info for naming
      const { data: profiles } = await supabase
        .from("advertiser_profiles")
        .select("user_id, company_name, contact_email")
        .in("user_id", retailerIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      // 3. Fetch approved ad_spaces activated by these retailers (own or leased)
      const orFilter = retailerIds
        .map((id) => `advertiser_id.eq.${id},leased_advertiser_ids.cs.{${id}}`)
        .join(",");

      const { data: spaces, error: spacesErr } = await supabase
        .from("ad_spaces")
        .select(
          "id, title, location, media_type, specifications, approved_at, advertiser_id, leased_advertiser_ids"
        )
        .eq("approval_status", "approved")
        .or(orFilter)
        .order("approved_at", { ascending: false });

      if (spacesErr) {
        console.error(spacesErr);
        setLoading(false);
        return;
      }

      const mapped: Listing[] = (spaces || []).map((r: any) => {
        const materials: string[] = Array.isArray(r.specifications?.ad_unit_materials)
          ? r.specifications.ad_unit_materials
          : [];
        const mt = String(r.media_type || "OOH").toUpperCase() as MediaType;
        const ownerId =
          retailerIds.includes(r.advertiser_id)
            ? r.advertiser_id
            : (r.leased_advertiser_ids || []).find((id: string) =>
                retailerIds.includes(id)
              ) || r.advertiser_id;
        const profile: any = profileMap.get(ownerId);
        return {
          id: r.id,
          title: r.title || "Untitled",
          location: r.location,
          media_type: mt === "AOOH" || mt === "DOOH" ? mt : "OOH",
          units: materials.length,
          retailer_name: profile?.company_name || "Retailer",
          retailer_email: profile?.contact_email || null,
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

  const uniqueRetailers = new Set(listings.map((l) => l.retailer_name)).size;

  const filtered = listings.filter((l) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      l.title.toLowerCase().includes(s) ||
      l.location?.toLowerCase().includes(s) ||
      l.retailer_name.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Total Inventory</h1>
            <p className="text-muted-foreground text-sm">
              All activated ad space inventory across retailer accounts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Retailers</span>
                <Building2 className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{uniqueRetailers}</div>
              <div className="text-xs text-muted-foreground">active accounts</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" /> Activated Ad Space Inventory
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search retailer, title, location…"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No activated ad space inventory yet.
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((l) => (
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
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{l.retailer_name}</span>
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
