import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { 
  ArrowLeft,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Ticket,
  DollarSign,
  Users,
  QrCode
} from "lucide-react";
import { format } from "date-fns";

interface Purchase {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  quantity: number;
  total_amount: number;
  payment_method: string;
  payment_proof_url: string;
  payment_status: string;
  ticket_status: string;
  qr_code: string;
  checked_in_at: string;
  order_code: string;
  created_at: string;
  event_tickets: {
    ticket_name: string;
  };
}

interface EventStats {
  total_tickets: number;
  tickets_sold: number;
  total_revenue: number;
  pending_payments: number;
  checked_in: number;
}

const EventSales = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<EventStats>({
    total_tickets: 0,
    tickets_sold: 0,
    total_revenue: 0,
    pending_payments: 0,
    checked_in: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select(`
          *,
          event_tickets (
            id,
            ticket_name,
            ticket_price,
            quantity_available,
            quantity_sold
          )
        `)
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Calculate stats
      const totalTickets = eventData.event_tickets?.reduce((sum: number, t: any) => sum + t.quantity_available, 0) || 0;
      const ticketsSold = eventData.event_tickets?.reduce((sum: number, t: any) => sum + t.quantity_sold, 0) || 0;

      // Fetch all purchases for this event's tickets
      const ticketIds = eventData.event_tickets?.map((t: any) => t.id) || [];
      
      if (ticketIds.length > 0) {
        const { data: purchasesData, error: purchasesError } = await supabase
          .from("event_purchases")
          .select(`
            *,
            event_tickets (
              ticket_name
            )
          `)
          .in("event_ticket_id", ticketIds)
          .order("created_at", { ascending: false });

        if (purchasesError) throw purchasesError;
        setPurchases(purchasesData || []);

        // Calculate additional stats
        const confirmedPurchases = (purchasesData || []).filter(p => p.payment_status === "confirmed");
        const pendingPayments = (purchasesData || []).filter(p => p.payment_status === "pending").length;
        const checkedIn = (purchasesData || []).filter(p => p.ticket_status === "used").length;
        const totalRevenue = confirmedPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0);

        setStats({
          total_tickets: totalTickets,
          tickets_sold: ticketsSold,
          total_revenue: totalRevenue,
          pending_payments: pendingPayments,
          checked_in: checkedIn
        });
      } else {
        setStats({
          total_tickets: totalTickets,
          tickets_sold: 0,
          total_revenue: 0,
          pending_payments: 0,
          checked_in: 0
        });
      }
    } catch (error: any) {
      console.error("Error fetching event data:", error);
      toast({
        title: "Error",
        description: "Failed to load event data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async (purchaseId: string, action: "confirm" | "reject") => {
    try {
      const newStatus = action === "confirm" ? "confirmed" : "rejected";
      const ticketStatus = action === "confirm" ? "valid" : "invalid";
      
      // Generate QR code if confirming
      const qrCode = action === "confirm" ? `TICKET-${purchaseId}-${Date.now()}` : null;

      const { error } = await supabase
        .from("event_purchases")
        .update({ 
          payment_status: newStatus,
          ticket_status: ticketStatus,
          qr_code: qrCode
        })
        .eq("id", purchaseId);

      if (error) throw error;

      // Update quantity sold if confirming
      if (action === "confirm") {
        const { data: ticketData } = await supabase
          .from("event_purchases")
          .select("event_ticket_id, quantity")
          .eq("id", purchaseId)
          .single();

        if (ticketData) {
          // Get current quantity sold
          const { data: currentTicket } = await supabase
            .from("event_tickets")
            .select("quantity_sold")
            .eq("id", ticketData.event_ticket_id)
            .single();

          if (currentTicket) {
            await supabase
              .from("event_tickets")
              .update({ 
                quantity_sold: (currentTicket.quantity_sold || 0) + ticketData.quantity
              })
              .eq("id", ticketData.event_ticket_id);
          }
        }
      }

      toast({
        title: action === "confirm" ? "Payment Confirmed" : "Payment Rejected",
        description: action === "confirm" 
          ? "The buyer will receive their QR code ticket via email."
          : "The payment has been marked as rejected."
      });

      fetchEventData();
    } catch (error: any) {
      console.error("Error updating payment:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status.",
        variant: "destructive"
      });
    }
  };

  const exportAttendees = () => {
    const confirmedPurchases = purchases.filter(p => p.payment_status === "confirmed");
    
    const csv = [
      ["Order Code", "Name", "Email", "Phone", "Ticket Type", "Quantity", "Amount", "Status", "Checked In"].join(","),
      ...confirmedPurchases.map(p => [
        p.order_code,
        `"${p.buyer_name}"`,
        p.buyer_email,
        p.buyer_phone || "",
        p.event_tickets?.ticket_name || "",
        p.quantity,
        p.total_amount,
        p.ticket_status,
        p.checked_in_at ? format(new Date(p.checked_in_at), "PPp") : "No"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event?.title || "event"}-attendees.csv`;
    a.click();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case "used":
        return <Badge className="bg-blue-500">Checked In</Badge>;
      case "valid":
        return <Badge className="bg-green-500">Valid</Badge>;
      case "invalid":
        return <Badge variant="destructive">Invalid</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/advertiser/events")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ticket Sales</h1>
            <p className="text-muted-foreground">{event?.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportAttendees}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => navigate(`/advertiser/events/${eventId}/scanner`)}>
              <QrCode className="h-4 w-4 mr-2" />
              QR Scanner
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tickets Sold</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                {stats.tickets_sold} / {stats.total_tickets}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                ₱{stats.total_revenue.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Payments</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                {stats.pending_payments}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Checked In</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {stats.checked_in}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Purchases Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Purchases</CardTitle>
            <CardDescription>View and manage ticket purchases</CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No purchases yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-mono text-xs">
                          {purchase.order_code.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{purchase.buyer_name}</p>
                            <p className="text-xs text-muted-foreground">{purchase.buyer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{purchase.event_tickets?.ticket_name}</TableCell>
                        <TableCell>{purchase.quantity}</TableCell>
                        <TableCell>₱{purchase.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(purchase.payment_status)}
                          {purchase.payment_proof_url && (
                            <a 
                              href={purchase.payment_proof_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block text-xs text-primary hover:underline mt-1"
                            >
                              View Proof
                            </a>
                          )}
                        </TableCell>
                        <TableCell>{getTicketStatusBadge(purchase.ticket_status)}</TableCell>
                        <TableCell>
                          {purchase.payment_status === "pending" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600"
                                onClick={() => handlePaymentAction(purchase.id, "confirm")}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600"
                                onClick={() => handlePaymentAction(purchase.id, "reject")}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventSales;