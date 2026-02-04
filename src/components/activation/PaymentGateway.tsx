import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Loader2, CheckCircle, Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PaymentGatewayProps {
  amount: number;
  currency: string;
  orderId: string;
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
  },
];

export const PaymentGateway = ({
  amount,
  currency,
  orderId,
  activationId,
  listingTitle,
  onPaymentSuccess,
  onBack,
  disabled = false,
}: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("visa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  
  // Card details state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  
  // GCash state
  const [gcashNumber, setGcashNumber] = useState("");
  
  const { toast } = useToast();

  const formatPrice = (price: number, curr: string) => {
    const symbols: Record<string, string> = {
      PHP: "₱",
      USD: "$",
      EUR: "€",
    };
    return `${symbols[curr] || curr} ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    if (!buyerName || !buyerEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod === "visa" && (!cardNumber || !cardExpiry || !cardCvc)) {
      toast({
        title: "Missing Card Details",
        description: "Please enter your card number, expiry date, and CVC.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod === "gcash" && !gcashNumber) {
      toast({
        title: "Missing GCash Number",
        description: "Please enter your GCash mobile number.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Call PayMongo checkout edge function
      const { data, error } = await supabase.functions.invoke("paymongo-checkout", {
        body: {
          amount: amount * 100, // Convert to centavos
          currency: currency || "PHP",
          description: `Ad Space Activation - ${listingTitle}`,
          metadata: {
            activation_id: activationId,
            order_id: orderId,
            type: "activation_payment",
          },
          buyer: {
            name: buyerName,
            email: buyerEmail,
            phone: selectedMethod === "gcash" ? gcashNumber : (buyerPhone || undefined),
          },
          payment_method_types: selectedMethod === "visa" ? ["card"] : ["gcash"],
          success_url: `${window.location.origin}/activate/${activationId}?payment=success`,
          cancel_url: `${window.location.origin}/activate/${activationId}?payment=cancelled`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.checkout_url) {
        // Redirect to PayMongo checkout
        window.location.href = data.checkout_url;
      } else {
        // For demo/dev mode, simulate success
        toast({
          title: "Payment Processing",
          description: "Redirecting to payment gateway...",
        });
        
        // Simulate payment success after delay (dev mode)
        setTimeout(() => {
          onPaymentSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="border-t border-primary/20 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Amount</span>
                <span className="text-2xl font-bold text-primary">{formatPrice(amount, currency)}</span>
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
                  className={`relative flex flex-col rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => !isProcessing && setSelectedMethod(method.id)}
                >
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

      {/* Payment Details Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {selectedMethod === "visa" ? "Card Details" : "GCash Details"}
          </CardTitle>
          <CardDescription>
            {selectedMethod === "visa" 
              ? "Enter your card information securely" 
              : "Enter your GCash registered mobile number"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Billing Info */}
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

          {selectedMethod === "visa" ? (
            <>
              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number *</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    disabled={isProcessing}
                    className="pr-20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <div className="bg-[#1A1F71] text-white text-[8px] font-bold px-1.5 py-0.5 rounded italic">
                      VISA
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry & CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Expiry Date *</Label>
                  <Input
                    id="cardExpiry"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
                    disabled={isProcessing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardCvc">CVC *</Label>
                  <Input
                    id="cardCvc"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    type="password"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </>
          ) : (
            /* GCash Mobile Number */
            <div className="space-y-2">
              <Label htmlFor="gcashNumber">GCash Mobile Number *</Label>
              <div className="relative">
                <Input
                  id="gcashNumber"
                  placeholder="09XX XXX XXXX"
                  value={gcashNumber}
                  onChange={(e) => setGcashNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  maxLength={11}
                  disabled={isProcessing}
                  className="pl-14"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  +63
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You will receive a payment request on your GCash app
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing || disabled || !buyerName || !buyerEmail}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Pay {formatPrice(amount, currency)}
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
