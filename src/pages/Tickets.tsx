import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Ticket, ShoppingCart } from "lucide-react";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { TicketCart } from "@/components/TicketCart";
import { toast } from "sonner";

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
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [approvedTickets, setApprovedTickets] = useState<ApprovedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedTickets();
  }, []);

  const fetchApprovedTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching approved tickets:", error);
    } else {
      setApprovedTickets(data || []);
    }
    setLoading(false);
  };

  // Get unique locations for filter
  const uniqueLocations = [...new Set(approvedTickets.map(t => t.location))];

  const filteredTickets = approvedTickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesLocation = locationFilter === "all" || ticket.location === locationFilter;
    return matchesSearch && matchesLocation;
  });

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

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Marketplace
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

        {/* Marketplace Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Marketplace ({filteredTickets.length})</h2>
          
          <div>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No tickets found matching your criteria
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Horizontal Scrolling List */}
                <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
                  {filteredTickets.map(ticket => {
                    const available = ticket.quantity_available - ticket.quantity_sold;
                    const isSoldOut = available <= 0;
                    const imageUrl = ticket.image_url || (ticket.image_urls?.[0]);

                    return (
                      <Card key={ticket.id} className="hover:shadow-lg transition-shadow overflow-hidden flex-shrink-0 w-80 snap-start">
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
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Tickets;
