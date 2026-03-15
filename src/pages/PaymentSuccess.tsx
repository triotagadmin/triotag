import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, XCircle, Calendar, MapPin, ArrowRight, Download, CreditCard, Receipt } from "lucide-react";
import { Navigation } from "@/components/Navigation";

interface BookingDetails {
  id: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: string;
}

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const sessionId = searchParams.get("session_id");
  const activationId = searchParams.get("activation_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !activationId) {
        setStatus("failed");
        setErrorMessage("Missing payment session information");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("activation-payment-callback", {
          body: { sessionId, activationId },
        });
        if (error) throw error;

        if (data?.success) {
          const { data: activation } = await supabase
            .from("activations")
            .select(`*, ad_spaces (title, location, specifications)`)
            .eq("id", activationId)
            .single();

          if (activation) {
            const specs = activation.ad_spaces?.specifications as Record<string, unknown>;
            setBooking({
              id: activation.id,
              title: (activation.ad_spaces as any)?.title || "Ad Space",
              location: (activation.ad_spaces as any)?.location || "",
              startDate: activation.start_date || "",
              endDate: activation.end_date || "",
              amount: activation.total_amount || 0,
              currency: (specs?.lease_currency as string) || (specs?.currency as string) || "PHP",
              paymentMethod: "PayMongo Checkout",
              transactionDate: new Date().toISOString(),
            });
          }
          setStatus("success");
        } else {
          setStatus("failed");
          setErrorMessage(data?.message || "Payment verification failed");
        }
      } catch (error: any) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setErrorMessage(error.message || "Failed to verify payment");
      }
    };
    verifyPayment();
  }, [sessionId, activationId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  const formatPrice = (amount: number, currency: string) => {
    const symbols: Record<string, string> = { PHP: "₱", USD: "$", EUR: "€" };
    return `${symbols[currency] || currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const handleDownloadReceipt = () => {
    if (!booking) return;
    const receiptText = [
      "========================================",
      "        TRIOTAG — BOOKING RECEIPT       ",
      "========================================",
      "",
      `Booking ID:      ${booking.id.slice(0, 8).toUpperCase()}`,
      `Ad Space:        ${booking.title}`,
      `Location:        ${booking.location}`,
      `Period:          ${formatDate(booking.startDate)} — ${formatDate(booking.endDate)}`,
      "",
      `Amount Paid:     ${formatPrice(booking.amount, booking.currency)}`,
      `Payment Status:  Paid`,
      `Payment Method:  ${booking.paymentMethod}`,
      `Transaction Date:${formatDate(booking.transactionDate)}`,
      "",
      "========================================",
      "  Thank you for advertising with TrioTag",
      "========================================",
    ].join("\n");

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `triotag-receipt-${booking.id.slice(0, 8).toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-xl">
        {status === "verifying" && (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
                  <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "success" && booking && (
          <Card className="border-primary">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
              <CardDescription className="text-base">
                Your payment was successful and your ad space booking is now confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg">{booking.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(booking.startDate)} — {formatDate(booking.endDate)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Booking ID</span>
                  <span className="font-mono font-semibold">{booking.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status</span>
                  <Badge className="bg-primary text-primary-foreground">Paid</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <CreditCard className="h-4 w-4" />
                    {booking.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(booking.amount, booking.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Transaction Date</span>
                  <span className="text-sm">{formatDate(booking.transactionDate)}</span>
                </div>
              </div>

              {/* What's Next */}
              <div className="space-y-3">
                <h4 className="font-medium">What happens next?</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Your booking has been added to the publisher's calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                    <span>Print materials will be shipped to the venue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                    <span>You'll receive confirmation emails with full details</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleDownloadReceipt} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button onClick={() => navigate("/advertiser-dashboard")} className="w-full">
                  <Receipt className="h-4 w-4 mr-2" />
                  View Booking Details
                </Button>
                <Button variant="ghost" onClick={() => navigate("/explore")} className="w-full">
                  Browse More Listings
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "failed" && (
          <Card className="border-destructive">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Payment Verification Failed</CardTitle>
              <CardDescription className="text-base">
                {errorMessage || "We couldn't verify your payment. Please try again or contact support."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate(`/activate/${activationId}`)} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate("/advertiser-dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
