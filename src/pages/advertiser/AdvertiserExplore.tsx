import { useEffect, useMemo, useState } from "react";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell, Globe, Layers, ShieldCheck, BadgeCheck, Loader2, CheckCircle2,
  Image as ImageIcon, Monitor, Volume2,
} from "lucide-react";
import { RadiusMapPlanner } from "@/components/advertiser/RadiusMapPlanner";
import {
  calculateMediaPlanEstimate, MAX_RADIUS_METERS, MAX_RADIUS_FEE,
} from "@/lib/mediaPlanPricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 };

export default function AdvertiserExplore() {
  // ------- Radius planner state -------
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [radiusMeters, setRadiusMeters] = useState(1000);

  // ------- Unit counts -------
  const [oohCount, setOohCount] = useState(0);
  const [doohCount, setDoohCount] = useState(0);
  const [aoohCount, setAoohCount] = useState(0);

  const totalUnits = oohCount + doohCount + aoohCount;

  const estimate = useMemo(
    () => calculateMediaPlanEstimate(
      { ooh: oohCount, dooh: doohCount, aooh: aoohCount },
      radiusMeters,
    ),
    [oohCount, doohCount, aoohCount, radiusMeters],
  );

  // ------- Request dialog -------
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    campaignName: "",
    preferredStartDate: "",
    notes: "",
  });

  async function handleSubmitRequest() {
    if (!form.campaignName.trim() || !form.preferredStartDate) {
      toast({ title: "Missing info", description: "Campaign name and start date are required.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const campaignType = [
        oohCount > 0 && "OOH",
        doohCount > 0 && "DOOH",
        aoohCount > 0 && "AOOH",
      ].filter(Boolean).join(", ");

      const { error } = await supabase.from("media_plan_requests" as any).insert({
        advertiser_id: user?.id ?? null,
        campaign_name: form.campaignName,
        campaign_type: campaignType,
        center_lat: center.lat,
        center_lng: center.lng,
        radius_meters: radiusMeters,
        ooh_units: oohCount,
        dooh_units: doohCount,
        aooh_units: aoohCount,
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
          oohUnits: oohCount,
          doohUnits: doohCount,
          aoohUnits: aoohCount,
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
      unitCounts: { ooh: oohCount, dooh: doohCount, aooh: aoohCount },
      estimate, savedAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("saved_media_plans") || "[]");
    existing.unshift(plan);
    localStorage.setItem("saved_media_plans", JSON.stringify(existing.slice(0, 10)));
    toast({ title: "Saved", description: "Media plan saved locally on this device." });
  }

  const tierColor = estimate.tier === "Domination"
    ? "bg-purple-100 text-purple-700 border-purple-300"
    : estimate.tier === "Growth"
    ? "bg-blue-100 text-blue-700 border-blue-300"
    : "bg-green-100 text-green-700 border-green-300";

  const unitRows = [
    { key: "ooh", label: "OOH Units", price: 1500, Icon: ImageIcon, count: oohCount, setCount: setOohCount },
    { key: "dooh", label: "DOOH Units", price: 4500, Icon: Monitor, count: doohCount, setCount: setDoohCount },
    { key: "aooh", label: "AOOH Units", price: 1200, Icon: Volume2, count: aoohCount, setCount: setAoohCount },
  ] as const;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      <div className="flex">
        <AdvertiserSidebar />

        <main className="flex-1 min-w-0">
          <header className="px-6 lg:px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#111827]">Map Your Campaign Area</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Pick your coverage area, choose how many units you need, and get an instant media plan estimate.
                </p>
              </div>
              <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Bell className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </header>

          <div className="px-6 lg:px-8 pt-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Map (60%) */}
              <div className="lg:col-span-3 space-y-4">
                <RadiusMapPlanner
                  center={center}
                  radiusMeters={radiusMeters}
                  onCenterChange={setCenter}
                  onRadiusChange={setRadiusMeters}
                />

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Coverage Radius — affects campaign reach pricing
                  </div>
                  <div className="text-sm text-gray-700">
                    {estimate.radiusPercent}% coverage = <span className="font-semibold text-green-700">₱{estimate.radiusFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Results panel (40%) */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-6 space-y-5">
                  {/* Unit selector */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h3 className="text-base font-bold text-gray-900 mb-1">How many units do you need?</h3>
                    <p className="text-xs text-gray-500 mb-3">Pick the mix of placements for your campaign.</p>

                    {unitRows.map(({ key, label, price, Icon, count, setCount }) => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{label}</div>
                            <div className="text-xs text-gray-500">₱{price.toLocaleString()} / unit</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCount(Math.max(0, count - 1))}
                            disabled={count === 0}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700"
                          >
                            −
                          </button>
                          <Input
                            type="number"
                            min={0}
                            max={200}
                            value={count}
                            onChange={(e) => setCount(Math.max(0, Math.min(200, Number(e.target.value) || 0)))}
                            className="w-14 h-8 text-center px-1"
                          />
                          <button
                            type="button"
                            onClick={() => setCount(Math.min(200, count + 1))}
                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estimate */}
                  <div className="bg-green-50 border-2 border-green-500 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Estimated Media Plan</div>
                      <Badge className={`${tierColor} border`}>{estimate.tier}</Badge>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mt-1">
                      ₱{estimate.totalEstimate.toLocaleString()}
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>Unit Cost ({oohCount} OOH + {doohCount} DOOH + {aoohCount} AOOH)</span>
                        <span className="font-medium">₱{estimate.unitCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Coverage Radius ({estimate.radiusPercent}% of {MAX_RADIUS_METERS / 1000}km)</span>
                        <span className="font-medium">₱{estimate.radiusFee.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-green-200 my-2" />
                      <div className="flex justify-between items-center">
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
                        disabled={totalUnits === 0}
                        className="w-full bg-green-600 hover:bg-green-500 text-white h-11 text-base font-semibold"
                      >
                        Request This Media Plan
                      </Button>
                      {totalUnits === 0 && (
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
        </main>
      </div>

      {/* Request dialog */}
      <Dialog open={requestOpen} onOpenChange={(o) => { setRequestOpen(o); if (!o) setSubmitted(false); }}>
        <DialogContent className="max-w-lg">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Request submitted!</h3>
              <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
                Your media plan request has been submitted. Our team will confirm final pricing and reach out within 24 hours to activate your campaign.
              </p>
              <Button className="mt-5 bg-green-600 hover:bg-green-500 text-white" onClick={() => setRequestOpen(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request Your Media Plan</DialogTitle>
                <DialogDescription>
                  We'll confirm final pricing and reach out within 24 hours.
                </DialogDescription>
              </DialogHeader>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm space-y-1">
                {oohCount > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">OOH units</span><span className="font-semibold">{oohCount}</span></div>
                )}
                {doohCount > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">DOOH units</span><span className="font-semibold">{doohCount}</span></div>
                )}
                {aoohCount > 0 && (
                  <div className="flex justify-between"><span className="text-gray-600">AOOH units</span><span className="font-semibold">{aoohCount}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-600">Coverage radius</span><span className="font-semibold">{estimate.radiusKm}km ({estimate.radiusPercent}%)</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Estimated</span><span className="font-bold text-green-700">₱{estimate.totalEstimate.toLocaleString()}</span></div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Campaign Name *</label>
                  <Input value={form.campaignName} onChange={(e) => setForm({ ...form, campaignName: e.target.value })} placeholder="Summer brand activation" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Preferred Start Date *</label>
                  <Input type="date" value={form.preferredStartDate} onChange={(e) => setForm({ ...form, preferredStartDate: e.target.value })} />
                </div>
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
