import { useEffect, type ElementType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Compass,
  Gauge,
  Layers3,
  Megaphone,
  MonitorPlay,
  MousePointerClick,
  Network,
  PanelsTopLeft,
  QrCode,
  Search,
  Sparkles,
  Store,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const CANONICAL = "https://triotag.com/industries/sspsource";
const TITLE = "Outsourced Advertising Agency & Retail Media | TRIOTAG";
const DESCRIPTION =
  "TRIOTAG is an outsourced advertising agency providing social media advertising, paid media, creative, SEO, analytics, OOH, DOOH and retail media services through one integrated advertising partner.";

const setMeta = (selector: string, attr: string, value: string) => {
  let element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!element) {
    if (selector.startsWith("link")) {
      element = document.createElement("link");
      (element as HTMLLinkElement).rel = "canonical";
    } else {
      element = document.createElement("meta");
      const match = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (match) element.setAttribute(match[1], match[2]);
    }
    document.head.appendChild(element);
  }
  element.setAttribute(attr, value);
};

const services = [
  {
    number: "01",
    icon: Megaphone,
    title: "Social Media Advertising",
    items: [
      "Facebook Advertising",
      "Instagram Advertising",
      "TikTok Advertising",
      "Social Campaign Strategy",
      "Audience Targeting",
      "Retargeting",
      "Creative Testing",
      "Campaign Optimization",
    ],
  },
  {
    number: "02",
    icon: Target,
    title: "Search & Performance Advertising",
    items: [
      "Google Ads",
      "Search Advertising",
      "Display Advertising",
      "YouTube Advertising",
      "Performance Campaigns",
      "Remarketing",
      "Conversion Tracking",
      "Campaign Optimization",
    ],
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Creative & Content",
    items: [
      "Advertising Creatives",
      "Social Media Creatives",
      "Display Banners",
      "Promotional Graphics",
      "Video Advertising",
      "Short-Form Video",
      "Copywriting",
      "Campaign Concepts",
    ],
  },
  {
    number: "04",
    icon: Search,
    title: "SEO & Search Visibility",
    items: [
      "SEO Strategy",
      "Keyword Research",
      "On-Page SEO",
      "Technical SEO",
      "Local SEO",
      "Google Business Profile Optimization",
      "SEO Content",
      "AI/GEO Search Visibility",
    ],
  },
  {
    number: "05",
    icon: PanelsTopLeft,
    title: "Digital Campaign Infrastructure",
    items: [
      "Landing Pages",
      "Campaign Microsites",
      "SEO Websites",
      "Lead Generation Pages",
      "QR Landing Pages",
      "Conversion Optimization",
      "Tracking",
      "Analytics Integration",
    ],
  },
  {
    number: "06",
    icon: BarChart3,
    title: "Analytics & Advertising Intelligence",
    items: [
      "Campaign Reporting",
      "Conversion Tracking",
      "Analytics",
      "Audience Analysis",
      "Competitor Research",
      "Performance Analysis",
      "Advertising Dashboards",
      "Campaign Insights",
    ],
  },
  {
    number: "07",
    icon: Bot,
    title: "AI & Advertising Automation",
    items: [
      "AI Advertising Assistants",
      "AI Lead Generation",
      "Automated Lead Capture",
      "Advertising Workflows",
      "CRM Automation",
      "Customer Engagement Automation",
      "AI-Assisted Content Operations",
    ],
  },
  {
    number: "08",
    icon: Store,
    title: "Retail Media Advertising",
    items: [
      "OOH Advertising",
      "DOOH Advertising",
      "In-Store Advertising",
      "Tabletop Advertising",
      "Retail Screens",
      "Physical Advertising Spaces",
      "Retail Media Campaigns",
      "QR Campaigns",
      "Physical-to-Digital Campaigns",
    ],
  },
];

const audiences = [
  ["Growing Businesses", "Outsource advertising instead of building a large internal advertising department."],
  [
    "Startups",
    "Access professional advertising capabilities without immediately hiring a complete advertising operation.",
  ],
  ["Retailers & Consumer Brands", "Connect digital advertising with physical retail media opportunities."],
  ["Franchises", "Develop scalable advertising campaigns across multiple locations."],
  ["Multi-Location Businesses", "Coordinate advertising across multiple physical locations and markets."],
  [
    "Agencies & Business Partners",
    "Add advertising and retail media capabilities to your existing operation through an outsourced partnership.",
  ],
];

