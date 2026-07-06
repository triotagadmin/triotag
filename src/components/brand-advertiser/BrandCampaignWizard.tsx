import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, CalendarIcon, MapPin, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { getActiveAreaNamesText } from "@/lib/serviceAreas";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brandAdvertiserId: string;
  onCreated?: () => void;
  initialAdSpaceId?: string | null;
}

const MEDIA_TYPES = ["OOH", "DOOH", "AOOH"] as const;
type MediaType = typeof MEDIA_TYPES[number];
const TOTAL_STEPS = 5;

interface AdSpaceRow {
  id: string;
  title: string;
  location: string | null;
  media_type: string;
  pricing: any;
  monthly_subscription_fee: number | null;
}

const formatBadge = (mt: string) => {
  const u = mt.toUpperCase();
  if (u === "OOH") return "bg-purple-100 text-purple-700";
  if (u === "DOOH") return "bg-cyan-100 text-cyan-700";
  return "bg-green-100 text-green-700";
};

export default function BrandCampaignWizard({ open, onOpenChange, brandAdvertiserId, onCreated, initialAdSpaceId }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [campaignName, setCampaignName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Step 2 - inventory browser
  const [invSearch, setInvSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"ALL" | MediaType>("ALL");
  const [selectedAdSpaceIds, setSelectedAdSpaceIds] = useState<string[]>([]);
  const [adSpaces, setAdSpaces] = useState<AdSpaceRow[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoadingInv(true);
      const { data, error } = await supabase
        .from("ad_spaces")
        .select("id,title,location,media_type,pricing,monthly_subscription_fee")
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });
      if (!error) setAdSpaces((data || []) as AdSpaceRow[]);
      setLoadingInv(false);
    })();
  }, [open]);

  useEffect(() => {
    if (open && initialAdSpaceId) {
      setSelectedAdSpaceIds((prev) => (prev.includes(initialAdSpaceId) ? prev : [...prev, initialAdSpaceId]));
    }
  }, [open, initialAdSpaceId]);

  // Step 3
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [gender, setGender] = useState("All");
  const [creativeFormat, setCreativeFormat] = useState("Image");

  // Step 4 - creative selection
  const [creativeSets, setCreativeSets] = useState<Array<{ id: string; title: string; creative_format: string | null; file_url: string | null }>>([]);
  const [creativeSetId, setCreativeSetId] = useState<string | null>(null);
  const [loadingCreatives, setLoadingCreatives] = useState(false);

  useEffect(() => {
    if (!open || !brandAdvertiserId) return;
    (async () => {
      setLoadingCreatives(true);
      const { data } = await (supabase as any)
        .from("brand_creative_sets")
        .select("id,title,creative_format,file_url,status")
        .eq("brand_advertiser_id", brandAdvertiserId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setCreativeSets(data || []);
      setLoadingCreatives(false);
    })();
  }, [open, brandAdvertiserId]);

  // Step 5
  const [notes, setNotes] = useState("");

  const filteredInventory = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return adSpaces.filter((s) => {
      const mt = String(s.media_type || "").toUpperCase();
      if (mediaFilter !== "ALL" && mt !== mediaFilter) return false;
      if (q) {
        const hay = `${s.title || ""} ${s.location || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [adSpaces, invSearch, mediaFilter]);

  const selectedEnvs = useMemo(() => {
    const set = new Set<string>();
    adSpaces.forEach((s) => {
      if (selectedAdSpaceIds.includes(s.id)) set.add(String(s.media_type || "").toUpperCase());
    });
    return Array.from(set);
  }, [adSpaces, selectedAdSpaceIds]);

  const reset = () => {
    setStep(1); setCampaignName(""); setBudget(""); setStartDate(undefined); setEndDate(undefined);
    setInvSearch(""); setMediaFilter("ALL"); setSelectedAdSpaceIds([]);
    setAgeMin("18"); setAgeMax("65"); setGender("All");
    setCreativeFormat("Image"); setCreativeSetId(null); setNotes("");
  };

  const close = () => { onOpenChange(false); setTimeout(reset, 200); };

  const toggleAdSpace = (id: string) => {
    setSelectedAdSpaceIds((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const canNext1 = campaignName.trim() && Number(budget) > 0 && startDate && endDate;
  const canNext2 = selectedAdSpaceIds.length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data: created, error } = await (supabase as any).from("brand_campaigns").insert({
        brand_advertiser_id: brandAdvertiserId,
        campaign_name: campaignName,
        budget: Number(budget),
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        environments: selectedEnvs,
        countries: ["Philippines"],
        target_age_min: Number(ageMin),
        target_age_max: Number(ageMax),
        target_gender: gender,
        creative_format: creativeFormat,
        creative_set_id: creativeSetId,
        notes,
        status: "pending_review",
      }).select("id").single();
      if (error) throw error;

      if (created?.id && selectedAdSpaceIds.length > 0) {
        const targetRows = selectedAdSpaceIds.map((ad_space_id) => ({
          campaign_id: created.id,
          ad_space_id,
        }));
        const { error: targetErr } = await supabase.from("campaign_ad_space_targets").insert(targetRows);
        if (targetErr) throw targetErr;
      }

      try {
        await supabase.functions.invoke("notify-brand-campaign-submission", {
          body: { campaign_name: campaignName, budget, environments: selectedEnvs },
        });
      } catch (e) { /* non-fatal */ }

      onCreated?.();
      close();
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">New Brand Campaign</DialogTitle>
          <div className="text-xs text-gray-500 mt-1">Step {step} of {TOTAL_STEPS}</div>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded ${i < step ? "bg-green-500" : "bg-gray-200"}`} />
            ))}
          </div>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign Name *</Label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="e.g. Summer Brand Launch" />
            </div>
            <div className="space-y-1.5">
              <Label>Budget (PHP) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <Input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="pl-7" placeholder="50000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 bg-white" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 bg-white" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 py-2">
            <h3 className="font-semibold text-gray-900">Select Inventory</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder="Search by title or location..."
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["ALL", ...MEDIA_TYPES] as const).map((m) => (
                <Button
                  key={m}
                  type="button"
                  size="sm"
                  variant={mediaFilter === m ? "default" : "outline"}
                  className={mediaFilter === m ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  onClick={() => setMediaFilter(m)}
                >
                  {m === "ALL" ? "All" : m}
                </Button>
              ))}
              <div className="flex-1" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAdSpaceIds(filteredInventory.map((s) => s.id))}
              >Select all</Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setSelectedAdSpaceIds([])}
              >Clear</Button>
            </div>
            <div className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-[360px] overflow-y-auto">
              {loadingInv ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">Loading inventory…</div>
              ) : adSpaces.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No approved inventory available yet — check back soon.
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No matches for your filters</div>
              ) : (
                filteredInventory.map((s) => {
                  const mt = String(s.media_type || "").toUpperCase();
                  const weekly = s.pricing?.weekly;
                  const monthly = s.pricing?.monthly ?? s.monthly_subscription_fee;
                  const checked = selectedAdSpaceIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${checked ? "bg-green-50/50" : ""}`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleAdSpace(s.id)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900 truncate">{s.title}</span>
                          <Badge className={formatBadge(mt)}>{mt || "—"}</Badge>
                        </div>
                        {s.location && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {s.location}
                          </div>
                        )}
                        {(weekly || monthly) && (
                          <div className="text-xs text-gray-600 mt-1">
                            {weekly ? `₱${Number(weekly).toLocaleString()}/week` : ""}
                            {weekly && monthly ? " • " : ""}
                            {monthly ? `₱${Number(monthly).toLocaleString()}/month` : ""}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="text-xs text-gray-500">
              {selectedAdSpaceIds.length} ad space(s) selected
              {selectedEnvs.length > 0 && ` • Environments: ${selectedEnvs.join(", ")}`}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
              Currently available in: {getActiveAreaNamesText()}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Age Min</Label>
                <Input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Age Max</Label>
                <Input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Creative Format</Label>
              <Select value={creativeFormat} onValueChange={setCreativeFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Image">Image</SelectItem>
                  <SelectItem value="Video">Video</SelectItem>
                  <SelectItem value="Audio">Audio</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="font-semibold text-gray-900">Attach Creative</h3>
              <p className="text-xs text-gray-500 mt-1">
                Choose which creative set should serve on this campaign. You can skip this and add one later, but the campaign cannot be approved until a creative is attached.
              </p>
            </div>

            {loadingCreatives ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading creative sets…</div>
            ) : creativeSets.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-md p-6 text-center space-y-3 bg-gray-50">
                <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                <div className="text-sm text-gray-700">You don't have any active creative sets yet.</div>
                <Link
                  to="/brand-advertiser/creatives"
                  className="inline-block text-sm text-green-700 hover:text-green-800 underline"
                >
                  Create a creative set →
                </Link>
                <div className="text-xs text-gray-500 pt-1">
                  You can continue without attaching one — the campaign will save as a draft until creative is added.
                </div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
                <label className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${creativeSetId === null ? "bg-gray-50" : ""}`}>
                  <input
                    type="radio"
                    name="creative-set"
                    className="mt-1"
                    checked={creativeSetId === null}
                    onChange={() => setCreativeSetId(null)}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">No creative yet</div>
                    <div className="text-xs text-gray-500">Save as draft; attach later from the campaigns list.</div>
                  </div>
                </label>
                {creativeSets.map((cs) => (
                  <label
                    key={cs.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${creativeSetId === cs.id ? "bg-green-50/50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="creative-set"
                      className="mt-1"
                      checked={creativeSetId === cs.id}
                      onChange={() => setCreativeSetId(cs.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{cs.title}</span>
                        {cs.creative_format && (
                          <Badge className="bg-gray-100 text-gray-700">{cs.creative_format}</Badge>
                        )}
                      </div>
                      {cs.file_url && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{cs.file_url}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4 py-2">
            <div className="border border-gray-200 rounded-md p-4 space-y-2 bg-gray-50">
              <Row label="Campaign" value={campaignName} />
              <Row label="Budget" value={`₱${Number(budget || 0).toLocaleString()}`} />
              <Row label="Dates" value={`${startDate ? format(startDate, "MMM d, yyyy") : "—"} – ${endDate ? format(endDate, "MMM d, yyyy") : "—"}`} />
              <Row label="Environments" value={selectedEnvs.join(", ") || "—"} />
              <Row label="Country" value="Philippines" />
              <Row label="Age" value={`${ageMin} – ${ageMax}`} />
              <Row label="Gender" value={gender} />
              <Row label="Creative Format" value={creativeFormat} />
              <Row
                label="Creative Set"
                value={creativeSetId ? (creativeSets.find(c => c.id === creativeSetId)?.title || "Selected") : "None (draft)"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything else our team should know?" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={() => step === 1 ? close() : setStep(step - 1)} disabled={submitting}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canNext1) || (step === 2 && !canNext2)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >Next</Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
              {submitting ? "Submitting..." : "Submit Campaign for Review"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}
