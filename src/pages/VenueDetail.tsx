import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowLeft, MapPin, DollarSign, Clock, Users, Phone, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { User } from "@supabase/supabase-js";

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
  publisher_profiles_public?: {
    user_id: string;
    business_name: string;
  } | null;
}

const VenueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Validate ID first
    if (!id) {
      setError("Invalid venue ID");
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        // Check auth status
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) {
          setUser(session?.user ?? null);
        }
        
        if (session?.user) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          if (isMounted) {
            setIsAdmin(roleData?.role === "admin");
          }
        }

        // Fetch venue details - use maybeSingle() to avoid throwing on no results
        // Use publisher_profiles_public view to avoid RLS issues
        const { data, error: venueError } = await supabase
          .from("ad_spaces")
          .select(`
            *,
            publisher_profiles_public (
              user_id,
              business_name
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (!isMounted) return;

        if (venueError) {
          console.error("Error fetching venue:", venueError);
          setError("Failed to load venue details");
          toast({
            title: "Error",
            description: "Failed to load venue details",
            variant: "destructive",
          });
        } else if (!data) {
          setError("Venue not found");
        } else {
          setVenue(data);
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        if (isMounted) {
          setError("An unexpected error occurred");
          toast({
            title: "Error",
            description: "An unexpected error occurred",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-destructive text-lg mb-2">{error || "Venue not found"}</p>
            <p className="text-muted-foreground mb-6">The venue you're looking for doesn't exist or may have been removed.</p>
            <Button onClick={() => navigate("/explore")}>Browse Venues</Button>
          </div>
        </div>
      </div>
    );
  }

  const images = Array.isArray(venue.media_urls) ? venue.media_urls : [];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {images.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {images.map((url, index) => (
                        <CarouselItem key={index}>
                          <div className="aspect-video overflow-hidden rounded-lg">
                            <img
                              src={url}
                              alt={`${venue.title} - Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {images.length > 1 && (
                      <>
                        <CarouselPrevious />
                        <CarouselNext />
                      </>
                    )}
                  </Carousel>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {images.length} photo{images.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{venue.title}</CardTitle>
                    {venue.specifications?.venue_type && (
                      <Badge variant="secondary" className="mb-4">
                        {venue.specifications.venue_type}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant={
                      venue.approval_status === "approved"
                        ? "default"
                        : venue.approval_status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {venue.approval_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{venue.description}</p>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Location</h3>
                    <p className="text-muted-foreground">
                      {venue.specifications?.full_address || venue.location}
                    </p>
                  </div>
                </div>

                {venue.specifications?.operating_hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Operating Hours</h3>
                      <p className="text-muted-foreground">
                        {venue.specifications.operating_hours}
                      </p>
                    </div>
                  </div>
                )}

                {venue.specifications?.allowed_ad_formats && (
                  <div>
                    <h3 className="font-semibold mb-2">Allowed Ad Formats</h3>
                    <div className="flex flex-wrap gap-2">
                      {venue.specifications.allowed_ad_formats.map((format: string) => (
                        <Badge key={format} variant="outline">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {venue.specifications?.ad_units && venue.specifications.ad_units.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Available Ad Units</h3>
                    <div className="space-y-2">
                      {venue.specifications.ad_units.map((unit: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Badge variant="outline">{unit.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            Qty: {unit.quantity} | ${unit.pricePerWeek}/week | ${unit.pricePerMonth}/month
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                {venue.pricing?.weekly && (
                  <div>
                    <p className="text-sm text-muted-foreground">Per Week</p>
                    <p className="text-2xl font-bold">${venue.pricing.weekly}</p>
                  </div>
                )}
                {venue.pricing?.monthly && (
                  <div>
                    <p className="text-sm text-muted-foreground">Per Month</p>
                    <p className="text-2xl font-bold">${venue.pricing.monthly}</p>
                  </div>
                )}
                {!venue.pricing?.weekly && !venue.pricing?.monthly && (
                  <p className="text-muted-foreground">Contact for pricing</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publisher Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{venue.publisher_profiles_public?.business_name || "Publisher"}</p>
                </div>

                {/* Contact info only visible to admins */}
                {isAdmin ? (
                  <>
                    {venue.specifications?.contact_person && (
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{venue.specifications.contact_person}</p>
                      </div>
                    )}

                    {venue.specifications?.contact_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{venue.specifications.contact_number}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Contact details available after activation</span>
                  </div>
                )}

                <Button 
                  className="w-full mt-4" 
                  onClick={() => navigate(`/activate/${venue.id}`)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Activate
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetail;
