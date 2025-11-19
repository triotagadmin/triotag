import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Users, UserCircle, Palette } from "lucide-react";

const agents = [
  {
    name: "Urban Guerrilla Network",
    category: "Guerrilla Placements",
    reach: "500+ locations",
    rating: "4.9",
    specialty: "Street art & pop-ups",
    status: "accepting",
    icon: Sparkles,
  },
  {
    name: "Social Influence Collective",
    category: "Influencers",
    reach: "2M+ followers",
    rating: "4.8",
    specialty: "Lifestyle & entertainment",
    status: "accepting",
    icon: Users,
  },
  {
    name: "Elite Model Network",
    category: "Models",
    reach: "300+ models",
    rating: "4.9",
    specialty: "Brand ambassadors",
    status: "accepting",
    icon: UserCircle,
  },
  {
    name: "Creative Artists Guild",
    category: "Artists",
    reach: "200+ artists",
    rating: "4.7",
    specialty: "Murals & installations",
    status: "limited",
    icon: Palette,
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
            Connect with guerrilla placements, influencers, models, and artists
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.map((agent, index) => {
            const IconComponent = agent.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-all group border-border bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant={agent.status === "accepting" ? "default" : "secondary"}>
                      {agent.status === "accepting" ? "Available" : "Limited Availability"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors text-card-foreground">
                    {agent.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span>{agent.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{agent.reach}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{agent.rating} ★ rating</span>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {agent.specialty}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
