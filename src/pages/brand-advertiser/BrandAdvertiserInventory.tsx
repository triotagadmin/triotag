import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Image as ImageIcon,
  Monitor,
  Volume2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Search as SearchIcon,
  Check,
  Save,
  Loader2,
  Layers,
  Calendar as CalendarIcon,
  Users,
  Wallet,
  Palette,
  ClipboardCheck,
  Send,
  Target,
  X,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";

type MediaType = "OOH" | "DOOH" | "AOOH";

const STEPS = [
  { n: 1, key: "type", label: "Campaign", icon: Target },
  { n: 2, key: "media", label: "Media", icon: Monitor },
  { n: 3, key: "objective", label: "Objective", icon: ClipboardCheck },
  { n: 4, key: "inventory", label: "Inventory", icon: SearchIcon },
  { n: 5, key: "format", label: "Format", icon: ImageIcon },
  { n: 6, key: "duration", label: "Duration", icon: CalendarIcon },
  { n: 7, key: "audience", label: "Audience", icon: Users },
  { n: 8, key: "budget", label: "Budget", icon: Wallet },
  { n: 9, key: "creative", label: "Creative", icon: Palette },
  { n: 10, key: "review", label: "Review", icon: ClipboardCheck },
  { n: 11, key: "submit", label: "Submit", icon: Send },
];

const CAMPAIGN_TYPES = [
  { value: "event", title: "EVENT", desc: "Promote a launch, activation, concert or happening." },
  { value: "product", title: "PRODUCT", desc: "Drive awareness and sales for a physical or digital product." },
  { value: "service", title: "SERVICE", desc: "Generate demand and leads for a service offering." },
];

const MEDIA_TYPES: { key: MediaType; title: string; desc: string; icon: any; accent: string }[] = [
  { key: "OOH", title: "OOH", desc: "Out-of-Home printed placements", icon: ImageIcon, accent: "text-purple-600" },
  { key: "DOOH", title: "DOOH", desc: "Digital Out-of-Home screens", icon: Monitor, accent: "text-cyan-600" },
  { key: "AOOH", title: "AOOH", desc: "Alternative Out-of-Home formats", icon: Volume2, accent: "text-green-600" },
];

const OBJECTIVES = [
  "Brand Awareness",
  "Product Launch",
  "Event Promotion",
  "Store Traffic",
  "Lead Generation",
  "Sales / Conversions",
  "Promotional Campaign",
  "Other",
];

const FORMAT_OPTIONS: Record<MediaType, string[]> = {
  OOH: ["Billboard", "Poster", "Wall Advertising", "Transit Advertising", "Sticker / Decal", "Tabletop", "Signage", "Other"],
  DOOH: ["Static Digital Display", "Video", "Motion Graphic", "Digital Billboard", "LED Screen", "Retail Screen", "Kiosk"],
  AOOH: ["Custom Installation", "Experiential", "Street Furniture", "Vehicle / Mobile Media", "Alternative Format", "Other"],
};

const DURATION_PRESETS = [
  { key: "1d", label: "1 Day", days: 1 },
  { key: "3d", label: "3 Days", days: 3 },
  { key: "1w", label: "1 Week", days: 7 },
  { key: "2w", label: "2 Weeks", days: 14 },
  { key: "1m", label: "1 Month", days: 30 },
  { key: "custom", label: "Custom", days: 0 },
];

type InventoryRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  media_urls: any;
  specifications: any;
  pricing: any;
  media_type: string;
  media_types: string[] | null;
  total_ad_units: number | null;
  monthly_subscription_fee: number | null;
  availability_status: string | null;
  media_owner_name: string | null;
  contact_verified_at: string | null;
  created_at: string;
};

type SelectionState = Record<string, { quantity: number; adFormat: string | null }>;

const firstImage = (media: any): string | null => {
  const arr = Array.isArray(media) ? media : media?.images || media?.urls;
  if (Array.isArray(arr) && arr.length) return typeof arr[0] === "string" ? arr[0] : arr[0]?.url || null;
  return null;
};

const monthlyRate = (row: InventoryRow): number => {
  const p = row.pricing || {};
  return Number(row.monthly_subscription_fee || p.monthly || p.monthly_rate || p.price || 0);
};

const rowTypes = (row: InventoryRow): string[] =>
  (row.media_types?.length ? row.media_types : [row.media_type]).filter(Boolean).map((t) => String(t).toUpperCase());

const cityOf = (row: InventoryRow): string => {
  const loc = row.location || "";
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : parts[0] || "Unspecified";
};

const reachOf = (row: InventoryRow): number => Number(row.specifications?.estimated_reach || row.specifications?.reach || 0);

const venueTypeOf = (row: InventoryRow): string | null =>
  row.specifications?.venue_type || row.specifications?.place_type || row.specifications?.category || null;

