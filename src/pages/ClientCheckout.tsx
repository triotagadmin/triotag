import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, ShieldCheck, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckoutData {
  id: string;
  token: string;
  print_partner_id: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  listing_title: string | null;
  campaign_dates: string | null;
  line_items: any;
  lease_total: number | null;
  material_total: number | null;
  grand_total: number | null;
  currency: string | null;
  status: string | null;
  ad_space_id: string | null;
  activation_id: string | null;
}

const ClientCheckout = () => {
  const { token } = useParams<{ token: string }>();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) fetchCheckout();
  }, [token]);

  const fetchCheckout = async () => {
    try {
      const { data, error } = await supabase
        .from("client_checkouts")
        .select("*")
        .eq("token", token)
        .single();

      if (error) throw error;
      setCheckout(data as CheckoutData);
    } catch {
      setCheckout(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!checkout) return;
    setPaying(true);

    try {
      const { data, error } = await supabase.functions.invoke("client-checkout-payment", {
        body: {
          checkoutId: checkout.id,
          token: checkout.token,
          successUrl: `${window.location.origin}/payment-success?type=client_checkout&token=${checkout.token}`,
          cancelUrl: window.location.href,
        },
      });

      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message || "Failed to start payment.", variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold">Checkout not found</p>
            <p className="text-sm text-muted-foreground mt-2">This link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = checkout.status === "paid";
  const lineItems = checkout.line_items as any;
  const branches = lineItems?.branches || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">TrioTag Checkout</h1>
          <p className="text-muted-foreground mt-1">Secure payment for your advertising campaign</p>
        </div>

        {isPaid && (
          <Card className="mb-6 border-primary bg-primary/5">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold text-primary">Payment Confirmed</p>
                <p className="text-sm text-muted-foreground">This order has been paid. Your Print Partner has been notified.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign Info */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">{lineItems?.campaignTitle || checkout.listing_title || "Ad Campaign"}</CardTitle>
            <CardDescription>
              Prepared for <span className="font-medium text-foreground">{checkout.client_name}</span>
              {checkout.client_company && <> · {checkout.client_company}</>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {checkout.campaign_dates && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>{checkout.campaign_dates}</span>
              </div>
            )}
            {checkout.listing_title && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listing</span>
                <span>{checkout.listing_title}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Price Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(checkout.lease_total ?? 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ad Space Lease</span>
                <span className="font-medium">₱{(checkout.lease_total ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {branches.map((branch: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span className="font-medium">{branch.branchName}</span>
                </div>
                {branch.materials?.filter((m: any) => m.quantity > 0).map((m: any, mIdx: number) => (
                  <div key={mIdx} className="flex justify-between text-xs pl-5">
                    <span className="text-muted-foreground">
                      {m.materialLabel} ({m.quantity} × ₱{(m.customUnitPrice || 0).toFixed(2)})
                    </span>
                    <span>₱{(m.quantity * (m.customUnitPrice || 0)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ))}

            {(checkout.material_total ?? 0) > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Print Materials</span>
                <span className="font-medium">₱{(checkout.material_total ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
              <span>Grand Total</span>
              <span className="text-primary">₱{(checkout.grand_total ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>

        {/* Trust & Payment */}
        {!isPaid && (
          <Card className="border-primary/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Secure Payment</p>
                  <p className="text-muted-foreground">Payments are processed securely via PayMongo. Your payment details are never stored.</p>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handlePayment} disabled={paying}>
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting to payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Payment · ₱{(checkout.grand_total ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientCheckout;