const technology = [
  [
    Layers3,
    "Retail media inventory",
    "Discover and organize OOH, DOOH and audio opportunities across physical locations.",
  ],
  [
    ClipboardCheck,
    "Campaign management",
    "Plan, submit and manage advertising campaigns with location and budget requirements.",
  ],
  [
    Users,
    "Media owner relationships",
    "Connect campaign demand with registered media partners and physical advertising spaces.",
  ],
  [QrCode, "QR tracking", "Bridge physical placements to digital experiences with trackable QR interactions."],
  [BarChart3, "Campaign analytics", "Review QR engagement and campaign signals through reporting interfaces."],
  [
    Store,
    "Physical advertising opportunities",
    "Access posters, tabletop media, retail screens, OOH, DOOH and AOOH formats.",
  ],
  [
    MonitorPlay,
    "Digital campaign integration",
    "Coordinate digital screen delivery and physical-to-digital campaign touchpoints.",
  ],
] as const;

const mediaLayers: { icon: ElementType; title: string; items: string[] }[] = [
  { icon: Megaphone, title: "Digital Advertising", items: ["Meta", "TikTok", "Google", "YouTube", "SEO", "Web"] },
  { icon: Store, title: "Retail Media", items: ["OOH", "DOOH", "In-Store", "Tabletop", "Retail Screens", "Print"] },
  { icon: BarChart3, title: "Data", items: ["QR Tracking", "Lead Capture", "Campaign Analytics", "Conversion Data"] },
];

const packages = [
  {
    name: "Foundation",
    description: "For businesses that need essential advertising support.",
    items: ["Social Advertising", "Creative", "Basic SEO", "Campaign Reporting"],
  },
  {
    name: "Growth",
    description: "For businesses that want a broader advertising operation.",
    items: [
      "Social Advertising",
      "Google Ads",
      "Creative",
      "SEO",
      "Landing Pages",
      "Analytics",
      "Retargeting",
      "Content",
    ],
    featured: true,
  },
  {
    name: "Retail Media",
    description: "For businesses combining digital and physical media.",
    items: [
      "Digital Advertising",
      "Social Advertising",
      "Search",
      "Creative",
      "SEO",
      "Analytics",
      "OOH",
      "DOOH",
      "Retail Media",
      "QR Campaigns",
      "Physical-to-Digital Advertising",
    ],
  },
];

const SectionHeading = ({
  eyebrow,
  title,
  copy,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
  center?: boolean;
}) => (
  <div className={center ? "mx-auto mb-12 max-w-3xl text-center md:mb-16" : "mb-12 max-w-3xl md:mb-16"}>
    {eyebrow && <p className="mb-4 text-xs font-semibold uppercase text-primary">{eyebrow}</p>}
    <h2 className="text-3xl font-bold leading-tight text-foreground md:text-5xl">{title}</h2>
    {copy && <p className="mt-5 text-base leading-7 text-muted-foreground md:text-lg">{copy}</p>}
  </div>
);

const GlassCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`border border-border bg-card/70 backdrop-blur-xl ${className}`}>{children}</div>
);

const Ecosystem = () => {
  const channels = [
    "SOCIAL",
    "PAID MEDIA",
    "SEARCH",
    "CREATIVE",
    "SEO",
    "WEB",
    "ANALYTICS",
    "RETAIL MEDIA",
    "OOH",
    "DOOH",
  ];
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[620px]"
      aria-label="TRIOTAG connected advertising ecosystem"
    >
      <div className="absolute inset-[12%] rounded-full border border-primary/15" />
      <div className="absolute inset-[27%] rounded-full border border-primary/25" />
      <svg className="absolute inset-0 h-full w-full text-primary/35" viewBox="0 0 100 100" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="0.25" strokeDasharray="1.5 1.5">
          <line x1="50" y1="50" x2="50" y2="8" />
          <line x1="50" y1="50" x2="75" y2="15" />
          <line x1="50" y1="50" x2="91" y2="35" />
          <line x1="50" y1="50" x2="91" y2="65" />
          <line x1="50" y1="50" x2="75" y2="85" />
          <line x1="50" y1="50" x2="50" y2="92" />
          <line x1="50" y1="50" x2="25" y2="85" />
          <line x1="50" y1="50" x2="9" y2="65" />
          <line x1="50" y1="50" x2="9" y2="35" />
          <line x1="50" y1="50" x2="25" y2="15" />
        </g>
      </svg>
      <div className="adops-core absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/60 bg-background text-center shadow-[0_0_45px_hsl(var(--primary)/0.18)] md:h-36 md:w-36">
        <div>
          <Network className="mx-auto mb-2 h-6 w-6 text-primary" />
          <span className="text-sm font-bold text-foreground md:text-base">TRIOTAG</span>
          <span className="mt-1 block text-[9px] uppercase text-muted-foreground">Advertising Operations</span>
        </div>
      </div>
      {channels.map((channel, index) => (
        <span key={channel} className={`adops-node adops-node-${index + 1}`}>
          {channel}
        </span>
      ))}
    </div>
  );
};

