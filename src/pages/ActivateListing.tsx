import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, DollarSign, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";

interface ListingDetails {
  id: string;
  title: string;
  location: string;
  description: string;
  pricing: any;
  specifications: any;
  media_urls: any;
}

const ActivateListing = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchListingDetails();
    }
  }, [id]);

  const fetchListingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_spaces")
        .select("id, title, location, description, pricing, specifications, media_urls")
        .eq("id", id)
        .single();

      if (error) throw error;
      setListing(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load listing details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = () => {
    toast({
      title: "Payment Gateway",
      description: "Payment integration coming soon. Contact support for manual activation.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Listing not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const primaryImage = Array.isArray(listing.media_urls) && listing.media_urls.length > 0 
    ? listing.media_urls[0] 
    : null;

  const activationPrice = listing.pricing?.weekly || listing.pricing?.monthly || 99;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Listing Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
              <CardDescription>Review the listing you're activating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {primaryImage && (
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={primaryImage}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold">{listing.title}</h3>
                {listing.specifications?.venue_type && (
                  <Badge variant="secondary" className="mt-2">
                    {listing.specifications.venue_type}
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground">{listing.description}</p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
              </div>

              {listing.specifications?.ad_units && listing.specifications.ad_units.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Ad Unit Details</h4>
                  {listing.specifications.ad_units.map((unit: any, idx: number) => (
                    <div key={idx} className="text-sm text-muted-foreground">
                      <span className="font-medium">{unit.type}</span>: Qty {unit.quantity}
                    </div>
                  ))}
                </div>
              )}

              {listing.specifications?.operating_hours && (
                <div>
                  <h4 className="font-semibold mb-1">Operating Hours</h4>
                  <p className="text-sm text-muted-foreground">{listing.specifications.operating_hours}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Activate This Listing
              </CardTitle>
              <CardDescription>
                Unlock full access to this advertising opportunity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Activation Fee</span>
                  <span className="text-2xl font-bold text-primary">${activationPrice}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  One-time payment to unlock full contact details and booking access.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">What you'll get:</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Full contact information
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Direct messaging with publisher
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority booking access
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Campaign analytics access
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Pricing Options:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {listing.pricing?.weekly && (
                    <div className="border rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Weekly</p>
                      <p className="text-lg font-bold">${listing.pricing.weekly}</p>
                    </div>
                  )}
                  {listing.pricing?.monthly && (
                    <div className="border rounded-lg p-3 text-center">
                      <p className="text-sm text-muted-foreground">Monthly</p>
                      <p className="text-lg font-bold">${listing.pricing.monthly}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayNow}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Pay Now
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe, PayPal & GCash
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivateListing;
