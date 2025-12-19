import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, DollarSign, CreditCard, CheckCircle, Package, Truck, Loader2, Palette, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { AdMockupPreview } from "@/components/AdMockupPreview";
import { createProdigiQuote, createProdigiOrder, ProdigiQuoteResponse } from "@/lib/prodigi";

interface ListingDetails {
  id: string;
  title: string;
  location: string;
  description: string;
  pricing: any;
  specifications: any;
  media_urls: any;
}

const PRODIGI_PRODUCTS = [
  { sku: "GLOBAL-STI-SQU-2X2", name: "Square Sticker 2x2\"", category: "Sticker Ads" },
  { sku: "GLOBAL-STI-SQU-4X4", name: "Square Sticker 4x4\"", category: "Sticker Ads" },
  { sku: "GLOBAL-STI-CIR-2X2", name: "Circle Sticker 2x2\"", category: "Sticker Ads" },
  { sku: "GLOBAL-STI-CIR-3X3", name: "Circle Sticker 3x3\"", category: "Sticker Ads" },
  { sku: "GLOBAL-STI-REC-3X4", name: "Rectangle Sticker 3x4\"", category: "Sticker Ads" },
];

const SHIPPING_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "PH", name: "Philippines" },
];

type ActivationStep = "design" | "print-order" | "payment";

const ActivateListing = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<ActivationStep>("design");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Design step state
  const [designApproved, setDesignApproved] = useState(false);
  const [approvedAdUnitType, setApprovedAdUnitType] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

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

  const handleMockupApproval = (data: { artworkUrl: string; adUnitType: string; selectedSku: string }) => {
    setArtworkUrl(data.artworkUrl);
    setSelectedProduct(data.selectedSku);
    setApprovedAdUnitType(data.adUnitType);
    setDesignApproved(true);
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
      setCurrentStep("payment");

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

  const handlePayNow = () => {
    toast({
      title: "Payment Gateway",
      description: "Payment integration coming soon. Contact support for manual activation.",
    });
  };

  const steps = [
    { id: "design", label: "Design Ad", icon: Palette },
    { id: "print-order", label: "Print Order", icon: Package },
    { id: "payment", label: "Payment", icon: CreditCard },
  ];

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
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = 
                (step.id === "design" && (currentStep === "print-order" || currentStep === "payment")) ||
                (step.id === "print-order" && currentStep === "payment");

              return (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : isCompleted 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                    <span className="font-medium hidden sm:inline">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-5 w-5 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
                      onClick={() => setCurrentStep("print-order")}
                    >
                      Continue to Print Order
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
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Selected Product</p>
                    <p className="font-medium">{PRODIGI_PRODUCTS.find(p => p.sku === selectedProduct)?.name || selectedProduct}</p>
                  </div>

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
                onClick={() => setCurrentStep("design")}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Design
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
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Activate Listing
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Stripe, PayPal & GCash
                </p>

                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep("print-order")}
                  className="w-full"
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