const peso = (n: number) => `₱${Number(n || 0).toLocaleString()}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export default function BrandAdvertiserInventory() {
  const navigate = useNavigate();
  const { companyName, totalBudget } = useAdvertiserProfile();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // wizard state
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<string>("");
  const [mediaTypes, setMediaTypes] = useState<MediaType[]>([]);
  const [objective, setObjective] = useState("");
  const [objectiveNotes, setObjectiveNotes] = useState("");
  const [selections, setSelections] = useState<SelectionState>({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationPreset, setDurationPreset] = useState("custom");
  const [audience, setAudience] = useState<any>({
    geography: "",
    ageMin: "",
    ageMax: "",
    gender: "All",
    interests: "",
    lifestyle: "",
    consumerType: "",
    estimatedSize: "",
    description: "",
  });
  const [budget, setBudget] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [creativeMode, setCreativeMode] = useState("");
  const [creativeSetId, setCreativeSetId] = useState<string | null>(null);
  const [creativeReq, setCreativeReq] = useState<any>({
    creativeType: "",
    message: "",
    brand: "",
    cta: "",
    dimensions: "",
    fileFormat: "",
    videoDuration: "",
    resolution: "",
    aspectRatio: "",
    instructions: "",
  });

  // inventory
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [minReach, setMinReach] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [availabilityIssues, setAvailabilityIssues] = useState<{ adSpaceId: string; title: string; reason: string }[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [creativeSets, setCreativeSets] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState<{ ref: string; id: string } | null>(null);

  /* ---------------- draft load ---------------- */
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoadingDraft(false); return; }
      const { data: profile } = await supabase
        .from("brand_advertiser_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!profile) { setLoadingDraft(false); return; }
      setProfileId(profile.id);

      const { data: draft } = await supabase
        .from("brand_campaigns")
        .select("*")
        .eq("brand_advertiser_id", profile.id)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draft) {
        setDraftId(draft.id);
        const s = (draft.draft_state || {}) as any;
        setCampaignName(draft.campaign_name === "Untitled campaign" ? "" : draft.campaign_name || "");
        setCampaignType((draft as any).campaign_type || "");
        setMediaTypes(((draft as any).media_types || []) as MediaType[]);
        setObjective((draft as any).objective || "");
        setObjectiveNotes((draft as any).objective_notes || "");
        setSelections(s.selections || {});
        setStartDate(draft.start_date || "");
        setEndDate(draft.end_date || "");
        setDurationPreset(s.durationPreset || "custom");
        if ((draft as any).audience) setAudience((a: any) => ({ ...a, ...(draft as any).audience }));
        setBudget(draft.budget ? String(draft.budget) : "");
        setMinBudget(s.minBudget || "");
        setMaxBudget(s.maxBudget || "");
        setCreativeMode((draft as any).creative_mode || "");
        setCreativeSetId(draft.creative_set_id || null);
        if ((draft as any).creative_requirements) setCreativeReq((c: any) => ({ ...c, ...(draft as any).creative_requirements }));
        // drafts saved before steps 4+5 were merged store the old numbering — shift steps 5+ down by one
        const savedStep = Math.min(11, Math.max(1, (draft as any).wizard_step || 1));
        setStep(savedStep >= 5 ? savedStep - 1 : savedStep);
        toast.info("We restored your saved campaign draft.");
      }
      setLoadingDraft(false);
    })();
  }, []);

  /* ---------------- inventory load ---------------- */
  const loadInventory = useCallback(async () => {
    setLoadingInv(true);
    const { data, error } = await (supabase as any)
      .from("marketplace_inventory")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Could not load the TrioTag inventory network");
    setRows(((data || []) as InventoryRow[]).filter((r) => (r.availability_status || "available") === "available"));
    setLoadingInv(false);
  }, []);

  useEffect(() => {
    if (step === 4) loadInventory();
  }, [step, loadInventory]);

  useEffect(() => {
    if (step !== 9 || !profileId) return;
    (async () => {
      const { data } = await supabase
        .from("brand_creative_sets")
        .select("id, title, creative_format, creative_count")
        .eq("brand_advertiser_id", profileId)
        .order("created_at", { ascending: false });
      setCreativeSets(data || []);
    })();
  }, [step, profileId]);

  /* ---------------- derived ---------------- */
  const matching = useMemo(
    () => rows.filter((r) => (mediaTypes.length ? rowTypes(r).some((t) => mediaTypes.includes(t as MediaType)) : true)),
    [rows, mediaTypes]
  );

  const cities = useMemo(() => [...new Set(matching.map(cityOf))].sort(), [matching]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const cap = Number(maxPrice) || 0;
    const reachMin = Number(minReach) || 0;
    let list = matching.filter((r) => {
      if (needle) {
        const hay = `${r.title} ${r.location || ""} ${r.description || ""} ${r.media_owner_name || ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (cityFilter !== "all" && cityOf(r) !== cityFilter) return false;
      if (availabilityFilter !== "all" && (r.availability_status || "available") !== availabilityFilter) return false;
      if (cap > 0 && monthlyRate(r) > cap) return false;
      if (reachMin > 0 && reachOf(r) < reachMin) return false;
      return true;
    });
    if (sortBy === "price") list = [...list].sort((a, b) => monthlyRate(a) - monthlyRate(b));
    if (sortBy === "location") list = [...list].sort((a, b) => (a.location || "").localeCompare(b.location || ""));
    if (sortBy === "reach") list = [...list].sort((a, b) => reachOf(b) - reachOf(a));
    if (sortBy === "availability") list = [...list].sort((a, b) => (b.total_ad_units || 0) - (a.total_ad_units || 0));
    return list;
  }, [matching, q, cityFilter, availabilityFilter, maxPrice, minReach, sortBy]);

  const selectedRows = useMemo(
    () => rows.filter((r) => selections[r.id]),
    [rows, selections]
  );
  const selectedIds = Object.keys(selections);
  const totalUnits = Object.values(selections).reduce((s, v) => s + Number(v.quantity || 1), 0);
  const estimatedMediaCost = selectedRows.reduce(
    (s, r) => s + monthlyRate(r) * Number(selections[r.id]?.quantity || 1),
    0
  );

  const toggleSelect = (row: InventoryRow) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (next[row.id]) delete next[row.id];
      else next[row.id] = { quantity: 1, adFormat: null };
      return next;
    });
  };

  const capacityOf = (row: InventoryRow) => (Number(row.total_ad_units || 0) > 0 ? Number(row.total_ad_units) : null);

  /* ---------------- persistence ---------------- */
  const draftPayload = (status: "draft") => ({
    brand_advertiser_id: profileId!,
    campaign_name: campaignName || "Untitled campaign",
    campaign_type: campaignType || null,
    media_types: mediaTypes,
    objective: objective || null,
    objective_notes: objectiveNotes || null,
    start_date: startDate || null,
    end_date: endDate || null,
    budget: Number(budget || 0),
    estimated_cost: estimatedMediaCost,
    audience,
    creative_mode: creativeMode || null,
    creative_requirements: creativeReq,
    creative_set_id: creativeSetId,
    location_count: selectedIds.length,
    status,
    wizard_step: step,
    draft_state: { selections, durationPreset, minBudget, maxBudget },
    updated_at: new Date().toISOString(),
  });

  const saveDraft = async (silent = false) => {
    if (!profileId) return null;
    setSaving(true);
    try {
      if (draftId) {
        const { error } = await supabase.from("brand_campaigns").update(draftPayload("draft") as any).eq("id", draftId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("brand_campaigns")
          .insert(draftPayload("draft") as any)
          .select("id")
          .single();
        if (error) throw error;
        setDraftId(data.id);
      }
      if (!silent) toast.success("Draft saved. You can come back to it any time.");
      return true;
    } catch (e: any) {
      if (!silent) toast.error(e.message || "Could not save the draft");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const cancelWizard = () => navigate("/brand-advertiser/campaigns");

  /* ---------------- availability engine ---------------- */
  const runAvailabilityCheck = async () => {
    if (!selectedIds.length) return true;
    setCheckingAvailability(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-brand-campaign", {
        body: {
          mode: "check",
          campaignId: draftId,
          selections: selectedIds.map((id) => ({
            adSpaceId: id,
            quantity: selections[id].quantity,
            adFormat: selections[id].adFormat,
          })),
          mediaTypes,
          startDate: startDate || null,
          endDate: endDate || null,
        },
      });
      if (error) throw error;
      setAvailabilityIssues(data?.problems || []);
      return (data?.problems || []).length === 0;
    } catch (e: any) {
      toast.error(e.message || "Could not verify inventory availability");
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  /* ---------------- validation ---------------- */
  const canContinue = () => {
    switch (step) {
      case 1: return !!campaignType && !!campaignName.trim();
      case 2: return mediaTypes.length > 0;
      case 3: return !!objective;
      case 4: return selectedIds.length > 0; // at least 1 location required
      case 5: return selectedIds.every((id) => !!selections[id].adFormat);
      case 6: return !!startDate && !!endDate && new Date(endDate) >= new Date(startDate);
      case 7: return true;
      case 8: return Number(budget) > 0;
      case 9: return !!creativeMode;
      case 10: return true;
      default: return true;
    }
  };

  const next = async () => {
    if (!canContinue()) {
      toast.error(step === 4 ? "Please select at least 1 location before continuing." : "Please complete this step before continuing.");
      return;
    }
    if (step === 6) {
      const ok = await runAvailabilityCheck();
      if (!ok) return;
    }
    await saveDraft(true);
    setStep((s) => Math.min(11, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- submit ---------------- */
  const submitCampaign = async () => {
    setSubmitting(true);
    try {
      await saveDraft(true);
      const { data, error } = await supabase.functions.invoke("submit-brand-campaign", {
        body: {
          mode: "submit",
          campaignId: draftId,
          campaignName: campaignName || "Untitled campaign",
          campaignType,
          mediaTypes,
          objective,
          objectiveNotes,
          selections: selectedIds.map((id) => ({
            adSpaceId: id,
            quantity: selections[id].quantity,
            adFormat: selections[id].adFormat,
          })),
          startDate,
          endDate,
          budget: Number(budget || 0),
          audience,
          creativeMode,
          creativeSetId,
          creativeFormat: creativeReq.creativeType || null,
          creativeRequirements: creativeReq,
          notes: objectiveNotes,
          draftState: { selections, durationPreset, minBudget, maxBudget },
        },
      });
      if (error) throw error;
      if (data?.error) {
        setAvailabilityIssues(data.problems || []);
        toast.error(data.error);
        setStep(6);
        return;
      }
      setSubmitted({ ref: data.campaignRef, id: data.campaignId });
      setDraftId(null);
      setStep(11);
      toast.success(`Campaign request ${data.campaignRef} submitted for review.`);
    } catch (e: any) {
      toast.error(e.message || "Could not submit the campaign request");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- UI pieces ---------------- */
  const availableFormats = useMemo(() => {
    const set = new Set<string>();
    (mediaTypes.length ? mediaTypes : (["OOH", "DOOH", "AOOH"] as MediaType[])).forEach((t) =>
      FORMAT_OPTIONS[t].forEach((f) => set.add(f))
    );
    return [...set];
  }, [mediaTypes]);

  const StepHeader = ({ n, title, hint }: { n: number; title: string; hint: string }) => (
    <div className="mb-5">
      <p className="text-xs font-semibold tracking-wide text-blue-600">STEP {n} OF 12</p>
      <h2 className="text-xl font-semibold text-gray-900 mt-1">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{hint}</p>
    </div>
  );

  const SummaryPanel = (
    <div className="space-y-4">
      <Card className="p-4 bg-white border-gray-200">
        <p className="text-sm font-semibold text-gray-900 mb-3">Campaign Summary</p>
        <dl className="space-y-2 text-sm">
          <Row label="Name" value={campaignName || "—"} />
          <Row label="Type" value={campaignType ? campaignType.toUpperCase() : "—"} />
          <Row label="Media" value={mediaTypes.length ? mediaTypes.join(", ") : "—"} />
          <Row label="Objective" value={objective || "—"} />
          <Row label="Locations" value={selectedIds.length ? `${selectedIds.length} selected` : "—"} />
          <Row label="Units" value={totalUnits ? String(totalUnits) : "—"} />
          <Row label="Dates" value={startDate && endDate ? `${startDate} → ${endDate}` : "—"} />
          <Row label="Budget" value={budget ? peso(Number(budget)) : "—"} />
        </dl>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">Estimated Media Cost</p>
          <p className="text-lg font-semibold text-gray-900">{peso(estimatedMediaCost)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Estimate only — final costs are confirmed in your proposal.</p>
        </div>
      </Card>
            {selectedRows.length > 0 && (
              <Card className="p-4 bg-white border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-2">Selected inventory</p>
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {selectedRows.map((r) => (
                    <li key={r.id} className="text-xs text-gray-600 flex items-start justify-between gap-2">
                      <span className="line-clamp-2">{r.location || "Location on request"}</span>
                      <span className="shrink-0 text-gray-900 font-medium">×{selections[r.id].quantity}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
    </div>
  );

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading campaign builder...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Retail Media Campaign Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan your requirements, scan the TrioTag inventory network and request a campaign proposal.
          </p>
        </header>

        {/* progress */}
        <div className="mb-6 overflow-x-auto">
          <ol className="flex items-center gap-2 min-w-max">
            {STEPS.map((s) => {
              const state = s.n === step ? "current" : s.n < step ? "done" : "todo";
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { if (s.n < step && !submitted) setStep(s.n); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      state === "current"
                        ? "bg-blue-600 text-white border-blue-600"
                        : state === "done"
                        ? "bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                        : "bg-white text-gray-400 border-gray-200"
                    }`}
                  >
                    {state === "done" ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                    <span className="font-medium">{s.n}. {s.label}</span>
                  </button>
                  {s.n !== STEPS.length && <span className="text-gray-300">→</span>}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div>
            {/* mobile summary */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setSummaryOpen((v) => !v)}
                className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900"
              >
                <span className="font-medium">Campaign Summary · {peso(estimatedMediaCost)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
              </button>
              {summaryOpen && <div className="mt-3">{SummaryPanel}</div>}
            </div>

            <Card className="p-5 md:p-6 bg-white border-gray-200">
              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <StepHeader n={1} title="What are you advertising?" hint="Pick the primary focus of this campaign." />
                  <div className="grid sm:grid-cols-3 gap-3">
                    {CAMPAIGN_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setCampaignType(t.value)}
                        className={`text-left p-5 rounded-xl border-2 transition-all ${
                          campaignType === t.value ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <p className="text-lg font-semibold text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-500 mt-2">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-5">
                    <Label className="text-gray-900">Campaign name</Label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g. Summer Product Launch"
                      className="mt-1 bg-white text-gray-900"
                    />
                  </div>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <StepHeader n={2} title="Where would you like your campaign to appear?" hint="Select one or more media environments. We use this to scan matching inventory." />
                  <div className="grid sm:grid-cols-3 gap-3">
                    {MEDIA_TYPES.map((m) => {
                      const active = mediaTypes.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          onClick={() =>
                            setMediaTypes((p) => (active ? p.filter((x) => x !== m.key) : [...p, m.key]))
                          }
                          className={`text-left p-5 rounded-xl border-2 transition-all ${
                            active ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <m.icon className={`w-6 h-6 ${m.accent}`} />
                          <p className="text-lg font-semibold text-gray-900 mt-3">{m.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <>
                  <StepHeader n={3} title="What is the main goal of this campaign?" hint="This helps our media planners shape the proposal." />
                  <div className="grid sm:grid-cols-2 gap-2">
                    {OBJECTIVES.map((o) => (
                      <button
                        key={o}
                        onClick={() => setObjective(o)}
                        className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                          objective === o ? "border-blue-600 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  <div className="mt-5">
                    <Label className="text-gray-900">Additional campaign objective (optional)</Label>
                    <Textarea
                      value={objectiveNotes}
                      onChange={(e) => setObjectiveNotes(e.target.value)}
                      placeholder="Anything else we should know about the goal of this campaign?"
                      className="mt-1 bg-white text-gray-900"
                    />
                  </div>
                </>
              )}

              {/* STEP 4 — scan + select inventory (merged) */}
              {step === 4 && (
                <>
                  <StepHeader
                    n={4}
                    title="Choose your inventory"
                    hint="Browse every approved location across the TrioTag network and select at least 1 location for this campaign."
                  />
                  {loadingInv ? (
                    <div className="flex items-center gap-2 text-gray-500 py-10 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" /> Scanning approved inventory...
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat label="Matching locations" value={String(matching.length)} />
                        <Stat label="Cities covered" value={String(cities.length)} />
                        <Stat
                          label="Advertising units"
                          value={String(matching.reduce((s, r) => s + (r.total_ad_units || 1), 0))}
                        />
                        <Stat label="Media types" value={mediaTypes.join(", ") || "All"} />
                      </div>
                      {matching.length === 0 && (
                        <p className="text-sm text-gray-500 mt-5">
                          No approved inventory currently matches those media types. Try adding another media type in step 2.
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-5">
                        Only approved, verified and available inventory is shown. Draft, rejected or suspended listings are never included.
                      </p>

                      {matching.length > 0 && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-900">Available locations</p>
                            <Badge className={selectedIds.length > 0 ? "bg-blue-600" : "bg-gray-400"}>
                              {selectedIds.length} selected{selectedIds.length === 0 ? " — pick at least 1" : ""}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-4 gap-2 mb-4">
                            <div className="relative md:col-span-2">
                              <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search inventory"
                                className="pl-9 bg-white text-gray-900"
                              />
                            </div>
                            <Select value={cityFilter} onValueChange={setCityFilter}>
                              <SelectTrigger className="bg-white text-gray-900"><SelectValue placeholder="City" /></SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="all">All cities</SelectItem>
                                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select value={sortBy} onValueChange={setSortBy}>
                              <SelectTrigger className="bg-white text-gray-900"><SelectValue placeholder="Sort by" /></SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="relevance">Sort: Relevance</SelectItem>
                                <SelectItem value="price">Sort: Price</SelectItem>
                                <SelectItem value="location">Sort: Location</SelectItem>
                                <SelectItem value="reach">Sort: Reach</SelectItem>
                                <SelectItem value="availability">Sort: Availability</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder="Max ₱ / month"
                              className="bg-white text-gray-900"
                            />
                            <Input
                              value={minReach}
                              onChange={(e) => setMinReach(e.target.value.replace(/[^0-9]/g, ""))}
                              placeholder="Min reach"
                              className="bg-white text-gray-900"
                            />
                            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                              <SelectTrigger className="bg-white text-gray-900"><SelectValue placeholder="Availability" /></SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="all">Any availability</SelectItem>
                                <SelectItem value="available">Available now</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {visible.length === 0 ? (
                            <p className="text-sm text-gray-500 py-10 text-center">No inventory matches these filters.</p>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-3">
                              {visible.map((r) => {
                                const selected = !!selections[r.id];
                                const cap = capacityOf(r);
                                return (
                                  <Card
                                    key={r.id}
                                    className={`overflow-hidden border p-4 cursor-pointer transition-all ${
                                      selected ? "border-blue-600 ring-1 ring-blue-200 bg-blue-50/40" : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    onClick={() => toggleSelect(r)}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-sm text-gray-900 flex items-center gap-1 line-clamp-2">
                                        <MapPin className="w-3 h-3 shrink-0 text-gray-400" /> {r.location || "Location on request"}
                                      </p>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {r.contact_verified_at && (
                                          <Badge className="bg-green-600 text-[10px]"><ShieldCheck className="w-3 h-3 mr-1" />Verified</Badge>
                                        )}
                                        {selected && (
                                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                            <Check className="w-3 h-3" />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {venueTypeOf(r) && (
                                        <Badge variant="outline" className="text-[10px]">{venueTypeOf(r)}</Badge>
                                      )}
                                      {rowTypes(r).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                                      {cap && <Badge variant="outline">{cap} unit{cap > 1 ? "s" : ""}</Badge>}
                                      {reachOf(r) > 0 && <Badge variant="outline">{reachOf(r).toLocaleString()} reach</Badge>}
                                    </div>
                                    {r.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.description}</p>}
                                    <div className="mt-3 flex items-center justify-between">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {monthlyRate(r) > 0 ? `${peso(monthlyRate(r))}/mo` : "Rate on request"}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant={selected ? "default" : "outline"}
                                        onClick={(e) => { e.stopPropagation(); toggleSelect(r); }}
                                      >
                                        {selected ? <><Check className="w-3 h-3 mr-1" />Selected</> : "Select"}
                                      </Button>
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-3">
                            Tap a location to add or remove it from your campaign. At least 1 location is required to continue.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* STEP 6 */}
              {step === 6 && (
                <>
                  <StepHeader n={6} title="What advertising material will you run?" hint="Set the ad format and number of units per location." />
                  <div className="space-y-3">
                    {selectedRows.map((r) => {
                      const cap = capacityOf(r);
                      const sel = selections[r.id];
                      const formats = [...new Set(rowTypes(r).flatMap((t) => FORMAT_OPTIONS[(t as MediaType)] || []))];
                      return (
                        <Card key={r.id} className="p-4 border-gray-200">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm text-gray-900 flex items-center gap-1 line-clamp-2">
                                <MapPin className="w-3 h-3 shrink-0 text-gray-400" /> {r.location || "Location on request"}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {venueTypeOf(r) && (
                                  <Badge variant="outline" className="text-[10px]">{venueTypeOf(r)}</Badge>
                                )}
                                {rowTypes(r).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => toggleSelect(r)} aria-label="Remove">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid sm:grid-cols-3 gap-3 mt-3">
                            <div>
                              <Label className="text-xs text-gray-700">Ad format</Label>
                              <Select
                                value={sel.adFormat || ""}
                                onValueChange={(v) => setSelections((p) => ({ ...p, [r.id]: { ...p[r.id], adFormat: v } }))}
                              >
                                <SelectTrigger className="bg-white text-gray-900 mt-1"><SelectValue placeholder="Choose format" /></SelectTrigger>
                                <SelectContent className="bg-white">
                                  {(formats.length ? formats : availableFormats).map((f) => (
                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-700">
                                Quantity {cap ? `(max ${cap})` : ""}
                              </Label>
                              <Input
                                type="number"
                                min={1}
                                max={cap || undefined}
                                value={sel.quantity}
                                onChange={(e) => {
                                  let v = Math.max(1, Number(e.target.value) || 1);
                                  if (cap) v = Math.min(cap, v);
                                  setSelections((p) => ({ ...p, [r.id]: { ...p[r.id], quantity: v } }));
                                }}
                                className="bg-white text-gray-900 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-700">Creative specification</Label>
                              <p className="text-sm text-gray-600 mt-2">
                                {r.specifications?.dimensions || r.specifications?.size || "Provided with your proposal"}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}

              {/* STEP 7 */}
              {step === 7 && (
                <>
                  <StepHeader n={7} title="When should your campaign run?" hint="We check live availability for your selected inventory." />
                  <div className="flex flex-wrap gap-2 mb-4">
                    {DURATION_PRESETS.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => {
                          setDurationPreset(d.key);
                          if (d.days > 0) {
                            const s = startDate || addDays(todayISO(), 1);
                            setStartDate(s);
                            setEndDate(addDays(s, d.days - 1));
                          }
                        }}
                        className={`px-3 py-2 rounded-md text-sm border ${
                          durationPreset === d.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-900">Start date</Label>
                      <Input
                        type="date"
                        min={addDays(todayISO(), 1)}
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setDurationPreset("custom"); }}
                        className="bg-white text-gray-900 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900">End date</Label>
                      <Input
                        type="date"
                        min={startDate || addDays(todayISO(), 1)}
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setDurationPreset("custom"); }}
                        className="bg-white text-gray-900 mt-1"
                      />
                    </div>
                  </div>
                  {checkingAvailability && (
                    <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking availability...
                    </p>
                  )}
                  {availabilityIssues.length > 0 && (
                    <Card className="mt-4 p-4 border-amber-300 bg-amber-50">
                      <p className="text-sm font-medium text-amber-900">Some selected inventory is unavailable for these dates.</p>
                      <ul className="mt-2 space-y-1 text-xs text-amber-800">
                        {availabilityIssues.map((p) => (
                          <li key={p.adSpaceId}>• {p.title} — {p.reason}</li>
                        ))}
                      </ul>
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setStep(5)}>
                        Find Alternative Inventory
                      </Button>
                    </Card>
                  )}
                </>
              )}

              {/* STEP 8 */}
              {step === 8 && (
                <>
                  <StepHeader n={8} title="Who are you trying to reach?" hint="Optional — share what you know about your audience." />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Geographic location" value={audience.geography} onChange={(v) => setAudience({ ...audience, geography: v })} placeholder="e.g. Metro Manila" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Age from" value={audience.ageMin} onChange={(v) => setAudience({ ...audience, ageMin: v })} placeholder="18" />
                      <Field label="Age to" value={audience.ageMax} onChange={(v) => setAudience({ ...audience, ageMax: v })} placeholder="45" />
                    </div>
                    <div>
                      <Label className="text-gray-900">Gender</Label>
                      <Select value={audience.gender} onValueChange={(v) => setAudience({ ...audience, gender: v })}>
                        <SelectTrigger className="bg-white text-gray-900 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white">
                          {["All", "Female", "Male", "Non-binary"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Field label="Interests" value={audience.interests} onChange={(v) => setAudience({ ...audience, interests: v })} placeholder="e.g. fitness, coffee" />
                    <Field label="Lifestyle" value={audience.lifestyle} onChange={(v) => setAudience({ ...audience, lifestyle: v })} placeholder="e.g. urban commuters" />
                    <Field label="Consumer type" value={audience.consumerType} onChange={(v) => setAudience({ ...audience, consumerType: v })} placeholder="e.g. young professionals" />
                    <Field label="Estimated audience size" value={audience.estimatedSize} onChange={(v) => setAudience({ ...audience, estimatedSize: v })} placeholder="e.g. 100,000" />
                  </div>
                  <div className="mt-4">
                    <Label className="text-gray-900">Target audience description</Label>
                    <Textarea
                      value={audience.description}
                      onChange={(e) => setAudience({ ...audience, description: e.target.value })}
                      className="mt-1 bg-white text-gray-900"
                    />
                  </div>
                </>
              )}

              {/* STEP 9 */}
              {step === 9 && (
                <>
                  <StepHeader n={9} title="What is your campaign budget?" hint="All amounts in Philippine Peso (PHP)." />
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Field label="Total budget (₱)" value={budget} onChange={(v) => setBudget(v.replace(/[^0-9]/g, ""))} placeholder="250000" />
                    <Field label="Minimum budget (optional)" value={minBudget} onChange={(v) => setMinBudget(v.replace(/[^0-9]/g, ""))} placeholder="" />
                    <Field label="Maximum budget (optional)" value={maxBudget} onChange={(v) => setMaxBudget(v.replace(/[^0-9]/g, ""))} placeholder="" />
                  </div>
                  <Card className="mt-5 p-4 bg-gray-50 border-gray-200">
                    <div className="flex justify-between text-sm text-gray-700"><span>Selected inventory cost</span><span>{peso(estimatedMediaCost)}</span></div>
                    <div className="flex justify-between text-sm text-gray-700 mt-1"><span>Estimated media cost</span><span>{peso(estimatedMediaCost)}</span></div>
                    <div className="flex justify-between text-base font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                      <span>Estimated campaign cost</span><span>{peso(estimatedMediaCost)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">This is an estimate, not an invoice. Final pricing is confirmed in your proposal.</p>
                  </Card>
                </>
              )}

              {/* STEP 10 */}
              {step === 10 && (
                <>
                  <StepHeader n={10} title="Do you already have your advertising creative?" hint="We can also produce it for you." />
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { v: "have", t: "YES — I have the creative" },
                      { v: "need", t: "NO — I need creative production" },
                      { v: "unsure", t: "NOT SURE" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        onClick={() => setCreativeMode(o.v)}
                        className={`text-left p-4 rounded-xl border-2 text-sm ${
                          creativeMode === o.v ? "border-blue-600 bg-blue-50 text-blue-900" : "border-gray-200 bg-white text-gray-700"
                        }`}
                      >
                        {o.t}
                      </button>
                    ))}
                  </div>

                  {creativeMode === "have" && (
                    <div className="mt-5">
                      <Label className="text-gray-900">Choose a creative set</Label>
                      {creativeSets.length === 0 ? (
                        <Card className="p-4 mt-2 bg-gray-50 border-gray-200">
                          <p className="text-sm text-gray-600">You have no creative folders yet.</p>
                          <Button className="mt-3" variant="outline" onClick={() => navigate("/brand-advertiser/creatives")}>
                            Go to Creatives
                          </Button>
                        </Card>
                      ) : (
                        <Select value={creativeSetId || ""} onValueChange={setCreativeSetId}>
                          <SelectTrigger className="bg-white text-gray-900 mt-1"><SelectValue placeholder="Select creative folder" /></SelectTrigger>
                          <SelectContent className="bg-white">
                            {creativeSets.map((cs) => (
                              <SelectItem key={cs.id} value={cs.id}>
                                {cs.title} · {cs.creative_count} file{cs.creative_count === 1 ? "" : "s"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {(creativeMode === "need" || creativeMode === "unsure") && (
                    <div className="grid sm:grid-cols-2 gap-3 mt-5">
                      <Field label="Creative type" value={creativeReq.creativeType} onChange={(v) => setCreativeReq({ ...creativeReq, creativeType: v })} placeholder="e.g. Video, Poster" />
                      <Field label="Brand" value={creativeReq.brand} onChange={(v) => setCreativeReq({ ...creativeReq, brand: v })} placeholder="Brand name" />
                      <Field label="Key message" value={creativeReq.message} onChange={(v) => setCreativeReq({ ...creativeReq, message: v })} placeholder="Main message" />
                      <Field label="Call to action" value={creativeReq.cta} onChange={(v) => setCreativeReq({ ...creativeReq, cta: v })} placeholder="e.g. Visit our store" />
                      <Field label="Required dimensions" value={creativeReq.dimensions} onChange={(v) => setCreativeReq({ ...creativeReq, dimensions: v })} placeholder="e.g. 1080x1920" />
                      <Field label="File format" value={creativeReq.fileFormat} onChange={(v) => setCreativeReq({ ...creativeReq, fileFormat: v })} placeholder="e.g. MP4, PDF" />
                      {mediaTypes.includes("DOOH") && (
                        <>
                          <Field label="Video duration" value={creativeReq.videoDuration} onChange={(v) => setCreativeReq({ ...creativeReq, videoDuration: v })} placeholder="e.g. 15s" />
                          <Field label="Resolution" value={creativeReq.resolution} onChange={(v) => setCreativeReq({ ...creativeReq, resolution: v })} placeholder="e.g. 1080p" />
                          <Field label="Aspect ratio" value={creativeReq.aspectRatio} onChange={(v) => setCreativeReq({ ...creativeReq, aspectRatio: v })} placeholder="e.g. 9:16" />
                        </>
                      )}
                      <div className="sm:col-span-2">
                        <Label className="text-gray-900">Additional instructions</Label>
                        <Textarea
                          value={creativeReq.instructions}
                          onChange={(e) => setCreativeReq({ ...creativeReq, instructions: e.target.value })}
                          className="mt-1 bg-white text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP 11 */}
              {step === 11 && (
                <>
                  <StepHeader n={11} title="Review your campaign" hint="Check everything before requesting your proposal." />
                  <div className="space-y-3">
                    <ReviewBlock title="Campaign" onEdit={() => setStep(1)}>
                      {campaignName} · {campaignType.toUpperCase() || "—"}
                    </ReviewBlock>
                    <ReviewBlock title="Media" onEdit={() => setStep(2)}>{mediaTypes.join(", ") || "—"}</ReviewBlock>
                    <ReviewBlock title="Objective" onEdit={() => setStep(3)}>
                      {objective}{objectiveNotes ? ` — ${objectiveNotes}` : ""}
                    </ReviewBlock>
                    <ReviewBlock title="Inventory" onEdit={() => setStep(5)}>
                      {selectedIds.length} selected location{selectedIds.length === 1 ? "" : "s"} · {totalUnits} advertising unit{totalUnits === 1 ? "" : "s"}
                    </ReviewBlock>
                    <ReviewBlock title="Format" onEdit={() => setStep(6)}>
                      {[...new Set(Object.values(selections).map((s) => s.adFormat).filter(Boolean))].join(", ") || "—"}
                    </ReviewBlock>
                    <ReviewBlock title="Duration" onEdit={() => setStep(7)}>{startDate} – {endDate}</ReviewBlock>
                    <ReviewBlock title="Target" onEdit={() => setStep(8)}>
                      {audience.geography || "Not specified"}{audience.gender && audience.gender !== "All" ? ` · ${audience.gender}` : ""}
                    </ReviewBlock>
                    <ReviewBlock title="Budget" onEdit={() => setStep(9)}>{peso(Number(budget || 0))}</ReviewBlock>
                    <ReviewBlock title="Creative" onEdit={() => setStep(10)}>
                      {creativeMode === "have" ? "Creative ready" : creativeMode === "need" ? "Creative production needed" : "Not sure yet"}
                    </ReviewBlock>
                  </div>
                  <Card className="mt-5 p-4 bg-gray-50 border-gray-200">
                    <div className="flex justify-between text-sm text-gray-700"><span>Estimated media cost</span><span>{peso(estimatedMediaCost)}</span></div>
                    <div className="flex justify-between text-base font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                      <span>Estimated total campaign cost</span><span>{peso(estimatedMediaCost)}</span>
                    </div>
                  </Card>
                </>
              )}

              {/* STEP 12 */}
              {step === 12 && (
                <div className="text-center py-8">
                  {submitted ? (
                    <>
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <Check className="w-7 h-7 text-green-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900 mt-4">Campaign request submitted</h2>
                      <p className="text-sm text-gray-600 mt-2">
                        Your reference is <span className="font-mono font-semibold">{submitted.ref}</span>. Our media team is reviewing it now.
                      </p>
                      <Button className="mt-6" onClick={() => navigate("/brand-advertiser/campaigns")}>
                        View my campaigns
                      </Button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold text-gray-900">Ready to request your proposal?</h2>
                      <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                        We will confirm inventory availability, prepare pricing and send you a full campaign proposal for approval.
                      </p>
                      <Button className="mt-6" size="lg" disabled={submitting} onClick={submitCampaign}>
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "REQUEST CAMPAIGN PROPOSAL"}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* nav */}
              {!(step === 12 && submitted) && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-5 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={cancelWizard}>Cancel</Button>
                    <Button variant="outline" onClick={() => saveDraft(false)} disabled={saving || !profileId}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Draft
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {step > 1 && (
                      <Button variant="outline" onClick={back}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                    )}
                    {step < 12 && (
                      <Button onClick={next} disabled={!canContinue() || checkingAvailability}>
                        {step === 11 ? "Continue to submit" : "Continue"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <aside className="hidden lg:block">{SummaryPanel}</aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 text-right font-medium">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 bg-gray-50 border-gray-200">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
    </Card>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-gray-900">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 bg-white text-gray-900" />
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-white">
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
        <p className="text-sm text-gray-900 mt-0.5">{children}</p>
      </div>
      <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
    </div>
  );
}
