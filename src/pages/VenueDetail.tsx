import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowLeft, MapPin, DollarSign, Clock, Phone, Lock, Building, Eye, Key, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { User } from "@supabase/supabase-js";
import { OOHAdvertisingDetails } from "@/components/venue/OOHAdvertisingDetails";
import ShareButtons from "@/components/ShareButtons";

const AD_UNIT_TYPE_LABELS: Record<string, string> = {
  vinyl_sticker: "Vinyl Sticker",
  table_tent_card: "Table Tent Card",
  table_tent_acrylic: "Table Tent Acrylic",
  coroplast_a_frame: "Coroplast A-Frame Sign",
  countertop_display: "Countertop Display",
  wall_poster: "Wall Poster",
  digital_screen: "Digital Screen",
  table_tent: "Table Tent",
  floor_decal: "Floor Decal",
  window_cling: "Window Cling",
  standee: "Standee",
};

interface VenueDetails {
  id: string;
  title: string;
  location: string;
  description: string;
  media_urls: any;
  pricing: any;
  approval_status: string;
  specifications: any;
  publisher_id: string;
  advertiser_id: string | null;
  leased_advertiser_ids: string[];
  pending_advertiser_email: string | null;
  publisher_profiles: {
    user_id: string;
    business_name: string;
  };
}

const VenueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdvertiser, setIsAdvertiser] = useState(false);
  const [branchCount, setBranchCount] = useState(0);
  const [leasing, setLeasing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
        setIsAdmin(roleData?.role === "admin");
        setIsAdvertiser(roleData?.role === "advertiser");
      }
    };
    checkAuth();
    if (id) {
      fetchVenueDetails();
      fetchBranchCount();
    }
  }, [id]);

  const fetchVenueDetails = async () => {
    try {
      const { data, error } = await supabase.from("ad_spaces").select(`
          *,
          publisher_profiles (
            user_id,
            business_name
          )
        `).eq("id", id).single();
      if (error) throw error;
      setVenue(data);
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to load venue details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranchCount = async () => {
    try {
      const { count, error } = await supabase
        .from("franchise_branches")
        .select("*", { count: "exact", head: true })
        .eq("franchise_id", id!);
      if (!error && count !== null) setBranchCount(count);
    } catch {}
  };

  const images = venue ? (Array.isArray(venue.media_urls) ? venue.media_urls : []) : [];
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const ogShareUrl = `${supabaseUrl}/functions/v1/venue-og-meta?id=${id}`;
  const canonicalUrl = `https://tinystickyads.com/venue/${id}`;

  useEffect(() => {
    if (!venue) return;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property.startsWith("og:") ? "property" : "name", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    document.title = `${venue.title} – Tiny Sticky Ads`;
    setMeta("og:title", venue.title);
    setMeta("og:description", venue.description || "Check out this ad space on Tiny Sticky Ads!");
    setMeta("og:url", canonicalUrl);
    setMeta("og:image", images[0] || "");
    setMeta("twitter:title", venue.title);
    setMeta("twitter:description", venue.description || "Check out this ad space on Tiny Sticky Ads!");
    setMeta("twitter:image", images[0] || "");
  }, [venue]);

  if (loading) {
    return <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading venue details...</p>
      </div>;
  }
  if (!venue) {
    return <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Venue not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>;
  }

  const isFranchise = venue.specifications?.is_franchise === true;

  return <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {images.length > 0 && <Card>
                <CardContent className="p-6">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {images.map((url, index) => <CarouselItem key={index}>
                          <div className="aspect-video overflow-hidden rounded-lg">
                            <img src={url} alt={`${venue.title} - Image ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        </CarouselItem>)}
                    </CarouselContent>
                    {images.length > 1 && <>
                        <CarouselPrevious />
                        <CarouselNext />
                      </>}
                  </Carousel>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {images.length} photo{images.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>}

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{venue.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {venue.specifications?.venue_type && <Badge variant="secondary">
                          {venue.specifications.venue_type}
                        </Badge>}
                      {venue.specifications?.industry_category && <Badge variant="outline">
                          {venue.specifications.industry_category}
                        </Badge>}
                      {isFranchise && <Badge className="bg-primary/10 text-primary border-primary/20">
                          <Building className="h-3 w-3 mr-1" />
                          Multi-Location
                        </Badge>}
                    </div>
                  </div>
                  <Badge variant={venue.approval_status === "approved" ? "default" : venue.approval_status === "pending" ? "secondary" : "destructive"}>
                    {venue.approval_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{venue.description}</p>
                </div>

                {/* Show total locations count instead of a single address */}
                {branchCount > 0 && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">{branchCount} Location{branchCount !== 1 ? "s" : ""}</h3>
                      <p className="text-muted-foreground text-sm">
                        This brand has {branchCount} branch{branchCount !== 1 ? "es" : ""} available for advertising.
                      </p>
                    </div>
                  </div>
                )}

                {/* View All Locations button */}
                {branchCount > 0 && (
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/venue/${id}/branches`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View All Locations ({branchCount})
                  </Button>
                )}

                {venue.specifications?.operating_hours && <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Operating Hours</h3>
                      <p className="text-muted-foreground">
                        {venue.specifications.operating_hours}
                      </p>
                    </div>
                  </div>}

                {venue.specifications?.ad_units && venue.specifications.ad_units.length > 0 && <div>
                    <h3 className="font-semibold mb-2">Available Ad Units</h3>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {venue.specifications.ad_units.map((unit: any, idx: number) => <Button key={idx} variant="cyber" size="sm" className="text-xs h-7 px-3">
                          {AD_UNIT_TYPE_LABELS[unit.type] || unit.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </Button>)}
                    </div>
                  </div>}
              </CardContent>
            </Card>

            {venue.specifications?.ooh_details && <OOHAdvertisingDetails oohDetails={venue.specifications.ooh_details} />}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {venue.specifications?.ad_units && venue.specifications.ad_units.length > 0 ? venue.specifications.ad_units.map((unit: any, idx: number) => <div key={idx} className="border-b border-border pb-3 last:border-0 last:pb-0 space-y-2">
                      {unit.pricePerWeek && <Button variant="cyber" size="sm" className="w-full justify-between animate-pulse-glow">
                          <span>Weekly</span>
                          <span className="font-bold">${unit.pricePerWeek}</span>
                        </Button>}
                      {unit.pricePerMonth && <Button variant="cyber" size="sm" className="w-full justify-between animate-pulse-glow">
                          <span>Monthly</span>
                          <span className="font-bold">${unit.pricePerMonth}</span>
                        </Button>}
                    </div>) : <p className="text-muted-foreground">Contact for pricing</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Advertising Agent</p>
                  <p className="font-medium">{venue.publisher_profiles?.business_name}</p>
                </div>

                {isAdmin ? <>
                    {venue.specifications?.contact_person && <div>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{venue.specifications.contact_person}</p>
                      </div>}
                    {venue.specifications?.contact_number && <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{venue.specifications.contact_number}</p>
                      </div>}
                  </> : <div className="pt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Ready to advertise here? Activate this micro OOH ad space now!</span>
                  </div>}

                {/* Lease / Activate buttons */}
                {(() => {
                  const isOwner = venue.advertiser_id === user?.id;
                  const isLeased = user?.id ? (venue.leased_advertiser_ids || []).includes(user.id) : false;
                  const canLease = isAdvertiser && user && !isOwner && !isLeased && !venue.pending_advertiser_email;

                  return (
                    <>
                      {canLease && (
                        <Button
                          className="w-full mt-2"
                          variant="outline"
                          disabled={leasing}
                          onClick={async () => {
                            if (!user) return;
                            setLeasing(true);
                            try {
                              const currentIds = venue.leased_advertiser_ids || [];
                              if (currentIds.includes(user.id)) {
                                toast({ title: "Already leased", description: "You are already leasing this listing." });
                                return;
                              }
                              const { error } = await supabase
                                .from("ad_spaces")
                                .update({ leased_advertiser_ids: [...currentIds, user.id] } as any)
                                .eq("id", venue.id);
                              if (error) throw error;
                              toast({ title: "Listing Leased!", description: "This listing now appears on your dashboard for campaigns and print orders." });
                              fetchVenueDetails();
                            } catch (err: any) {
                              toast({ title: "Error", description: err.message, variant: "destructive" });
                            } finally { setLeasing(false); }
                          }}
                        >
                          {leasing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                          Lease this Listing
                        </Button>
                      )}
                      {isLeased && (
                        <Badge variant="secondary" className="w-full justify-center py-1.5 gap-1">
                          <Key className="h-3 w-3" /> You are leasing this listing
                        </Badge>
                      )}
                      <Button className="w-full mt-2" onClick={() => navigate(`/activate/${venue.id}`)}>
                        <Lock className="h-4 w-4 mr-2" />
                        Activate
                      </Button>
                    </>
                  );
                })()}
                <div className="mt-3">
                  <ShareButtons url={ogShareUrl} title={venue.title} description={venue.description} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};

export default VenueDetail;
