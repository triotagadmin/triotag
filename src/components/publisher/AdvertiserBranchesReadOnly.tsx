import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Users } from "lucide-react";

interface Branch {
  id: string;
  listing_id: string | null;
  branch_name: string | null;
  full_address: string;
  contact_name: string | null;
  created_at: string;
}

interface AdvertiserBranchesReadOnlyProps {
  listingIds: string[];
}

export const AdvertiserBranchesReadOnly = ({ listingIds }: AdvertiserBranchesReadOnlyProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listingIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("advertiser_branches")
        .select("*")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false });

      if (!error) setBranches((data as Branch[]) || []);
      setLoading(false);
    };
    fetchBranches();
  }, [listingIds]);

  if (loading) return null;
  if (branches.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Advertiser Branch Locations
        </CardTitle>
        <CardDescription>
          Branch locations added by advertisers for your listings (read-only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {branches.map((branch) => (
            <div key={branch.id} className="p-3 border rounded-lg space-y-1">
              <p className="font-medium text-sm">{branch.branch_name || "Unnamed Branch"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {branch.full_address}
              </p>
              {branch.contact_name && (
                <p className="text-xs text-muted-foreground">Notes: {branch.contact_name}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
