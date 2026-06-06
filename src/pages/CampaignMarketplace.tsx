import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calendar, MapPin, DollarSign, Clock, Megaphone, Search, Plus,
} from "lucide-react";

type Campaign = {
  id: string;
  campaign_name: string;
  campaign_type: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | null;
  budget_currency: string | null;
  location: string | null;
  campaign_description: string | null;
  created_at: string;
  status: string;
  advertiser_id: string;
  advertiser_profiles?: { company_name: string | null } | null;
};

const TYPE_BADGE: Record<string, string> = {
  ooh: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  dooh: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  aooh: "bg-green-500/20 text-green-400 border-green-500/30",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
};

const FAUX_CAMPAIGNS: Campaign[] = [
  { id: "faux-1", campaign_name: "SM Mall OOH Rollout", campaign_type: "OOH", status: "inactive", start_date: "2025-08-01", end_date: "2025-08-31", budget_amount: 45000, budget_currency: "PHP", location: "SM Mall of Asia, Pasay City", campaign_description: null, created_at: "2025-07-01T00:00:00Z", advertiser_id: "faux", advertiser_profiles: { company_name: "FreshBev Philippines" } },
  { id: "faux-2", campaign_name: "Gym Network DOOH Campaign", campaign_type: "DOOH", status: "inactive", start_date: "2025-09-01", end_date: "2025-09-30", budget_amount: 80000, budget_currency: "PHP", location: "Makati & BGC Gyms", campaign_description: null, created_at: "2025-07-05T00:00:00Z", advertiser_id: "faux", advertiser_profiles: { company_name: "ActiveLife Supplements" } },
  { id: "faux-3", campaign_name: "In-Store Audio — Back to School", campaign_type: "AOOH", status: "inactive", start_date: "2025-07-15", end_date: "2025-08-15", budget_amount: 25000, budget_currency: "PHP", location: "Quezon City Supermarkets", campaign_description: null, created_at: "2025-07-08T00:00:00Z", advertiser_id: "faux", advertiser_profiles: { company_name: "Schoolhouse PH" } },
  { id: "faux-4", campaign_name: "Salon Network Skincare Launch", campaign_type: "DOOH", status: "inactive", start_date: "2025-10-01", end_date: "2025-10-31", budget_amount: 60000, budget_currency: "PHP", location: "Metro Manila Salons", campaign_description: null, created_at: "2025-07-10T00:00:00Z", advertiser_id: "faux", advertiser_profiles: { company_name: "GlowUp Cosmetics" } },
  { id: "faux-5", campaign_name: "Cebu Retail OOH — New Flavor", campaign_type: "OOH", status: "inactive", start_date: "2025-08-15", end_date: "2025-09-15", budget_amount: 30000, budget_currency: "PHP", location: "Cebu City Retail Stores", campaign_description: null, created_at: "2025-07-12T00:00:00Z", advertiser_id: "faux", advertiser_profiles: { company_name: "TasteWave Snacks" } },
  { id: "faux-6", campaign_name: "AOOH Wellness Campaign", campaign_type: "AOOH", status: "inactive", start_date: "2025-09-15", end_date: "2025-10-15", budget_amount: 20000, budget_currency: "PHP", location: "Taguig & Pasig Pharmacies", campaign_description: null, created_at: "2025-07-14T00:00:00Z", advertiser_id: "faux", advertiser_profiles: { company_name: "VitalCare Health" } },
];


const formatBudget = (amt: number | null, ccy: string | null) => {
  if (!amt) return "Budget: Flexible";
  const symbol = ccy === "USD" ? "$" : "₱";
  return `${symbol}${Number(amt).toLocaleString()}`;
};

const matchBudget = (amt: number | null, bucket: string) => {
  if (bucket === "any") return true;
  const v = Number(amt || 0);
  if (bucket === "lt10") return v > 0 && v < 10000;
  if (bucket === "10to50") return v >= 10000 && v < 50000;
  if (bucket === "50to100") return v >= 50000 && v < 100000;
  if (bucket === "gt100") return v >= 100000;
  return true;
};

