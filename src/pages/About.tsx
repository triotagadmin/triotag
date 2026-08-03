import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Network,
  CalendarRange,
  Signpost,
  MonitorPlay,
  AudioLines,
  BarChart3,
  Boxes,
  Store,
  ClipboardCheck,
  LineChart,
  Database,
  Workflow,
  Users,
  Building2,
  Megaphone,
  ShoppingBag,
  Lightbulb,
  Eye,
  Handshake,
  Layers,
  ShieldCheck,
  ChevronDown,
  Target,
  Compass,
} from "lucide-react";

/* ============================ METADATA ============================ */
const PAGE_TITLE = "Triotag | About Us";
const PAGE_DESCRIPTION =
  "Learn about Triotag, an Advertising Technology company developing the infrastructure that powers Retail Media across the Philippines through data-driven campaign management, technology, and innovation.";
const PAGE_URL = "https://tinystickyads.com/about";

const setMeta = (selector: string, attr: string, key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const usePageMetadata = () => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = PAGE_TITLE;
    setMeta('meta[name="description"]', "name", "description", PAGE_DESCRIPTION);
    setMeta('meta[property="og:title"]', "property", "og:title", PAGE_TITLE);
    setMeta('meta[property="og:description"]', "property", "og:description", PAGE_DESCRIPTION);
    setMeta('meta[property="og:type"]', "property", "og:type", "website");
    setMeta('meta[property="og:url"]', "property", "og:url", PAGE_URL);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const prevCanonical = canonical?.getAttribute("href") ?? null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", PAGE_URL);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: PAGE_URL,
      mainEntity: {
        "@type": "Organization",
        name: "Triotag",
        url: "https://tinystickyads.com",
        description:
          "Advertising Technology company building Retail Media infrastructure connecting advertisers, retailers, media owners, and commercial venues.",
      },
    });
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevCanonical) canonical?.setAttribute("href", prevCanonical);
      ld.remove();
    };
  }, []);
};

/* ============================ REVEAL ============================ */
const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Section = ({
  id,
  tinted = false,
  children,
}: {
  id?: string;
  tinted?: boolean;
  children: ReactNode;
}) => (
  <section id={id} className={tinted ? "bg-muted/40" : "bg-background"}>
    <div className="mx-auto w-full max-w-[1280px] px-6 py-20 md:py-28">{children}</div>
  </section>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">{children}</p>
);

/* ============================ DATA ============================ */
const capabilities = [
  {
    icon: Network,
    title: "Retail Media Network",
    body: "A unified layer that organizes retail, venue, and media-owner inventory into structured, discoverable advertising supply.",
  },
  {
    icon: CalendarRange,
    title: "Campaign Planning",
    body: "Planning workflows for location targeting, availability, scheduling, and budget allocation across multiple formats.",
  },
  {
    icon: Signpost,
    title: "OOH Advertising",
    body: "Standardized management of static out-of-home placements within retail and commercial environments.",
  },
  {
    icon: MonitorPlay,
    title: "DOOH Advertising",
    body: "Digital screen management, scheduling, and playback coordination across networked retail locations.",
  },
  {
    icon: AudioLines,
    title: "AOOH Advertising",
    body: "Audio out-of-home distribution and scheduling for in-store environments and commercial venues.",
  },
  {
    icon: BarChart3,
    title: "Campaign Measurement",
    body: "Consistent reporting frameworks for delivery, activity, and campaign performance across the network.",
  },
];

const technology = [
  { icon: Workflow, label: "Campaign management" },
  { icon: Boxes, label: "Inventory management" },
  { icon: Building2, label: "Venue management" },
  { icon: ClipboardCheck, label: "Booking workflows" },
  { icon: LineChart, label: "Performance reporting" },
  { icon: Database, label: "Data analytics" },
  { icon: Store, label: "Retail publisher management" },
  { icon: Layers, label: "Automation" },
];

const ecosystem = [
  { icon: Megaphone, label: "Advertisers" },
  { icon: Users, label: "Agencies" },
  { icon: Store, label: "Retailers" },
  { icon: Building2, label: "Venue Owners" },
  { icon: MonitorPlay, label: "Publishers" },
  { icon: ShoppingBag, label: "Consumers" },
];

