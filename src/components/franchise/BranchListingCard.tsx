import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building, Search, ChevronRight, MapPin } from "lucide-react";

interface AdditionalLocation {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

interface AdSpaceListing {
  id: string;
  title: string;
  additionalLocations?: AdditionalLocation[];
}

interface BranchListingCardProps {
  adSpaces: AdSpaceListing[];
}

export const BranchListingCard = ({ adSpaces }: BranchListingCardProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      if (adSpaces.length === 0) return;
      const counts: Record<string, number> = {};

      await Promise.all(adSpaces.map(async (s) => {
        // Get listing's primary address to exclude it
        const { data: listing } = await supabase
          .from("ad_spaces")
          .select("location")
          .eq("id", s.id)
          .single();
        const primaryAddress = (listing?.location || "").trim().toLowerCase();

        const { data } = await supabase
          .from("franchise_branches")
          .select("full_address")
          .eq("franchise_id", s.id);

        const filtered = (data || []).filter(
          (b: any) => !(primaryAddress && (b.full_address || "").trim().toLowerCase() === primaryAddress)
        );
        counts[s.id] = filtered.length;
      }));

      setBranchCounts(counts);
    };
    fetchCounts();
  }, [adSpaces]);

  const filtered = adSpaces.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Manage Branch Locations</CardTitle>
            <CardDescription>
              Add and manage branches for your active ad space listings.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {adSpaces.length === 0
              ? "No ad space listings yet."
              : "No listings match your search."}
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((space) => {
              const count = branchCounts[space.id] ?? 0;
              const locations = space.additionalLocations || [];
              return (
                <div
                  key={space.id}
                  className="glass rounded-[14px] p-4 space-y-3 transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{space.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {count} branch{count !== 1 ? "es" : ""} registered
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() =>
                        navigate(`/venue-publishers/${space.id}/branches`)
                      }
                    >
                      Manage Branches
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {/* Additional Locations from Registration */}
                  {locations.length > 0 && (
                    <div className="border-t border-border/40 pt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Registered Locations ({locations.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {locations.map((loc, idx) => {
                          const label = [loc.address, loc.city, loc.province]
                            .filter(Boolean)
                            .join(", ");
                          return (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {label || `Location ${idx + 1}`}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
