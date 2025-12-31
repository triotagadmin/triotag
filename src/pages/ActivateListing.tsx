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
import { ActivationStepper, type ActivationStep } from "@/components/activation/ActivationStepper";
import { ScheduleApprovalStep } from "@/components/activation/ScheduleApprovalStep";
import { ProductCard } from "@/components/print-order/ProductCard";
import { OrderSuccessCard } from "@/components/print-order/OrderSuccessCard";
import { PRINT_PRODUCTS, SHIPPING_COUNTRIES, calculateOrderTotal, getProductById } from "@/lib/printProducts";
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

interface PublisherAddress {
  businessName: string;
  contactEmail: string;
  contactPhone: string | null;
  location: string | null;
}

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

  // Print order state - Manual Admin System
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [shippingCountry, setShippingCountry] = useState("PH");

  // Publisher address (shipping destination)
  const [publisherAddress, setPublisherAddress] = useState<PublisherAddress | null>(null);

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

      // Fetch publisher profile for shipping address
      if (data?.publisher_id) {
        const { data: publisherProfile } = await supabase
          .from("publisher_profiles")
          .select("business_name, contact_email, contact_phone, location")
          .eq("id", data.publisher_id)
          .single();

        if (publisherProfile) {
          setPublisherAddress({
            businessName: publisherProfile.business_name,
            contactEmail: publisherProfile.contact_email,
            contactPhone: publisherProfile.contact_phone,
            location: publisherProfile.location,
          });
        }
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
        setQuantity(data.quantity || 1);
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

  const handlePlacePrintOrder = async () => {
    if (!selectedProductId) {
      toast({
        title: "Missing information",
        description: "Please select a product.",
        variant: "destructive",
      });
      return;
    }

    if (!publisherAddress) {
      toast({
        title: "Missing information",
        description: "Publisher address not available.",
        variant: "destructive",
      });
      return;
    }

    const product = getProductById(selectedProductId);
    if (!product) {
      toast({
        title: "Invalid product",
        description: "Please select a valid product.",
        variant: "destructive",
      });
      return;
    }

    if (quantity < product.minQuantity) {
      toast({
        title: "Minimum quantity required",
        description: `This product requires a minimum of ${product.minQuantity} units.`,
        variant: "destructive",
      });
      return;
    }

    setOrderLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const totalPrice = calculateOrderTotal(product, quantity);

      // Create print order in database - shipping to publisher venue
      const { data: printOrder, error: orderError } = await supabase
        .from("print_orders")
        .insert({
          activation_id: activationId,
          advertiser_id: session.user.id,
          order_status: "pending_admin",
          product_sku: product.sku,
          product_name: product.name,
          product_specs: product.specs,
          quantity,
          design_url: artworkUrl,
          shipping_address: {
            recipientName: publisherAddress.businessName,
            line1: publisherAddress.location || listing?.location || "",
            line2: null,
            city: null,
            state: null,
            postalCode: null,
            country: shippingCountry,
            email: publisherAddress.contactEmail,
            phone: publisherAddress.contactPhone,
          },
          shipping_country: shippingCountry,
          total_price: totalPrice,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Update activation status
      if (activationId) {
        await supabase
          .from("activations")
          .update({
            status: "printing",
            print_order_id: printOrder.id,
            quantity,
          })
          .eq("id", activationId);
      }

      setOrderId(printOrder.id);
      setPrintOrderComplete(true);
      setActivationStatus("printing");

      toast({
        title: "Order Submitted!",
        description: "Our team will review your order and contact you for payment.",
      });
    } catch (error: any) {
      console.error("Order error:", error);
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order",
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
        const product = getProductById(selectedProductId);
        const totalAmount = product ? calculateOrderTotal(product, quantity) : 0;

        await supabase
          .from("activations")
          .update({
            status: "completed",
            total_amount: totalAmount + (listing?.pricing?.weekly || 99),
          })
          .eq("id", activationId);

        setActivationStatus("completed");

        // Send notification to venue publisher
        if (listing?.publisher_id) {
          // Get publisher user_id from publisher_profiles
          const { data: publisherProfile } = await supabase
            .from("publisher_profiles")
            .select("user_id, business_name")
            .eq("id", listing.publisher_id)
            .single();

          if (publisherProfile?.user_id) {
            await supabase
              .from("notifications")
              .insert({
                user_id: publisherProfile.user_id,
                title: "Print Ad Material Confirmed!",
                message: `Great news! An advertiser has completed payment for "${listing.title}". Tiny Sticky Ads is now handling the Print Ad Material for your venue.`,
                type: "payment_received",
              });
          }
        }

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

  const selectedPrintProduct = getProductById(selectedProductId);
  const orderTotal = selectedPrintProduct ? calculateOrderTotal(selectedPrintProduct, quantity) : 0;

  // Calculate subscription price based on selected duration
  const calculateSubscriptionPrice = () => {
    if (!startDate || !endDate || !listing) return 0;
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    
    // Get pricing from ad_units if available
    const adUnits = listing.specifications?.ad_units || [];
    const selectedAdUnit = adUnits.find((unit: any) => 
      unit.type === approvedAdUnitType || unit.type === activationType
    ) || adUnits[0];
    
    const weeklyRate = selectedAdUnit?.weekly_subscription_fee || listing.pricing?.weekly || 0;
    const monthlyRate = selectedAdUnit?.monthly_subscription_fee || listing.pricing?.monthly || 0;
    
    // Use monthly rate if duration is 4+ weeks, otherwise use weekly
    if (diffWeeks >= 4) {
      const months = Math.ceil(diffWeeks / 4);
      return months * monthlyRate;
    }
    
    return diffWeeks * weeklyRate;
  };

  const subscriptionPrice = calculateSubscriptionPrice();

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

  const activationPrice = subscriptionPrice > 0 ? subscriptionPrice : (listing.pricing?.weekly || listing.pricing?.monthly || 0);

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
                <p className="text-sm text-muted-foreground">
                  {startDate && endDate ? (
                    <>Subscription ({Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))} week{Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) !== 1 ? 's' : ''})</>
                  ) : (
                    'Subscription Fee'
                  )}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {subscriptionPrice > 0 ? `₱${subscriptionPrice.toLocaleString()}` : 'Select dates'}
                </p>
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
                    <CardTitle>Step 1: Upload Your Design</CardTitle>
                    <CardDescription>
                      Upload your design photos to proceed with your ad activation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                        Upload your design photos (PNG or JPG, max 30)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
                        Select ad unit type (sticker, table tent, etc.)
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
          <>
            {printOrderComplete ? (
              <OrderSuccessCard
                orderId={orderId}
                productName={selectedPrintProduct?.name || "Print Order"}
                quantity={quantity}
                onNewOrder={() => {
                  setPrintOrderComplete(false);
                  setOrderId("");
                  setSelectedProductId("");
                }}
              />
            ) : (
              <div className="space-y-8">
                {/* Product Selection */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Select Print Product
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {PRINT_PRODUCTS.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        selected={selectedProductId === product.id}
                        onClick={() => {
                          setSelectedProductId(product.id);
                          setQuantity(Math.max(quantity, product.minQuantity));
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Order Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Order Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {artworkUrl && (
                        <div className="p-3 bg-muted rounded-lg">
                          <Label className="text-xs text-muted-foreground">Your Design</Label>
                          <img 
                            src={artworkUrl} 
                            alt="Your design" 
                            className="max-h-24 mt-2 rounded object-contain"
                          />
                        </div>
                      )}

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min={selectedPrintProduct?.minQuantity || 1}
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        />
                        {selectedPrintProduct && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Minimum: {selectedPrintProduct.minQuantity} units
                          </p>
                        )}
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

                      {selectedPrintProduct && (
                        <div className="pt-4 border-t">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Product</span>
                            <span>{selectedPrintProduct.name}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Quantity</span>
                            <span>{quantity} units</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t">
                            <span>Estimated Total</span>
                            <span className="text-primary">₱{orderTotal.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Final price confirmed after admin review
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Shipping Details - Publisher Venue Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Shipping Destination
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Print materials will be shipped directly to the publisher venue
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {publisherAddress ? (
                        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Venue Name</Label>
                            <p className="font-medium">{publisherAddress.businessName}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Address</Label>
                            <p className="font-medium">{publisherAddress.location || listing?.location || "Not specified"}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Contact Email</Label>
                              <p className="text-sm">{publisherAddress.contactEmail}</p>
                            </div>
                            {publisherAddress.contactPhone && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Contact Phone</Label>
                                <p className="text-sm">{publisherAddress.contactPhone}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground">Loading publisher address...</p>
                        </div>
                      )}

                      <Button
                        onClick={handlePlacePrintOrder}
                        disabled={orderLoading || !selectedProductId || !publisherAddress}
                        className="w-full"
                        size="lg"
                      >
                        {orderLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting Order...
                          </>
                        ) : (
                          <>
                            <Package className="h-4 w-4 mr-2" />
                            Order Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep("schedule-approval")}
                  className="w-full max-w-md mx-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Schedule
                </Button>
              </div>
            )}
          </>
        )}

        {currentStep === "payment" && (
          <div className="max-w-2xl mx-auto">
            {printOrderComplete && (
              <Card className="mb-6 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-primary">
                    <CheckCircle className="h-6 w-6" />
                    <div>
                      <p className="font-semibold">Print Order Submitted</p>
                      <p className="text-sm text-muted-foreground">Order ID: {orderId.slice(0, 8).toUpperCase()}</p>
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