const values = [
  { icon: Lightbulb, title: "Innovation", body: "We continuously improve advertising technology." },
  { icon: Eye, title: "Transparency", body: "Data-driven reporting and accountable processes." },
  { icon: Handshake, title: "Collaboration", body: "Building stronger partnerships across the retail ecosystem." },
  { icon: Layers, title: "Scalability", body: "Technology designed for businesses of every size." },
  { icon: ShieldCheck, title: "Integrity", body: "Professionalism, accountability, and long-term value creation." },
];

const flow = ["Brand", "Triotag Platform", "Retail Locations", "Consumer", "Measurement"];

/* ============================ PAGE ============================ */
const About = () => {
  usePageMetadata();

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Navigation />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:64px_64px]"
          />
          <div className="relative mx-auto w-full max-w-[1280px] px-6 pt-24 pb-20 md:pt-32 md:pb-28">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <Reveal>
                <Eyebrow>About Triotag</Eyebrow>
                <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
                  Building the Future of Retail Media
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Triotag is an Advertising Technology (AdTech) company developing the infrastructure
                  that connects advertisers, retailers, media owners, and commercial venues into a
                  unified Retail Media Exchange. We enable organizations to discover, plan, activate,
                  and measure retail media campaigns through technology-driven workflows.
                </p>
              </Reveal>

              <Reveal delay={120}>
                <NetworkGraphic />
              </Reveal>
            </div>
          </div>
        </section>

        {/* SECTION 1 — WHO WE ARE */}
        <Section id="who-we-are">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <Eyebrow>Who we are</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">About Triotag</h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Triotag is an Advertising Technology company. We build software and operational
                  infrastructure for Retail Media, with a focus on the systems that make physical
                  advertising inventory structured, bookable, and measurable.
                </p>
                <p>
                  Our platform organizes retail advertising inventory into a scalable ecosystem,
                  connecting brands, agencies, retailers, and publishers through shared technology
                  and standardized workflows.
                </p>
                <p>
                  We believe the future of advertising extends beyond websites and social media into
                  physical commerce environments, where purchasing decisions are made.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Compass, k: "Company type", v: "Advertising Technology" },
                    { icon: Network, k: "Focus", v: "Retail Media infrastructure" },
                    { icon: Store, k: "Environment", v: "Physical commerce" },
                    { icon: Target, k: "Region", v: "Philippines & SEA" },
                  ].map((i) => (
                    <div key={i.k} className="rounded-2xl border border-border bg-background p-5">
                      <i.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{i.k}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{i.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* SECTION 2 — PLATFORM */}
        <Section tinted>
          <Reveal>
            <Eyebrow>What we do</Eyebrow>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Our Platform</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Triotag is composed of platform capabilities that operate together across the retail
              media lifecycle.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={i * 60}>
                <article className="group h-full rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <c.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* SECTION 3 — INDUSTRY */}
        <Section>
          <div className="grid gap-14 lg:grid-cols-2">
            <Reveal>
              <Eyebrow>Our industry</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                The Retail Media Opportunity
              </h2>
              <ul className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                <li>
                  Retail Media is becoming one of the fastest-growing sectors in advertising, driven
                  by the convergence of commerce and media.
                </li>
                <li>
                  Consumers increasingly make purchasing decisions inside physical retail
                  environments, where attention and intent align.
                </li>
                <li>
                  Businesses require measurable media closer to the point of purchase, with
                  reporting comparable to digital channels.
                </li>
                <li>
                  Technology enables standardized planning, activation, and reporting across
                  fragmented physical inventory.
                </li>
              </ul>
            </Reveal>

            <Reveal delay={120}>
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Value chain
                </p>
                <ol className="mt-6 space-y-3">
                  {flow.map((step, i) => (
                    <li key={step} className="flex items-center gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <span
                        className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium ${
                          step === "Triotag Platform"
                            ? "border-primary/40 bg-primary/10 text-foreground"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          </div>
        </Section>

        {/* SECTION 4 — TECHNOLOGY */}
        <Section tinted>
          <Reveal>
            <Eyebrow>Our technology</Eyebrow>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Technology Built for Modern Commerce
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              A single operational environment where inventory, campaigns, partners, and reporting
              are managed through consistent workflows.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <span className="ml-3 text-xs text-muted-foreground">Triotag Platform</span>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
                {technology.map((t, i) => (
                  <Reveal key={t.label} delay={i * 45}>
                    <div className="h-full rounded-2xl border border-border bg-background p-5 transition-colors hover:border-primary/40">
                      <t.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                      <p className="mt-4 text-sm font-semibold text-foreground">{t.label}</p>
                      <div className="mt-4 space-y-2" aria-hidden="true">
                        <div className="h-1.5 w-full rounded-full bg-muted" />
                        <div className="h-1.5 w-2/3 rounded-full bg-muted" />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>
        </Section>

        {/* SECTION 5 — ECOSYSTEM */}
        <Section>
          <Reveal>
            <Eyebrow>Our ecosystem</Eyebrow>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Connected Through Collaboration
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Triotag operates as shared infrastructure. Each participant works within the same
              system, using common data, availability, and reporting standards.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-14 flex justify-center">
              <div className="relative aspect-square w-full max-w-[520px]">
                <div className="absolute inset-[18%] rounded-full border border-dashed border-border" />
                <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-center">
                  <Network className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="mt-2 px-3 text-xs font-semibold text-foreground">
                    Triotag Platform
                  </span>
                </div>
                {ecosystem.map((node, i) => {
                  const angle = (i / ecosystem.length) * 2 * Math.PI - Math.PI / 2;
                  const x = 50 + 42 * Math.cos(angle);
                  const y = 50 + 42 * Math.sin(angle);
                  return (
                    <div
                      key={node.label}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-transform duration-300 hover:scale-105">
                        <node.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">{node.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </Section>

        {/* SECTION 6 — VISION & MISSION */}
        <Section tinted>
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal>
              <article className="h-full rounded-3xl border border-border bg-card p-9 shadow-sm">
                <Compass className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Vision</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  To become Southeast Asia's leading Retail Media Exchange by building technology
                  that connects commerce, media, and data into one intelligent advertising
                  ecosystem.
                </p>
              </article>
            </Reveal>
            <Reveal delay={90}>
              <article className="h-full rounded-3xl border border-border bg-card p-9 shadow-sm">
                <Target className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">Mission</h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  To simplify retail media through scalable technology, transparent workflows, and
                  measurable campaign execution.
                </p>
              </article>
            </Reveal>
          </div>
        </Section>

        {/* SECTION 7 — VALUES */}
        <Section>
          <Reveal>
            <Eyebrow>Core values</Eyebrow>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              How We Operate
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 60}>
                <article className="h-full rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                  <v.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-5 text-base font-semibold text-foreground">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Section>

        {/* FINAL */}
        <Section tinted>
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <Eyebrow>Looking ahead</Eyebrow>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Looking Ahead
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
                <p>
                  Retail media will continue evolving through digital transformation, omnichannel
                  commerce, and intelligent advertising technology. Physical retail environments are
                  becoming measurable media channels, and the systems that support them must meet
                  the same standards as digital infrastructure.
                </p>
                <p>
                  Triotag is focused on building long-term infrastructure rather than short-term
                  campaigns: durable systems for inventory, workflows, and measurement that the
                  wider retail media ecosystem can operate on.
                </p>
              </div>
            </div>
          </Reveal>
        </Section>
      </main>

      <Footer />
    </div>
  );
};

/* ============================ HERO GRAPHIC ============================ */
const NetworkGraphic = () => {
  const nodes = [
    { x: 50, y: 50, r: 9, core: true },
    { x: 16, y: 22, r: 5 },
    { x: 84, y: 20, r: 5 },
    { x: 12, y: 74, r: 5 },
    { x: 86, y: 78, r: 5 },
    { x: 50, y: 10, r: 4 },
    { x: 50, y: 92, r: 4 },
    { x: 26, y: 50, r: 4 },
    { x: 76, y: 50, r: 4 },
  ];

  return (
    <div className="relative rounded-3xl border border-border bg-card p-6 shadow-sm">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Abstract network of connected retail locations, commerce, media, and data"
        className="h-auto w-full"
      >
        {nodes.slice(1).map((n, i) => (
          <line
            key={i}
            x1="50"
            y1="50"
            x2={n.x}
            y2={n.y}
            stroke="hsl(var(--border))"
            strokeWidth="0.4"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={i}>
            {n.core && (
              <circle cx={n.x} cy={n.y} r={n.r + 6} fill="hsl(var(--primary) / 0.08)">
                <animate attributeName="r" values={`${n.r + 4};${n.r + 9};${n.r + 4}`} dur="4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={n.core ? "hsl(var(--primary))" : "hsl(var(--card))"}
              stroke="hsl(var(--primary) / 0.5)"
              strokeWidth="0.6"
            >
              {!n.core && (
                <animate
                  attributeName="opacity"
                  values="0.55;1;0.55"
                  dur={`${3 + i * 0.4}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default About;
