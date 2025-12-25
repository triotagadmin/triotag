import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Ticket, Download, Wallet, ChevronRight, PartyPopper } from "lucide-react";
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
  };
}

export default function TicketSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [ticketSale, setTicketSale] = useState<TicketSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      fetchTicketSale(sessionId);
    } else {
      fetchLatestTicketSale();
    }

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const fetchTicketSale = async (sessionId: string) => {
    try {
      // Poll for the ticket sale to be updated by webhook
      let attempts = 0;
      const maxAttempts = 10;

      const poll = async () => {
        const { data, error } = await supabase
          .from("ticket_sales")
          .select(`
            *,
            tickets (
              title,
              event_date,
              event_time,
              location,
              venue_name
            )
          `)
          .eq("paymongo_checkout_session_id", sessionId)
          .single();

        if (error) {
          console.error("Error fetching ticket sale:", error);
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(poll, 1000);
          } else {
            setLoading(false);
          }
          return;
        }

        if (data) {
          setTicketSale(data);
          setLoading(false);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setLoading(false);
        }
      };

      poll();
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const fetchLatestTicketSale = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
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
            venue_name
          )
        `)
        .eq("buyer_email", user.email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching latest ticket sale:", error);
      } else {
        setTicketSale(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!ticketSale) return;

    const doc = new jsPDF();
    const ticket = ticketSale.tickets;

    // Title
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94);
    doc.text("EVENT TICKET", 105, 30, { align: "center" });

    // Event details
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(ticket?.title || "Event", 105, 50, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Date: ${ticket?.event_date ? new Date(ticket.event_date).toLocaleDateString() : "TBA"}`, 20, 70);
    doc.text(`Time: ${ticket?.event_time || "TBA"}`, 20, 80);
    doc.text(`Location: ${ticket?.venue_name || ""} ${ticket?.location || ""}`, 20, 90);
    
    doc.text(`Attendee: ${ticketSale.buyer_name}`, 20, 110);
    doc.text(`Quantity: ${ticketSale.quantity}`, 20, 120);
    doc.text(`Serial: ${ticketSale.serial_number}`, 20, 130);

    // QR Code placeholder text
    doc.setFontSize(10);
    doc.text("Show this ticket at the venue entrance", 105, 160, { align: "center" });
    doc.text(`QR Code: ${ticketSale.qr_code || ticketSale.serial_number}`, 105, 170, { align: "center" });

    doc.save(`ticket-${ticketSale.serial_number}.pdf`);
    toast.success("Ticket downloaded as PDF!");
  };

  const handleAddToWallet = () => {
    toast.info("Add to Wallet feature coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="animate-pulse text-primary">Loading your ticket...</div>
        </div>
      </div>
    );
  }

  if (!ticketSale) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Ticket Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find your ticket. Please try again.</p>
          <Button onClick={() => navigate("/tickets")}>Browse Tickets</Button>
        </div>
      </div>
    );
  }

  const ticket = ticketSale.tickets;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navigation />

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"][
                    Math.floor(Math.random() * 5)
                  ],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-12 pt-24">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
            <PartyPopper className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">Your ticket has been confirmed. Show this at the venue.</p>
        </div>

        {/* Ticket Card */}
        <div className="max-w-lg mx-auto">
          <div ref={ticketRef} className="relative">
            {/* Perforated Edge Left */}
            <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around z-10">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-background" />
              ))}
            </div>

            {/* Perforated Edge Right */}
            <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col justify-around z-10">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-background" />
              ))}
            </div>

            <Card className="ml-2 mr-2 overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10">
              {/* Ticket Header */}
              <div className="bg-primary text-primary-foreground p-6 text-center">
                <Ticket className="w-8 h-8 mx-auto mb-2" />
                <h2 className="text-xl font-bold">EVENT TICKET</h2>
              </div>

              {/* Event Details */}
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground">{ticket?.title || "Event"}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {ticket?.event_date
                        ? new Date(ticket.event_date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBA"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-semibold">{ticket?.event_time || "TBA"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Venue</p>
                    <p className="font-semibold">
                      {ticket?.venue_name ? `${ticket.venue_name}, ` : ""}
                      {ticket?.location || "TBA"}
                    </p>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="border-t-2 border-dashed border-border my-4" />

                {/* Attendee & Serial */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Attendee</p>
                    <p className="font-semibold">{ticketSale.buyer_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{ticketSale.quantity} ticket(s)</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Serial Number</p>
                  <p className="font-mono font-bold text-lg">{ticketSale.serial_number}</p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center py-4">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCodeSVG
                      value={ticketSale.qr_code || ticketSale.serial_number || ticketSale.id}
                      size={150}
                      level="H"
                      includeMargin
                    />
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Present this QR code at the venue entrance
                </p>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button onClick={handleAddToWallet} variant="outline" className="flex-1">
              <Wallet className="w-4 h-4 mr-2" />
              Add to Wallet
            </Button>
            <Button onClick={handlePrintPDF} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          <Button
            onClick={() => navigate("/my-tickets")}
            className="w-full mt-4"
            variant="default"
          >
            View All My Tickets
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
