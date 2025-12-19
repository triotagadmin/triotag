import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket,
  User,
  Minus,
  Plus
} from "lucide-react";
import { format } from "date-fns";

interface EventTicket {
  id: string;
  ticket_name: string;
  ticket_price: number;
  quantity_available: number;
  quantity_sold: number;
  sale_start_date: string;
  sale_end_date: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  venue_name: string;
  event_date: string;
  event_time: string;
  banner_image_url: string;
  organizer_name: string;
  status: string;
  event_tickets: EventTicket[];
}

const PublicEventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_tickets (*)
        `)
        .eq("id", eventId)
        .eq("status", "published")
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error: any) {
      console.error("Error fetching event:", error);
      toast({
        title: "Event Not Found",
        description: "This event may have been removed or is not available.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTicketQuantity = (ticketId: string, delta: number) => {
    const ticket = event?.event_tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const current = selectedTickets[ticketId] || 0;
    const available = ticket.quantity_available - ticket.quantity_sold;
    const newQty = Math.max(0, Math.min(current + delta, available, 10)); // Max 10 per order

    setSelectedTickets(prev => ({
      ...prev,
      [ticketId]: newQty
    }));
  };

  const getTotalAmount = () => {
    if (!event) return 0;
    return Object.entries(selectedTickets).reduce((total, [ticketId, qty]) => {
      const ticket = event.event_tickets.find(t => t.id === ticketId);
      return total + (ticket?.ticket_price || 0) * qty;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const isTicketAvailable = (ticket: EventTicket) => {
    const now = new Date();
    const available = ticket.quantity_available - ticket.quantity_sold;
    
    if (available <= 0) return false;
    if (ticket.sale_start_date && new Date(ticket.sale_start_date) > now) return false;
    if (ticket.sale_end_date && new Date(ticket.sale_end_date) < now) return false;
    
    return true;
  };

  const handleCheckout = () => {
    if (getTotalTickets() === 0) {
      toast({
        title: "No Tickets Selected",
        description: "Please select at least one ticket.",
        variant: "destructive"
      });
      return;
    }

    // Encode selected tickets in URL params
    const ticketParams = Object.entries(selectedTickets)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => `${id}:${qty}`)
      .join(",");

    navigate(`/events/${eventId}/checkout?tickets=${ticketParams}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">This event may have been removed or is not available.</p>
          <Button onClick={() => navigate("/events")}>Browse Events</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      
      {/* Banner */}
      {event.banner_image_url && (
        <div className="w-full h-64 md:h-96 relative">
          <img 
            src={event.banner_image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
            
            <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}
              </div>
              {event.event_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {event.event_time}
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {event.venue_name || event.location}
              </div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {event.organizer_name}
              </div>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{event.description || "No description provided."}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{event.venue_name}</p>
                <p className="text-muted-foreground">{event.location}</p>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Selection */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Select Tickets
                </CardTitle>
                <CardDescription>Choose your tickets below</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.event_tickets.map((ticket) => {
                  const available = ticket.quantity_available - ticket.quantity_sold;
                  const isAvailable = isTicketAvailable(ticket);
                  const selected = selectedTickets[ticket.id] || 0;

                  return (
                    <div 
                      key={ticket.id} 
                      className={`p-4 border rounded-lg ${!isAvailable ? "opacity-50" : ""}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{ticket.ticket_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {available} tickets left
                          </p>
                        </div>
                        <p className="font-bold">
                          {ticket.ticket_price === 0 ? "FREE" : `₱${ticket.ticket_price.toLocaleString()}`}
                        </p>
                      </div>

                      {isAvailable ? (
                        <div className="flex items-center justify-end gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateTicketQuantity(ticket.id, -1)}
                            disabled={selected === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{selected}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateTicketQuantity(ticket.id, 1)}
                            disabled={selected >= available || selected >= 10}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="w-full justify-center">
                          {available <= 0 ? "Sold Out" : "Not Available"}
                        </Badge>
                      )}
                    </div>
                  );
                })}

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-muted-foreground">Total ({getTotalTickets()} tickets)</span>
                    <span className="text-xl font-bold">₱{getTotalAmount().toLocaleString()}</span>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={getTotalTickets() === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PublicEventDetail;