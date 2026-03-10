import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdvertiserBranchLocations } from "@/components/advertiser/AdvertiserBranchLocations";

interface Branch {
  id: string;
  place_name: string;
  full_address: string;
  latitude: number | null;
  longitude: number | null;
  ad_unit_quantity: number;
  branch_operating_hours: string | null;
}

const FranchiseBranches = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [franchiseName, setFranchiseName] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdvertiser, setIsAdvertiser] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserId(session.user.id);
          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();
          setIsAdvertiser(role?.role === "advertiser");
        }

        const { data: venue, error: venueError } = await supabase
          .from("ad_spaces")
          .select("title")
          .eq("id", id)
          .single();
        if (venueError) throw venueError;
        setFranchiseName(venue.title);

        // Fetch branches
        const { data, error } = await supabase
          .from("franchise_branches")
          .select("*")
          .eq("franchise_id", id)
          .order("place_name", { ascending: true });
        if (error) throw error;
        setBranches((data as any[]) || []);
      } catch (error: any) {
        toast({ title: "Error", description: "Failed to load branches", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Realtime subscription for branch updates
    const channel = supabase
      .channel(`branches-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'franchise_branches', filter: `franchise_id=eq.${id}` }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {franchiseName}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{franchiseName} – All Locations</h1>
          <p className="text-muted-foreground mt-2">
            {branches.length} branch{branches.length !== 1 ? "es" : ""} available for advertising
          </p>
        </div>

        {branches.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((branch) => (
              <Card key={branch.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-lg">{branch.place_name}</h3>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">{branch.full_address}</p>
                  </div>

                  {branch.branch_operating_hours && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground">{branch.branch_operating_hours}</p>
                    </div>
                  )}

                  {branch.ad_unit_quantity > 0 && (
                    <Badge variant="secondary">
                      {branch.ad_unit_quantity} ad unit{branch.ad_unit_quantity !== 1 ? "s" : ""} available
                    </Badge>
                  )}

                  {branch.latitude && branch.longitude && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`, '_blank')}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      View on Google Maps
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Advertiser Branch Locations */}
        {isAdvertiser && userId && id && (
          <div className="mt-8">
            <AdvertiserBranchLocations
              userId={userId}
              listingId={id}
              listingTitle={franchiseName}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseBranches;
