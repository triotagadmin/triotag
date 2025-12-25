import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, Calendar, MapPin, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface TicketSale {
  id: string;
  ticket_id: string;
  buyer_name: string;
  buyer_email: string;
  quantity: number;
  total_amount: number;
  currency: string;
  serial_number: string;
  qr_code: string;
  payment_status: string;
  created_at: string;
  tickets?: {
    title: string;
    event_date: string;
    event_time: string;
    location: string;
    venue_name: string;
    image_url: string;
  };
}

export default function MyTickets() {
  const navigate = useNavigate();
  const [ticketSales, setTicketSales] = useState<TicketSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to view your tickets");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("ticket_sales")
        .select(`
          *,
          tickets (
            title,
            event_date,
            event_time,
            location,
            venue_name,
            image_url
          )
        `)
        .eq("buyer_email", user.email)
        .eq("payment_status", "paid")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        toast.error("Failed to load tickets");
      } else {
        setTicketSales(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = (sale: TicketSale) => {
    const doc = new jsPDF();
    const ticket = sale.tickets;

    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94);
    doc.text("EVENT TICKET", 105, 30, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(ticket?.title || "Event", 105, 50, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Date: ${ticket?.event_date ? new Date(ticket.event_date).toLocaleDateString() : "TBA"}`, 20, 70);
    doc.text(`Time: ${ticket?.event_time || "TBA"}`, 20, 80);
    doc.text(`Location: ${ticket?.venue_name || ""} ${ticket?.location || ""}`, 20, 90);
    
    doc.text(`Attendee: ${sale.buyer_name}`, 20, 110);
    doc.text(`Quantity: ${sale.quantity}`, 20, 120);
    doc.text(`Serial: ${sale.serial_number}`, 20, 130);

    doc.setFontSize(10);
    doc.text("Show this ticket at the venue entrance", 105, 160, { align: "center" });
    doc.text(`QR Code: ${sale.qr_code || sale.serial_number}`, 105, 170, { align: "center" });

    doc.save(`ticket-${sale.serial_number}.pdf`);
    toast.success("Ticket downloaded!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-pulse text-primary">Loading your tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Tickets</h1>
          <p className="text-muted-foreground">Your purchased event tickets</p>
        </div>

        {ticketSales.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Tickets Yet</h2>
              <p className="text-muted-foreground mb-6">You haven't purchased any tickets yet.</p>
              <Button onClick={() => navigate("/tickets")}>Browse Events</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ticketSales.map((sale) => {
              const ticket = sale.tickets;
              const isPastEvent = ticket?.event_date && new Date(ticket.event_date) < new Date();

              return (
                <Card key={sale.id} className={`overflow-hidden ${isPastEvent ? "opacity-60" : ""}`}>
                  {ticket?.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={ticket.image_url}
                        alt={ticket.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{ticket?.title || "Event"}</CardTitle>
                      <Badge variant={isPastEvent ? "secondary" : "default"}>
                        {isPastEvent ? "Past" : "Upcoming"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {ticket?.event_date
                          ? new Date(ticket.event_date).toLocaleDateString()
                          : "TBA"}
                        {ticket?.event_time && ` at ${ticket.event_time}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {ticket?.venue_name ? `${ticket.venue_name}, ` : ""}
                        {ticket?.location || "TBA"}
                      </span>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Serial</p>
                      <p className="font-mono text-sm font-bold">{sale.serial_number}</p>
                    </div>

                    <div className="flex justify-center py-2">
                      <div className="bg-white p-2 rounded">
                        <QRCodeSVG
                          value={sale.qr_code || sale.serial_number || sale.id}
                          size={80}
                          level="H"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Qty: {sale.quantity}</span>
                      <span className="font-semibold">
                        {sale.currency} {sale.total_amount.toLocaleString()}
                      </span>
                    </div>

                    <Button
                      onClick={() => handleDownloadPDF(sale)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
