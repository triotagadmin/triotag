import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/Navigation";
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Ticket, 
  Eye,
  Edit,
  BarChart3,
  QrCode
} from "lucide-react";
import { format } from "date-fns";

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
  created_at: string;
  ticket_count?: number;
  tickets_sold?: number;
}

const MyEvents = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get advertiser profile
      const { data: profile } = await supabase
        .from("advertiser_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        toast({
          title: "Profile not found",
          description: "Please complete your Print Partner profile first.",
          variant: "destructive"
        });
        navigate("/advertiser-dashboard");
        return;
      }

      // Fetch events with ticket stats
      const { data: eventsData, error } = await supabase
        .from("events")
        .select(`
          *,
          event_tickets (
            id,
            quantity_sold
          )
        `)
        .eq("advertiser_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const eventsWithStats = (eventsData || []).map(event => ({
        ...event,
        ticket_count: event.event_tickets?.length || 0,
        tickets_sold: event.event_tickets?.reduce((sum: number, t: any) => sum + (t.quantity_sold || 0), 0) || 0
      }));

      setEvents(eventsWithStats);
    } catch (error: any) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <p className="text-center text-muted-foreground">Loading events...</p>
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
            <h1 className="text-3xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground">Manage your events and sell tickets</p>
          </div>
          <Button onClick={() => navigate("/advertiser/events/create")} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event and start selling tickets with QR codes
              </p>
              <Button onClick={() => navigate("/advertiser/events/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {event.banner_image_url && (
                    <div className="md:w-64 h-48 md:h-auto">
                      <img 
                        src={event.banner_image_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {event.description?.substring(0, 100)}
                            {event.description && event.description.length > 100 ? "..." : ""}
                          </CardDescription>
                        </div>
                        {getStatusBadge(event.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.event_date), "PPP")}
                          {event.event_time && ` at ${event.event_time}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.venue_name || event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" />
                          {event.tickets_sold} tickets sold
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/advertiser/events/${event.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/advertiser/events/${event.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/advertiser/events/${event.id}/sales`)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Sales
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/advertiser/events/${event.id}/scanner`)}
                        >
                          <QrCode className="h-4 w-4 mr-1" />
                          Scanner
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;