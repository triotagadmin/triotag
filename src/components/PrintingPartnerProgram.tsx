import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell } from
"@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Camera,
  MapPin,
  BarChart3,
  Shield,
  TrendingUp,
  Handshake,
  FileText,
  MessageSquare,
  Award,
  ArrowRight,
  Clock,
  DollarSign,
  Users,
  Repeat } from
"lucide-react";

/* ─── Value Pillars ─── */
const pillars = [
{
  icon: MapPin,
  title: "Ad Space Onboarding",
  description:
  "Register every tarpaulin, poster, or sticker location as a verified, trackable media placement — giving your print jobs lasting value."
},
{
  icon: Camera,
  title: "Proof of Placement",
  description:
  "Timestamped photos and GPS verification give advertisers confidence that their materials are installed, visible, and performing."
},
{
  icon: BarChart3,
  title: "Campaign Reporting",
  description:
  "Deliver professional placement reports to advertisers — the kind of accountability that turns a one-time print job into a monthly retainer."
},
{
  icon: Shield,
  title: "Verification & Trust",
  description:
  "Every ad placement is verified by our system. Advertisers see proof, you build credibility, and renewals become automatic."
},
{
  icon: TrendingUp,
  title: "Recurring Revenue",
  description:
  "Stop chasing one-off orders. Verified placements give you the proof to charge monthly media fees on top of your print costs."
},
{
  icon: Handshake,
  title: "Full Control, Zero Competition",
  description:
  "You keep your clients, your pricing, and your relationships. No other printer sees your listings. No marketplace fees."
}];


/* ─── Comparison rows ─── */
const comparisonRows = [
{
  feature: "Revenue per job",
  traditional: "One-time print fee",
  partner: "Print fee + monthly media income"
},
{
  feature: "Client retention",
  traditional: "Job-by-job, no guaranteed repeat",
  partner: "Monthly placements drive renewals"
},
{
  feature: "Proof of installation",
  traditional: "WhatsApp photo at best",
  partner: "GPS-verified, timestamped reports"
},
{
  feature: "Advertiser confidence",
  traditional: "Trust-based, hard to verify",
  partner: "Platform-verified placement proof"
},
{
  feature: "Campaign reporting",
  traditional: "None",
  partner: "Professional reports per placement"
},
{
  feature: "Pricing power",
  traditional: "Race to the bottom on print cost",
  partner: "Charge for media value, not just ink"
},
{
  feature: "Competitive moat",
  traditional: "Any shop can match your price",
  partner: "Verified network no competitor can replicate"
}];


/* ─── What's included ─── */
const programIncludes = [
{
  icon: MapPin,
  title: "Ad Space Onboarding & Listing",
  description:
  "We help you register every installation site — walls, fences, vehicles, storefronts — as verified media placements on the platform."
},
{
  icon: DollarSign,
  title: "Pricing Guidance",
  description:
  "Get location-based pricing benchmarks so you know exactly what to charge for monthly ad placement fees on top of your production costs."
},
{
  icon: FileText,
  title: "Pitch Decks & Proposal Templates",
  description:
  "Ready-made presentation materials you can brand as your own when approaching advertisers, agencies, and local businesses."
},
{
  icon: BarChart3,
  title: "Proof-of-Placement Reports",
  description:
  "Automated reports with timestamped photos, GPS coordinates, and installation verification — delivered to your advertisers."
},
{
  icon: Award,
  title: "Publisher Partner Credentials",
  description:
  "A verified badge and partner status that signals professionalism to advertisers and separates you from every other print shop."
},
{
  icon: MessageSquare,
  title: "WhatsApp & Email Scripts",
  description:
  "Proven outreach scripts for contacting potential advertisers, following up on leads, and closing recurring placement deals."
}];


/* ─── Upsell strategies ─── */
const upsellStrategies = [
{
  icon: Repeat,
  title: "Turn One-Time Jobs Into Monthly Contracts",
  description:
  'When a client orders a tarpaulin, show them the value: "For ₱X more per month, we verify your placement, deliver proof reports, and help you track ROI." Most say yes.'
},
{
  icon: Users,
  title: "Approach Local Businesses With Data",
  description:
  "Use your verified placement reports to cold-pitch businesses near your installation sites. Real proof beats every sales promise."
},
{
  icon: FileText,
  title: "Bundle Print + Placement as a Package",
  description:
  "Stop selling print alone. Offer a complete advertising package: design, print, install, verify, report. Command premium pricing."
},
{
  icon: Clock,
  title: "Lock In 3–6 Month Placement Deals",
  description:
  "With verified reporting, advertisers trust longer commitments. Longer contracts mean predictable income for your shop every month."
}];


export const PrintingPartnerProgram = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fadeIn = (delay = 0) =>
  `transition-all duration-700 ${
  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`;


  return (
    <section ref={sectionRef} className="relative py-16 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 right-1/4 w-40 md:w-80 h-40 md:h-80 bg-primary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10 space-y-20 md:space-y-32">
        {/* ════════ HERO ════════ */}
        <div className={`text-center max-w-4xl mx-auto ${fadeIn()}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <Handshake className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Exclusive Partner Program
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
            Turn Your Print Shop
            <br />
            <span className="text-primary">Into a Recurring Media Business</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-4">You already print tarpaulins, stickers, posters, and signage. With our platform now you can gain another revenue stream by offering your ad space partner to our advertising clients.

            <span className="text-foreground font-semibold">every month</span> for
            keeping them verified, visible, and performing.
          </p>

          <p className="text-base md:text-lg text-primary font-semibold max-w-2xl mx-auto">
            Tiny Sticky Ads gives printing companies the tools to onboard ad spaces, prove
            placements, and earn recurring income — without giving up a single client.
          </p>
        </div>

        {/* ════════ VALUE PILLARS ════════ */}
        <div>
          <h3
            className={`text-center text-2xl md:text-3xl font-display font-bold mb-10 ${fadeIn()}`}>

            What the Platform Does for Your Business
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {pillars.map((p, i) =>
            <Card
              key={p.title}
              className={`group border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 ${fadeIn()}`}
              style={{ transitionDelay: `${i * 80}ms` }}>

                <CardContent className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {p.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ════════ PROOF REPORT SAMPLE ════════ */}
        <div className={fadeIn()}>
          <h3 className="text-center text-2xl md:text-3xl font-display font-bold mb-4">
            Sample Ad Placement Proof Report
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Every verified placement generates a professional report your advertiser can see.
            This is what separates you from every other print shop in your area.
          </p>

          <Card className="max-w-2xl mx-auto border-primary/20 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Placement Report
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    Wall Tarpaulin — EDSA Northbound
                  </p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Install Date</p>
                  <p className="font-medium text-foreground">March 1, 2026 — 09:42 AM</p>
                </div>
                <div>
                  <p className="text-muted-foreground">GPS Coordinates</p>
                  <p className="font-medium text-foreground">14.6507° N, 121.0495° E</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Verification Status</p>
                  <p className="font-medium text-primary">✓ Verified & Active</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Check-in</p>
                  <p className="font-medium text-foreground">April 1, 2026</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Installation Photo (timestamped)
                </p>
                <div className="h-32 bg-muted rounded flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                This report is automatically generated for every verified ad placement.
                Share it with your advertiser to build trust and secure renewals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ════════ COMPETITIVE ADVANTAGE ════════ */}
        <div className={fadeIn()}>
          <h3 className="text-center text-2xl md:text-3xl font-display font-bold mb-4">
            Your Competitive Advantage Over Other Print Shops
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            Most print shops hand over a tarpaulin and hope for a repeat order. You deliver a
            verified, tracked advertising placement backed by proof — and charge accordingly.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
            {
              icon: Camera,
              title: "Timestamped Installation Photos",
              text: "Every installation is documented with date, time, and GPS. Advertisers never have to guess if their ad is up."
            },
            {
              icon: Shield,
              title: "Platform Verification",
              text: "Tiny Sticky Ads verifies each placement independently. Your word becomes platform-backed proof."
            },
            {
              icon: Repeat,
              title: "Renewal-Ready Reporting",
              text: "Monthly reports make renewal conversations effortless. Advertisers see value, you keep earning."
            }].
            map((item) =>
            <Card key={item.title} className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-5 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ════════ COMPARISON TABLE ════════ */}
        <div className={fadeIn()}>
          <h3 className="text-center text-2xl md:text-3xl font-display font-bold mb-4">
            Traditional Print Shop vs. Publisher Partner
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-8">
            See the difference between running a print shop the old way — and building a
            verified advertising media business.
          </p>

          <div className="max-w-4xl mx-auto overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-primary/20">
                  <TableHead className="text-foreground font-semibold w-[30%]">Feature</TableHead>
                  <TableHead className="text-muted-foreground w-[35%]">
                    Traditional Print Shop
                  </TableHead>
                  <TableHead className="text-primary font-semibold w-[35%]">
                    Publisher Partner with Tiny Sticky Ads
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) =>
                <TableRow key={row.feature} className="border-border/40">
                    <TableCell className="font-medium text-foreground">{row.feature}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        {row.traditional}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-start gap-2 text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {row.partner}
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ════════ PROGRAM INTRODUCTION ════════ */}
        <div className={`text-center max-w-3xl mx-auto ${fadeIn()}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">By Application Only</span>
          </div>

          <h3 className="text-2xl md:text-4xl font-display font-bold mb-6">
            The Publisher Partner Program
          </h3>

          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-4">
            This is not a signup form. It's a partnership.
          </p>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            We work with a limited number of printing companies in each city to build a verified
            network of ad placements. Early partners get priority access, dedicated onboarding,
            and first-mover advantage in their area. If you already print and install advertising
            materials, this program was built for you.
          </p>
        </div>

        {/* ════════ WHAT'S INCLUDED ════════ */}
        <div>
          <h3
            className={`text-center text-2xl md:text-3xl font-display font-bold mb-4 ${fadeIn()}`}>

            What's Included in the Program
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
            Everything you need to turn your print shop into a recurring advertising media business
            — without changing how you work.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {programIncludes.map((item, i) =>
            <Card
              key={item.title}
              className={`group border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 ${fadeIn()}`}
              style={{ transitionDelay: `${i * 80}ms` }}>

                <CardContent className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ════════ SELL TO ADVERTISERS ════════ */}
        <div>
          <h3
            className={`text-center text-2xl md:text-3xl font-display font-bold mb-4 ${fadeIn()}`}>

            How We Help You Sell Ad Placements
          </h3>
          <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
            We don't just onboard your spaces — we arm you with everything you need to close
            deals, upsell existing clients, and grow recurring revenue.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
            {upsellStrategies.map((s, i) =>
            <Card
              key={s.title}
              className={`group border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 ${fadeIn()}`}
              style={{ transitionDelay: `${i * 80}ms` }}>

                <CardContent className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {s.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ════════ CLOSING CTA ════════ */}
        <div className={`text-center max-w-3xl mx-auto ${fadeIn()}`}>
          <h3 className="text-2xl md:text-4xl font-display font-bold mb-6">
            Stop Selling Print.
            <br />
            <span className="text-primary">Start Selling Advertising.</span>
          </h3>

          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
            Every tarpaulin you install is an ad placement waiting to earn monthly income.
            Every sticker is a verified media spot. Every poster is proof of performance.
            The only difference between a print shop and a media business is what you do
            after the installation.
          </p>

          <Link to="/list-space">
            <Button
              size="lg"
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)] transition-all duration-300">

              <span className="relative z-10 flex items-center gap-2">
                Join the Publisher Partner Program
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </Link>

          <p className="mt-4 text-sm text-muted-foreground">
            Limited spots per city • Early access for qualified printing companies • No platform
            fees on your print work
          </p>
        </div>
      </div>
    </section>);

};