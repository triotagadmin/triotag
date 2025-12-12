import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Calendar, Ticket, Plus } from "lucide-react";
import { Footer } from "@/components/Footer";

const Tickets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  // Placeholder data - will be replaced with database queries
  const mockEvents = [
    {
      id: "1",
      title: "Summer Music Festival 2024",
      description: "A three-day music festival featuring top artists",
      date: "2024-07-15",
      location: "Central Park, NYC",
      category: "Music",
      price: 150,
      ticketsAvailable: 500,
      image: null,
    },
    {
      id: "2", 
      title: "Tech Conference 2024",
      description: "Annual technology conference with industry leaders",
      date: "2024-08-20",
      location: "Convention Center, SF",
      category: "Conference",
      price: 299,
      ticketsAvailable: 200,
      image: null,
    },
    {
      id: "3",
      title: "Comedy Night Live",
      description: "Stand-up comedy show featuring local comedians",
      date: "2024-06-30",
      location: "Laugh Factory, LA",
      category: "Entertainment",
      price: 45,
      ticketsAvailable: 100,
      image: null,
    },
  ];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Ticket Marketplace</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Buy and sell tickets for events, concerts, conferences, and more
          </p>
        </div>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Events</CardTitle>
            <CardDescription>Search for tickets by event name, date, or location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
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
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="NYC">New York</SelectItem>
                  <SelectItem value="LA">Los Angeles</SelectItem>
                  <SelectItem value="SF">San Francisco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Ticket Button */}
        <div className="flex justify-end mb-6">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Submit Event Ticket
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No events found matching your criteria</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Ticket className="h-16 w-16 text-primary/40" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <p className="text-2xl font-bold">${event.price}</p>
                      <p className="text-xs text-muted-foreground">{event.ticketsAvailable} tickets left</p>
                    </div>
                    <Button>Buy Tickets</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Tickets;
