import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { 
  ArrowLeft,
  Upload,
  Smartphone,
  CreditCard,
  CheckCircle
} from "lucide-react";

interface TicketSelection {
  ticketId: string;
  ticketName: string;
  price: number;
  quantity: number;
}

const EventCheckout = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<any>(null);
  const [tickets, setTickets] = useState<TicketSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  // Form fields
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");

  useEffect(() => {
    if (eventId) {
      fetchEventAndTickets();
    }
  }, [eventId]);

  const fetchEventAndTickets = async () => {
    try {
      // Parse ticket selections from URL
      const ticketParams = searchParams.get("tickets");
      if (!ticketParams) {
        navigate(`/events/${eventId}`);
        return;
      }

      const selections = ticketParams.split(",").map(s => {
        const [id, qty] = s.split(":");
        return { id, qty: parseInt(qty) };
      });

      // Fetch event and tickets
      const { data: eventData, error } = await supabase
        .from("events")
        .select(`
          *,
          event_tickets (*)
        `)
        .eq("id", eventId)
        .single();

      if (error) throw error;
      setEvent(eventData);

      // Map selections to ticket details
      const ticketDetails: TicketSelection[] = selections
        .map(sel => {
          const ticket = eventData.event_tickets.find((t: any) => t.id === sel.id);
          if (!ticket) return null;
          return {
            ticketId: ticket.id,
            ticketName: ticket.ticket_name,
            price: ticket.ticket_price,
            quantity: sel.qty
          };
        })
        .filter(Boolean) as TicketSelection[];

      setTickets(ticketDetails);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to load checkout.",
        variant: "destructive"
      });
      navigate(`/events/${eventId}`);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return tickets.reduce((sum, t) => sum + t.price * t.quantity, 0);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName || !buyerEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (getTotalAmount() > 0 && !paymentProofFile) {
      toast({
        title: "Payment Proof Required",
        description: "Please upload your payment screenshot.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      let proofUrl = "";

      // Upload payment proof if provided
      if (paymentProofFile) {
        const fileExt = paymentProofFile.name.split(".").pop();
        const fileName = `proofs/${eventId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("event-assets")
          .upload(fileName, paymentProofFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("event-assets")
          .getPublicUrl(fileName);

        proofUrl = publicUrl;
      }

      // Create purchases for each ticket type
      const purchases = tickets.map(ticket => ({
        event_ticket_id: ticket.ticketId,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone || null,
        quantity: ticket.quantity,
        total_amount: ticket.price * ticket.quantity,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        payment_status: getTotalAmount() === 0 ? "confirmed" : "pending",
        ticket_status: getTotalAmount() === 0 ? "valid" : "pending",
        qr_code: getTotalAmount() === 0 ? `TICKET-${crypto.randomUUID()}` : null
      }));

      const { data: insertedPurchases, error } = await supabase
        .from("event_purchases")
        .insert(purchases)
        .select();

      if (error) throw error;

      setOrderCode(insertedPurchases?.[0]?.order_code || "");
      setSuccess(true);

      toast({
        title: getTotalAmount() === 0 ? "Tickets Confirmed!" : "Order Submitted!",
        description: getTotalAmount() === 0 
          ? "Your tickets are ready. Check your email for the QR code."
          : "Your order is pending payment verification."
      });
    } catch (error: any) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12 max-w-lg">
          <Card className="text-center">
            <CardContent className="pt-12 pb-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
              <h1 className="text-2xl font-bold mb-2">
                {getTotalAmount() === 0 ? "Tickets Confirmed!" : "Order Submitted!"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {getTotalAmount() === 0 
                  ? "Your free tickets are confirmed. You will receive the QR code ticket via email."
                  : "Your order is pending payment verification. Once confirmed, you will receive your QR code ticket via email."}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Order Reference: <span className="font-mono font-bold">{orderCode.substring(0, 8)}</span>
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Confirmation email sent to: <span className="font-medium">{buyerEmail}</span>
              </p>
              <Button onClick={() => navigate("/events")}>
                Browse More Events
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/events/${eventId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event
        </Button>

        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-8">{event?.title}</p>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <Card className="lg:order-2">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.ticketId} className="flex justify-between text-sm">
                    <span>
                      {ticket.ticketName} × {ticket.quantity}
                    </span>
                    <span>₱{(ticket.price * ticket.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span>₱{getTotalAmount().toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Info & Payment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Buyer Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>We'll send your tickets to this email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="juan@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              {getTotalAmount() > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Select your preferred payment method</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="gcash" id="gcash" />
                        <Label htmlFor="gcash" className="flex items-center gap-2 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium">GCash</p>
                            <p className="text-sm text-muted-foreground">Pay via GCash QR or number</p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem value="maya" id="maya" />
                        <Label htmlFor="maya" className="flex items-center gap-2 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">Maya</p>
                            <p className="text-sm text-muted-foreground">Pay via Maya QR or number</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Payment Instructions */}
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Payment Instructions</h4>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Open your {paymentMethod === "gcash" ? "GCash" : "Maya"} app</li>
                        <li>Send ₱{getTotalAmount().toLocaleString()} to <span className="font-mono font-bold">0917-XXX-XXXX</span></li>
                        <li>Take a screenshot of your payment confirmation</li>
                        <li>Upload the screenshot below</li>
                      </ol>
                    </div>

                    {/* Upload Payment Proof */}
                    <div>
                      <Label>Payment Screenshot *</Label>
                      <div className="mt-2">
                        {paymentProofPreview ? (
                          <div className="relative">
                            <img 
                              src={paymentProofPreview} 
                              alt="Payment proof" 
                              className="w-full max-h-64 object-contain rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setPaymentProofFile(null);
                                setPaymentProofPreview("");
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Click to upload payment screenshot</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleProofUpload}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Processing..." : `Complete Order - ₱${getTotalAmount().toLocaleString()}`}
              </Button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default EventCheckout;