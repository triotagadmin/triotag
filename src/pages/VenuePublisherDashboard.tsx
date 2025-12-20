import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { 
  Plus,
  MapPin,
  Calendar,
  Ticket,
  QrCode,
  Building2,
  Clock,
  DollarSign,
  Ticket as TicketIcon
} from "lucide-react";
import { CreateVenueDialog } from "@/components/venue-ticketing/CreateVenueDialog";
import { CreateEventDialog } from "@/components/venue-ticketing/CreateEventDialog";
import { GenerateTicketsDialog } from "@/components/venue-ticketing/GenerateTicketsDialog";

interface Venue {
  id: string;
  name: string;
  location: string;
  description: string | null;
  created_at: string;
}

interface VenueEvent {
  id: string;
  venue_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  ticket_price: number;
  total_tickets: number;
  tickets_sold: number;
  status: string;
  venues?: Venue;
}

const VenuePublisherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<VenueEvent | null>(null);
  const [showVenueDialog, setShowVenueDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTicketsDialog, setShowTicketsDialog] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    try {
      // Fetch venues
      const { data: venuesData, error: venuesError } = await supabase
        .from("venues")
        .select("*")
        .order("created_at", { ascending: false });

      if (venuesError) throw venuesError;
      setVenues(venuesData || []);

      // Fetch events with venue info
      const { data: eventsData, error: eventsError } = await supabase
        .from("venue_events")
        .select(`
          *,
          venues (*)
        `)
        .order("event_date", { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVenue = () => {
    setShowVenueDialog(true);
  };

  const handleCreateEvent = (venue: Venue) => {
    setSelectedVenue(venue);
    setShowEventDialog(true);
  };

  const handleGenerateTickets = (event: VenueEvent) => {
    setSelectedEvent(event);
    setShowTicketsDialog(true);
  };

  const handleViewTickets = (eventId: string) => {
    navigate(`/venue-ticketing/event/${eventId}/tickets`);
  };

  const handleOpenScanner = (eventId: string) => {
    navigate(`/venue-ticketing/scanner/${eventId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Venue Publisher Dashboard</h1>
            <p className="text-muted-foreground">Manage your venues, events, and tickets</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/ticket-market")} variant="secondary">
              <Ticket className="h-4 w-4 mr-2" />
              Ticket Creator
            </Button>
            <Button onClick={handleCreateVenue}>
              <Plus className="h-4 w-4 mr-2" />
              Add Venue
            </Button>
          </div>
        </div>

        {/* Venues Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            My Venues
          </h2>
          
          {venues.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No venues yet. Create your first venue to get started.</p>
                <Button onClick={handleCreateVenue}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Venue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {venue.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {venue.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {venue.description && (
                      <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>
                    )}
                    <Button 
                      onClick={() => handleCreateEvent(venue)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Events Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            My Events
          </h2>

          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No events yet. Create a venue first, then add events.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          at {event.venues?.name}
                        </CardDescription>
                      </div>
                      <Badge variant={event.status === "published" ? "default" : "secondary"}>
                        {event.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(event.event_date).toLocaleDateString()}
                      </div>
                      {event.event_time && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {event.event_time}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        ${event.ticket_price}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        {event.tickets_sold} / {event.total_tickets} tickets sold
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleGenerateTickets(event)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Generate
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewTickets(event.id)}
                      >
                        <Ticket className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleOpenScanner(event.id)}
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        Scan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateVenueDialog 
        open={showVenueDialog} 
        onOpenChange={setShowVenueDialog}
        onSuccess={fetchData}
      />
      
      <CreateEventDialog 
        open={showEventDialog} 
        onOpenChange={setShowEventDialog}
        venue={selectedVenue}
        onSuccess={fetchData}
      />

      <GenerateTicketsDialog
        open={showTicketsDialog}
        onOpenChange={setShowTicketsDialog}
        event={selectedEvent}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default VenuePublisherDashboard;