const CampaignMarketplace = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [budgetFilter, setBudgetFilter] = useState<string>("any");
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Proposal dialog
  const [proposalFor, setProposalFor] = useState<Campaign | null>(null);
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pVenue, setPVenue] = useState("");
  const [pMessage, setPMessage] = useState("");
  const [sendingProposal, setSendingProposal] = useState(false);

  // wizard
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [guestEmail, setGuestEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [serverCode, setServerCode] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState(0);

  // request form
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("ooh");
  const [fLocation, setFLocation] = useState("");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fBudget, setFBudget] = useState("");
  const [fNotes, setFNotes] = useState("");

  const fetchCampaigns = async () => {
    setLoading(true);
    const [{ data: realData }, { data: guestData }] = await Promise.all([
      supabase
        .from("campaigns")
        .select(
          "id, campaign_name, campaign_type, start_date, end_date, budget_amount, budget_currency, location, campaign_description, created_at, status, advertiser_id, advertiser_profiles(company_name)"
        )
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false }),
      supabase
        .from("guest_campaigns")
        .select(
          "id, email, campaign_name, campaign_type, start_date, end_date, budget_amount, budget_currency, location, campaign_description, created_at, status"
        )
        .eq("email_verified", true)
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false }),
    ]);

    const mapped = ((guestData || []) as any[]).map((g) => ({
      ...g,
      advertiser_id: "guest",
      advertiser_profiles: { company_name: null },
    }));

    setCampaigns([...(((realData as any[]) || [])), ...mapped]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (!requestOpen) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setEmailVerified(true);
        setGuestEmail(session.user.email || "");
        setStep(3);
      } else {
        setIsLoggedIn(false);
        setEmailVerified(false);
        setStep(1);
      }
    });
  }, [requestOpen]);

  const displayCampaigns = useMemo(
    () => (campaigns.length > 0 ? [...campaigns, ...FAUX_CAMPAIGNS] : FAUX_CAMPAIGNS),
    [campaigns]
  );

  const counts = useMemo(() => {
    const t = (k: string) =>
      displayCampaigns.filter((c) => (c.campaign_type || "").toLowerCase() === k).length;
    return { total: displayCampaigns.length, ooh: t("ooh"), dooh: t("dooh"), aooh: t("aooh") };
  }, [displayCampaigns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return displayCampaigns.filter((c) => {
      if (typeFilter !== "all" && (c.campaign_type || "").toLowerCase() !== typeFilter) return false;
      if (!matchBudget(c.budget_amount, budgetFilter)) return false;
      if (q) {
        const hay = `${c.campaign_name || ""} ${c.location || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [displayCampaigns, search, typeFilter, budgetFilter]);


  const openRequest = () => {
    setRequestOpen(true);
  };

  const handleSendOtp = async () => {
    if (!guestEmail || !/^\S+@\S+\.\S+$/.test(guestEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email: guestEmail },
      });
      if (error || !data?.ok) {
        toast.error(`Failed to send code: ${error?.message || data?.error || "Unknown error"}`);
        return;
      }
      setServerCode(data.code);
      setCodeExpiresAt(data.expiresAt);
      setStep(2);
      toast.success("Verification code sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send verification code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    if (Date.now() > codeExpiresAt) {
      toast.error("Code has expired. Please request a new one.");
      return;
    }
    if (otpValue.trim() !== serverCode) {
      toast.error("Incorrect code. Please try again.");
      return;
    }
    setEmailVerified(true);
    setStep(3);
    toast.success("Email verified! Fill in your campaign details.");
  };


  const resetWizard = () => {
    setRequestOpen(false);
    setStep(1);
    setGuestEmail("");
    setOtpValue("");
    setEmailVerified(false);
    setFName(""); setFType("ooh"); setFLocation("");
    setFStart(""); setFEnd(""); setFBudget(""); setFNotes("");
  };

  const resetProposal = () => {
    setProposalFor(null);
    setPName(""); setPEmail(""); setPVenue(""); setPMessage("");
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalFor) return;
    if (!pName || !pEmail || !pMessage) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(pEmail)) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSendingProposal(true);
    try {
      const { data, error } = await supabase.functions.invoke("notify-proposal-submitted", {
        body: {
          campaignId: proposalFor.id,
          campaignName: proposalFor.campaign_name,
          proposerName: pName,
          proposerEmail: pEmail,
          proposerVenue: pVenue,
          proposerMessage: pMessage,
        },
      });
      if (error || (data && (data as any).error)) {
        throw new Error(error?.message || (data as any)?.error || "Failed to send");
      }
      toast.success("Proposal sent! The campaign owner will be notified.");
      resetProposal();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to send proposal.");
    } finally {
      setSendingProposal(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fType || !fLocation || !fStart || !fEnd) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isGuest = !session || !isLoggedIn;

      let campaignId: string | null = null;

      if (session && isLoggedIn) {
        const { data: profile } = await supabase
          .from("advertiser_profiles")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile?.id) {
          const { data: inserted, error } = await supabase.from("campaigns").insert({
            advertiser_id: profile.id,
            campaign_name: fName,
            campaign_type: fType,
            location: fLocation,
            start_date: fStart,
            end_date: fEnd,
            budget_amount: fBudget ? Number(fBudget) : null,
            budget_currency: "PHP",
            campaign_description: fNotes || null,
            status: "pending",
          }).select("id").single();
          if (error) throw error;
          campaignId = inserted?.id ?? null;
        } else {
          const { data: inserted, error } = await supabase.from("guest_campaigns").insert({
            email: session.user.email,
            email_verified: true,
            campaign_name: fName,
            campaign_type: fType,
            location: fLocation,
            start_date: fStart,
            end_date: fEnd,
            budget_amount: fBudget ? Number(fBudget) : null,
            campaign_description: fNotes || null,
            status: "pending",
          }).select("id").single();
          if (error) throw error;
          campaignId = inserted?.id ?? null;
        }
      } else {
        const { data: inserted, error } = await supabase.from("guest_campaigns").insert({
          email: guestEmail,
          email_verified: true,
          campaign_name: fName,
          campaign_type: fType,
          location: fLocation,
          start_date: fStart,
          end_date: fEnd,
          budget_amount: fBudget ? Number(fBudget) : null,
          campaign_description: fNotes || null,
          status: "pending",
        }).select("id").single();
        if (error) throw error;
        campaignId = inserted?.id ?? null;
      }

      await supabase.functions.invoke("notify-campaign-submission", {
        body: {
          toEmail: session?.user?.email || guestEmail,
          campaignName: fName,
          campaignType: fType.toUpperCase(),
          location: fLocation,
          startDate: fStart,
          endDate: fEnd,
          budget: fBudget || "Flexible",
          isGuest,
          campaignId,
        },
      });

      toast.success("Campaign request submitted!", {
        description: "Check your email for confirmation. Your listing will appear on the marketplace shortly.",
      });

      resetWizard();
      fetchCampaigns();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit campaign request.");
    } finally {
      setSubmitting(false);
    }
  };

  const TypeBadge = ({ t }: { t: string | null }) => {
    const key = (t || "").toLowerCase();
    const cls = TYPE_BADGE[key] || "bg-white/10 text-white/70 border-white/20";
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${cls}`}>
        {key || "other"}
      </span>
    );
  };

  const StatusBadge = ({ s }: { s: string }) => {
    const cls = STATUS_BADGE[s] || "bg-white/10 text-white/70 border-white/20";
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${cls}`}>
        {s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero */}
      <section className="py-16 bg-black border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6">
          <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-semibold mb-5">
            Campaign Marketplace
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl">
            Open Campaigns Looking for Ad Spaces
          </h1>
          <p className="text-white/70 max-w-2xl mb-8">
            Browse active campaign requests from brands and retailers. If you have the right ad space, submit a proposal directly.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-3xl">
            {[
              ["Total", counts.total],
              ["OOH", counts.ooh],
              ["DOOH", counts.dooh],
              ["AOOH", counts.aooh],
            ].map(([l, n]) => (
              <div key={l as string} className="bg-[#0c0c0c] border border-white/10 rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold text-green-500">{n as number}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>

          <Button onClick={openRequest} className="bg-green-600 hover:bg-green-500 text-white">
            <Plus className="w-4 h-4 mr-2" /> Submit a Campaign Request
          </Button>
        </div>
      </section>

      {/* Filter bar */}
      <div className="bg-[#0c0c0c] sticky top-16 z-10 py-3 border-b border-white/10">
        <div className="container mx-auto px-4 md:px-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaign or location"
              className="pl-9 bg-black border-white/10 text-white"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {["all", "ooh", "dooh", "aooh"].map((t) => (
              <Button
                key={t}
                size="sm"
                variant="outline"
                onClick={() => setTypeFilter(t)}
                className={`uppercase ${
                  typeFilter === t
                    ? "bg-green-600 border-green-500 text-white hover:bg-green-500"
                    : "bg-transparent border-white/15 text-white/70 hover:text-white"
                }`}
              >
                {t}
              </Button>
            ))}
          </div>
          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
            <SelectTrigger className="w-[180px] bg-black border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Budget</SelectItem>
              <SelectItem value="lt10">Under ₱10K</SelectItem>
              <SelectItem value="10to50">₱10K – ₱50K</SelectItem>
              <SelectItem value="50to100">₱50K – ₱100K</SelectItem>
              <SelectItem value="gt100">₱100K+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <section className="py-10">
        <div className="container mx-auto px-4 md:px-6">
          {loading ? (
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-56 bg-white/5 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Megaphone className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <h3 className="text-xl font-semibold mb-2">No campaigns found</h3>
              <p className="text-white/60 mb-6">Be the first to submit a campaign request.</p>
              <Button onClick={openRequest} className="bg-green-600 hover:bg-green-500 text-white">
                Submit a Campaign Request
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-5 hover:border-green-500/40 transition-all flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <TypeBadge t={c.campaign_type} />
                    <StatusBadge s={c.status} />
                  </div>
                  <h3 className="font-bold text-white truncate mb-1">{c.campaign_name}</h3>
                  <div className="text-xs text-white/50 mb-4 truncate">
                    {c.advertiser_profiles?.company_name || "Anonymous Brand"}
                  </div>
                  <div className="space-y-1.5 text-sm text-white/70 flex-1">
                    {(c.start_date || c.end_date) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-green-500" />
                        <span className="truncate">
                          {c.start_date || "?"} → {c.end_date || "?"}
                        </span>
                      </div>
                    )}
                    {c.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-green-500" />
                        <span className="truncate">{c.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-green-500" />
                      <span>{formatBudget(c.budget_amount, c.budget_currency)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-green-500" />
                      <span>Posted {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-white/15 text-white hover:bg-white/5"
                      onClick={() => setDetail(c)}
                    >
                      View Details
                    </Button>
                    {c.status === "inactive" ? (
                      <Button
                        size="sm"
                        disabled
                        className="flex-1 bg-zinc-500/20 text-zinc-400 border border-zinc-500/40 cursor-not-allowed hover:bg-zinc-500/20"
                      >
                        Inactive
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                        onClick={() => setProposalFor(c)}
                      >
                        Submit Proposal
                      </Button>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      {/* Detail Modal */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="bg-[#0c0c0c] border-white/10 text-white max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{detail.campaign_name}</DialogTitle>
                <div className="flex gap-2 pt-2">
                  <TypeBadge t={detail.campaign_type} />
                  <StatusBadge s={detail.status} />
                </div>
              </DialogHeader>
              <div className="space-y-3 text-sm py-2">
                <div className="text-white/60">
                  By <span className="text-white">{detail.advertiser_profiles?.company_name || "Anonymous Brand"}</span>
                </div>
                {(detail.start_date || detail.end_date) && (
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-green-500" /> {detail.start_date} → {detail.end_date}</div>
                )}
                {detail.location && (
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-green-500" /> {detail.location}</div>
                )}
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> {formatBudget(detail.budget_amount, detail.budget_currency)}</div>
                {detail.campaign_description && (
                  <div className="pt-2 border-t border-white/10 text-white/80 whitespace-pre-wrap">
                    {detail.campaign_description}
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetail(null)} className="border-white/15">Close</Button>
                <Button
                  className="bg-green-600 hover:bg-green-500 text-white"
                  onClick={() => { setProposalFor(detail); setDetail(null); }}
                >
                  Submit a Proposal
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Modal — 3-step wizard */}
      <Dialog open={requestOpen} onOpenChange={(o) => (o ? setRequestOpen(true) : resetWizard())}>
        <DialogContent className="bg-[#0c0c0c] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <div className="text-xs text-green-400 font-semibold mb-1">Step {step} of 3</div>
            <DialogTitle>
              {step === 1 && "Submit a Campaign Request"}
              {step === 2 && "Check your email"}
              {step === 3 && "Campaign Details"}
            </DialogTitle>
            <DialogDescription className="text-white/60" asChild>
              <div>
                {step === 1 && "Enter your email to get started. We'll send you a verification code."}
                {step === 2 && (
                  <p className="text-zinc-400 text-sm">
                    We sent a 6-digit verification code to <span className="text-white font-medium">{guestEmail}</span>.
                    Enter it below to verify your email. <strong>Do not click the Log In button</strong> — just copy the 6-digit code from the email.
                  </p>
                )}
                {step === 3 && "Post your campaign so retailers and ad space owners can respond."}
              </div>
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email *</label>
                <Input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="bg-black border-white/10"
                />
              </div>
              <p className="text-xs text-zinc-500 text-center mt-2">
                Check your inbox for a 6-digit number code from Triotag
              </p>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={resetWizard} className="border-white/15">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  {sendingOtp ? "Sending..." : "Send Verification Code"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Input
                  type="text"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="bg-black border-white/10 text-center text-2xl tracking-widest font-mono max-w-[200px]"
                />
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="text-xs text-green-400 hover:text-green-300 underline"
                >
                  {sendingOtp ? "Resending..." : "Resend code"}
                </button>
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-white/15">
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  {verifyingOtp ? "Verifying..." : "Verify Code"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Campaign Name *</label>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} required className="bg-black border-white/10" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Campaign Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["ooh", "dooh", "aooh"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFType(t)}
                      className={`px-3 py-2 rounded-lg border text-sm uppercase font-semibold ${
                        fType === t
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-white/15 text-white/70 hover:border-white/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Target Location *</label>
                <Input
                  value={fLocation}
                  onChange={(e) => setFLocation(e.target.value)}
                  placeholder="e.g. Makati, BGC, Cebu City"
                  required
                  className="bg-black border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date *</label>
                  <Input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)} required className="bg-black border-white/10" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date *</label>
                  <Input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)} required className="bg-black border-white/10" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Budget (₱)</label>
                <Input
                  type="number"
                  value={fBudget}
                  onChange={(e) => setFBudget(e.target.value)}
                  placeholder="e.g. 15000"
                  className="bg-black border-white/10"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Additional Notes</label>
                <Textarea
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  rows={3}
                  className="bg-black border-white/10"
                />
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                {!isLoggedIn ? (
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="border-white/15">
                    Back
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={resetWizard} className="border-white/15">
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white">
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Proposal Dialog */}
      <Dialog open={!!proposalFor} onOpenChange={(o) => !o && resetProposal()}>
        <DialogContent className="bg-[#0c0c0c] border-white/10 text-white max-w-lg">
          {proposalFor && (
            <form onSubmit={handleSubmitProposal}>
              <DialogHeader>
                <DialogTitle>Submit a Proposal</DialogTitle>
                <DialogDescription className="text-white/60">
                  Send your proposal to the owner of <span className="text-white font-medium">{proposalFor.campaign_name}</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Name *</label>
                  <Input value={pName} onChange={(e) => setPName(e.target.value)} required className="bg-black border-white/10" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Email *</label>
                  <Input type="email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} required className="bg-black border-white/10" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Venue / Ad Space</label>
                  <Input
                    value={pVenue}
                    onChange={(e) => setPVenue(e.target.value)}
                    placeholder="e.g. Gym in Makati, Cafe in BGC"
                    className="bg-black border-white/10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Message *</label>
                  <Textarea
                    value={pMessage}
                    onChange={(e) => setPMessage(e.target.value)}
                    rows={4}
                    placeholder="Describe your space and why it's a good fit..."
                    required
                    className="bg-black border-white/10"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={resetProposal} className="border-white/15">
                  Cancel
                </Button>
                <Button type="submit" disabled={sendingProposal} className="bg-green-600 hover:bg-green-500 text-white">
                  {sendingProposal ? "Sending..." : "Send Proposal"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignMarketplace;
