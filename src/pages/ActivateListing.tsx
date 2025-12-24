import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, DollarSign, CreditCard, CheckCircle, Package, Truck, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { AdMockupPreview } from "@/components/AdMockupPreview";
import { createProdigiQuote, createProdigiOrder, ProdigiQuoteResponse } from "@/lib/prodigi";
import { ActivationStepper, type ActivationStep } from "@/components/activation/ActivationStepper";
import { ScheduleApprovalStep } from "@/components/activation/ScheduleApprovalStep";
import { format } from "date-fns";

interface ListingDetails {
  id: string;
  title: string;
  location: string;
  description: string;
  pricing: any;
  specifications: any;
  media_urls: any;
  publisher_id: string;
}

const SHIPPING_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "PH", name: "Philippines" },
];

type ActivationType = "sticker" | "table_tent" | "poster" | "flyer" | "banner" | "other";

const ActivateListing = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<ActivationStep>("design");
  const [activationId, setActivationId] = useState<string | null>(null);
  const [activationStatus, setActivationStatus] = useState<string>("design");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Design step state
  const [designApproved, setDesignApproved] = useState(false);
  const [approvedAdUnitType, setApprovedAdUnitType] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [activationType, setActivationType] = useState<ActivationType>("other");

  // Schedule state
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();

  // Print order state
  const [quantity, setQuantity] = useState(100);
  const [shippingCountry, setShippingCountry] = useState("US");
  const [quote, setQuote] = useState<ProdigiQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("");

  // Shipping details
  const [recipientName, setRecipientName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Order state
  const [orderLoading, setOrderLoading] = useState(false);
  const [printOrderComplete, setPrintOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (id) {
      fetchListingDetails();
      checkExistingActivation();
    }
  }, [id]);

  const fetchListingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_spaces")
        .select("id, title, location, description, pricing, specifications, media_urls, publisher_id")
        .eq("id", id)
        .single();

      if (error) throw error;
      setListing(data);

      // Get user email for shipping
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
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

  const checkExistingActivation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("activations")
        .select("*")
        .eq("ad_space_id", id)
        .eq("advertiser_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActivationId(data.id);
        setActivationStatus(data.status);
        setArtworkUrl(data.ad_design_url || "");
        setSelectedProduct(data.ad_unit_sku || "");
        setQuantity(data.quantity || 100);
        setRejectionReason(data.rejection_reason || undefined);
        
        if (data.start_date) setStartDate(new Date(data.start_date));
        if (data.end_date) setEndDate(new Date(data.end_date));
        if (data.activation_type) setActivationType(data.activation_type as ActivationType);
        if (data.print_order_id) {
          setPrintOrderComplete(true);
          setOrderId(data.print_order_id);
        }

        // Determine current step based on status
        switch (data.status) {
          case "design":
            setCurrentStep("design");
            if (data.ad_design_url) setDesignApproved(true);
            break;
          case "pending_approval":
          case "rejected":
            setCurrentStep("schedule-approval");
            setDesignApproved(true);
            break;
          case "approved":
          case "printing":
            setCurrentStep("print-order");
            setDesignApproved(true);
            break;
          case "payment_pending":
          case "completed":
            setCurrentStep("payment");
            setDesignApproved(true);
            setPrintOrderComplete(true);
            break;
        }
      }
    } catch (error) {
      console.error("Error checking activation:", error);
    }
  };

  const getActivationType = (adUnitType: string): ActivationType => {
    const typeMap: Record<string, ActivationType> = {
      "sticker": "sticker",
      "table-tent": "table_tent",
      "poster": "poster",
      "flyer": "flyer",
      "banner": "banner",
    };
    return typeMap[adUnitType] || "other";
  };

  const handleMockupApproval = async (data: { artworkUrl: string; adUnitType: string; selectedSku: string }) => {
    setArtworkUrl(data.artworkUrl);
    setSelectedProduct(data.selectedSku);
    setApprovedAdUnitType(data.adUnitType);
    const type = getActivationType(data.adUnitType);
    setActivationType(type);
    setDesignApproved(true);

    // Create or update activation record
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !listing) return;

      // Get publisher user_id from the ad_space's publisher_profile
      const { data: publisherProfile } = await supabase
        .from("publisher_profiles")
        .select("user_id")
        .eq("id", listing.publisher_id)
        .single();

      if (!publisherProfile) {
        toast({
          title: "Error",
          description: "Could not find publisher information",
          variant: "destructive",
        });
        return;
      }

      if (activationId) {
        await supabase
          .from("activations")
          .update({
            ad_design_url: data.artworkUrl,
            ad_unit_sku: data.selectedSku,
            activation_type: type,
          })
          .eq("id", activationId);
      } else {
        const { data: newActivation, error } = await supabase
          .from("activations")
          .insert({
            ad_space_id: id,
            advertiser_id: session.user.id,
            publisher_id: publisherProfile.user_id,
            status: "design",
            ad_design_url: data.artworkUrl,
            ad_unit_sku: data.selectedSku,
            activation_type: type,
          })
          .select()
          .single();

        if (error) throw error;
        if (newActivation) {
          setActivationId(newActivation.id);
        }
      }
    } catch (error: any) {
      console.error("Error saving activation:", error);
    }
  };

  const handleDatesSelected = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleSubmitForApproval = async () => {
    if (!startDate || !endDate || !activationId) return;

    setSubmittingApproval(true);
    try {
      const { error } = await supabase
        .from("activations")
        .update({
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          status: "pending_approval",
        })
        .eq("id", activationId);

      if (error) throw error;

      setActivationStatus("pending_approval");
      toast({
        title: "Request Submitted",
        description: "Your booking request has been sent to the publisher for approval.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit for approval",
        variant: "destructive",
      });
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleGetQuote = async () => {
    if (!selectedProduct || !artworkUrl || !shippingCountry) {
      toast({
        title: "Missing information",
        description: "Please complete the design step first.",
        variant: "destructive",
      });
      return;
    }

    setQuoteLoading(true);
    setQuote(null);

    try {
      const quoteResponse = await createProdigiQuote({
        sku: selectedProduct,
        copies: quantity,
        artworkUrl,
        shippingCountry,
      });

      setQuote(quoteResponse);
      
      if (quoteResponse.quotes?.length > 0) {
        setSelectedShipping(quoteResponse.quotes[0].shipmentMethod);
      }

      toast({
        title: "Quote received",
        description: "Review the pricing options below.",
      });
    } catch (error: any) {
      toast({
        title: "Quote failed",
        description: error.message || "Failed to get quote from Prodigi",
        variant: "destructive",
      });
    } finally {
      setQuoteLoading(false);
    }
  };

  const handlePlacePrintOrder = async () => {
    if (!recipientName || !addressLine1 || !city || !postalCode || !selectedShipping) {
      toast({
        title: "Missing information",
        description: "Please fill in all required shipping details.",
        variant: "destructive",
      });
      return;
    }

    setOrderLoading(true);

    try {
      const shippingMethod = selectedShipping.includes("Express") ? "Express" 
        : selectedShipping.includes("Overnight") ? "Overnight"
        : selectedShipping.includes("Budget") ? "Budget"
        : "Standard";

      const orderResponse = await createProdigiOrder({
        recipient: {
          name: recipientName,
          address: {
            line1: addressLine1,
            line2: addressLine2 || undefined,
            city,
            state: state || undefined,
            postalCode,
            country: shippingCountry,
          },
          email: email || undefined,
          phone: phone || undefined,
        },
        sku: selectedProduct,
        copies: quantity,
        artworkUrl,
        shippingMethod,
        merchantReference: `LISTING-${id}-${Date.now()}`,
      });

      setOrderId(orderResponse.order.id);
      setPrintOrderComplete(true);

      // Update activation status
      if (activationId) {
        await supabase
          .from("activations")
          .update({
            status: "payment_pending",
            print_order_id: orderResponse.order.id,
            quantity,
          })
          .eq("id", activationId);
      }

      setCurrentStep("payment");
      setActivationStatus("payment_pending");

      toast({
        title: "Print order placed!",
        description: "Now complete the listing activation payment.",
      });
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message || "Failed to place print order",
        variant: "destructive",
      });
    } finally {
      setOrderLoading(false);
    }
  };

  const handlePayNow = async () => {
    // Mark activation as completed
    if (activationId) {
      try {
        const selectedQuote = quote?.quotes?.find(q => q.shipmentMethod === selectedShipping);
        const totalAmount = selectedQuote ? parseFloat(selectedQuote.costSummary.totalCost.amount) : 0;

        await supabase
          .from("activations")
          .update({
            status: "completed",
            total_amount: totalAmount + (listing?.pricing?.weekly || 99),
          })
          .eq("id", activationId);

        setActivationStatus("completed");

        toast({
          title: "Activation Complete!",
          description: "Your booking is now confirmed and added to the publisher's calendar.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to complete activation",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Payment Gateway",
        description: "Payment integration coming soon. Contact support for manual activation.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
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
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Step Indicator */}
        <ActivationStepper 
          currentStep={currentStep} 
          approvalStatus={activationStatus === "pending_approval" ? "pending" : activationStatus === "approved" ? "approved" : undefined}
        />

        {/* Listing Summary */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {primaryImage && (
                <div className="w-full sm:w-32 h-24 overflow-hidden rounded-lg flex-shrink-0">
                  <img
                    src={primaryImage}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold">{listing.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
                {listing.specifications?.venue_type && (
                  <Badge variant="secondary" className="mt-2">
                    {listing.specifications.venue_type}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Activation Fee</p>
                <p className="text-2xl font-bold text-primary">${activationPrice}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === "design" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <AdMockupPreview onApprove={handleMockupApproval} />
            
            <div className="space-y-6">
              {designApproved ? (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <CheckCircle className="h-5 w-5" />
                      Design Approved
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium">
                        Ad Unit: {approvedAdUnitType.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Product SKU: {selectedProduct}
                      </p>
                    </div>
                    {artworkUrl && (
                      <div className="p-3 bg-muted rounded-lg">
                        <img 
                          src={artworkUrl} 
                          alt="Approved artwork" 
                          className="max-h-32 mx-auto rounded object-contain"
                        />
                      </div>
                    )}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setCurrentStep("schedule-approval")}
                    >
                      Continue to Schedule & Approval
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Step 1: Design Your Ad</CardTitle>
                    <CardDescription>
                      Upload your design and generate a preview mockup to see how your ad will look in the venue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                        Upload your design (PNG or JPG)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                        Select ad unit type (sticker, table tent, etc.)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                        Generate AI mockup preview
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                        Approve design to continue
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {currentStep === "schedule-approval" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <ScheduleApprovalStep
              activationId={activationId || ""}
              status={activationStatus}
              startDate={startDate}
              endDate={endDate}
              rejectionReason={rejectionReason}
              onDatesSelected={handleDatesSelected}
              onSubmitForApproval={handleSubmitForApproval}
              isSubmitting={submittingApproval}
            />

            {activationStatus === "approved" && (
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => setCurrentStep("print-order")}
              >
                Continue to Print Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => setCurrentStep("design")}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Design
            </Button>
          </div>
        )}

        {currentStep === "print-order" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Configure Print Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label>Shipping Country</Label>
                    <Select value={shippingCountry} onValueChange={setShippingCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIPPING_COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleGetQuote} 
                    disabled={quoteLoading || !selectedProduct}
                    className="w-full"
                  >
                    {quoteLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Quote...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Get Quote
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Quote Results */}
              {quote && quote.quotes && quote.quotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quote.quotes.map((q, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedShipping === q.shipmentMethod
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedShipping(q.shipmentMethod)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{q.shipmentMethod}</p>
                            <p className="text-sm text-muted-foreground">
                              Items: {q.costSummary.items.currency} {q.costSummary.items.amount}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">
                              {q.costSummary.totalCost.currency} {q.costSummary.totalCost.amount}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Shipping Details */}
            <div className="space-y-6">
              {quote && quote.quotes && quote.quotes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Recipient Name *</Label>
                        <Input
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Address Line 1 *</Label>
                        <Input
                          value={addressLine1}
                          onChange={(e) => setAddressLine1(e.target.value)}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Address Line 2</Label>
                        <Input
                          value={addressLine2}
                          onChange={(e) => setAddressLine2(e.target.value)}
                          placeholder="Apt, suite, etc. (optional)"
                        />
                      </div>
                      <div>
                        <Label>City *</Label>
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>State/Province</Label>
                        <Input
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Postal Code *</Label>
                        <Input
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(optional)"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Email</Label>
                        <Input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handlePlacePrintOrder}
                      disabled={orderLoading || !recipientName || !addressLine1 || !city || !postalCode || !selectedShipping}
                      className="w-full"
                      size="lg"
                    >
                      {orderLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4 mr-2" />
                          Place Print Order & Continue to Payment
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Button 
                variant="outline" 
                onClick={() => setCurrentStep("schedule-approval")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Schedule
              </Button>
            </div>
          </div>
        )}

        {currentStep === "payment" && (
          <div className="max-w-2xl mx-auto">
            {printOrderComplete && (
              <Card className="mb-6 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-primary">
                    <CheckCircle className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">Print Order Placed Successfully</p>
                      <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Complete Activation
                </CardTitle>
                <CardDescription>
                  Pay the activation fee to unlock full access to this advertising space
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

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handlePayNow}
                  disabled={activationStatus === "completed"}
                >
                  {activationStatus === "completed" ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activation Complete
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Activate Listing
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Stripe, PayPal & GCash
                </p>

                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep("print-order")}
                  className="w-full"
                  disabled={activationStatus === "completed"}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Print Order
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivateListing;
