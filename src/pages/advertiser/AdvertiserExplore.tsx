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
  RefreshCw, Package, Clock, Calendar as CalendarIcon,
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
  FormatVariant,
} from "@/lib/mediaPlanPricing";
import oohVideo from "@/assets/retailmediakit.mp4.asset.json";
import doohVideo from "@/assets/doohmediakit.mp4.asset.json";
import aoohVideo from "@/assets/supertruckmediakit.mp4.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

// Earliest selectable campaign start date — gives TrioTag 1 month to prepare
const MIN_LAUNCH_DATE = startOfDay(addMonths(new Date(), 1));

export default function AdvertiserExplore() {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(0);
  const [withinServiceArea, setWithinServiceArea] = useState(
    isWithinServiceArea(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
  );


  // variantId -> qty
  const [selections, setSelections] = useState<Record<string, number>>({});

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
  });

  async function handleSubmitRequest() {
    if (!withinServiceArea) {
      toast({
        title: "Selected location is outside our service area",
        description: `TrioTag currently only operates in ${getActiveAreaNamesText()}. Please choose a location within our service area to continue.`,
        variant: "destructive",
      });
      return;
    }
    if (!form.campaignName.trim() || !form.preferredStartDate) {
      toast({ title: "Missing info", description: "Campaign name and start date are required.", variant: "destructive" });
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

      const { error } = await supabase.from("media_plan_requests" as any).insert({
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
        status: "pending_review",
      });
      if (error) throw error;

      supabase.functions.invoke("notify-media-plan-request", {
        body: {
          campaignName: form.campaignName,
          campaignType,
          centerLat: center.lat,
          centerLng: center.lng,
          radiusMeters,
          selections: enriched,
          estimatedPrice: estimate.totalEstimate,
          preferredStartDate: form.preferredStartDate,
          notes: form.notes,
          requesterEmail: user?.email,
        },
      }).catch(() => {});

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
            <div className="font-semibold text-gray-900 text-sm">{variant.label}</div>
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
          <div className="flex items-center gap-3 shrink-0 min-w-[200px]">
            <input
              type="range"
              min={0}
              max={9999}
              step={1}
              value={qty}
              onChange={(e) => updateQty(variant.id, parseInt(e.target.value, 10))}
              className="flex-1 h-2 accent-green-600 cursor-pointer"
            />
            <div className="text-xs text-gray-700 font-medium whitespace-nowrap w-20 text-right">
              {qty.toLocaleString()} units
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {variant.airTime && (
            <span className="text-[11px] bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-amber-700 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <strong className="text-amber-800">Air Time:</strong> {variant.airTime}
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
                  {/* Format selector */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1">Choose Your Ad Formats</h3>
                    <p className="text-xs text-gray-500 mb-4">Pick the formats and quantities for your campaign.</p>

                    <Tabs defaultValue="OOH">
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="OOH">OOH</TabsTrigger>
                        <TabsTrigger value="DOOH">DOOH</TabsTrigger>
                        <TabsTrigger value="AOOH">AOOH</TabsTrigger>
                      </TabsList>

                      <TabsContent value="OOH" className="mt-4">
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                          {OOH_VARIANTS.map(renderVariantRow)}
                        </div>
                      </TabsContent>
                      <TabsContent value="DOOH" className="mt-4">
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                          {DOOH_VARIANTS.map(renderVariantRow)}
                        </div>
                      </TabsContent>
                      <TabsContent value="AOOH" className="mt-4">
                        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                          {AOOH_VARIANTS.map(renderVariantRow)}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Estimate */}
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
                        onClick={() => { setSubmitted(false); setRequestOpen(true); }}
                        disabled={estimate.totalUnits === 0 || !withinServiceArea}
                        className="w-full bg-green-600 hover:bg-green-500 text-white h-11 text-base font-semibold"
                      >
                        Request This Ad Campaign
                      </Button>
                      {!withinServiceArea && (
                        <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>
                            This location is outside our current service area. TrioTag currently only operates in {getActiveAreaNamesText()}.
                          </span>
                        </div>
                      )}
                      {withinServiceArea && estimate.totalUnits === 0 && (
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
                </div>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <section className="bg-green-50 border-t border-green-100 px-6 lg:px-8 py-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { Icon: Globe, t: "Nationwide Coverage", d: "Plan campaigns anywhere our partners operate" },
                { Icon: Layers, t: "Multi-Format Inventory", d: "OOH, DOOH, and AOOH placements" },
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

          {/* CTA: OOH, DOOH, AOOH videos */}
          <section className="px-6 lg:px-8 py-12 mt-8">
            <div className="max-w-6xl mx-auto text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">See TrioTag in Action</h2>
              <p className="text-gray-600 mt-2">Explore our OOH, DOOH, and AOOH advertising formats.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                { title: "OOH", desc: "Out-of-Home print placements across retail and high-traffic locations.", video: oohVideo.url },
                { title: "DOOH", desc: "Digital Out-of-Home screens with dynamic, scheduled creative.", video: doohVideo.url },
                { title: "AOOH", desc: "Audio Out-of-Home reaching audiences through ambient sound networks.", video: aoohVideo.url },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl overflow-hidden border border-green-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-black">
                    <video
                      src={c.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
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
                Your ad campaign request has been submitted. Our team will confirm final pricing and reach out within 24 hours to activate your campaign.
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
                  We'll confirm final pricing and reach out within 24 hours.
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
                  <label className="text-xs font-semibold text-gray-700">Notes (optional)</label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any specific goals or constraints..." />
                </div>
              </div>


              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitRequest} disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white">
                  {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Request — We'll Confirm Pricing & Activate"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
