import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, DollarSign, Truck, CheckCircle } from "lucide-react";
import { createProdigiQuote, createProdigiOrder, ProdigiQuoteResponse } from "@/lib/prodigi";
import { AdMockupPreview } from "@/components/AdMockupPreview";

// Prodigi product catalog for ad units
const PRODIGI_PRODUCTS = [
  { 
    sku: "GLOBAL-STI-SQU-2X2", 
    name: "Square Sticker 2x2\"", 
    category: "Sticker Ads",
    description: "Perfect for guerrilla marketing and brand stickers"
  },
  { 
    sku: "GLOBAL-STI-SQU-4X4", 
    name: "Square Sticker 4x4\"", 
    category: "Sticker Ads",
    description: "Larger format for high-visibility placements"
  },
  { 
    sku: "GLOBAL-STI-CIR-2X2", 
    name: "Circle Sticker 2x2\"", 
    category: "Sticker Ads",
    description: "Round stickers for unique brand presence"
  },
  { 
    sku: "GLOBAL-STI-CIR-3X3", 
    name: "Circle Sticker 3x3\"", 
    category: "Sticker Ads",
    description: "Medium circle stickers"
  },
  { 
    sku: "GLOBAL-STI-REC-3X4", 
    name: "Rectangle Sticker 3x4\"", 
    category: "Sticker Ads",
    description: "Rectangular format for detailed designs"
  },
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

const OrderPrints = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  // Mockup approval state
  const [designApproved, setDesignApproved] = useState(false);
  const [approvedAdUnitType, setApprovedAdUnitType] = useState("");

  // Form state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [artworkUrl, setArtworkUrl] = useState("");
  const [shippingCountry, setShippingCountry] = useState("US");

  // Recipient state
  const [recipientName, setRecipientName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Quote state
  const [quote, setQuote] = useState<ProdigiQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("");

  // Order state
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");

  // Handle mockup approval
  const handleMockupApproval = (data: { artworkUrl: string; adUnitType: string; selectedSku: string }) => {
    setArtworkUrl(data.artworkUrl);
    setSelectedProduct(data.selectedSku);
    setApprovedAdUnitType(data.adUnitType);
    setDesignApproved(true);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if advertiser is verified
      const { data: profile } = await supabase
        .from("advertiser_profiles")
        .select("status")
        .eq("user_id", session.user.id)
        .single();

      if (profile?.status === "approved") {
        setIsVerified(true);
        setEmail(session.user.email || "");
      }

      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleGetQuote = async () => {
    if (!selectedProduct || !artworkUrl || !shippingCountry) {
      toast({
        title: "Missing information",
        description: "Please select a product, provide artwork URL, and select shipping country.",
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

  const handlePlaceOrder = async () => {
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
        merchantReference: `AD-${Date.now()}`,
      });

      setOrderId(orderResponse.order.id);
      setOrderComplete(true);

      toast({
        title: "Order placed successfully!",
        description: `Order ID: ${orderResponse.order.id}`,
      });
    } catch (error: any) {
      toast({
        title: "Order failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Account Verification Required</CardTitle>
              <CardDescription>
                Only verified advertiser accounts can order print materials.
                Please wait for your account to be approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/advertiser-dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle>Order Placed Successfully!</CardTitle>
              <CardDescription>
                Your print order has been submitted to Prodigi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono font-bold">{orderId}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You will receive email updates about your order status.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => {
                  setOrderComplete(false);
                  setQuote(null);
                  setSelectedProduct("");
                  setArtworkUrl("");
                  setDesignApproved(false);
                  setApprovedAdUnitType("");
                }}>
                  Place Another Order
                </Button>
                <Button variant="outline" onClick={() => navigate("/advertiser-dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Print Materials</h1>
          <p className="text-muted-foreground">
            Create professional ad units like stickers, table tent ads, and more through our print partner.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Mockup Preview Section */}
          <div className="space-y-6">
            <AdMockupPreview onApprove={handleMockupApproval} />
            
            {designApproved && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-primary">
                  ✓ Design approved for: {approvedAdUnitType.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Product SKU: {selectedProduct}
                </p>
              </div>
            )}
          </div>

          {/* Product Selection & Quote */}
          <div className="space-y-6">
            <Card className={!designApproved ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {designApproved ? "Configure Order" : "Approve Design First"}
                </CardTitle>
                {!designApproved && (
                  <CardDescription>
                    Generate and approve a mockup preview before proceeding
                  </CardDescription>
                )}
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
                  <Label>Artwork</Label>
                  {artworkUrl ? (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <img 
                        src={artworkUrl} 
                        alt="Approved artwork" 
                        className="max-h-20 mx-auto rounded object-contain"
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Original design (approved)
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload and approve a design in the preview panel
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

                <Button 
                  onClick={handleGetQuote} 
                  disabled={quoteLoading || !selectedProduct || !artworkUrl || !designApproved}
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
                          <p className="text-sm text-muted-foreground">
                            Shipping: {q.costSummary.shipping.currency} {q.costSummary.shipping.amount}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {q.costSummary.totalCost.currency} {q.costSummary.totalCost.amount}
                          </p>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Shipping Details & Place Order - Full Width Below */}
        {designApproved && quote && quote.quotes && quote.quotes.length > 0 && (
          <div className="mt-8 max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Recipient Name *</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label>Address Line 1 *</Label>
                  <Input
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <Label>Address Line 2</Label>
                  <Input
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Suite 100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <Label>State/Province</Label>
                    <Input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div>
                  <Label>Postal Code *</Label>
                  <Input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10001"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-123-4567"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handlePlaceOrder}
              disabled={orderLoading || !quote || !selectedShipping || !recipientName || !addressLine1 || !city || !postalCode}
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
                  Place Order
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Orders are processed through our print partner. 
              Production typically takes 2-5 business days plus shipping time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderPrints;
