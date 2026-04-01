import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Plus, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGuestBasket } from "@/contexts/GuestBasketContext";
import { toast } from "sonner";

interface BranchResult {
  listing_id: string;
  listing_title: string;
  branch_id: string | null;
  branch_name: string;
  branch_address: string;
  city: string;
  unit_type: string;
  unit_price: number;
  currency: string;
}

export const LocationBundlingSearch = () => {
  const [searchArea, setSearchArea] = useState("");
  const [results, setResults] = useState<BranchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const { addLocation, items } = useGuestBasket();

  const handleSearch = async () => {
    if (!searchArea.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      const term = searchArea.trim().toLowerCase();

      // Search franchise_branches by city/address
      const { data: franchiseBranches } = await supabase
        .from("franchise_branches")
        .select("id, franchise_id, place_name, full_address")
        .or(`full_address.ilike.%${term}%,place_name.ilike.%${term}%`);

      // Search advertiser_branches by city/address
      const { data: advertiserBranches } = await supabase
        .from("advertiser_branches")
        .select("id, listing_id, branch_name, full_address, city")
        .eq("is_ad_space_listing", true)
        .or(`full_address.ilike.%${term}%,city.ilike.%${term}%,branch_name.ilike.%${term}%`);

      // Collect listing IDs
      const listingIds = new Set<string>();
      (franchiseBranches || []).forEach(b => listingIds.add(b.franchise_id));
      (advertiserBranches || []).forEach(b => { if (b.listing_id) listingIds.add(b.listing_id); });

      if (listingIds.size === 0) {
        // Also check ad_spaces directly by location
        const { data: directListings } = await supabase
          .from("ad_spaces")
          .select("id, title, location, specifications, pricing")
          .eq("approval_status", "approved")
          .eq("availability_status", "available")
          .ilike("location", `%${term}%`);

        const directResults: BranchResult[] = (directListings || []).map(l => {
          const specs = l.specifications as any;
          const adUnits = specs?.ad_units || [];
          const unitPrice = adUnits[0]?.pricePerWeek || specs?.weekly_lease_price || 0;
          const currency = adUnits[0]?.currency || specs?.currency || "PHP";
          const unitType = adUnits[0]?.type || "ad_space";
          // Extract city from location
          const parts = (l.location || "").split(",").map((s: string) => s.trim());
          const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || searchArea;
          return {
            listing_id: l.id,
            listing_title: l.title,
            branch_id: null,
            branch_name: l.title,
            branch_address: l.location || "",
            city,
            unit_type: unitType,
            unit_price: unitPrice,
            currency,
          };
        });
        setResults(directResults);
        setSearching(false);
        return;
      }

      // Fetch listing details
      const { data: listings } = await supabase
        .from("ad_spaces")
        .select("id, title, location, specifications")
        .eq("approval_status", "approved")
        .eq("availability_status", "available")
        .in("id", Array.from(listingIds));

      const listingMap = new Map((listings || []).map(l => [l.id, l]));

      const branchResults: BranchResult[] = [];

      (franchiseBranches || []).forEach(b => {
        const listing = listingMap.get(b.franchise_id);
        if (!listing) return;
        const specs = listing.specifications as any;
        const adUnits = specs?.ad_units || [];
        const unitPrice = adUnits[0]?.pricePerWeek || specs?.weekly_lease_price || 0;
        const currency = adUnits[0]?.currency || specs?.currency || "PHP";
        const unitType = adUnits[0]?.type || "ad_space";
        const parts = b.full_address.split(",").map((s: string) => s.trim());
        const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0] || searchArea;
        branchResults.push({
          listing_id: listing.id,
          listing_title: listing.title,
          branch_id: b.id,
          branch_name: b.place_name,
          branch_address: b.full_address,
          city,
          unit_type: unitType,
          unit_price: unitPrice,
          currency,
        });
      });

      (advertiserBranches || []).forEach(b => {
        if (!b.listing_id) return;
        const listing = listingMap.get(b.listing_id);
        if (!listing) return;
        const specs = listing.specifications as any;
        const adUnits = specs?.ad_units || [];
        const unitPrice = adUnits[0]?.pricePerWeek || specs?.weekly_lease_price || 0;
        const currency = adUnits[0]?.currency || specs?.currency || "PHP";
        const unitType = adUnits[0]?.type || "ad_space";
        branchResults.push({
          listing_id: listing.id,
          listing_title: listing.title,
          branch_id: b.id,
          branch_name: b.branch_name || b.full_address,
          branch_address: b.full_address,
          city: b.city || searchArea,
          unit_type: unitType,
          unit_price: unitPrice,
          currency,
        });
      });

      setResults(branchResults);
    } catch (err) {
      console.error("Location bundling search error:", err);
      toast.error("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const isInBasket = (listing_id: string, branch_id: string | null) =>
    items.some(i => i.listing_id === listing_id && (i.branch_id ?? "head") === (branch_id ?? "head"));

  const handleAdd = (r: BranchResult) => {
    addLocation({
      listing_id: r.listing_id,
      listing_title: r.listing_title,
      branch_id: r.branch_id,
      branch_name: r.branch_name,
      branch_address: r.branch_address,
      city: r.city,
      unit_type: r.unit_type,
      unit_price: r.unit_price,
      quantity: 1,
      duration_weeks: 1,
      currency: r.currency,
    });
    toast.success(`Added ${r.branch_name} to basket`);
  };

  // Group results by listing
  const grouped = results.reduce<Record<string, { title: string; branches: BranchResult[] }>>((acc, r) => {
    if (!acc[r.listing_id]) acc[r.listing_id] = { title: r.listing_title, branches: [] };
    acc[r.listing_id].branches.push(r);
    return acc;
  }, {});

  return (
    <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle>Bundle Locations by Area</CardTitle>
        </div>
        <CardDescription>
          Search branches by location, add them to one basket, and pay in a single checkout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search area (e.g. Quezon City, Makati, BGC, Cebu IT Park...)"
              value={searchArea}
              onChange={e => setSearchArea(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} disabled={searching || !searchArea.trim()}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
            Location Bundling
          </Button>
        </div>

        {searched && !searching && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No branches found in "{searchArea}". Try a different area.
          </p>
        )}

        {Object.keys(grouped).length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing branches available in <span className="font-semibold text-primary">{searchArea}</span>
            </p>

            {Object.entries(grouped).map(([listingId, { title, branches }]) => (
              <Card key={listingId} className="overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <Badge variant="secondary">{branches.length} branch{branches.length !== 1 ? "es" : ""}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border">
                  {branches.map((b, idx) => (
                    <div key={b.branch_id ?? idx} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{b.branch_name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {b.city}
                        </p>
                        <Badge variant="outline" className="text-[10px] mt-1">Available in your selected area</Badge>
                      </div>
                      <div className="text-right shrink-0">
                        {b.unit_price > 0 && (
                          <p className="text-xs text-muted-foreground">{b.currency} {b.unit_price.toLocaleString()}/wk</p>
                        )}
                        <Button
                          size="sm"
                          variant={isInBasket(b.listing_id, b.branch_id) ? "secondary" : "default"}
                          disabled={isInBasket(b.listing_id, b.branch_id)}
                          onClick={() => handleAdd(b)}
                          className="mt-1"
                        >
                          {isInBasket(b.listing_id, b.branch_id) ? "Added" : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Location
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
