import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Eye, MapPin, DollarSign, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Venue {
  id: string;
  title: string;
  location: string;
  description: string;
  media_urls: any;
  pricing: any;
  approval_status: string;
  specifications: any;
  advertiser_id: string | null;
  pending_advertiser_email: string | null;
}

const VenueInventory = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPublisherAndVenues();
  }, []);

  const fetchPublisherAndVenues = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("publisher_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        toast({
          title: "Error",
          description: "Retailer profile not found",
          variant: "destructive",
        });
        return;
      }

      setPublisherId(profile.id);

      const { data: venuesData, error: venuesError } = await supabase
        .from("ad_spaces")
        .select("*")
        .eq("publisher_id", profile.id)
        .eq("agent_disconnected", false)
        .order("created_at", { ascending: false });

      if (venuesError) throw venuesError;
      setVenues(venuesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approvedVenues = venues.filter((v) => v.approval_status === "approved");
  const pendingVenues = venues.filter((v) => v.approval_status === "pending");
  const rejectedVenues = venues.filter((v) => v.approval_status === "rejected");

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" } = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const handleDeleteClick = (venue: Venue) => {
    setVenueToDelete(venue);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!venueToDelete) return;
    
    try {
      const { error } = await supabase
        .from("ad_spaces")
        .delete()
        .eq("id", venueToDelete.id)
        .eq("publisher_id", publisherId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Venue deleted successfully",
      });

      setVenues(venues.filter(v => v.id !== venueToDelete.id));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setVenueToDelete(null);
    }
  };

  const VenueCard = ({ venue }: { venue: Venue }) => {
    const firstImage = Array.isArray(venue.media_urls) && venue.media_urls.length > 0 
      ? venue.media_urls[0] 
      : null;
    const imageCount = Array.isArray(venue.media_urls) ? venue.media_urls.length : 0;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        {firstImage && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <img
              src={firstImage}
              alt={venue.title}
              className="w-full h-full object-cover"
            />
            {imageCount > 1 && (
              <Badge className="absolute top-2 right-2" variant="secondary">
                +{imageCount - 1} photos
              </Badge>
            )}
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{venue.title}</CardTitle>
              {venue.specifications?.venue_type && (
                <p className="text-xs text-muted-foreground mb-2">
                  {venue.specifications.venue_type}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(venue.approval_status)}
              {venue.pending_advertiser_email && !venue.advertiser_id && (
                <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
                  <Clock className="h-3 w-3" /> Pending Advertiser
                </Badge>
              )}
            </div>
          </div>
          <CardDescription className="line-clamp-2">{venue.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{venue.location}</span>
          </div>

          {venue.pricing && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                {venue.pricing.weekly && `$${venue.pricing.weekly}/week`}
                {venue.pricing.weekly && venue.pricing.monthly && " • "}
                {venue.pricing.monthly && `$${venue.pricing.monthly}/month`}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/venue/${venue.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/venue-registration?edit=${venue.id}`)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteClick(venue)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Venue Inventory</h1>
            <p className="text-xl text-muted-foreground">
              Manage your venue listings and submissions
            </p>
          </div>
          <Button size="lg" onClick={() => navigate("/venue-registration")}>
            <Plus className="h-5 w-5 mr-2" />
            Register New Venue
          </Button>
        </div>

        <Tabs defaultValue="approved" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="approved">
              Approved ({approvedVenues.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingVenues.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedVenues.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approved" className="mt-6">
            {approvedVenues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No approved venues yet
                  </p>
                  <Button onClick={() => navigate("/venue-registration")}>
                    Register Your First Venue
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingVenues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No pending venues</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedVenues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">No rejected venues</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedVenues.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Venue</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{venueToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VenueInventory;