const Brands = () => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = TITLE;
    setMeta('meta[name="description"]', "content", DESCRIPTION);
    setMeta(
      'meta[name="keywords"]',
      "content",
      "outsourced advertising agency, outsourced advertising services, advertising agency Philippines, digital advertising agency, social media advertising agency, performance advertising, paid media agency, retail media agency, OOH advertising, DOOH advertising, advertising outsourcing, outsourced media buying, Google advertising, retail advertising",
    );
    setMeta('link[rel="canonical"]', "href", CANONICAL);
    setMeta('meta[property="og:title"]', "content", TITLE);
    setMeta('meta[property="og:description"]', "content", DESCRIPTION);
    setMeta('meta[property="og:url"]', "content", CANONICAL);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[name="twitter:title"]', "content", TITLE);
    setMeta('meta[name="twitter:description"]', "content", DESCRIPTION);
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navigation />

      <main>
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden border-b border-border">
          <div className="adops-grid absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
          <div className="container relative mx-auto grid items-center gap-12 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:py-24">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase text-primary">
                <CircleDot className="h-3.5 w-3.5" /> Outsourced Advertising Agency
              </p>
              <h1 className="text-4xl font-bold leading-[1.08] text-foreground md:text-6xl lg:text-7xl">
                Your Advertising Agency. <span className="text-primary">Without the Overhead.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                Access a multidisciplinary advertising operation without building one from scratch. TRIOTAG manages
                digital advertising, social media, creative, search, analytics and retail media through one integrated
                advertising partner.
              </p>
              <p className="mt-5 text-sm font-medium text-foreground/80">
                One agency. Multiple advertising capabilities. Lower operational overhead.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 px-7">
                  <Link to="/contact">
                    Talk to TRIOTAG <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-7">
                  <a href="#services">
                    Explore Advertising Services <ArrowDown />
                  </a>
                </Button>
              </div>
            </div>
            <Ecosystem />
          </div>
        </section>

        <section className="border-b border-border py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading
              eyebrow="The outsourced model"
              title="An Advertising Agency Built Around Your Business."
              copy="Traditional advertising services often require businesses to coordinate multiple specialists, freelancers, vendors and media providers. TRIOTAG brings these capabilities together under one advertising partner."
            />
            <div className="grid gap-5 md:grid-cols-3">
              {[
                [
                  "01",
                  "Lower Overhead",
                  "Access multiple advertising capabilities without the recruitment, payroll and management burden of building every function internally.",
                ],
                [
                  "02",
                  "One Advertising Partner",
                  "Strategy, media buying, creative, digital advertising and retail media can be coordinated through one agency relationship.",
                ],
                [
                  "03",
                  "Scale Without Rebuilding",
                  "Expand your advertising capabilities as your business grows without having to build a new department for every channel.",
                ],
              ].map(([number, title, copy]) => (
                <GlassCard
                  key={number}
                  className="group p-7 transition duration-300 hover:-translate-y-1 hover:border-primary/40"
                >
                  <span className="font-mono text-sm text-primary">{number}</span>
                  <h3 className="mt-8 text-xl font-semibold uppercase text-foreground">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{copy}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-20 border-b border-border bg-card/25 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading
              eyebrow="Managed advertising services"
              title="Complete Advertising Capabilities."
              copy="Instead of hiring multiple advertising specialists, managing separate vendors, and building an expensive internal advertising operation, businesses can outsource their advertising to TRIOTAG."
            />
            <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
              {services.map(({ number, icon: Icon, title, items }) => (
                <article key={number} className="group bg-background p-6 transition-colors hover:bg-card md:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex h-11 w-11 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{number}</span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold uppercase text-foreground">{title}</h3>
                  <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
                    {items.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-border py-20 md:py-32">
          <div className="adops-grid absolute inset-0 opacity-20" />
          <div className="container relative mx-auto px-4 md:px-6">
            <SectionHeading
              eyebrow="The TRIOTAG difference"
              title="Where Digital Advertising Meets Retail Media."
              copy="TRIOTAG goes beyond traditional digital advertising. Through its retail media ecosystem, businesses can extend campaigns into physical environments where customers shop, eat, work and interact."
              center
            />
            <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
              {mediaLayers.map(({ icon: Icon, title, items }, index) => (
                <div key={title} className="contents">
                  {index > 0 && (
                    <div className="flex items-center justify-center text-primary">
                      <ArrowRight className="hidden h-5 w-5 lg:block" />
                      <ArrowDown className="h-5 w-5 lg:hidden" />
                    </div>
                  )}
                  <GlassCard className="p-7">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center bg-primary text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-semibold uppercase">{title}</h3>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {items.map((item) => (
                        <span
                          key={item}
                          className="border border-border bg-secondary px-3 py-1.5 text-xs text-secondary-foreground"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
            <p className="mt-12 text-center text-2xl font-semibold text-foreground md:text-3xl">
              One Advertising Strategy. <span className="text-primary">Multiple Media Environments.</span>
            </p>
          </div>
        </section>

        <section className="border-b border-border py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading eyebrow="Operational comparison" title="Why partner with Triotag?" />
            <div className="grid overflow-hidden border border-border lg:grid-cols-2">
              <div className="bg-card/40 p-7 md:p-10">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Build your own advertising operation
                </p>
                <ul className="mt-7 space-y-4">
                  {[
                    "Recruit specialists",
                    "Manage employees",
                    "Coordinate freelancers",
                    "Manage multiple vendors",
                    "Purchase software",
                    "Build media relationships",
                    "Manage campaign operations",
                    "Handle reporting",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <span className="h-px w-4 bg-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-primary/30 bg-primary/5 p-7 md:p-10 lg:border-l lg:border-t-0">
                <p className="text-xs font-semibold uppercase text-primary">Outsource to TRIOTAG</p>
                <ul className="mt-7 space-y-4">
                  {[
                    "One agency relationship",
                    "Access multiple specialists",
                    "Integrated advertising services",
                    "Managed campaign execution",
                    "Advertising technology",
                    "Retail media access",
                    "Campaign reporting",
                    "Ongoing optimization",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-7 max-w-4xl text-base leading-7 text-muted-foreground">
              Outsourcing allows businesses to access broader advertising capabilities while reducing the operational
              burden associated with building and managing every function internally.
            </p>
          </div>
        </section>

        <section className="border-b border-border bg-card/25 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading
              eyebrow="One coordinated relationship"
              title="Your Advertising Operation, Managed By One Agency."
              copy="Your TRIOTAG account is coordinated through one agency relationship while specialized resources support the advertising functions required by your business."
              center
            />
            <div className="mx-auto max-w-5xl">
              <div className="mx-auto w-fit border border-border bg-card px-8 py-4 text-center">
                <span className="text-xs uppercase text-muted-foreground">Your business</span>
                <strong className="mt-1 block text-lg">CLIENT</strong>
              </div>
              <div className="mx-auto h-10 w-px bg-primary/50" />
              <div className="mx-auto w-fit border border-primary/50 bg-primary px-10 py-5 text-center text-primary-foreground shadow-[0_0_35px_hsl(var(--primary)/0.15)]">
                <Network className="mx-auto mb-2 h-5 w-5" />
                <strong className="text-xl">TRIOTAG</strong>
              </div>
              <div className="mx-auto h-10 w-px bg-primary/50" />
              <p className="mx-auto w-fit border border-border bg-card px-6 py-3 text-center text-xs font-semibold uppercase text-muted-foreground">
                Advertising Specialists
              </p>
              <div className="mx-auto h-6 w-px bg-border" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  "Social Advertising",
                  "Paid Media",
                  "Creative",
                  "SEO",
                  "Search",
                  "Web",
                  "Analytics",
                  "Retail Media",
                  "OOH",
                  "DOOH",
                  "AI & Automation",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex min-h-16 items-center justify-center border border-border bg-background px-3 text-center text-xs font-medium text-foreground transition hover:border-primary/40"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading eyebrow="Working model" title="From Objectives To Ongoing Optimization." />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  Compass,
                  "01",
                  "Discover",
                  "We understand your business, customers, objectives, existing advertising and available media budget.",
                ],
                [
                  Workflow,
                  "02",
                  "Strategize",
                  "We develop an advertising strategy based on your goals, audience and media opportunities.",
                ],
                [
                  MousePointerClick,
                  "03",
                  "Execute",
                  "Our advertising specialists manage campaigns, creative, media, digital channels and retail media.",
                ],
                [
                  Gauge,
                  "04",
                  "Optimize",
                  "We monitor performance, analyze results and continuously improve the advertising operation.",
                ],
              ].map(([Icon, number, title, copy]) => (
                <article key={String(number)} className="relative border-t border-primary/40 pt-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">{String(number)}</span>
                  </div>
                  <h3 className="mt-7 text-xl font-semibold uppercase">{String(title)}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{String(copy)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/25 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading
              eyebrow="Who we work with"
              title="Built For Businesses That Need More Advertising Capability."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {audiences.map(([title, copy], index) => (
                <GlassCard key={title} className="p-6 transition hover:border-primary/40">
                  <span className="font-mono text-xs text-primary">0{index + 1}</span>
                  <h3 className="mt-5 text-lg font-semibold uppercase">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{copy}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading
              eyebrow="TRIOTAG technology"
              title="An Advertising Agency Powered By Technology."
              copy="TRIOTAG combines advertising services with technology designed to support retail media, campaign management, tracking and physical-to-digital advertising."
            />
            <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {technology.map(([Icon, title, copy]) => (
                <article key={title} className="bg-background p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card/25 py-20 md:py-28">
          <div className="container mx-auto px-4 md:px-6">
            <SectionHeading
              eyebrow="Managed packages"
              title="Choose The Level Of Advertising Support You Need."
              copy="Build a managed service scope around the channels and advertising functions your business needs now."
              center
            />
            <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
              {packages.map((item) => (
                <GlassCard
                  key={item.name}
                  className={`flex flex-col p-7 ${item.featured ? "border-primary/50 bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold uppercase">{item.name}</h3>
                    {item.featured && (
                      <span className="border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase text-primary">
                        Expanded
                      </span>
                    )}
                  </div>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {item.items.map((service) => (
                      <li key={service} className="flex items-center gap-2 text-sm text-foreground/85">
                        <Check className="h-4 w-4 text-primary" />
                        {service}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={item.featured ? "default" : "outline"} className="mt-8 w-full">
                    <Link to="/contact">
                      Talk to TRIOTAG <ArrowRight />
                    </Link>
                  </Button>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden py-24 md:py-36">
          <div className="adops-grid absolute inset-0 opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-background" />
          <div className="container relative mx-auto px-4 text-center md:px-6">
            <p className="mb-5 text-xs font-semibold uppercase text-primary">Outsourced Advertising Agency</p>
            <h2 className="mx-auto max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              Stop Building Your Advertising Operation From Scratch.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Partner with TRIOTAG and access a broader advertising operation without taking on the full overhead of
              building one internally.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7">
                <Link to="/contact">
                  Talk to TRIOTAG <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7">
                <a href="#services">Explore Our Services</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <style>{`
        .adops-grid {
          background-image: linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(circle at center, black, transparent 82%);
        }
        .adops-core { animation: adops-pulse 4s ease-in-out infinite; }
        .adops-node {
          position: absolute; z-index: 10; display: flex; min-height: 2rem; align-items: center; justify-content: center;
          border: 1px solid hsl(var(--border)); background: hsl(var(--card) / .88); padding: .4rem .65rem;
          color: hsl(var(--muted-foreground)); font-size: .6rem; font-weight: 700; backdrop-filter: blur(12px);
          animation: adops-drift 6s ease-in-out infinite;
        }
        .adops-node-1 { top: 3%; left: 50%; transform: translateX(-50%); }
        .adops-node-2 { top: 11%; right: 8%; animation-delay: -.6s; }
        .adops-node-3 { top: 32%; right: 0; animation-delay: -1.2s; }
        .adops-node-4 { bottom: 28%; right: 0; animation-delay: -1.8s; }
        .adops-node-5 { bottom: 9%; right: 10%; animation-delay: -2.4s; }
        .adops-node-6 { bottom: 1%; left: 50%; transform: translateX(-50%); animation-delay: -3s; }
        .adops-node-7 { bottom: 9%; left: 8%; animation-delay: -3.6s; }
        .adops-node-8 { bottom: 28%; left: 0; animation-delay: -4.2s; }
        .adops-node-9 { top: 32%; left: 0; animation-delay: -4.8s; }
        .adops-node-10 { top: 11%; left: 8%; animation-delay: -5.4s; }
        @keyframes adops-pulse { 50% { box-shadow: 0 0 65px hsl(var(--primary) / .25); } }
        @keyframes adops-drift { 50% { margin-top: -5px; border-color: hsl(var(--primary) / .45); color: hsl(var(--foreground)); } }
        @media (max-width: 420px) {
          .adops-node { font-size: .5rem; padding: .3rem .4rem; }
          .adops-node-2, .adops-node-5 { right: 1%; }
          .adops-node-7, .adops-node-10 { left: 1%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .adops-core, .adops-node { animation: none; }
          html { scroll-behavior: auto; }
        }
      `}</style>
    </div>
  );
};

export default Brands;
