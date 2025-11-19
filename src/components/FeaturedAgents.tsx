import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Star } from "lucide-react";

const agents = [
  {
    name: "Urban Connect Agency",
    location: "New York, NY",
    reach: "500+ venues",
    rating: "4.9",
    specialty: "High-traffic locations",
    status: "accepting",
  },
  {
    name: "Street Marketing Pros",
    location: "Los Angeles, CA",
    reach: "300+ venues",
    rating: "4.8",
    specialty: "Entertainment districts",
    status: "accepting",
  },
  {
    name: "Metro Ad Solutions",
    location: "Chicago, IL",
    reach: "450+ venues",
    rating: "4.9",
    specialty: "Transit hubs",
    status: "accepting",
  },
  {
    name: "Coastal Media Network",
    location: "Miami, FL",
    reach: "250+ venues",
    rating: "4.7",
    specialty: "Beach & nightlife",
    status: "limited",
  },
];

export const FeaturedAgents = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Featured Agents
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect with trusted agents managing premium venue networks
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.map((agent, index) => (
            <Card key={index} className="hover:shadow-lg transition-all group border-border bg-card">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant={agent.status === "accepting" ? "default" : "secondary"}>
                    {agent.status === "accepting" ? "Accepting Campaigns" : "Limited Availability"}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors text-card-foreground">
                  {agent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{agent.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span>{agent.rating} rating</span>
                </div>
                <CardDescription className="text-muted-foreground">
                  {agent.reach} • {agent.specialty}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
