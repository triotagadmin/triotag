import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft, X, Check, Info, MapPin, ExternalLink, Headphones,
  Briefcase, GraduationCap, Plane, Home, Megaphone, Monitor, Volume2,
} from "lucide-react";
import {
  getArea, getCity, citySlug, areaSlug, MEDIA_TYPE_BREAKDOWN,
  type Channel, type AreaSummary, type CityMarker,
} from "@/lib/inventoryAggregation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  "Select Media Type", "Campaign Setup", "Audience", "Schedule", "Budget", "Review",
];

const CHANNEL_CARDS: { c: Channel; pill: string; title: string; desc: string; formats: string[]; Icon: any }[] = [
  { c: "OOH", pill: "Print Media", title: "OOH (Print)", desc: "Posters, Billboards, Table Tents, Stickers & More.", formats: ["Posters", "Billboards", "Table Tents", "Stickers & More"], Icon: Megaphone },
  { c: "DOOH", pill: "Digital Screens", title: "DOOH (Screens)", desc: "Digital Billboards, LED Screens, TV Displays, Interactive Screens.", formats: ["Digital Billboards", "LED Screens", "TV Displays", "Interactive Screens"], Icon: Monitor },
  { c: "AOOH", pill: "Audio", title: "AOOH (Audio)", desc: "In-store Audio Ads, Announcements, Branded Mentions, Background Audio Ads.", formats: ["In-store Audio Ads", "Announcements", "Branded Mentions", "Background Audio Ads"], Icon: Volume2 },
];

interface CampaignDraft {
  channel: Channel | null;
  name: string;
  objective: string;
  description: string;
  campaignType: string;
  buyStrategy: string;
  ageRange: [number, number];
  gender: string;
  interests: string[];
  startDate: string;
  endDate: string;
  dayparts: string[];
  days: string[];
  budgetTotal: string;
  dailyCap: string;
  cpm: string;
  agreed: boolean;
}

