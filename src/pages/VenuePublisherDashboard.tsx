import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Package,
  ClipboardList
} from "lucide-react";
import { CreateVenueDialog } from "@/components/venue-ticketing/CreateVenueDialog";
import { CreateEventDialog } from "@/components/venue-ticketing/CreateEventDialog";
import { GenerateTicketsDialog } from "@/components/venue-ticketing/GenerateTicketsDialog";
import { PublisherCalendar } from "@/components/publisher/PublisherCalendar";

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

interface Activation {
  id: string;
  ad_space_id: string;
  advertiser_id: string;
  publisher_id: string;
  status: string;
  activation_type: string | null;
  ad_design_url: string | null;
  ad_unit_sku: string | null;
  start_date: string | null;
  end_date: string | null;
  estimated_publisher_payout: number | null;
  quantity: number | null;
  created_at: string;
  submitted_at: string | null;
  ad_spaces: {
    title: string;
    location: string | null;
  } | null;
}

const VenuePublisherDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<VenueEvent | null>(null);
  const [showVenueDialog, setShowVenueDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTicketsDialog, setShowTicketsDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);
    fetchData(session.user.id);
  };

  const fetchData = async (currentUserId: string) => {
    try {
      // First get the publisher profile id for this user
      const { data: publisherProfile } = await supabase
        .from("publisher_profiles")
        .select("id")
        .eq("user_id", currentUserId)
        .maybeSingle();

      const publisherProfileId = publisherProfile?.id;

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

      // Fetch booking requests (activations) for this publisher using profile id
      if (publisherProfileId) {
        const { data: activationsData, error: activationsError } = await supabase
          .from("activations")
          .select(`
            id,
            ad_space_id,
            advertiser_id,
            publisher_id,
            status,
            activation_type,
            ad_design_url,
            ad_unit_sku,
            start_date,
            end_date,
            estimated_publisher_payout,
            quantity,
            created_at,
            submitted_at,
            ad_spaces (
              title,
              location
            )
          `)
          .eq("publisher_id", publisherProfileId)
          .order("created_at", { ascending: false });

        if (activationsError) throw activationsError;
        setActivations(activationsData || []);
      }
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

  const handleStatusChange = async () => {
    if (userId) {
      await fetchData(userId);
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
      
      {/* Ticket Creator & Ad Requests Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Create and sell event tickets</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => navigate("/publisher/ad-requests")}
              className="relative overflow-hidden bg-primary text-primary-foreground animate-pulse-glow neon-glow"
            >
              <Package className="h-4 w-4 mr-2" />
              AD REQUEST
              {activations.filter(a => ["pending_submission", "under_review"].includes(a.status) && a.ad_design_url).length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activations.filter(a => ["pending_submission", "under_review"].includes(a.status) && a.ad_design_url).length}
                </Badge>
              )}
            </Button>
            <Button 
              onClick={() => navigate("/ticket-creator")}
              className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90 text-white"
            >
              <Ticket className="h-4 w-4 mr-2" />
              Ticket Creator
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Venue Publisher Dashboard</h1>
            <p className="text-muted-foreground">Manage your venues, events, tickets, and booking requests</p>
          </div>
          <Button onClick={handleCreateVenue}>
            <Plus className="h-4 w-4 mr-2" />
            Add Venue
          </Button>
        </div>

        {/* Ad Requests Quick Access Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Ad Requests
                  {activations.filter(a => ["pending_submission", "under_review", "design"].includes(a.status) && a.ad_design_url).length > 0 && (
                    <Badge variant="destructive">
                      {activations.filter(a => ["pending_submission", "under_review", "design"].includes(a.status) && a.ad_design_url).length} New
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Review and manage advertiser booking submissions</CardDescription>
              </div>
              <Button onClick={() => navigate("/publisher/ad-requests")}>
                <Package className="h-4 w-4 mr-2" />
                View All Ad Requests
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No ad requests yet.</p>
            ) : (
              <div className="space-y-3">
                {activations.slice(0, 3).map((activation) => (
                  <div key={activation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {activation.ad_design_url && (
                        <img 
                          src={activation.ad_design_url} 
                          alt="Ad Preview" 
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{activation.ad_spaces?.title || "Unknown Listing"}</p>
                        <p className="text-sm text-muted-foreground">
                          {activation.start_date ? new Date(activation.start_date).toLocaleDateString() : "No date"} 
                          {activation.end_date && ` - ${new Date(activation.end_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      activation.status === "approved" ? "default" : 
                      activation.status === "rejected" ? "destructive" : 
                      "secondary"
                    }>
                      {activation.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
                {activations.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    +{activations.length - 3} more requests
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="venues">
              <Building2 className="h-4 w-4 mr-2" />
              Venues
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <PublisherCalendar activations={activations} />
          </TabsContent>

          {/* Venues Tab */}
          <TabsContent value="venues">
            <div className="space-y-6">
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
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>

      <CreateVenueDialog 
        open={showVenueDialog} 
        onOpenChange={setShowVenueDialog}
        onSuccess={() => userId && fetchData(userId)}
      />
      
      <CreateEventDialog 
        open={showEventDialog} 
        onOpenChange={setShowEventDialog}
        venue={selectedVenue}
        onSuccess={() => userId && fetchData(userId)}
      />

      <GenerateTicketsDialog
        open={showTicketsDialog}
        onOpenChange={setShowTicketsDialog}
        event={selectedEvent}
        onSuccess={() => userId && fetchData(userId)}
      />
    </div>
  );
};

export default VenuePublisherDashboard;
