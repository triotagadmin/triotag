import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import {
  Plus, MapPin, Calendar, Ticket, QrCode, Building2, Clock, DollarSign, Package,
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
  const [userId, setUserId] = useState<string | null>(null);
  const [isVenuePublisher, setIsVenuePublisher] = useState(false);

  useEffect(() => { checkAuthAndFetch(); }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUserId(session.user.id);
    fetchData(session.user.id);
  };

  const fetchData = async (currentUserId: string) => {
    try {
      const { data: publisherProfile } = await supabase
        .from("publisher_profiles").select("id, publisher_type").eq("user_id", currentUserId).maybeSingle();
      setIsVenuePublisher(publisherProfile?.publisher_type === "venue");

      const { data: venuesData, error: venuesError } = await supabase
        .from("venues").select("*").order("created_at", { ascending: false });
      if (venuesError) throw venuesError;
      setVenues(venuesData || []);

      const { data: eventsData, error: eventsError } = await supabase
        .from("venue_events").select(`*, venues (*)`).order("event_date", { ascending: true });
      if (eventsError) throw eventsError;
      setEvents(eventsData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* AD REQUEST anchor */}
      {isVenuePublisher && (
        <div className="border-b border-[rgba(255,255,255,0.06)]">
          <div className="container mx-auto px-6 py-4 flex items-center justify-center">
            <Button asChild variant="cyber" size="lg" className="relative overflow-hidden animate-pulse-glow">
              <Link to="/publisher/ad-requests" aria-label="Go to Ad Requests">
                <Package className="h-4 w-4" /> AD REQUEST
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Ticket Creator Banner */}
      <div className="glass border-b border-[rgba(255,255,255,0.06)]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Create and sell event tickets</span>
          </div>
          <Button onClick={() => navigate("/ticket-creator")} variant="cyber" size="sm">
            <Ticket className="h-4 w-4 mr-2" /> Ticket Creator
          </Button>
        </div>
      </div>

      {/* Dashboard Content - 2 Column Grid */}
      <div className="container mx-auto px-4 md:px-6 py-8 max-w-[1200px]">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ad Space Retailer Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your ad spaces, events, and tickets</p>
          </div>
          <div className="flex md:justify-end items-start">
            <Button onClick={() => setShowVenueDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Ad Space
            </Button>
          </div>
        </div>

        {/* Quick Access to Ad Requests */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <CardTitle className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-primary" /> Ad Requests
                </CardTitle>
                <CardDescription>Review and manage advertiser booking submissions</CardDescription>
              </div>
              <div className="flex md:justify-end">
                <Button onClick={() => navigate("/publisher/ad-requests")} className="w-full md:w-auto">
                  <Package className="h-4 w-4 mr-2" /> View All Ad Requests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="venues" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 glass rounded-[14px]">
            <TabsTrigger value="venues" className="rounded-[12px]">
              <Building2 className="h-4 w-4 mr-2" /> Ad Spaces
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-[12px]">
              <Calendar className="h-4 w-4 mr-2" /> Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="venues">
            {venues.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No ad spaces yet. Create your first ad space to get started.</p>
                  <Button onClick={() => setShowVenueDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Ad Space
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {venues.map((venue) => (
                  <Card key={venue.id}>
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" /> {venue.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {venue.location}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                      {venue.description && (
                        <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>
                      )}
                      <Button onClick={() => { setSelectedVenue(venue); setShowEventDialog(true); }} className="w-full">
                        <Plus className="h-4 w-4 mr-2" /> Create Event
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {events.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No events yet. Create an ad space first, then add events.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader className="p-4 md:p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{event.title}</CardTitle>
                          <CardDescription>at {event.venues?.name}</CardDescription>
                        </div>
                        <Badge variant={event.status === "published" ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(event.event_date).toLocaleDateString()}
                        </div>
                        {event.event_time && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" /> {event.event_time}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" /> ${event.ticket_price}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                          {event.tickets_sold} / {event.total_tickets} tickets sold
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setShowTicketsDialog(true); }}>
                          <Plus className="h-4 w-4 mr-1" /> Generate
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/venue-ticketing/event/${event.id}/tickets`)}>
                          <Ticket className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button variant="default" size="sm" onClick={() => navigate(`/venue-ticketing/scanner/${event.id}`)}>
                          <QrCode className="h-4 w-4 mr-1" /> Scan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateVenueDialog open={showVenueDialog} onOpenChange={setShowVenueDialog} onSuccess={() => userId && fetchData(userId)} />
      <CreateEventDialog open={showEventDialog} onOpenChange={setShowEventDialog} venue={selectedVenue} onSuccess={() => userId && fetchData(userId)} />
      <GenerateTicketsDialog open={showTicketsDialog} onOpenChange={setShowTicketsDialog} event={selectedEvent} onSuccess={() => userId && fetchData(userId)} />
    </div>
  );
};

export default VenuePublisherDashboard;