export default function AdvertiserCampaignCreate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const cityParam = params.get("city") || "";
  const areaParam = params.get("area") || "";
  const city: CityMarker | undefined = getCity(cityParam);
  const areaData = areaParam ? getArea(cityParam, areaParam) : undefined;
  const area: AreaSummary | undefined = areaData?.area;

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CampaignDraft>({
    channel: null, name: "", objective: "", description: "",
    campaignType: "reach", buyStrategy: "automated",
    ageRange: [25, 45], gender: "all", interests: [],
    startDate: "", endDate: "",
    dayparts: [], days: [],
    budgetTotal: "", dailyCap: "", cpm: "",
    agreed: false,
  });
  const update = (p: Partial<CampaignDraft>) => setDraft((d) => ({ ...d, ...p }));

  const estImpressions = useMemo(() => {
    const b = parseFloat(draft.budgetTotal || "0");
    const cpm = parseFloat(draft.cpm || "150");
    if (!b || !cpm) return 0;
    return Math.round((b / cpm) * 1000);
  }, [draft.budgetTotal, draft.cpm]);

  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    let map: any;
    (async () => {
      const L = await import("leaflet");

      if (cancelled || !mapRef.current) return;
      map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false }).setView([city.lat, city.lng], 11);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      L.circle([city.lat, city.lng], { radius: area ? 1500 : 5000, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.15, weight: 2 }).addTo(map);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [city, area]);

  if (!city) {
    return <div className="p-10">Pick a city first. <Link to="/advertiser/explore" className="text-green-600">Explore</Link></div>;
  }

  const next = () => setStep((s) => Math.min(6, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to launch a campaign.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    const { data: profile } = await supabase
      .from("advertiser_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!profile) {
      toast({ title: "Retailer profile missing", description: "Complete your retailer profile first.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("campaigns").insert({
      advertiser_id: profile.id,
      campaign_name: draft.name || `${city.city} Campaign`,
      campaign_description: draft.description,
      campaign_type: draft.campaignType,
      ad_unit_type: draft.channel || "OOH",
      location: area ? `${area.name}, ${city.city}` : city.city,
      target_audience: `Ages ${draft.ageRange[0]}-${draft.ageRange[1]}, ${draft.gender}, ${draft.interests.join(", ")}`,
      start_date: draft.startDate || null,
      end_date: draft.endDate || null,
      budget_amount: draft.budgetTotal ? parseFloat(draft.budgetTotal) : null,
      budget_currency: city.currency,
    });
    if (error) {
      toast({ title: "Could not save campaign", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Campaign launched 🎉", description: "We'll notify you when it's reviewed." });
    navigate("/advertiser-dashboard");
  };

  const summarySpaces = (m: typeof MEDIA_TYPE_BREAKDOWN[number]) => {
    const inv = area?.inventory || city.inventory;
    return Math.round((inv * m.pct) / 100);
  };

  return (
    <div className="min-h-screen flex bg-white text-gray-900 font-sans">
      <AdvertiserSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="px-6 lg:px-8 py-5 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link
              to={area ? `/advertiser/explore/${citySlug(city.city)}/${areaSlug(area.name)}` : `/advertiser/explore/${citySlug(city.city)}`}
              className="text-green-600 text-sm font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Create Campaign</h1>
            <p className="text-sm text-gray-500 inline-flex items-center gap-1 mt-0.5">
              <MapPin className="w-4 h-4 text-green-600" /> {area ? `${area.name}, ` : ""}{city.city}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} className="border-gray-300 text-gray-700 rounded-lg">
            <X className="w-4 h-4 mr-1" /> Exit Wizard
          </Button>
        </div>

        {/* Stepper */}
        <div className="px-6 lg:px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const isActive = step === n;
              const isDone = step > n;
              return (
                <div key={s} className="flex items-center gap-2 min-w-fit">
                  <div className={
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 " +
                    (isActive ? "bg-green-600 text-white border-green-600"
                      : isDone ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-400 border-gray-300")
                  }>
                    {isDone ? <Check className="w-4 h-4" /> : n}
                  </div>
                  <span className={"text-xs " + (isActive ? "text-green-600 font-bold" : isDone ? "text-gray-700" : "text-gray-400")}>
                    {s}
                  </span>
                  {n < STEPS.length && <div className="w-8 h-px bg-gray-200" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px]">
          <div className="px-6 lg:px-8 py-6">
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900">1. Select Media Type</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose the type of media you want to advertise on in {area?.name || city.city}.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                  {CHANNEL_CARDS.map((card) => {
                    const sel = draft.channel === card.c;
                    return (
                      <button
                        key={card.c}
                        onClick={() => update({ channel: card.c })}
                        className={
                          "text-left bg-white border-2 rounded-2xl p-5 transition-all " +
                          (sel ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-green-400")
                        }
                      >
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold rounded-full px-3 py-1">{card.pill}</span>
                        <div className="flex justify-center my-5">
                          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                            <card.Icon className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                        <div className="font-bold text-lg text-gray-900">{card.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{card.desc}</div>
                        <div className="space-y-1.5 mt-3">
                          {card.formats.map((f) => (
                            <div key={f} className="flex items-center gap-2 text-xs text-gray-700">
                              <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 inline-flex items-center justify-center"><Check className="w-3 h-3" /></span>
                              {f}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-center mt-4">
                          <span className={"w-5 h-5 rounded-full border-2 " + (sel ? "border-green-600 bg-green-600" : "border-gray-300 bg-white")} />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <InfoBar text="You can create separate campaigns for each media type or run integrated campaigns across multiple channels for greater impact." />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">2. Campaign Setup</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Campaign Name</Label>
                    <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="My Brand Awareness Campaign" className="mt-1" />
                  </div>
                  <div>
                    <Label>Objective</Label>
                    <Select value={draft.objective} onValueChange={(v) => update({ objective: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Choose objective" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="awareness">Brand Awareness</SelectItem>
                        <SelectItem value="consideration">Consideration</SelectItem>
                        <SelectItem value="conversion">Conversion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Campaign Description (optional)</Label>
                  <Textarea value={draft.description} onChange={(e) => update({ description: e.target.value })} className="mt-1" rows={3} />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3 flex-wrap">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{area ? area.name : city.city}</div>
                    <div className="text-xs text-gray-500">{city.city}, {city.country}</div>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/advertiser/explore/${citySlug(city.city)}`)} className="border-green-600 text-green-600 hover:bg-green-50 rounded-lg">Change Area</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RadioBlock title="Campaign Type" value={draft.campaignType} onChange={(v) => update({ campaignType: v })}
                    opts={[
                      { v: "reach", t: "Reach Campaign", d: "Maximize unique people exposed." },
                      { v: "frequency", t: "Frequency Campaign", d: "Increase repetition for memorability." },
                      { v: "awareness", t: "Awareness Campaign", d: "Drive top-of-mind brand recognition." },
                    ]} />
                  <RadioBlock title="Buy Strategy" value={draft.buyStrategy} onChange={(v) => update({ buyStrategy: v })}
                    opts={[
                      { v: "automated", t: "Automated", d: "We optimize placements for you.", badge: "Recommended" },
                      { v: "manual", t: "Manual", d: "Hand-pick venues and formats." },
                      { v: "guaranteed", t: "Programmatic Guaranteed", d: "Locked inventory with reserved pricing." },
                    ]} />
                </div>
                <InfoBar text="You can change these settings later before launching your campaign." />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900">3. Audience</h2>
                <div>
                  <Label>Age Range: {draft.ageRange[0]}–{draft.ageRange[1]}</Label>
                  <div className="px-2 mt-3">
                    <Slider min={13} max={70} step={1} value={draft.ageRange} onValueChange={(v) => update({ ageRange: [v[0], v[1]] as [number, number] })} />
                  </div>
                </div>
                <div>
                  <Label>Gender</Label>
                  <div className="flex gap-2 mt-2">
                    {["all", "female", "male"].map((g) => (
                      <button key={g} onClick={() => update({ gender: g })}
                        className={"px-4 py-2 rounded-full text-sm capitalize border " + (draft.gender === g ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200")}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Interests</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {["F&B", "Fashion", "Tech", "Travel", "Health", "Finance", "Auto", "Beauty", "Entertainment"].map((i) => {
                      const sel = draft.interests.includes(i);
                      return (
                        <label key={i} className={"flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer " + (sel ? "border-green-600 bg-green-50" : "border-gray-200")}>
                          <Checkbox checked={sel} onCheckedChange={(c) => {
                            update({ interests: c ? [...draft.interests, i] : draft.interests.filter((x) => x !== i) });
                          }} />
                          <span className="text-sm">{i}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900">4. Schedule</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start Date</Label><Input type="date" value={draft.startDate} onChange={(e) => update({ startDate: e.target.value })} className="mt-1" /></div>
                  <div><Label>End Date</Label><Input type="date" value={draft.endDate} onChange={(e) => update({ endDate: e.target.value })} className="mt-1" /></div>
                </div>
                <div>
                  <Label>Dayparts</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {["Morning", "Afternoon", "Evening", "Late Night"].map((d) => {
                      const sel = draft.dayparts.includes(d);
                      return (
                        <button key={d} onClick={() => update({ dayparts: sel ? draft.dayparts.filter((x) => x !== d) : [...draft.dayparts, d] })}
                          className={"px-4 py-2 rounded-full text-sm border " + (sel ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200")}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex gap-2 mt-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => {
                      const sel = draft.days.includes(d);
                      return (
                        <button key={d} onClick={() => update({ days: sel ? draft.days.filter((x) => x !== d) : [...draft.days, d] })}
                          className={"w-12 h-10 rounded-lg text-xs font-medium border " + (sel ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-200")}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900">5. Budget</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Total Budget</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 text-gray-500 text-sm">{city.currency}</span>
                      <Input value={draft.budgetTotal} onChange={(e) => update({ budgetTotal: e.target.value })} className="pl-12" type="number" placeholder="50000" />
                    </div>
                  </div>
                  <div><Label>Daily Cap</Label><Input value={draft.dailyCap} onChange={(e) => update({ dailyCap: e.target.value })} className="mt-1" type="number" placeholder="2500" /></div>
                  <div><Label>CPM Bid</Label><Input value={draft.cpm} onChange={(e) => update({ cpm: e.target.value })} className="mt-1" type="number" placeholder="150" /></div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Estimated Impressions</div>
                  <div className="text-3xl font-bold text-green-600 mt-1">{estImpressions.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">Updates live as you adjust budget and CPM.</div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">6. Review</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <SummaryBlock l="Media Type" v={draft.channel || "—"} />
                  <SummaryBlock l="Campaign Name" v={draft.name || "—"} />
                  <SummaryBlock l="Objective" v={draft.objective || "—"} />
                  <SummaryBlock l="Type / Strategy" v={`${draft.campaignType} / ${draft.buyStrategy}`} />
                  <SummaryBlock l="Audience" v={`${draft.ageRange[0]}-${draft.ageRange[1]}, ${draft.gender}`} />
                  <SummaryBlock l="Interests" v={draft.interests.join(", ") || "—"} />
                  <SummaryBlock l="Schedule" v={`${draft.startDate || "?"} → ${draft.endDate || "?"}`} />
                  <SummaryBlock l="Budget" v={draft.budgetTotal ? `${city.currency} ${draft.budgetTotal}` : "—"} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={draft.agreed} onCheckedChange={(c) => update({ agreed: !!c })} />
                  I agree to the campaign terms and acknowledge inventory may shift based on availability.
                </label>
                <Button disabled={!draft.agreed} onClick={submit} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-lg h-12 text-base font-bold">
                  Launch Campaign
                </Button>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={prev} disabled={step === 1} className="border-gray-300 text-gray-700 rounded-lg">Back</Button>
              {step < 6 && (
                <Button onClick={next} disabled={step === 1 && !draft.channel} className="bg-green-600 hover:bg-green-500 text-white rounded-lg">
                  Continue →
                </Button>
              )}
            </div>
          </div>

          {/* Right summary */}
          <aside className="border-l border-gray-100 bg-white p-5 hidden lg:block">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Your Campaign Summary</h3>
              <div className="text-xs text-gray-500">Step {step} of 6</div>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-100 mt-3 h-32">
              <div ref={mapRef} className="w-full h-full" />
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-500">Selected Area</div>
              <div className="flex items-center gap-1 font-bold text-gray-900">
                {area ? area.name : city.city} <ExternalLink className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Stat l="Reach/day" v={`${((area?.reachDaily || city.reachDaily)/1000).toFixed(0)}K`} />
              <Stat l="Venues" v={area?.activeVenues || city.activeVenues} />
              <Stat l="Inventory" v={area?.inventory || city.inventory} />
            </div>

            <div className="mt-5">
              <div className="text-xs font-bold text-gray-700 mb-2">Available Ad Formats</div>
              <div className="space-y-2">
                {MEDIA_TYPE_BREAKDOWN.map((m) => (
                  <div key={m.channel}>
                    <div className="flex justify-between text-xs">
                      <span className={m.channel === "OOH" ? "text-green-600 font-semibold" : m.channel === "DOOH" ? "text-blue-600 font-semibold" : "text-red-500 font-semibold"}>{m.channel}</span>
                      <span className="text-gray-700">{summarySpaces(m)} spaces · {m.pct}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-bold text-gray-700 mb-2">Estimated Audience (Daily)</div>
              <div className="space-y-2">
                {[
                  { Icon: Briefcase, l: "Professionals", pct: 58 },
                  { Icon: GraduationCap, l: "Students", pct: 17 },
                  { Icon: Plane, l: "Tourists", pct: 15 },
                  { Icon: Home, l: "Residents", pct: 10 },
                ].map((d) => (
                  <div key={d.l}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-gray-700"><d.Icon className="w-3.5 h-3.5 text-green-600" />{d.l}</span>
                      <span className="text-green-600 font-bold">{d.pct}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-green-500" style={{ width: `${d.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 mt-5">
              <div className="flex items-start gap-2">
                <Headphones className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-gray-900">Need help setting up your campaign?</div>
                  <a className="text-green-600 text-xs font-medium" href="mailto:tinystickyads@gmail.com">Chat with our team →</a>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 rounded-lg">Save Draft</Button>
              {step < 6 ? (
                <Button onClick={next} disabled={step === 1 && !draft.channel} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg">Continue →</Button>
              ) : (
                <Button disabled={!draft.agreed} onClick={submit} className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg">Launch</Button>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function InfoBar({ text }: { text: string }) {
  return (
    <div className="mt-5 bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 flex items-start gap-2">
      <Info className="w-5 h-5 shrink-0 text-green-600" />
      <span>{text}</span>
    </div>
  );
}

function RadioBlock({ title, value, onChange, opts }: {
  title: string; value: string; onChange: (v: string) => void;
  opts: { v: string; t: string; d: string; badge?: string }[];
}) {
  return (
    <div>
      <Label className="mb-2 block">{title}</Label>
      <div className="space-y-2">
        {opts.map((o) => {
          const sel = value === o.v;
          return (
            <button key={o.v} onClick={() => onChange(o.v)}
              className={"w-full text-left p-3 rounded-xl border-2 flex items-start gap-3 " + (sel ? "border-green-600 bg-green-50" : "border-gray-200 bg-white")}>
              <span className={"w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 " + (sel ? "border-green-600 bg-green-600" : "border-gray-300")} />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  {o.t}
                  {o.badge && <span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-[10px] font-bold">{o.badge}</span>}
                </div>
                <div className="text-xs text-gray-500">{o.d}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryBlock({ l, v }: { l: string; v: string | number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">{l}</div>
      <div className="text-sm font-semibold text-gray-900 mt-0.5">{v}</div>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string | number }) {
  return (
    <div className="bg-green-50 rounded-lg p-2 text-center">
      <div className="text-[10px] text-gray-500">{l}</div>
      <div className="text-green-700 font-bold text-sm">{v}</div>
    </div>
  );
}
