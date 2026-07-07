import { useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell, Globe, Layers, ShieldCheck, BadgeCheck, Loader2, CheckCircle2, AlertTriangle,
  RefreshCw, Package, Clock, Calendar as CalendarIcon, Eye,
  Image as ImageIcon, Monitor, Volume2, Truck, ChevronRight, ChevronLeft,
} from "lucide-react";
import { addMonths, format, startOfDay, isBefore } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadiusMapPlanner } from "@/components/advertiser/RadiusMapPlanner";
import { getActiveAreaNamesText, isWithinServiceArea } from "@/lib/serviceAreas";
import {
  calculateMediaPlanEstimate,
  MAX_RADIUS_METERS,
  ALL_VARIANTS,
  OOH_VARIANTS,
  DOOH_VARIANTS,
  AOOH_VARIANTS,
  MEDIA_TRUCK_VARIANTS,
  FormatVariant,
} from "@/lib/mediaPlanPricing";
import oohImage from "@/assets/ooh_formats_grid.png.asset.json";
import doohVideo from "@/assets/doohmediakit.mp4.asset.json";
import aoohVideo from "@/assets/supertruckmediakit.mp4.asset.json";
import mediaTruckVideo from "@/assets/supertruckmediakit.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

// Earliest selectable campaign start date — gives TrioTag 1 month to prepare
const MIN_LAUNCH_DATE = startOfDay(addMonths(new Date(), 1));

