import { Store, ShoppingBag, Calendar, TrendingUp, Building } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const advertiserTypes = [
  {
    title: "Local Businesses",
    description: "Boost foot traffic and engagement with QR code stickers in your neighborhood.",
    icon: Store,
  },
  {
    title: "Retail & E-commerce Brands",
    description: "Drive online conversions by connecting offline placements to digital campaigns.",
    icon: ShoppingBag,
  },
  {
    title: "Event Promotions",
    description: "Promote concerts, launches, or pop-ups through targeted sticker campaigns.",
    icon: Calendar,
  },
  {
    title: "Franchises & Chains",
    description: "Ensure consistent local reach across multiple locations worldwide.",
    icon: Building,
  },
];

export const AdvertiserTypes = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Advertise with Precision & Impact
          </h2>
          <p className="text-xl text-muted-foreground">
            Tiny Sticky Ads enables brands to leverage hyper-local guerilla advertising with cross-platform reach. 
            Create measurable, scalable campaigns that compete globally—no matter your size.
          </p>
          <p className="text-lg text-muted-foreground">
            Small brands can now compete with big names through strategic micro-location placements and real-time tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {advertiserTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow border-border bg-card">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{type.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {type.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Buy Ad Space
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
