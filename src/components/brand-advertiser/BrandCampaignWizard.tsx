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
  initialAdSpaceIds?: string[] | null;
  editCampaign?: any | null;
}

const TOTAL_STEPS = 5;

const LOCATION_TYPE_OPTIONS = [
  { value: "cafe", label: "Cafe" },
  { value: "coffee_shop", label: "Coffee Shop" },
  { value: "restaurant", label: "Restaurant" },
  { value: "fast_food", label: "Fast Food" },
  { value: "bar", label: "Bar" },
  { value: "nightclub", label: "Nightclub" },
  { value: "supermarket", label: "Supermarket" },
  { value: "convenience_store", label: "Convenience Store" },
  { value: "mall", label: "Mall" },
  { value: "clothing_store", label: "Clothing Store" },
  { value: "department_store", label: "Department Store" },
  { value: "barbershop", label: "Barbershop / Salon" },
  { value: "fitness_centre", label: "Fitness / Gym" },
  { value: "pharmacy", label: "Pharmacy" },
];

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

export default function BrandCampaignWizard({ open, onOpenChange, brandAdvertiserId, onCreated, initialAdSpaceId, initialAdSpaceIds, editCampaign }: Props) {
  const { toast } = useToast();
  const isEdit = !!editCampaign?.id;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [campaignName, setCampaignName] = useState("");
  const [scopeName, setScopeName] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Step 2 - location targeting + optional inventory reference
  const [locationCount, setLocationCount] = useState<string>("10");
  const [locationTypes, setLocationTypes] = useState<string[]>([]);
  const [invSearch, setInvSearch] = useState("");
  const [showInventory, setShowInventory] = useState(false);
  const [adSpaces, setAdSpaces] = useState<AdSpaceRow[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [selectedAdSpaceIds, setSelectedAdSpaceIds] = useState<string[]>([]);

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

  // Prefill from edit campaign or initial ad space seeds
  useEffect(() => {
    if (!open) return;
    if (editCampaign) {
      setCampaignName(editCampaign.campaign_name || "");
      setScopeName(editCampaign.scope_name || "");
      setBudget(String(editCampaign.budget ?? ""));
      setStartDate(editCampaign.start_date ? new Date(editCampaign.start_date) : undefined);
      setEndDate(editCampaign.end_date ? new Date(editCampaign.end_date) : undefined);
      setLocationCount(String(editCampaign.location_count ?? "10"));
      setLocationTypes(Array.isArray(editCampaign.location_types) ? editCampaign.location_types : []);
      setAgeMin(String(editCampaign.target_age_min ?? "18"));
      setAgeMax(String(editCampaign.target_age_max ?? "65"));
      setGender(editCampaign.target_gender || "All");
      setCreativeFormat(editCampaign.creative_format || "Image");
      setCreativeSetId(editCampaign.creative_set_id || null);
      setNotes(editCampaign.notes || "");
      return;
    }
    const ids = [
      ...(initialAdSpaceIds ?? []),
      ...(initialAdSpaceId ? [initialAdSpaceId] : []),
    ];
    if (ids.length === 0) return;
    setSelectedAdSpaceIds((prev) => {
      const merged = new Set(prev);
      ids.forEach((id) => merged.add(id));
      return Array.from(merged);
    });
    setShowInventory(true);
  }, [open, initialAdSpaceId, initialAdSpaceIds, editCampaign]);

  // Step 3
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [gender, setGender] = useState("All");
  const [creativeFormat, setCreativeFormat] = useState("Image");

  // Step 4 - creative selection
  const [creativeSets, setCreativeSets] = useState<Array<{ id: string; title: string; creative_format: string | null; file_url: string | null; creative_count: number | null }>>([]);
  const [creativeSetId, setCreativeSetId] = useState<string | null>(null);
  const [loadingCreatives, setLoadingCreatives] = useState(false);

  useEffect(() => {
    if (!open || !brandAdvertiserId) return;
    (async () => {
      setLoadingCreatives(true);
      const { data } = await (supabase as any)
        .from("brand_creative_sets")
        .select("id,title,creative_format,file_url,status,creative_count")
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
      if (!q) return true;
      const hay = `${s.title || ""} ${s.location || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [adSpaces, invSearch]);

  const reset = () => {
    setStep(1); setCampaignName(""); setScopeName(""); setBudget(""); setStartDate(undefined); setEndDate(undefined);
    setLocationCount("10"); setLocationTypes([]); setInvSearch(""); setShowInventory(false); setSelectedAdSpaceIds([]);
    setAgeMin("18"); setAgeMax("65"); setGender("All");
    setCreativeFormat("Image"); setCreativeSetId(null); setNotes("");
  };

  const close = () => { onOpenChange(false); setTimeout(reset, 200); };

  const toggleAdSpace = (id: string) => {
    setSelectedAdSpaceIds((p) => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };
  const toggleLocationType = (v: string) => {
    setLocationTypes((p) => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  const canNext1 = campaignName.trim() && Number(budget) > 0 && startDate && endDate;
  const canNext2 = Number(locationCount) > 0 && locationTypes.length > 0;

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload: any = {
        campaign_name: campaignName,
        scope_name: scopeName || null,
        budget: Number(budget),
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        location_count: Number(locationCount) || null,
        location_types: locationTypes,
        countries: ["Philippines"],
        target_age_min: Number(ageMin),
        target_age_max: Number(ageMax),
        target_gender: gender,
        creative_format: creativeFormat,
        creative_set_id: creativeSetId,
        notes,
      };

      if (isEdit) {
        const { error } = await (supabase as any)
          .from("brand_campaigns")
          .update(payload)
          .eq("id", editCampaign.id);
        if (error) throw error;
        toast({ title: "Campaign updated" });
      } else {
        payload.brand_advertiser_id = brandAdvertiserId;
        payload.status = "pending_review";
        const { data: created, error } = await (supabase as any)
          .from("brand_campaigns")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;

        if (created?.id && selectedAdSpaceIds.length > 0) {
          const targetRows = selectedAdSpaceIds.map((ad_space_id) => ({
            campaign_id: created.id,
            ad_space_id,
          }));
          await supabase.from("campaign_ad_space_targets").insert(targetRows);
        }

        try {
          await supabase.functions.invoke("notify-brand-campaign-submission", {
            body: { campaign_name: campaignName, budget, location_types: locationTypes },
          });
        } catch (e) { /* non-fatal */ }
      }

      onCreated?.();
      close();
    } catch (e: any) {
      toast({ title: isEdit ? "Update failed" : "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      <DialogContent className="max-w-2xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{isEdit ? "Edit Brand Campaign" : "New Brand Campaign"}</DialogTitle>
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
              <Label>Campaign Scope Name</Label>
              <Input value={scopeName} onChange={(e) => setScopeName(e.target.value)} placeholder="e.g. Metro Manila Cafes Q3" />
              <p className="text-xs text-gray-500">A short label describing the reach/scope of this campaign.</p>
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
                  <PopoverContent className="p-0 bg-white text-gray-900" align="start">
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
                  <PopoverContent className="p-0 bg-white text-gray-900" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-2">
            <div>
              <h3 className="font-semibold text-gray-900">Location Targeting</h3>
              <p className="text-xs text-gray-500 mt-1">
                Tell us how many locations you want to reach and what types. Our team will match your campaign to the best available inventory — no need to hand-pick.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Number of Locations *</Label>
                <Input
                  type="number"
                  min="1"
                  value={locationCount}
                  onChange={(e) => setLocationCount(e.target.value)}
                  placeholder="10"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Selected Types</Label>
                <div className="text-sm text-gray-700 pt-2">{locationTypes.length} selected</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location Types *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-gray-200 rounded-md p-3 max-h-[240px] overflow-y-auto">
                {LOCATION_TYPE_OPTIONS.map((opt) => {
                  const checked = locationTypes.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${checked ? "bg-green-50 border border-green-200" : "hover:bg-gray-50 border border-transparent"}`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleLocationType(opt.value)} />
                      <span className="text-gray-800">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {!isEdit && (
              <div className="border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInventory((s) => !s)}
                  className="text-xs text-green-700 hover:text-green-800 underline"
                >
                  {showInventory ? "Hide" : "Browse"} available inventory (reference only, optional)
                </button>
                {showInventory && (
                  <div className="mt-3 space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={invSearch}
                        onChange={(e) => setInvSearch(e.target.value)}
                        placeholder="Search by location..."
                        className="pl-9"
                      />
                    </div>
                    <div className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-[240px] overflow-y-auto">
                      {loadingInv ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">Loading inventory…</div>
                      ) : filteredInventory.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">No inventory found</div>
                      ) : (
                        filteredInventory.slice(0, 50).map((s) => {
                          const mt = String(s.media_type || "").toUpperCase();
                          const checked = selectedAdSpaceIds.includes(s.id);
                          return (
                            <label
                              key={s.id}
                              className={`flex items-start gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 ${checked ? "bg-green-50/50" : ""}`}
                            >
                              <Checkbox checked={checked} onCheckedChange={() => toggleAdSpace(s.id)} className="mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={formatBadge(mt)}>{mt || "—"}</Badge>
                                  {s.location && (
                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {s.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedAdSpaceIds.length} referenced ad space(s)
                    </div>
                  </div>
                )}
              </div>
            )}
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
                Choose which creative set should serve on this campaign. You can skip and attach later.
              </p>
            </div>

            {loadingCreatives ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading creative sets…</div>
            ) : creativeSets.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-md p-6 text-center space-y-3 bg-gray-50">
                <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                <div className="text-sm text-gray-700">You don't have any active creative sets yet.</div>
                <Link to="/brand-advertiser/creatives" className="inline-block text-sm text-green-700 hover:text-green-800 underline">
                  Create a creative set →
                </Link>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-md divide-y divide-gray-100 max-h-[320px] overflow-y-auto">
                <label className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${creativeSetId === null ? "bg-gray-50" : ""}`}>
                  <input type="radio" name="creative-set" className="mt-1" checked={creativeSetId === null} onChange={() => setCreativeSetId(null)} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">No creative yet</div>
                    <div className="text-xs text-gray-500">Save as draft; attach later from the campaigns list.</div>
                  </div>
                </label>
                {creativeSets.map((cs) => (
                  <label key={cs.id} className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${creativeSetId === cs.id ? "bg-green-50/50" : ""}`}>
                    <input type="radio" name="creative-set" className="mt-1" checked={creativeSetId === cs.id} onChange={() => setCreativeSetId(cs.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">{cs.title}</span>
                        {cs.creative_format && <Badge className="bg-gray-100 text-gray-700">{cs.creative_format}</Badge>}
                      </div>
                      {cs.file_url && <div className="text-xs text-gray-500 truncate mt-0.5">{cs.file_url}</div>}
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
              {scopeName && <Row label="Scope" value={scopeName} />}
              <Row label="Budget" value={`₱${Number(budget || 0).toLocaleString()}`} />
              <Row label="Dates" value={`${startDate ? format(startDate, "MMM d, yyyy") : "—"} – ${endDate ? format(endDate, "MMM d, yyyy") : "—"}`} />
              <Row label="Locations" value={`${locationCount || 0} × ${locationTypes.map(t => LOCATION_TYPE_OPTIONS.find(o => o.value === t)?.label || t).join(", ") || "—"}`} />
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
              {submitting ? (isEdit ? "Saving..." : "Submitting...") : (isEdit ? "Save Changes" : "Submit Campaign for Review")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-gray-900 font-medium text-right">{value}</span>
    </div>
  );
}
