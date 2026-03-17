import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, MapPin } from "lucide-react";

interface FranchiseOption {
  id: string;
  franchise_name: string;
  branchCount: number;
  city: string;
}

interface FranchiseSelectorProps {
  userId: string;
  selectedFranchiseId: string;
  onSelect: (id: string) => void;
}

export const FranchiseSelector = ({ userId, selectedFranchiseId, onSelect }: FranchiseSelectorProps) => {
  const [franchises, setFranchises] = useState<FranchiseOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Get advertiser franchises
      const { data: advFranchises } = await supabase
        .from("advertiser_franchises")
        .select("id, franchise_name")
        .eq("advertiser_id", userId);

      // Also get ad_spaces where user is advertiser/leased
      const { data: adSpaces } = await supabase
        .from("ad_spaces")
        .select("id, title, location, specifications")
        .eq("approval_status", "approved")
        .eq("advertiser_id", userId);

      const allItems: FranchiseOption[] = [];

      // Add advertiser franchises
      if (advFranchises) {
        for (const f of advFranchises) {
          const { data: branches } = await supabase
            .from("advertiser_branches")
            .select("id, city")
            .eq("advertiser_franchise_id", f.id);
          allItems.push({
            id: `adv_${f.id}`,
            franchise_name: f.franchise_name,
            branchCount: branches?.length || 0,
            city: branches?.[0]?.city || "Unknown",
          });
        }
      }

      // Add ad space listings as franchise options
      if (adSpaces) {
        const listingIds = adSpaces.map(a => a.id);
        let branchCounts = new Map<string, number>();
        if (listingIds.length > 0) {
          // Count from franchise_branches
          const { data: counts } = await supabase.rpc("get_listing_branch_counts", { _listing_ids: listingIds });
          counts?.forEach((c: any) => branchCounts.set(c.listing_id, c.branch_count));

          // Also count from advertiser_branches linked to these listings
          const { data: advBranchCounts } = await supabase
            .from("advertiser_branches")
            .select("listing_id")
            .in("listing_id", listingIds);
          
          if (advBranchCounts) {
            const advCountMap = new Map<string, number>();
            advBranchCounts.forEach((b: any) => {
              advCountMap.set(b.listing_id, (advCountMap.get(b.listing_id) || 0) + 1);
            });
            advCountMap.forEach((count, lid) => {
              branchCounts.set(lid, (branchCounts.get(lid) || 0) + count);
            });
          }
        }
        for (const a of adSpaces) {
          const specs = (a.specifications as any) || {};
          allItems.push({
            id: `listing_${a.id}`,
            franchise_name: a.title,
            branchCount: branchCounts.get(a.id) || 0,
            city: specs.head_office_address?.city || a.location?.split(",")[0]?.trim() || "Unknown",
          });
        }
      }

      setFranchises(allItems);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (franchises.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No franchises or listings found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-primary" />
          Select Franchise
        </CardTitle>
        <CardDescription>Choose which franchise to configure print materials for.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {franchises.map((f) => (
          <div
            key={f.id}
            className={`p-4 rounded-[14px] border-2 cursor-pointer transition-all ${
              selectedFranchiseId === f.id
                ? "border-primary bg-primary/5"
                : "border-[rgba(255,255,255,0.12)] hover:border-primary/40"
            }`}
            onClick={() => onSelect(f.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{f.franchise_name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {f.city} — {f.branchCount > 0 ? `${f.branchCount + 1} Locations` : "1 Location"}
                </p>
              </div>
              <Badge variant={f.branchCount > 0 ? "default" : "secondary"}>
                {f.branchCount > 0 ? "Multi-Location" : "Single Location"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
