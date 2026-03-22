import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import favicon from "/favicon.gif";

const ClientPaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<any>(null);

  useEffect(() => {
    if (token) {
      supabase
        .from("client_checkouts")
        .select("client_name, listing_title, grand_total, status")
        .eq("token", token)
        .single()
        .then(({ data }) => {
          setCheckout(data);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={favicon} alt={BRAND_NAME} className="w-6 h-6" />
            <span className="font-bold text-lg">{BRAND_NAME}</span>
          </div>
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you{checkout?.client_name ? `, ${checkout.client_name}` : ""}! Your payment has been received and confirmed.
          </p>
          {checkout?.listing_title && (
            <p className="text-sm font-medium">{checkout.listing_title}</p>
          )}
          {checkout?.grand_total > 0 && (
            <p className="text-lg font-bold text-primary">
              ₱{checkout.grand_total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4">
            You can close this page. The Print Partner has been notified and will begin processing your order.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientPaymentSuccess;
