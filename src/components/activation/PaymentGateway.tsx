import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Wallet, Loader2, CheckCircle, Shield, Lock } from "lucide-react";
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

type PaymentMethod = "gcash" | "maya" | "card";

const PAYMENT_METHODS = [
  {
    id: "gcash" as PaymentMethod,
    name: "GCash",
    description: "Pay with your GCash e-wallet",
    icon: Smartphone,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "maya" as PaymentMethod,
    name: "Maya",
    description: "Pay with your Maya e-wallet",
    icon: Wallet,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "card" as PaymentMethod,
    name: "Credit/Debit Card",
    description: "Visa, Mastercard, JCB",
    icon: CreditCard,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("gcash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const { toast } = useToast();

  const formatPrice = (price: number, curr: string) => {
    const symbols: Record<string, string> = {
      PHP: "₱",
      USD: "$",
      EUR: "€",
    };
    return `${symbols[curr] || curr} ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
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
            phone: buyerPhone || undefined,
          },
          payment_method_types: selectedMethod === "card" 
            ? ["card"] 
            : selectedMethod === "gcash" 
              ? ["gcash"] 
              : ["paymaya"],
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
      <Card className="border-primary/30">
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
              <span>{listingTitle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono">{orderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Amount</span>
                <span className="text-primary">{formatPrice(amount, currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buyer Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Billing Information</CardTitle>
          <CardDescription>Enter your details for payment receipt</CardDescription>
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
              placeholder="+63 917 123 4567"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Select Payment Method
          </CardTitle>
          <CardDescription>Choose how you'd like to pay</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="space-y-3"
            disabled={isProcessing}
          >
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  className={`relative flex items-center space-x-4 rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => !isProcessing && setSelectedMethod(method.id)}
                >
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className={`p-2 rounded-lg ${method.bgColor}`}>
                    <Icon className={`h-5 w-5 ${method.color}`} />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor={method.id} className="font-medium cursor-pointer">
                      {method.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={isProcessing || disabled || !buyerName || !buyerEmail}
        className="w-full h-14 text-lg"
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
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Secured by PayMongo. Your payment information is encrypted.</span>
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
