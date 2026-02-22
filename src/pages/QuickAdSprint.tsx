import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Palette, BarChart3, Zap, CheckCircle2, Star } from "lucide-react";
import { Link } from "react-router-dom";

const services = [
  {
    icon: MapPin,
    emoji: "📍",
    title: "Location Bundling",
    summary: "Select a bundle of 5–10 prime micro-locations",
    details: [
      "Hand-picked high-foot-traffic spots in your target area",
      "Strategic placement across cafés, salons, and retail counters",
      "Ideal for testing which locations drive the best engagement",
      "Locations verified for visibility and audience match",
    ],
  },
  {
    icon: Palette,
    emoji: "🎨",
    title: "Creative Development",
    summary: "1 sticker ad design with 1 revision",
    details: [
      "Custom sticker ad designed to match your brand identity",
      "One round of revisions to ensure perfection",
      "Print-ready file delivered in all required formats",
      "Designed for maximum impact in small-format placements",
    ],
  },
  {
    icon: BarChart3,
    emoji: "📊",
    title: "Campaign Management",
    summary: "Placement in chosen locations + basic performance report",
    details: [
      "Coordinated placement across all selected micro-locations",
      "QR code integration for tracking engagement",
      "Basic performance report with scan counts and location data",
      "Campaign duration: up to 2 weeks",
    ],
  },
];

const testimonials = [
  {
    quote: "We tested our first sticker campaign and got 3x the foot traffic to our pop-up store. The Sprint was the perfect starting point.",
    name: "Maria S.",
    role: "Pop-up Shop Owner",
  },
  {
    quote: "Quick, affordable, and surprisingly effective. I didn't expect this level of engagement from micro-ads.",
    name: "Jason L.",
    role: "Freelance Event Planner",
  },
];

const QuickAdSprint = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          <h1 className="text-lg md:text-4xl font-bold mb-2 md:mb-3">Quick Ad Sprint</h1>
          <p className="text-muted-foreground text-[9px] md:text-lg max-w-2xl mx-auto">
            Test a small campaign fast—perfect for first-time advertisers.
          </p>
        </div>
      </section>

      {/* Service Breakdown */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-[12px] md:text-2xl font-bold text-center mb-6 md:mb-10">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {services.map((service) => (
              <Card key={service.title} className="p-4 md:p-6 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all duration-300">
                <CardContent className="p-0 flex flex-col gap-3 md:gap-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <service.icon className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[8px] md:text-xs text-muted-foreground">{service.emoji}</p>
                      <h3 className="text-[10px] md:text-lg font-bold">{service.title}</h3>
                    </div>
                  </div>
                  <p className="text-[9px] md:text-sm font-semibold text-primary">{service.summary}</p>
                  <ul className="space-y-1.5 md:space-y-2">
                    {service.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-1.5 md:gap-2">
                        <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-[8px] md:text-sm text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[12px] md:text-2xl font-bold mb-4 md:mb-6">Pricing</h2>
          <Card className="max-w-md mx-auto p-6 md:p-8">
            <CardContent className="p-0 flex flex-col items-center gap-3 md:gap-4">
              <p className="text-2xl md:text-5xl font-bold text-primary">₱4,999</p>
              <p className="text-[8px] md:text-sm text-muted-foreground">One-time campaign fee</p>
              <div className="w-12 md:w-16 h-[2px] bg-primary" />
              <ul className="text-left space-y-1.5 md:space-y-2 w-full">
                <li className="flex items-center gap-2 text-[8px] md:text-sm"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" /> 5–10 micro-locations</li>
                <li className="flex items-center gap-2 text-[8px] md:text-sm"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" /> 1 sticker design + 1 revision</li>
                <li className="flex items-center gap-2 text-[8px] md:text-sm"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" /> Basic performance report</li>
                <li className="flex items-center gap-2 text-[8px] md:text-sm"><CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" /> Up to 2-week campaign</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-[12px] md:text-2xl font-bold text-center mb-6 md:mb-10">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            {testimonials.map((t, i) => (
              <Card key={i} className="p-4 md:p-6">
                <CardContent className="p-0 flex flex-col gap-2 md:gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3 h-3 md:w-4 md:h-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-[8px] md:text-sm text-muted-foreground italic">"{t.quote}"</p>
                  <div>
                    <p className="text-[9px] md:text-sm font-bold">{t.name}</p>
                    <p className="text-[8px] md:text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[12px] md:text-2xl font-bold mb-2 md:mb-3">Ready to Test Your First Campaign?</h2>
          <p className="text-[8px] md:text-sm text-muted-foreground mb-4 md:mb-6 max-w-lg mx-auto">
            Get started with a Quick Ad Sprint and see the power of micro-advertising firsthand.
          </p>
          <Link to="/contact">
            <Button size="lg" className="text-[9px] md:text-sm h-8 md:h-12">
              Start a Sprint →
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default QuickAdSprint;
