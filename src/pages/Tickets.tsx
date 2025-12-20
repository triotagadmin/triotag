import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Ticket, Plus, ChevronLeft, ChevronRight, ShoppingCart, QrCode, Sparkles, ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { TicketCart } from "@/components/TicketCart";
import { TicketSubmissionDialog } from "@/components/TicketSubmissionDialog";
import { toast } from "sonner";
interface TicketEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string;
  venue_name: string | null;
  category: string;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  image_url: string | null;
  status: string;
}
const Tickets = () => {
  const navigate = useNavigate();
  const {
    addToCart
  } = useCart();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tickets, setTickets] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const ITEMS_PER_SLIDE = 3;
  useEffect(() => {
    fetchTickets();
    checkUser();
  }, []);
  const checkUser = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const {
        data: roleData
      } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      setUserRole(roleData?.role || null);
    }
  };
  const fetchTickets = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from("tickets").select("*").eq("status", "approved").order("event_date", {
      ascending: true
    });
    if (error) {
      console.error("Error fetching tickets:", error);
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || (ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === "all" || ticket.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  const totalSlides = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_SLIDE));
  const getCurrentSlideTickets = () => {
    const start = currentSlide * ITEMS_PER_SLIDE;
    return filteredTickets.slice(start, start + ITEMS_PER_SLIDE);
  };
  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };
  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };
  const handleAddToCart = (ticket: TicketEvent) => {
    const available = ticket.quantity_available - ticket.quantity_sold;
    if (available <= 0) {
      toast.error("This event is sold out");
      return;
    }
    addToCart({
      ticketId: ticket.id,
      title: ticket.title,
      price: ticket.price,
      eventDate: ticket.event_date,
      location: ticket.location,
      image_url: ticket.image_url || undefined,
      maxQuantity: available
    });
    toast.success("Added to cart!");
  };
  const canSubmitTickets = userRole === "advertiser" || userRole === "publisher";
  return <div className="min-h-screen bg-muted/30">
      <Navigation />

      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Ticket Marketplace
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Digital tickets for events anywhere in the world.        
            </p>
          </div>
          <TicketCart />
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Events</CardTitle>
            <CardDescription>
              Search for tickets by event name, date, or location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Theater">Theater</SelectItem>
                  <SelectItem value="Festival">Festival</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Networking">Networking</SelectItem>
                </SelectContent>
              </Select>

              {canSubmitTickets && (
                <Button 
                  onClick={() => navigate("/qr-ticket-creator")}
                  className="relative group overflow-hidden bg-gradient-to-r from-primary via-purple-500 to-pink-500 hover:from-primary/90 hover:via-purple-500/90 hover:to-pink-500/90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <QrCode className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Create QR Ticket</span>
                  <Sparkles className="h-3 w-3 ml-2 opacity-75" />
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Horizontal Slider */}
        {loading ? <div className="text-center py-12">
            <p className="text-muted-foreground">Loading events...</p>
          </div> : filteredTickets.length === 0 ? <Card className="py-12">
            <CardContent className="text-center">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No events found matching your criteria
              </p>
            </CardContent>
          </Card> : <div className="space-y-6">
            {/* Carousel Navigation */}
            {totalSlides > 1 && <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="icon" onClick={prevSlide}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-2">
                  {Array.from({
              length: totalSlides
            }).map((_, idx) => <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"}`} />)}
                </div>
                <Button variant="outline" size="icon" onClick={nextSlide}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>}

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCurrentSlideTickets().map(ticket => {
            const available = ticket.quantity_available - ticket.quantity_sold;
            const isSoldOut = available <= 0;
            return <Card key={ticket.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                      {ticket.image_url ? <img src={ticket.image_url} alt={ticket.title} className="w-full h-full object-cover" /> : <Ticket className="h-16 w-16 text-primary/40" />}
                      {isSoldOut && <Badge className="absolute top-2 right-2 bg-destructive">
                          Sold Out
                        </Badge>}
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                        <Badge variant="secondary">{ticket.category}</Badge>
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
                          <p className="text-2xl font-bold">${ticket.price}</p>
                          <p className="text-xs text-muted-foreground">
                            {isSoldOut ? "Sold out" : `${available} tickets left`}
                          </p>
                        </div>
                        <Button onClick={() => handleAddToCart(ticket)} disabled={isSoldOut}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {isSoldOut ? "Sold Out" : "Add to Cart"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>;
          })}
            </div>

            {filteredTickets.length > ITEMS_PER_SLIDE && <p className="text-center text-sm text-muted-foreground">
                Showing {getCurrentSlideTickets().length} of{" "}
                {filteredTickets.length} events
              </p>}
          </div>}
      </div>

      <Footer />

      {canSubmitTickets && <TicketSubmissionDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen} ownerType={userRole === "advertiser" ? "advertiser" : "publisher"} onSuccess={fetchTickets} />}
    </div>;
};
export default Tickets;