import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Loader2, CheckCircle, Shield, Lock, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentGatewayProps {
  activationId: string;
  listingTitle: string;
  onPaymentSuccess: () => void;
  onBack: () => void;
  disabled?: boolean;
}

type PaymentMethod = "visa" | "gcash";

const PAYMENT_METHODS = [
  {
    id: "visa" as PaymentMethod,
    name: "Credit/Debit Card",
    description: "Pay securely with Visa, Mastercard, or JCB",
    icon: CreditCard,
    logos: ["VISA", "Mastercard", "JCB"],
  },
  {
    id: "gcash" as PaymentMethod,
    name: "GCash",
    description: "Pay instantly with your GCash e-wallet",
    icon: Smartphone,
    logos: ["GCash"],
    comingSoon: true,
  },
];

export const PaymentGateway = ({
  activationId,
  listingTitle,
  onPaymentSuccess,
  onBack,
  disabled = false,
}: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("visa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingAmount, setBookingAmount] = useState(0);
  const [currency, setCurrency] = useState("PHP");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const { toast } = useToast();

  // Fetch booking amount from database
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!activationId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: activation, error } = await supabase
          .from("activations")
          .select(`
            *,
            ad_spaces (
              title,
              specifications,
              pricing
            )
          `)
          .eq("id", activationId)
          .single();

        if (error) throw error;

        // Calculate amount from activation data
        let amount = activation.total_amount || activation.estimated_publisher_payout || 0;

        // If no total_amount, calculate from dates and pricing
        if (amount <= 0 && activation.start_date && activation.end_date) {
          const startDate = new Date(activation.start_date);
          const endDate = new Date(activation.end_date);
          const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const diffWeeks = Math.ceil(diffDays / 7);

          const adSpace = activation.ad_spaces as Record<string, unknown>;
          const specs = adSpace?.specifications as Record<string, unknown>;
          const pricing = adSpace?.pricing as Record<string, unknown>;
          const adUnits = (specs?.ad_units || pricing?.ad_units || []) as Array<Record<string, unknown>>;
          const selectedAdUnit = adUnits[0];

          const weeklyRate = (selectedAdUnit?.pricePerWeek || pricing?.weekly || 0) as number;
          const monthlyRate = (selectedAdUnit?.pricePerMonth || pricing?.monthly || 0) as number;

          if (diffWeeks >= 4 && monthlyRate > 0) {
            const fullMonths = Math.floor(diffWeeks / 4);
            const remainingWeeks = diffWeeks % 4;
            amount = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
          } else {
            amount = diffWeeks * weeklyRate;
          }
        }

        // Add print order total if exists
        if (activation.print_order_id) {
          const { data: printOrder } = await supabase
            .from("print_orders")
            .select("total_price")
            .eq("id", activation.print_order_id)
            .single();

          if (printOrder?.total_price) {
            amount += printOrder.total_price;
          }
        }

        setBookingAmount(amount);
        
        const specs = (activation.ad_spaces as Record<string, unknown>)?.specifications as Record<string, unknown>;
        setCurrency((specs?.currency as string) || "PHP");

        // Pre-fill user email if logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setBuyerEmail(session.user.email);
        }
      } catch (error) {
        console.error("Error fetching booking details:", error);
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
  }, [activationId, toast]);

  const formatPrice = (price: number, curr: string = currency) => {
    const symbols: Record<string, string> = {
      PHP: "₱",
      USD: "$",
      EUR: "€",
    };
    return `${symbols[curr] || curr} ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const handleProceedToCheckout = async () => {
    if (!buyerName || !buyerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call secure activation checkout edge function
      const { data, error } = await supabase.functions.invoke("activation-checkout", {
        body: {
          activationId,
          buyerName,
          buyerEmail,
          buyerPhone: buyerPhone || undefined,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/activate/${activationId}?payment=cancelled`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.checkoutUrl) {
        toast({
          title: "Redirecting to Secure Checkout",
          description: "You will be redirected to complete your payment...",
        });

        // Redirect to PayMongo checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } finally {
      // Don't reset isProcessing here since we're redirecting
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading booking details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ad Space Activation</span>
              <span className="font-medium">{listingTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Booking ID</span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{activationId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="border-t border-primary/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Amount</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(bookingAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Select your preferred payment option</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            disabled={isProcessing}
          >
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <div
                  key={method.id}
                  className={`relative flex flex-col rounded-xl border-2 p-4 transition-all ${
                    (method as any).comingSoon
                      ? "border-border opacity-60 cursor-not-allowed"
                      : isSelected
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 cursor-pointer"
                        : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                  }`}
                  onClick={() => !isProcessing && !(method as any).comingSoon && setSelectedMethod(method.id)}
                >
                  {(method as any).comingSoon && (
                    <div className="absolute top-2 right-2 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30 uppercase tracking-wider">
                      Coming Soon
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                    <div className={`p-2.5 rounded-xl ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={method.id} className="font-semibold cursor-pointer text-base">
                        {method.name}
                      </Label>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{method.description}</p>

                  {/* Payment Logos */}
                  <div className="flex items-center gap-2 mt-auto">
                    {method.id === "visa" && (
                      <>
                        <div className="bg-[#1A1F71] text-white text-[10px] font-bold px-2 py-1 rounded italic">
                          VISA
                        </div>
                        <div className="flex">
                          <div className="w-4 h-4 bg-[#EB001B] rounded-full -mr-1.5"></div>
                          <div className="w-4 h-4 bg-[#F79E1B] rounded-full opacity-90"></div>
                        </div>
                        <div className="bg-[#0B4EA2] text-white text-[8px] font-bold px-1.5 py-1 rounded">
                          JCB
                        </div>
                      </>
                    )}
                    {method.id === "gcash" && (
                      <div className="bg-[#007DFE] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                        GCash
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Billing Information</CardTitle>
          <CardDescription>Enter your details to receive payment confirmation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buyerName">Full Name *</Label>
              <Input
                id="buyerName"
                placeholder="Juan Dela Cruz"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerEmail">Email Address *</Label>
              <Input
                id="buyerEmail"
                type="email"
                placeholder="juan@example.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyerPhone">Phone Number (Optional)</Label>
            <Input
              id="buyerPhone"
              type="tel"
              placeholder="09XX XXX XXXX"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Secure Notice */}
      <div className="bg-muted/50 rounded-lg p-4 border">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Secure Checkout</p>
            <p className="text-xs text-muted-foreground mt-1">
              You will be redirected to PayMongo's secure checkout page to complete your payment. 
              Your card details are never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Proceed to Checkout Button */}
      <Button
        onClick={handleProceedToCheckout}
        disabled={isProcessing || disabled || !buyerName || !buyerEmail || bookingAmount <= 0}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Redirecting to Secure Checkout...
          </>
        ) : (
          <>
            <ExternalLink className="h-5 w-5 mr-2" />
            Proceed to Secure Checkout - {formatPrice(bookingAmount)}
          </>
        )}
      </Button>

      {/* Security Notice */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>256-bit SSL encrypted payment</span>
        </div>
        <div className="flex items-center gap-3 opacity-60">
          <div className="bg-[#1A1F71] text-white text-[8px] font-bold px-1.5 py-0.5 rounded italic">
            VISA
          </div>
          <div className="flex">
            <div className="w-3 h-3 bg-[#EB001B] rounded-full -mr-1"></div>
            <div className="w-3 h-3 bg-[#F79E1B] rounded-full opacity-90"></div>
          </div>
          <div className="bg-[#007DFE] text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
            GCash
          </div>
        </div>
      </div>

      {/* Back Button */}
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isProcessing}
        className="w-full"
      >
        Back to Print Order
      </Button>
    </div>
  );
};
