import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, TrendingUp } from "lucide-react";

const digitalPublishers = [
  {
    name: "Urban Lifestyle Blog",
    category: "Lifestyle & Culture",
    reach: "250K monthly visitors",
    engagement: "High",
    platforms: ["Website", "Newsletter"],
    status: "available",
  },
  {
    name: "FoodieSpot Network",
    category: "Food & Dining",
    reach: "500K monthly visitors",
    engagement: "High",
    platforms: ["Website", "Social Media"],
    status: "available",
  },
  {
    name: "City Events Hub",
    category: "Events & Entertainment",
    reach: "180K monthly visitors",
    engagement: "Medium",
    platforms: ["Website", "App"],
    status: "available",
  },
  {
    name: "Local Business Review",
    category: "Business & Reviews",
    reach: "350K monthly visitors",
    engagement: "High",
    platforms: ["Website", "Newsletter"],
    status: "limited",
  },
];

export const FeaturedDigitalMedia = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Featured Digital Media
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Amplify your campaign with trusted digital publishers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {digitalPublishers.map((publisher, index) => (
            <Link key={index} to="/publishers?type=digital">
              <Card className="hover:shadow-lg transition-all group border-border bg-card">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant={publisher.status === "available" ? "default" : "secondary"}>
                      {publisher.status === "available" ? "Available" : "Limited Slots"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors text-card-foreground">
                    {publisher.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm font-medium text-foreground">
                    {publisher.category}
                  </CardDescription>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{publisher.reach}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    <span>{publisher.engagement} Engagement</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {publisher.platforms.map((platform, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
