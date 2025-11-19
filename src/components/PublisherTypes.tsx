import { Building2, Users, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const PublisherTypes = () => {
  const publisherTypes = [
    {
      icon: Building2,
      title: "Venue Publishers",
      description: "Physical locations like cafés, restaurants, bars, and retail spaces hosting small-format ads on tables, walls, and displays.",
      features: ["Prime locations", "Verified spaces", "High foot traffic"]
    },
    {
      icon: Users,
      title: "Agent Publishers",
      description: "Freelance placement agents including guerrilla agents, influencers, models, and artists executing independent campaigns across urban environments.",
      features: ["Flexible placement", "Wide coverage", "Creative campaigns"]
    },
    {
      icon: Globe,
      title: "Digital Publishers",
      description: "Websites, apps, and social media accounts accepting micro-ad creatives for online display and engagement.",
      features: ["Instant deployment", "Trackable metrics", "Global reach"]
    }
  ];

  return (
    <section className="py-24 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Publisher Types</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three ways to monetize your space or audience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {publisherTypes.map((type) => (
            <Card key={type.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <type.icon className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">{type.title}</CardTitle>
                <CardDescription className="text-base">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature) => (
                    <li key={feature} className="flex items-center text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
