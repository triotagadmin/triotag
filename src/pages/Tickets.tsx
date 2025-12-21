import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Calendar, Ticket, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { TicketCart } from "@/components/TicketCart";
import { toast } from "sonner";

interface EventWithTicket {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string;
  venue_name: string | null;
  banner_image_url: string | null;
  organizer_name: string;
  status: string;
  event_tickets: {
    id: string;
    ticket_name: string;
    ticket_price: number;
    quantity_available: number;
    quantity_sold: number;
  }[];
}

interface ApprovedTicket {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string;
  venue_name: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  category: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  status: string;
}

const Tickets = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [events, setEvents] = useState<EventWithTicket[]>([]);
  const [approvedTickets, setApprovedTickets] = useState<ApprovedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState("events");
  const ITEMS_PER_SLIDE = 3;

  useEffect(() => {
    fetchEvents();
    fetchApprovedTickets();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        event_tickets (*)
      `)
      .eq("status", "published")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
  };

  const fetchApprovedTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("status", "approved")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Error fetching approved tickets:", error);
    } else {
      setApprovedTickets(data || []);
    }
    setLoading(false);
  };

  // Get unique locations for filter
  const allLocations = [
    ...events.map(e => e.location),
    ...approvedTickets.map(t => t.location)
  ];
  const uniqueLocations = [...new Set(allLocations)];

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      event.organizer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === "all" || event.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const filteredTickets = approvedTickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesLocation = locationFilter === "all" || ticket.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

  const currentItems = activeTab === "events" ? filteredEvents : filteredTickets;
  const totalSlides = Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_SLIDE));

  const getCurrentSlideItems = () => {
    const start = currentSlide * ITEMS_PER_SLIDE;
    return currentItems.slice(start, start + ITEMS_PER_SLIDE);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleAddEventToCart = (event: EventWithTicket) => {
    const ticket = event.event_tickets[0];
    if (!ticket) {
      toast.error("No tickets available for this event");
      return;
    }

    const available = ticket.quantity_available - ticket.quantity_sold;
    if (available <= 0) {
      toast.error("This event is sold out");
      return;
    }

    addToCart({
      ticketId: ticket.id,
      title: event.title,
      price: ticket.ticket_price,
      eventDate: event.event_date,
      location: event.location,
      image_url: event.banner_image_url || undefined,
      maxQuantity: available
    });
    toast.success("Added to cart!");
  };

  const handleAddTicketToCart = (ticket: ApprovedTicket) => {
    const available = ticket.quantity_available - ticket.quantity_sold;
    if (available <= 0) {
      toast.error("This ticket is sold out");
      return;
    }

    addToCart({
      ticketId: ticket.id,
      title: ticket.title,
      price: ticket.price,
      eventDate: ticket.event_date,
      location: ticket.location,
      image_url: ticket.image_url || (ticket.image_urls?.[0]) || undefined,
      maxQuantity: available
    });
    toast.success("Added to cart!");
  };

  const getLowestPrice = (event: EventWithTicket) => {
    if (event.event_tickets.length === 0) return null;
    return Math.min(...event.event_tickets.map(t => t.ticket_price));
  };

  const getTotalAvailable = (event: EventWithTicket) => {
    return event.event_tickets.reduce((acc, t) => acc + (t.quantity_available - t.quantity_sold), 0);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Event Tickets
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover and purchase tickets for amazing events
            </p>
          </div>
          <TicketCart />
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Events</CardTitle>
            <CardDescription>
              Search for tickets by event name, organizer, or location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search events..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-9" 
                />
              </div>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Events and Tickets */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCurrentSlide(0); }} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="events">Published Events ({filteredEvents.length})</TabsTrigger>
            <TabsTrigger value="tickets">Approved Tickets ({filteredTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No events found matching your criteria
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Carousel Navigation */}
                {totalSlides > 1 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={prevSlide}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalSlides }).map((_, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setCurrentSlide(idx)} 
                          className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`} 
                        />
                      ))}
                    </div>
                    <Button variant="outline" size="icon" onClick={nextSlide}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(getCurrentSlideItems() as EventWithTicket[]).map(event => {
                    const lowestPrice = getLowestPrice(event);
                    const totalAvailable = getTotalAvailable(event);
                    const isSoldOut = totalAvailable <= 0;

                    return (
                      <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                          {event.banner_image_url ? (
                            <img 
                              src={event.banner_image_url} 
                              alt={event.title} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <Ticket className="h-16 w-16 text-primary/40" />
                          )}
                          {isSoldOut && (
                            <Badge className="absolute top-2 right-2 bg-destructive">
                              Sold Out
                            </Badge>
                          )}
                        </div>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {event.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(event.event_date).toLocaleDateString()}
                              {event.event_time && ` at ${event.event_time}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {event.venue_name ? `${event.venue_name}, ${event.location}` : event.location}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            By {event.organizer_name}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              {lowestPrice !== null ? (
                                <>
                                  <p className="text-2xl font-bold">₱{lowestPrice}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {isSoldOut ? "Sold out" : `${totalAvailable} tickets left`}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-muted-foreground">No tickets available</p>
                              )}
                            </div>
                            <Button 
                              onClick={() => handleAddEventToCart(event)} 
                              disabled={isSoldOut || lowestPrice === null}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {isSoldOut ? "Sold Out" : "Add to Cart"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredEvents.length > ITEMS_PER_SLIDE && (
                  <p className="text-center text-sm text-muted-foreground">
                    Showing {getCurrentSlideItems().length} of {filteredEvents.length} events
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No approved tickets found matching your criteria
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Carousel Navigation */}
                {totalSlides > 1 && (
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" size="icon" onClick={prevSlide}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalSlides }).map((_, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setCurrentSlide(idx)} 
                          className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`} 
                        />
                      ))}
                    </div>
                    <Button variant="outline" size="icon" onClick={nextSlide}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Tickets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(getCurrentSlideItems() as ApprovedTicket[]).map(ticket => {
                    const available = ticket.quantity_available - ticket.quantity_sold;
                    const isSoldOut = available <= 0;
                    const imageUrl = ticket.image_url || (ticket.image_urls?.[0]);

                    return (
                      <Card key={ticket.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                        <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                          {imageUrl ? (
                            <img 
                              src={imageUrl} 
                              alt={ticket.title} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <Ticket className="h-16 w-16 text-primary/40" />
                          )}
                          {isSoldOut && (
                            <Badge className="absolute top-2 right-2 bg-destructive">
                              Sold Out
                            </Badge>
                          )}
                          <Badge className="absolute top-2 left-2 bg-primary/90">
                            {ticket.category}
                          </Badge>
                        </div>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{ticket.title}</CardTitle>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {ticket.description || "No description available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(ticket.event_date).toLocaleDateString()}
                              {ticket.event_time && ` at ${ticket.event_time}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {ticket.venue_name ? `${ticket.venue_name}, ${ticket.location}` : ticket.location}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              <p className="text-2xl font-bold">₱{ticket.price}</p>
                              <p className="text-xs text-muted-foreground">
                                {isSoldOut ? "Sold out" : `${available} tickets left`}
                              </p>
                            </div>
                            <Button 
                              onClick={() => handleAddTicketToCart(ticket)} 
                              disabled={isSoldOut}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {isSoldOut ? "Sold Out" : "Add to Cart"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredTickets.length > ITEMS_PER_SLIDE && (
                  <p className="text-center text-sm text-muted-foreground">
                    Showing {getCurrentSlideItems().length} of {filteredTickets.length} tickets
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Tickets;
