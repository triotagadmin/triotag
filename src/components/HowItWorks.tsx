import { MapPin, Calendar, Camera, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: MapPin,
    title: "Register as Advertiser",
    description: "Browse venues, agents, and digital publishers worldwide",
  },
  {
    icon: Calendar,
    title: "Book Publisher",
    description: "Select your ad slots and schedule your campaign",
  },
  {
    icon: Camera,
    title: "Verify & Approve",
    description: "Send campaign details and Approve campaign.",
  },
  {
    icon: TrendingUp,
    title: "Track Results",
    description: "Real-time analytics and proof of placement",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">Four simple steps to start advertising</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="border-2 hover:border-primary transition-all hover:shadow-lg">
                <CardContent className="pt-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
