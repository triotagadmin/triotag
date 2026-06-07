import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  X, ArrowRight, ArrowLeft, CheckCircle, CheckCircle2, Image as ImageIcon,
  Monitor, Volume2, MapPin, Search, Loader2, Shield, Lock,
} from "lucide-react";
import { MultiPinLocationMap, type PinnedLocation } from "./MultiPinLocationMap";

type MediaType = "OOH" | "DOOH" | "AOOH";
type Step = 1 | 2 | 3 | 4;

interface Venue {
  id: string;
  title: string;
  location: string | null;
  media_type: string | null;
  specifications: any;
  pricing: any;
  monthly_subscription_fee: number | null;
  publisher_id: string;
}

const COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "US", name: "United States" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "JP", name: "Japan" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

const INDUSTRIES = [
  "Food & Beverage", "Retail", "Fitness & Wellness", "Technology",
  "Entertainment", "Education", "Other",
];

const TYPE_OPTIONS: { value: MediaType; icon: any; title: string; desc: string }[] = [
  { value: "OOH", icon: ImageIcon, title: "OOH", desc: "Print placements: stickers, posters, table tents inside retail venues" },
  { value: "DOOH", icon: Monitor, title: "DOOH", desc: "Digital screens in gyms, salons, waiting rooms, and retail venues" },
  { value: "AOOH", icon: Volume2, title: "AOOH", desc: "In-store audio ads played at the point of purchase" },
];

const STEPS = [
  { id: 1, label: "Campaign Details" },
  { id: 2, label: "Select Location" },
  { id: 3, label: "Review" },
  { id: 4, label: "Payment" },
];

const MIN_PINS = 1;
const MAX_PINS = 15;

function monthsBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const s = new Date(start); const e = new Date(end);
  const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1);
  return Math.max(1, days / 30);
}

function venueMonthly(v: Venue): number {
  if (v.monthly_subscription_fee) return Number(v.monthly_subscription_fee);
  const p = v.pricing || {};
  return Number(p.monthly || p.pricePerMonth || 0);
}