export default function AdvertiserExplore() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(250);
  const [selectedLocationAddress, setSelectedLocationAddress] = useState("");
  const [withinServiceArea, setWithinServiceArea] = useState(
    isWithinServiceArea(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
  );


  // Wizard state
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [chosenFormat, setChosenFormat] = useState<"OOH" | "DOOH" | "AOOH" | "MEDIA_TRUCK" | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [exampleModal, setExampleModal] = useState<{ label: string; image: string; caption: string } | null>(null);

  const resetWizard = () => {
    setWizardStep(1);
    setChosenFormat(null);
    setSelections({});
  };

  const openRequestDialog = () => { setSubmitted(false); setRequestOpen(true); };

  const updateQty = (variantId: string, qty: number) => {
    setSelections((prev) => ({ ...prev, [variantId]: Math.max(0, qty) }));
  };

  const selectionsArray = useMemo(
    () => Object.entries(selections).map(([variantId, quantity]) => ({ variantId, quantity })),
    [selections],
  );

  const estimate = useMemo(
    () => calculateMediaPlanEstimate(selectionsArray, radiusMeters),
    [selectionsArray, radiusMeters],
  );

  const activeSelections = selectionsArray.filter((s) => s.quantity > 0);

  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    campaignName: "",
    preferredStartDate: "",
    notes: "",
    email: "",
  });

  async function handleSubmitRequest() {
    if (!selectedLocationAddress) {
      toast({
        title: "Location required",
        description: "Search and select a location for your campaign before proceeding.",
        variant: "destructive",
      });
      return;
    }
    if (!withinServiceArea) {
      toast({
        title: "Selected location is outside our service area",
        description: `TrioTag currently only operates in ${getActiveAreaNamesText()}. Please choose a location within our service area to continue.`,
        variant: "destructive",
      });
      return;
    }
    if (radiusMeters < 250) {
      toast({
        title: "Minimum coverage required",
        description: "The minimum campaign radius is 250 m (5% coverage).",
        variant: "destructive",
      });
      return;
    }
    if (!form.campaignName.trim() || !form.preferredStartDate) {
      toast({ title: "Missing info", description: "Campaign name and start date are required.", variant: "destructive" });
      return;
    }
    const emailTrimmed = form.email.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      toast({ title: "Email required", description: "Please enter a valid email so we can confirm your campaign.", variant: "destructive" });
      return;
    }
    if (isBefore(new Date(form.preferredStartDate), MIN_LAUNCH_DATE)) {
      toast({
        title: "Start date too soon",
        description: `Campaigns require at least 1 month lead time. Earliest available date is ${format(MIN_LAUNCH_DATE, "MMMM d, yyyy")}.`,
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const enriched = activeSelections.map((s) => {
        const v = ALL_VARIANTS.find((vv) => vv.id === s.variantId);
        return { ...s, label: v?.label, price: v?.price, category: v?.category, specs: v?.specs };
      });
      const campaignType = [...new Set(enriched.map((s) => s.category).filter(Boolean))].join(", ");

      const { error } = await supabase
        .from("media_plan_requests" as any)
        .insert({
          advertiser_id: user?.id ?? null,
          campaign_name: form.campaignName,
          campaign_type: campaignType,
          center_lat: center.lat,
          center_lng: center.lng,
          radius_meters: radiusMeters,
          selections: enriched,
          estimated_price: estimate.totalEstimate,
          preferred_start_date: form.preferredStartDate,
          notes: form.notes || null,
          status: "pending_payment",
          requester_email: emailTrimmed,
        });
      if (error) throw error;

      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Submission failed", description: e?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function saveForLater() {
    const plan = {
      center, radiusMeters,
      selections: activeSelections,
      estimate, savedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("saved_media_plans") || "[]");
    existing.unshift(plan);
    localStorage.setItem("saved_media_plans", JSON.stringify(existing.slice(0, 10)));
    toast({ title: "Saved", description: "Ad campaign saved locally on this device." });
  }

  const tierColor = estimate.tier === "Domination"
    ? "bg-purple-100 text-purple-700 border-purple-300"
    : estimate.tier === "Growth"
    ? "bg-blue-100 text-blue-700 border-blue-300"
    : "bg-green-100 text-green-700 border-green-300";

  function renderVariantRow(variant: FormatVariant) {
    const qty = selections[variant.id] || 0;
    const selected = qty > 0;
    return (
      <div
        key={variant.id}
        className={`rounded-xl p-4 transition-colors border ${
          selected ? "border-green-500 bg-green-50/30" : "border-gray-100 hover:border-green-300"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-gray-900 text-sm">{variant.label}</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExampleModal({
                    label: variant.label,
                    image: variant.exampleImage,
                    caption: variant.exampleCaption,
                  });
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-green-400 text-green-600 bg-green-50 hover:bg-green-100 hover:border-green-500 transition-all duration-200 cursor-pointer hover:[animation-play-state:paused]"
                style={{ animation: "subtlePulse 3s ease-in-out infinite" }}
              >
                <Eye className="w-3 h-3" />
                View Example
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-green-600 font-medium text-xs">
                ₱{variant.price.toLocaleString()} / unit
              </span>
              {variant.billingType === "monthly" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  <RefreshCw className="w-3 h-3" />
                  Monthly Subscription
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">
                  <Package className="w-3 h-3" />
                  Per Campaign
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 min-w-[140px]">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qty === 0 ? "" : qty}
              placeholder="0"
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                const val = raw === "" ? 0 : Math.min(9999, parseInt(raw, 10));
                updateQty(variant.id, val);
              }}
              className="w-20 h-8 text-right text-sm font-medium text-gray-800 border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <span className="text-xs text-gray-500 font-medium">units</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {variant.airTime && (
            <span className="text-[11px] bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-amber-700 inline-flex flex-col items-start gap-0.5">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <strong className="text-amber-800">Air Time:</strong>
              </div>
              <span className="pl-4">{variant.airTime}</span>
            </span>
          )}
          {Object.entries(variant.specs).map(([key, val]) => (
            <span key={key} className="text-[11px] bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1 text-gray-600">
              <strong className="text-gray-800">{key}:</strong> {val}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      <div className="flex">

        <main className="flex-1 min-w-0">
          <header className="px-6 lg:px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#111827]">Map Your Campaign Area</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Pick your coverage area, choose your ad formats, and get an instant ad campaign estimate.
                </p>
              </div>
              <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Bell className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </header>

          {/* CTA: OOH, DOOH, AOOH, Media Truck formats */}
          <section className="px-6 lg:px-8 py-12">
            <div className="max-w-6xl mx-auto text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Customize your campaigns</h2>
              <p className="text-gray-600 mt-2">Explore our OOH, DOOH, AOOH, and Media Truck advertising formats.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { title: "OOH", desc: "Out-of-Home print placements across retail and high-traffic locations.", media: oohImage.url, isVideo: false },
                { title: "DOOH", desc: "Digital Out-of-Home screens with dynamic, scheduled creative.", media: doohVideo.url, isVideo: true },
                { title: "AOOH", desc: "Ambient Out-of-Home reaching audiences through unique installations.", media: aoohVideo.url, isVideo: true },
              ].map((c) => (
                <div
                  key={c.title}
                  onClick={() => {
                    document.getElementById("choose-ad-formats")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setWizardStep(1);
                    setChosenFormat(null);
                    setSelections({});
                  }}
                  className="rounded-2xl overflow-hidden border border-green-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="aspect-video bg-black">
                    {c.isVideo ? (
                      <video
                        src={c.media}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={c.media}
                        alt={`${c.title} format examples`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{c.title}</h3>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Available</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="px-6 lg:px-8 pt-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Map */}
              <div className="lg:col-span-3 space-y-4">
                <RadiusMapPlanner
                  center={center}
                  radiusMeters={radiusMeters}
                  onCenterChange={setCenter}
                  onRadiusChange={setRadiusMeters}
                  onServiceAreaChange={setWithinServiceArea}
                  onLocationSet={setSelectedLocationAddress}
                />


                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Coverage Radius — affects campaign reach pricing
                  </div>
                  <div className="text-sm text-gray-700">
                    {estimate.radiusPercent}% coverage ={" "}
                    <span className="font-semibold text-green-700">₱{estimate.radiusFee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Campaign Name *</label>
                    <Input
                      value={form.campaignName}
                      onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
                      placeholder="Summer brand activation"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Preferred Start Date *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${!form.preferredStartDate ? "text-muted-foreground" : ""}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.preferredStartDate
                            ? format(new Date(form.preferredStartDate), "PPP")
                            : "Pick your campaign start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <Calendar
                          mode="single"
                          selected={form.preferredStartDate ? new Date(form.preferredStartDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setForm({ ...form, preferredStartDate: format(date, "yyyy-MM-dd") });
                            }
                          }}
                          disabled={(date) => isBefore(date, MIN_LAUNCH_DATE)}
                          defaultMonth={MIN_LAUNCH_DATE}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-[11px] text-gray-500 mt-1.5 inline-flex items-start gap-1">
                      <Clock className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>Earliest available start date: <strong className="text-gray-700">{format(MIN_LAUNCH_DATE, "MMMM d, yyyy")}</strong> — TrioTag requires 1 week or up to 1 month lead time to prepare your campaign.</span>
                    </p>
                  </div>
                </div>
              </div>


              {/* Right panel */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-6 space-y-5">
                  {/* Format selector — 3-step wizard */}
                  <div id="choose-ad-formats" className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Choose Your Ad Formats</h3>
                    <p className="text-xs text-gray-500 mb-4">Pick the formats and quantities for your campaign.</p>

                    {/* Step progress — 3 dots */}
                    <div className="flex items-center gap-2 mb-5">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            wizardStep > s ? "bg-green-500 text-white" :
                            wizardStep === s ? "bg-black text-white" :
                            "bg-gray-100 text-gray-400"
                          }`}>
                            {wizardStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                          </div>
                          {s < 3 && <div className={`h-0.5 w-8 rounded ${wizardStep > s ? "bg-green-500" : "bg-gray-200"}`} />}
                        </div>
                      ))}
                      <span className="ml-2 text-xs text-gray-400">
                        {wizardStep === 1 ? "Choose format type" : wizardStep === 2 ? "Select units" : "Review"}
                      </span>
                    </div>

                    {wizardStep === 1 && (
                      <div className="space-y-3">
                        <div className="font-semibold text-gray-900 mb-1">Which format do you want to run?</div>
                        <p className="text-xs text-gray-500 mb-4">You can only book one format type per campaign. Choose the channel that best fits your goals.</p>

                        {[
                          {
                            id: "OOH" as const,
                            label: "OOH — Print",
                            icon: <ImageIcon className="w-5 h-5" />,
                            color: "border-purple-300 hover:border-purple-500 hover:bg-purple-50",
                            badge: "bg-purple-100 text-purple-700",
                            desc: "Stickers, table tents, posters, tarpaulins — physical print placed inside venues",
                          },
                          {
                            id: "DOOH" as const,
                            label: "DOOH — Digital Screen",
                            icon: <Monitor className="w-5 h-5" />,
                            color: "border-cyan-300 hover:border-cyan-500 hover:bg-cyan-50",
                            badge: "bg-cyan-100 text-cyan-700",
                            desc: "Static or video ads on digital screens inside gyms, salons, clinics, and retail venues",
                          },
                          {
                            id: "AOOH" as const,
                            label: "AOOH — In-Store Audio",
                            icon: <Volume2 className="w-5 h-5" />,
                            color: "border-green-300 hover:border-green-500 hover:bg-green-50",
                            badge: "bg-green-100 text-green-700",
                            desc: "Audio spots played through venue speaker systems at point of purchase",
                          },
                          {
                            id: "MEDIA_TRUCK" as const,
                            label: "Media Truck",
                            icon: <Truck className="w-5 h-5" />,
                            color: "border-amber-300 hover:border-amber-500 hover:bg-amber-50",
                            badge: "bg-amber-100 text-amber-700",
                            desc: "Mobile LED truck fleet deployed on planned retail and commuter routes",
                          },
                        ].map((fmt) => (
                          <button
                            key={fmt.id}
                            onClick={() => {
                              setChosenFormat(fmt.id);
                              setSelections({});
                              setWizardStep(2);
                            }}
                            className={`w-full text-left border-2 rounded-xl p-4 transition-all flex items-start gap-4 ${fmt.color}`}
                          >
                            <div className={`p-2 rounded-lg ${fmt.badge} shrink-0`}>
                              {fmt.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{fmt.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{fmt.desc}</div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto self-center shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}

                    {wizardStep === 2 && chosenFormat && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => { setWizardStep(1); setChosenFormat(null); setSelections({}); }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <Badge className={
                            chosenFormat === "OOH" ? "bg-purple-100 text-purple-700" :
                            chosenFormat === "DOOH" ? "bg-cyan-100 text-cyan-700" :
                            chosenFormat === "AOOH" ? "bg-green-100 text-green-700" :
                            "bg-amber-100 text-amber-700"
                          }>
                            {chosenFormat === "OOH" ? <ImageIcon className="w-3 h-3 mr-1" /> :
                             chosenFormat === "DOOH" ? <Monitor className="w-3 h-3 mr-1" /> :
                             chosenFormat === "AOOH" ? <Volume2 className="w-3 h-3 mr-1" /> :
                             <Truck className="w-3 h-3 mr-1" />}
                            {chosenFormat === "MEDIA_TRUCK" ? "Media Truck" : chosenFormat}
                          </Badge>
                          <span className="text-sm text-gray-600 font-medium">Select your units</span>
                        </div>

                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                          {(chosenFormat === "OOH" ? OOH_VARIANTS :
                            chosenFormat === "DOOH" ? DOOH_VARIANTS :
                            chosenFormat === "AOOH" ? AOOH_VARIANTS :
                            MEDIA_TRUCK_VARIANTS
                          ).map(renderVariantRow)}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <Button
                            className="w-full bg-black hover:bg-gray-800 text-white"
                            disabled={!Object.values(selections).some(v => v > 0)}
                            onClick={() => setWizardStep(3)}
                          >
                            Review Selection →
                          </Button>
                          {Object.values(selections).every(v => v === 0) && (
                            <p className="text-xs text-gray-400 text-center mt-2">Select at least 1 unit to continue</p>
                          )}
                        </div>
                      </div>
                    )}

                    {wizardStep === 3 && chosenFormat && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <button
                            onClick={() => setWizardStep(2)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-medium text-gray-700">Review your campaign</span>
                        </div>

                        <div className="mb-4">
                          <Badge className={
                            chosenFormat === "OOH" ? "bg-purple-100 text-purple-700" :
                            chosenFormat === "DOOH" ? "bg-cyan-100 text-cyan-700" :
                            chosenFormat === "AOOH" ? "bg-green-100 text-green-700" :
                            "bg-amber-100 text-amber-700"
                          }>{chosenFormat === "MEDIA_TRUCK" ? "Media Truck" : chosenFormat} Campaign</Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          {selectionsArray
                            .filter((s) => s.quantity > 0)
                            .map((s) => {
                              const variant = ALL_VARIANTS.find((v) => v.id === s.variantId)!;
                              return (
                                <div key={s.variantId} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">{variant.label}</div>
                                    <div className="text-xs text-gray-500">₱{variant.price.toLocaleString()} / unit</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-gray-900">× {s.quantity}</div>
                                    <div className="text-xs text-green-600">₱{(variant.price * s.quantity).toLocaleString()}</div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5 mb-4">
                          <div className="flex justify-between text-gray-600">
                            <span>Unit costs</span>
                            <span>₱{(estimate.totalEstimate - estimate.radiusFee).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Coverage radius ({estimate.radiusPercent}%)</span>
                            <span>₱{estimate.radiusFee.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                            <span>Total Estimate</span>
                            <span className="text-green-600">₱{estimate.totalEstimate.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetWizard}
                            className="flex-1"
                          >
                            Start Over
                          </Button>
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                            disabled={!selectedLocationAddress || radiusMeters < 250 || !withinServiceArea || estimate.totalUnits === 0}
                            onClick={openRequestDialog}
                          >
                            Proceed to Payment →
                          </Button>
                        </div>
                        {!selectedLocationAddress && (
                          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Search and select a campaign location
                          </p>
                        )}
                        {selectedLocationAddress && radiusMeters < 250 && (
                          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Minimum radius is 250 m (5% coverage)
                          </p>
                        )}
                        {selectedLocationAddress && radiusMeters >= 250 && !withinServiceArea && (
                          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Location is outside our service area
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {wizardStep === 1 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">How it works</div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-start gap-2"><span className="text-green-500 font-bold shrink-0">1.</span> Choose your ad format (OOH, DOOH, AOOH, or Media Truck)</div>
                        <div className="flex items-start gap-2"><span className="text-green-500 font-bold shrink-0">2.</span> Pick your units and quantities</div>
                        <div className="flex items-start gap-2"><span className="text-green-500 font-bold shrink-0">3.</span> Review your estimate and proceed to payment</div>
                      </div>
                    </div>
                  )}

                  {wizardStep > 1 && (
                    <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider">ESTIMATED AD CAMPAIGN FEE</div>
                        <Badge className={`${tierColor} border`}>{estimate.tier}</Badge>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mt-1">
                        ₱{estimate.totalEstimate.toLocaleString()}
                      </div>

                      <div className="mt-4 space-y-1.5 text-sm">
                        {activeSelections.length === 0 ? (
                          <div className="text-gray-500 italic text-xs">No formats selected yet.</div>
                        ) : (
                          activeSelections.map((s) => {
                            const v = ALL_VARIANTS.find((vv) => vv.id === s.variantId)!;
                            return (
                              <div key={s.variantId} className="flex justify-between text-gray-700">
                                <span className="truncate pr-2">{v.label} × {s.quantity}</span>
                                <span className="font-medium shrink-0">₱{(v.price * s.quantity).toLocaleString()}</span>
                              </div>
                            );
                          })
                        )}
                        <div className="flex justify-between text-gray-700 pt-1.5 border-t border-green-200">
                          <span>Coverage Radius ({estimate.radiusPercent}% of {MAX_RADIUS_METERS / 1000}km)</span>
                          <span className="font-medium">₱{estimate.radiusFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-green-200">
                          <span className="font-bold text-gray-900">Total Estimate</span>
                          <span className="font-bold text-lg text-green-700">₱{estimate.totalEstimate.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 mt-3 italic">
                        *This is a planning estimate. Final pricing confirmed after campaign request. Service begins after payment.
                      </div>

                      <div className="mt-4 space-y-2">
                        <Button
                          onClick={openRequestDialog}
                          disabled={!selectedLocationAddress || radiusMeters < 250 || estimate.totalUnits === 0 || !withinServiceArea}
                          className="w-full bg-green-600 hover:bg-green-500 text-white h-11 text-base font-semibold"
                        >
                          Request This Ad Campaign
                        </Button>
                        {!selectedLocationAddress && (
                          <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>Search and select a campaign location to continue.</span>
                          </div>
                        )}
                        {selectedLocationAddress && radiusMeters < 250 && (
                          <div className="flex items-start gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>Minimum campaign radius is 250 m (5% coverage).</span>
                          </div>
                        )}
                        {selectedLocationAddress && radiusMeters >= 250 && !withinServiceArea && (
                          <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>
                              This location is outside our current service area. TrioTag currently only operates in {getActiveAreaNamesText()}.
                            </span>
                          </div>
                        )}
                        {selectedLocationAddress && radiusMeters >= 250 && withinServiceArea && estimate.totalUnits === 0 && (
                          <div className="text-xs text-gray-500 text-center">Add at least 1 unit to continue</div>
                        )}
                        <Button
                          variant="outline"
                          onClick={saveForLater}
                          className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        >
                          Save for Later
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <section className="bg-green-50 border-t border-green-100 px-6 lg:px-8 py-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { Icon: Globe, t: "Nationwide Coverage", d: "Plan campaigns anywhere our partners operate" },
                { Icon: Layers, t: "Multi-Format Inventory", d: "OOH, DOOH, AOOH, and Media Truck placements" },
                { Icon: BadgeCheck, t: "Verified Venues", d: "Listings reviewed before activation" },
                { Icon: ShieldCheck, t: "Brand-Safe Placement", d: "Locations pre-vetted for quality" },
              ].map((b) => (
                <div key={b.t} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-green-100 flex items-center justify-center shrink-0">
                    <b.Icon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{b.t}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>




        </main>
      </div>

      {/* Request dialog */}
      <Dialog open={requestOpen} onOpenChange={(o) => { setRequestOpen(o); if (!o) setSubmitted(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Request submitted!</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                TrioTag will email you a direct Insertion Order (IO) with bank transfer payment details within 24 hours. Your campaign activates once payment is confirmed.
              </p>
              <Button className="mt-5 bg-green-600 hover:bg-green-500 text-white" onClick={() => setRequestOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request Your Ad Campaign</DialogTitle>
                <DialogDescription>
                  TrioTag will send you a direct Insertion Order (IO) with bank transfer payment details within 24 hours.
                </DialogDescription>
              </DialogHeader>


              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-2">
                {activeSelections.map((s) => {
                  const v = ALL_VARIANTS.find((vv) => vv.id === s.variantId)!;
                  return (
                    <div key={s.variantId} className="pb-2 border-b border-green-200 last:border-0 last:pb-0">
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>{v.label} × {s.quantity}</span>
                        <span>₱{(v.price * s.quantity).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {v.billingType === "monthly" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                            <RefreshCw className="w-2.5 h-2.5" />
                            Monthly Subscription
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-2 py-0.5">
                            <Package className="w-2.5 h-2.5" />
                            Per Campaign
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.airTime && (
                          <span className="text-[10px] bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-amber-700 inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <strong className="text-amber-800">Air Time:</strong> {v.airTime}
                          </span>
                        )}
                        {Object.entries(v.specs).map(([k, val]) => (
                          <span key={k} className="text-[10px] bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                            <strong>{k}:</strong> {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="flex justify-between pt-1">
                  <span className="text-gray-600">Coverage radius</span>
                  <span className="font-semibold">{estimate.radiusKm}km ({estimate.radiusPercent}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated total</span>
                  <span className="font-bold text-green-700">₱{estimate.totalEstimate.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Email *</label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">We'll use this email to confirm pricing and activate your campaign.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Notes (optional)</label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any specific goals or constraints..." />
                </div>
              </div>


              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitRequest} disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting request...</> : "Submit Request"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Example Image Modal */}
      <Dialog open={!!exampleModal} onOpenChange={(open) => { if (!open) setExampleModal(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {exampleModal && (
            <>
              <div className="relative">
                <img
                  src={exampleModal.image}
                  alt={exampleModal.label}
                  className="w-full object-cover h-64"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80";
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-900 border border-gray-200 shadow-sm">
                    {exampleModal.label}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 text-base">{exampleModal.label}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{exampleModal.caption}</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-[11px] text-gray-500">Example placement — actual results may vary by venue</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExampleModal(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.35); }
          50% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
        }
      `}</style>
    </div>
  );
}
