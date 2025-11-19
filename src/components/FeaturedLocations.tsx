import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
const locations = [{
  name: "Brew & Bean Café",
  category: "Café",
  image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
  status: "Available"
}, {
  name: "Metro Station Plaza",
  category: "Kiosk",
  image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400",
  status: "Booked"
}, {
  name: "Downtown Bar & Lounge",
  category: "Bar",
  image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400",
  status: "Available"
}];
export const FeaturedLocations = () => {
  return <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Featured Venues</h2>
          <p className="text-xl text-muted-foreground">Premium micro ad spaces in high-traffic areas</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {locations.map((location, index) => <Link key={index} to="/publishers?type=venue">
              <Card className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={location.image} alt={location.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{location.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {location.category}
                      </p>
                    </div>
                    <Badge variant={location.status === "Available" ? "default" : "secondary"}>
                      {location.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>)}
        </div>
      </div>
    </section>;
};