export function CampaignWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<MediaType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 2 — pinned target locations
  const [pinnedLocations, setPinnedLocations] = useState<PinnedLocation[]>([]);

  // Step 3 billing
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingCountry, setBillingCountry] = useState("PH");
  const [billingZip, setBillingZip] = useState("");

  // Step 4
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email && !buyerEmail) setBuyerEmail(session.user.email);
    })();
  }, [open]);

  useEffect(() => {
    if (step !== 2 || !campaignType) return;
    setLoadingVenues(true);
    supabase
      .from("ad_spaces")
      .select("id, title, location, media_type, specifications, pricing, monthly_subscription_fee, publisher_id")
      .eq("approval_status", "approved")
      .eq("media_type", campaignType)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        }
        setVenues((data as any) || []);
        setLoadingVenues(false);
      });
  }, [step, campaignType]);

  const months = useMemo(() => monthsBetween(startDate, endDate), [startDate, endDate]);
  const selectedVenues = useMemo(() => venues.filter(v => selectedIds.has(v.id)), [venues, selectedIds]);
  const venueCost = (v: Venue) => venueMonthly(v) * months;
  const grandTotal = useMemo(
    () => selectedVenues.reduce((s, v) => s + venueCost(v), 0),
    [selectedVenues, months]
  );

  const cities = useMemo(() => {
    const set = new Set<string>();
    venues.forEach(v => { if (v.location) set.add(v.location); });
    return Array.from(set);
  }, [venues]);

  const filteredVenues = useMemo(() => {
    const q = search.toLowerCase();
    return venues.filter(v => {
      if (cityFilter !== "all" && v.location !== cityFilter) return false;
      if (!q) return true;
      return (v.title || "").toLowerCase().includes(q) || (v.location || "").toLowerCase().includes(q);
    });
  }, [venues, search, cityFilter]);

  const step1Valid = !!(campaignName && campaignType && startDate && endDate && budget);
  const step2Valid = selectedIds.size > 0;
  const billingValid = !!(buyerName && buyerEmail && billingAddress && billingCity && billingCountry && billingZip);

  const reset = () => {
    setStep(1); setCampaignName(""); setCampaignType(""); setStartDate(""); setEndDate("");
    setBudget(""); setDescription(""); setIndustry(""); setVenues([]); setSelectedIds(new Set());
    setSearch(""); setCityFilter("all"); setProcessing(false);
  };

  const handleClose = () => { onClose(); setTimeout(reset, 200); };

  const handleNext = () => {
    if (step === 1) {
      if (!step1Valid) return toast({ title: "Missing fields", description: "Complete all required fields.", variant: "destructive" });
      setStep(2);
    } else if (step === 2) {
      if (!step2Valid) return toast({ title: "Select at least one venue", variant: "destructive" });
      setStep(3);
    } else if (step === 3) {
      if (!billingValid) return toast({ title: "Missing billing info", variant: "destructive" });
      setStep(4);
      handlePayment();
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const uid = session.user.id;

      // Lookup advertiser_profiles.id (campaigns.advertiser_id FK)
      const { data: profile } = await supabase
        .from("advertiser_profiles").select("id").eq("user_id", uid).maybeSingle();

      // Create parent campaign
      await supabase.from("campaigns").insert({
        advertiser_id: profile?.id || uid,
        campaign_name: campaignName,
        campaign_type: (campaignType as string).toLowerCase(),
        campaign_description: description || null,
        start_date: startDate,
        end_date: endDate,
        budget_amount: Number(budget),
        budget_currency: "PHP",
        status: "pending",
        target_audience: industry || null,
      } as any);

      // Map UI type to activation_type enum
      const activationType = campaignType === "OOH" ? "poster" : "other";

      // Create activation rows
      const rows = selectedVenues.map(v => ({
        advertiser_id: uid,
        ad_space_id: v.id,
        publisher_id: v.publisher_id,
        activation_type: activationType,
        status: "pending_approval",
        start_date: startDate,
        end_date: endDate,
        total_amount: venueCost(v),
      }));

      const { data: inserted, error: insErr } = await supabase
        .from("activations").insert(rows as any).select("id");
      if (insErr) throw insErr;
      if (!inserted?.length) throw new Error("Failed to create activations");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          activationId: inserted[0].id,
          buyerName, buyerEmail, buyerPhone, companyName,
          billingAddress, billingCity, billingCountry, billingZip,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: window.location.href,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const checkoutUrl = data?.checkoutUrl || data?.checkout_url;
      if (!checkoutUrl) throw new Error("No checkout URL returned");
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("Campaign payment error:", err);
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setProcessing(false);
      setStep(3);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Create Campaign</h2>
          <p className="text-xs text-zinc-400">{STEPS[step - 1].label}</p>
        </div>
        <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stepper */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap max-w-4xl mx-auto">
          {STEPS.map((s, i) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-full transition-colors ${
                  isActive ? "bg-green-600 text-white" : isDone ? "bg-green-600/20 text-green-400" : "bg-white/5 text-zinc-500"
                }`}>
                  {isDone ? <CheckCircle className="w-4 h-4" /> : (
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? "bg-white/20" : "bg-white/10"}`}>{s.id}</span>
                  )}
                  <span className="font-medium hidden sm:inline text-sm">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <ArrowRight className="w-4 h-4 mx-1 md:mx-2 text-zinc-600" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-white mb-2 block">Campaign Name *</Label>
              <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. Summer Product Launch" />
            </div>

            <div>
              <Label className="text-white mb-3 block">Campaign Type *</Label>
              <RadioGroup value={campaignType} onValueChange={(v) => setCampaignType(v as MediaType)} className="grid md:grid-cols-3 gap-3">
                {TYPE_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const selected = campaignType === opt.value;
                  return (
                    <label key={opt.value} className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                      selected ? "border-green-500 bg-green-500/5" : "border-white/10 bg-[#0c0c0c] hover:border-white/20"
                    }`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={opt.value} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-5 h-5 text-green-400" />
                            <span className="font-bold">{opt.title}</span>
                          </div>
                          <p className="text-xs text-zinc-400">{opt.desc}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white mb-2 block">Start Date *</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-white mb-2 block">End Date *</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Budget (PHP) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">₱</span>
                <Input type="number" className="pl-7" value={budget} onChange={e => setBudget(e.target.value)} placeholder="5000" />
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Campaign Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your campaign objective..." className="bg-[#0c0c0c] border-white/10 text-white" />
            </div>

            <div>
              <Label className="text-white mb-2 block">Industry</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search venues by name or location..." />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-56"><SelectValue placeholder="All cities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cities</SelectItem>
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-green-400 font-medium">
              {selectedIds.size} venue{selectedIds.size !== 1 ? "s" : ""} selected
            </div>

            {loadingVenues ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
            ) : filteredVenues.length === 0 ? (
              <Card className="bg-[#0c0c0c] border-white/10">
                <CardContent className="py-12 text-center text-zinc-400">
                  No approved {campaignType} venues available.
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVenues.map(v => {
                  const selected = selectedIds.has(v.id);
                  const monthly = venueMonthly(v);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          next.has(v.id) ? next.delete(v.id) : next.add(v.id);
                          return next;
                        });
                      }}
                      className={`relative text-left rounded-2xl border-2 p-4 transition ${
                        selected ? "border-green-500 bg-green-500/5" : "border-white/10 bg-[#0c0c0c] hover:border-white/20"
                      }`}
                    >
                      {selected && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-green-400" />}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-bold text-white pr-6">{v.title}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-green-400 mb-3">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{v.location || "Unknown"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-green-500/40 text-green-400 text-[10px]">{v.media_type}</Badge>
                        {monthly > 0 && (
                          <span className="text-xs text-zinc-300">₱{monthly.toLocaleString()}/mo</span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Checkbox checked={selected} />
                        <span className="text-xs text-zinc-400">{selected ? "Selected" : "Select venue"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="bg-[#0c0c0c] border-white/10 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Campaign Summary</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div><div className="text-zinc-400 text-xs">Name</div><div className="font-medium">{campaignName}</div></div>
                  <div><div className="text-zinc-400 text-xs">Type</div><Badge className="bg-green-500/20 text-green-400 border-green-500/40">{campaignType}</Badge></div>
                  <div><div className="text-zinc-400 text-xs">Dates</div><div>{startDate} → {endDate}</div></div>
                  <div><div className="text-zinc-400 text-xs">Industry</div><div>{industry || "—"}</div></div>
                  <div><div className="text-zinc-400 text-xs">Budget</div><div>₱{Number(budget || 0).toLocaleString()}</div></div>
                  <div><div className="text-zinc-400 text-xs">Duration</div><div>{months.toFixed(1)} months</div></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0c0c0c] border-white/10 rounded-2xl">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3">Selected Venues ({selectedVenues.length})</h3>
                <div className="divide-y divide-white/5">
                  {selectedVenues.map(v => (
                    <div key={v.id} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">{v.title}</div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{v.location}</div>
                      </div>
                      <div className="text-green-400 font-semibold">₱{venueCost(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 mt-3 pt-3 flex items-center justify-between">
                  <span className="text-zinc-400">Venue lease fees</span>
                  <span className="font-bold">₱{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
                {campaignType === "OOH" && (
                  <p className="text-xs text-zinc-500 mt-2">Print materials billed separately after booking confirmation.</p>
                )}
                <div className="border-t border-green-500/30 mt-3 pt-3 flex items-center justify-between">
                  <span className="font-semibold text-lg">Grand Total</span>
                  <span className="text-2xl font-bold text-green-400">₱{grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0c0c0c] border-white/10 rounded-2xl">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Billing Information</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label className="text-white mb-1 block">Full Name *</Label><Input value={buyerName} onChange={e => setBuyerName(e.target.value)} /></div>
                  <div><Label className="text-white mb-1 block">Email *</Label><Input type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} /></div>
                  <div><Label className="text-white mb-1 block">Company Name</Label><Input value={companyName} onChange={e => setCompanyName(e.target.value)} /></div>
                  <div><Label className="text-white mb-1 block">Phone</Label><Input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} /></div>
                  <div className="sm:col-span-2"><Label className="text-white mb-1 block">Billing Address *</Label><Input value={billingAddress} onChange={e => setBillingAddress(e.target.value)} /></div>
                  <div><Label className="text-white mb-1 block">City *</Label><Input value={billingCity} onChange={e => setBillingCity(e.target.value)} /></div>
                  <div>
                    <Label className="text-white mb-1 block">Country *</Label>
                    <Select value={billingCountry} onValueChange={setBillingCountry}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-white mb-1 block">ZIP *</Label><Input value={billingZip} onChange={e => setBillingZip(e.target.value)} /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <Card className="bg-[#0c0c0c] border-white/10 rounded-2xl">
              <CardContent className="p-8 text-center">
                {processing ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Setting up your campaign...</h3>
                    <p className="text-zinc-400 text-sm">Creating activations and preparing checkout.</p>
                  </>
                ) : (
                  <>
                    <Shield className="w-10 h-10 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Redirecting to secure payment...</h3>
                    <p className="text-zinc-400 text-sm">If you are not redirected, please go back and try again.</p>
                  </>
                )}
                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure payment</span>
                  <span>QRPh · Maya · GrabPay · Online Banking</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur border-t border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {step > 1 && step < 4 ? (
            <Button variant="ghost" onClick={() => setStep((step - 1) as Step)} className="text-zinc-300 hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : <div />}
          {step < 4 && (
            <Button onClick={handleNext} className="bg-green-600 hover:bg-green-500 text-white">
              {step === 3 ? "Proceed to Payment" : step === 2 ? "Review Campaign" : "Next"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampaignWizard;
