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
import { OOHAdvertisingDetails } from "@/components/venue/OOHAdvertisingDetails";
const AD_UNIT_TYPE_LABELS: Record<string, string> = {
  countertop_display: "Countertop Display",
  wall_poster: "Wall Poster",
  digital_screen: "Digital Screen",
  table_tent: "Table Tent",
  floor_decal: "Floor Decal",
  window_cling: "Window Cling",
  standee: "Standee",
  napkin_holder: "Napkin Holder",
  receipt_ad: "Receipt Ad",
  mural_painting: "Mural Painting",
  wheat_paste: "Wheat Paste"
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
  publisher_profiles: {
    user_id: string;
    business_name: string;
    contact_email: string;
    contact_phone: string;
  };
}
const VenueDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    // Check auth status and admin role
    const checkAuth = async () => {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const {
          data: roleData
        } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
        setIsAdmin(roleData?.role === "admin");
      }
    };
    checkAuth();
    if (id) {
      fetchVenueDetails();
    }
  }, [id]);
  const fetchVenueDetails = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("ad_spaces").select(`
          *,
          publisher_profiles (
            user_id,
            business_name,
            contact_email,
            contact_phone
          )
        `).eq("id", id).single();
      if (error) throw error;
      setVenue(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load venue details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
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
  const images = Array.isArray(venue.media_urls) ? venue.media_urls : [];
  return <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    {venue.specifications?.venue_type && <Badge variant="secondary" className="mb-4">
                        {venue.specifications.venue_type}
                      </Badge>}
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

                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Location</h3>
                    <p className="text-muted-foreground">
                      {venue.specifications?.full_address || venue.location}
                    </p>
                  </div>
                </div>

                {venue.specifications?.operating_hours && <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Operating Hours</h3>
                      <p className="text-muted-foreground">
                        {venue.specifications.operating_hours}
                      </p>
                    </div>
                  </div>}

                {venue.specifications?.allowed_ad_formats && <div>
                    <h3 className="font-semibold mb-2">Allowed Ad Formats</h3>
                    <div className="flex flex-wrap gap-2">
                      {venue.specifications.allowed_ad_formats.map((format: string) => <Badge key={format} variant="outline">
                          {format}
                        </Badge>)}
                    </div>
                  </div>}

                {venue.specifications?.ad_units && venue.specifications.ad_units.length > 0 && <div>
                    <h3 className="font-semibold mb-2">Available Ad Units</h3>
                    <div className="space-y-2">
                      {venue.specifications.ad_units.map((unit: any, idx: number) => <div key={idx} className="flex items-center gap-2">
                          <Badge variant="outline">{AD_UNIT_TYPE_LABELS[unit.type] || unit.type}</Badge>
                          
                        </div>)}
                    </div>
                  </div>}
              </CardContent>
            </Card>

            {/* OOH Advertising Details Section - from Step 2 of Venue Registration */}
            {venue.specifications?.ooh_details && (
              <OOHAdvertisingDetails oohDetails={venue.specifications.ooh_details} />
            )}
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
                {venue.specifications?.ad_units && venue.specifications.ad_units.length > 0 ? venue.specifications.ad_units.map((unit: any, idx: number) => <div key={idx} className="border-b border-border pb-3 last:border-0 last:pb-0">
                      
                      {unit.pricePerWeek && <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Weekly</span>
                          <span className="font-semibold">${unit.pricePerWeek}</span>
                        </div>}
                      {unit.pricePerMonth && <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Monthly</span>
                          <span className="font-semibold">${unit.pricePerMonth}</span>
                        </div>}
                    </div>) : <p className="text-muted-foreground">Contact for pricing</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publisher Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-medium">{venue.publisher_profiles?.business_name}</p>
                </div>

                {/* Contact info only visible to admins */}
                {isAdmin ? <>
                    {venue.specifications?.contact_person && <div>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{venue.specifications.contact_person}</p>
                      </div>}

                    {venue.specifications?.contact_number && <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{venue.specifications.contact_number}</p>
                      </div>}

                    {venue.publisher_profiles?.contact_email && <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{venue.publisher_profiles.contact_email}</p>
                      </div>}
                  </> : <div className="pt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span>Contact details available after activation</span>
                  </div>}

                <Button className="w-full mt-4" onClick={() => navigate(`/activate/${venue.id}`)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Activate
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default VenueDetail;