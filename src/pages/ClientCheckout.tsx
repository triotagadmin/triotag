import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldCheck, MapPin, Calendar, Package, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BRAND_NAME } from "@/lib/brand";
import favicon from "/favicon.gif";

interface CheckoutData {
  id: string;
  token: string;
  client_name: string;
  client_email: string;
  client_company: string | null;
  listing_title: string | null;
  campaign_dates: string | null;
  line_items: any[];
  lease_total: number;
  material_total: number;
  grand_total: number;
  currency: string;
  status: string;
  print_partner_id: string;
  ad_space_id: string | null;
  activation_id: string | null;
}

const ClientCheckout = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [partnerName, setPartnerName] = useState("Print Partner");

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

      if (error || !data) throw new Error("Checkout not found");
      setCheckout(data as any);

      // Fetch partner name
      const { data: profile } = await supabase
        .from("advertiser_profiles")
        .select("company_name, contact_name")
        .eq("user_id", data.print_partner_id)
        .maybeSingle();

      if (profile) {
        setPartnerName(profile.company_name || profile.contact_name || "Print Partner");
      }
    } catch (err: any) {
      toast({ title: "Error", description: "This checkout page is not available.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!checkout) return;
    setPaying(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          checkoutToken: checkout.token,
          buyerName: checkout.client_name,
          buyerEmail: checkout.client_email,
          companyName: checkout.client_company || "",
          successUrl: `${window.location.origin}/checkout/success?token=${checkout.token}`,
          cancelUrl: window.location.href,
        },
      });

      if (error) throw error;
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (err: any) {
      toast({ title: "Payment Error", description: err.message, variant: "destructive" });
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-semibold mb-2">Checkout Not Found</p>
            <p className="text-muted-foreground text-sm">This checkout link may have expired or is invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = checkout.status === "paid";

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <img src={favicon} alt={BRAND_NAME} className="w-8 h-8" />
            <span className="font-bold text-xl text-foreground">{BRAND_NAME}</span>
          </div>
          <p className="text-sm text-muted-foreground">Secure Checkout</p>
        </div>

        {isPaid && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="text-lg font-semibold text-primary">Payment Complete</p>
              <p className="text-sm text-muted-foreground mt-1">Thank you! Your payment has been received.</p>
            </CardContent>
          </Card>
        )}

        {/* Booking Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{checkout.listing_title || "Ad Space Booking"}</CardTitle>
            <CardDescription>Prepared by {partnerName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">{checkout.client_name}</p>
                {checkout.client_company && (
                  <p className="text-xs text-muted-foreground">{checkout.client_company}</p>
                )}
              </div>
              {checkout.campaign_dates && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Campaign</p>
                  <p className="font-medium">{checkout.campaign_dates}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" /> Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(checkout.line_items || []).map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                    {item.quantity > 1 && <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>}
                  </div>
                  <span className="font-medium">₱{(item.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              {checkout.lease_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ad Space Lease</span>
                  <span>₱{checkout.lease_total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {checkout.material_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Print Materials</span>
                  <span>₱{checkout.material_total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₱{checkout.grand_total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Button */}
        {!isPaid && (
          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={handleProceedToPayment}
              disabled={paying}
            >
              {paying ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" /> Proceed to Payment — ₱{checkout.grand_total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</>
              )}
            </Button>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure payment powered by PayMongo</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCheckout;
