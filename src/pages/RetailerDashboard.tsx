import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Store, MapPin, Radio, PlayCircle, Wallet, ShieldCheck } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  business_name: z.string().trim().min(1, "Business name is required").max(100),
  contact_email: z.string().trim().email("Invalid email").max(255),
  contact_phone: z.string().trim().max(30).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

interface Stats {
  totalSpaces: number;
  approved: number;
  pending: number;
  playsToday: number;
  revenueMonth: number;
  creatives: number;
}

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

const StatCard = ({ label, value, sub, icon: Icon }: any) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <div className="text-xs font-semibold text-zinc-500">{label}</div>
      {Icon && <Icon className="w-4 h-4 text-green-600" />}
    </div>
    <div className="text-2xl md:text-3xl font-bold text-zinc-900">{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
  </div>
);

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSpaces: 0, approved: 0, pending: 0, playsToday: 0, revenueMonth: 0, creatives: 0 });
  const [spaceStats, setSpaceStats] = useState<Record<string, { active: number; plays: number; revenue: number }>>({});
  const [revenueNote, setRevenueNote] = useState<string | null>(null);
  const [form, setForm] = useState({ business_name: "", contact_email: "", contact_phone: "", location: "", description: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleActivation = async (space: any) => {
    const next = !(space.agent_disconnected ?? false);
    setTogglingId(space.id);
    const { error } = await supabase
      .from("ad_spaces")
      .update({ agent_disconnected: next })
      .eq("id", space.id);
    setTogglingId(null);
    if (error) { toast.error(error.message); return; }
    setSpaces((prev) => prev.map((s) => (s.id === space.id ? { ...s, agent_disconnected: next } : s)));
    toast.success(next ? "Inventory deactivated" : "Inventory activated");
  };

  const loadAll = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth?redirect=/retailer-dashboard", { replace: true }); return; }

    const { data: pub } = await supabase
      .from("publisher_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!pub) {
      setProfile(null);
      setForm((f) => ({ ...f, contact_email: session.user.email || "" }));
      setLoading(false);
      return;
    }
    setProfile(pub);

    const { data: spaceRows } = await supabase.from("ad_spaces").select("*").eq("publisher_id", pub.id);
    const rows = spaceRows || [];
    setSpaces(rows);

    const ids = rows.map((s: any) => s.id);
    const now = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const [dPlaysRes, aPlaysRes, creativesRes, payoutRes, activationsRes] = await Promise.all([
      ids.length
        ? supabase.from("dooh_play_logs").select("ad_space_id").in("ad_space_id", ids).gte("played_at", today.toISOString())
        : Promise.resolve({ data: [] } as any),
      ids.length
        ? supabase.from("aooh_play_logs").select("ad_space_id").in("ad_space_id", ids).gte("played_at", today.toISOString())
        : Promise.resolve({ data: [] } as any),
      supabase.from("retailer_creatives").select("id", { count: "exact", head: true }).eq("publisher_id", pub.id).eq("status", "active"),
      supabase.from("retailer_payout_details").select("revenue_share_pct").eq("publisher_id", pub.id).maybeSingle(),
      ids.length
        ? supabase.from("activations").select("ad_space_id, total_amount, created_at, start_date, end_date, status").in("ad_space_id", ids).in("status", ["approved", "completed", "printing"] as any)
        : Promise.resolve({ data: [] } as any),
    ]);

    const payout = (payoutRes as any).data;
    const sharePct = payout ? Number(payout.revenue_share_pct || 0) : 0;

    const allActivations = ((activationsRes as any).data || []) as any[];
    const thisMonthActivations = allActivations.filter((b: any) => {
      const d = new Date(b.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const revenueMonth = thisMonthActivations.reduce((s: number, b: any) => s + Number(b.total_amount || 0) * (sharePct / 100), 0);

    // Per-space stats
    const todayStr = today.toISOString().slice(0, 10);
    const perSpace: Record<string, { active: number; plays: number; revenue: number }> = {};
    for (const id of ids) perSpace[id] = { active: 0, plays: 0, revenue: 0 };

    for (const b of allActivations) {
      if (!b.ad_space_id || !perSpace[b.ad_space_id]) continue;
      // active: running today
      const start = b.start_date ? String(b.start_date).slice(0, 10) : null;
      const end = b.end_date ? String(b.end_date).slice(0, 10) : null;
      const isActive = ["approved", "completed"].includes(b.status) &&
        (!start || start <= todayStr) && (!end || end >= todayStr);
      if (isActive) perSpace[b.ad_space_id].active += 1;
    }
    for (const b of thisMonthActivations) {
      if (!b.ad_space_id || !perSpace[b.ad_space_id]) continue;
      perSpace[b.ad_space_id].revenue += Number(b.total_amount || 0) * (sharePct / 100);
    }
    for (const r of ((dPlaysRes as any).data || []) as any[]) {
      if (r.ad_space_id && perSpace[r.ad_space_id]) perSpace[r.ad_space_id].plays += 1;
    }
    for (const r of ((aPlaysRes as any).data || []) as any[]) {
      if (r.ad_space_id && perSpace[r.ad_space_id]) perSpace[r.ad_space_id].plays += 1;
    }
    setSpaceStats(perSpace);

    const totalPlaysToday = ((dPlaysRes as any).data?.length || 0) + ((aPlaysRes as any).data?.length || 0);

    setStats({
      totalSpaces: rows.length,
      approved: rows.filter((s: any) => s.approval_status === "approved").length,
      pending: rows.filter((s: any) => s.approval_status === "pending").length,
      playsToday: totalPlaysToday,
      revenueMonth,
      creatives: (creativesRes as any).count || 0,
    });
    setRevenueNote(payout ? null : "Revenue share not yet configured — contact support");
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  const handleCreateProfile = async () => {
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { fe[e.path[0] as string] = e.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const { error } = await supabase.from("publisher_profiles").insert({
      user_id: session.user.id,
      publisher_type: "venue" as any,
      verification_status: "pending" as any,
      verified: false,
      business_name: form.business_name.trim(),
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone?.trim() || null,
      location: form.location?.trim() || null,
      description: form.description?.trim() || null,
    });

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Business profile created");
    loadAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <PageLoader />
      </div>
    );
  }

  // Onboarding: no profile yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 md:px-6 py-10 max-w-2xl">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-3">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-900 mb-1">Set up your business profile</h1>
            <p className="text-sm text-zinc-600 mb-6">
              Set up your business profile to start registering ad spaces and earning from advertisers.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input id="business_name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
                {errors.business_name && <p className="text-xs text-destructive mt-1">{errors.business_name}</p>}
              </div>
              <div>
                <Label htmlFor="contact_email">Contact Email *</Label>
                <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
                {errors.contact_email && <p className="text-xs text-destructive mt-1">{errors.contact_email}</p>}
              </div>
              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input id="contact_phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <Button onClick={handleCreateProfile} disabled={saving} className="w-full bg-green-600 hover:bg-green-500 text-white">
                {saving ? "Creating…" : "Create Business Profile"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const businessName = profile.business_name || "Retailer";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Retailer Portal</div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-green-600" /> {businessName}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verification: <span className="font-semibold capitalize">{profile.verification_status || "pending"}</span>
            </div>
          </div>
          <Link to="/venue/register">
            <Button className="bg-green-600 hover:bg-green-500 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Register New Ad Space
            </Button>
          </Link>
        </div>

        {/* Section Navigation */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
          {[
            { to: "/retailer-dashboard", label: "Dashboard", end: true },
            { to: "/retailer-dashboard/creatives", label: "Creatives" },
            { to: "/retailer-dashboard/bookings", label: "Bookings" },
            { to: "/retailer-dashboard/house-ads", label: "House Ads" },
            { to: "/retailer-dashboard/screens", label: "Screens" },
            { to: "/retailer-dashboard/settings", label: "Settings" },
          ].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end as any}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <StatCard label="Ad Spaces" value={stats.totalSpaces} icon={MapPin} />
          <StatCard label="Approved" value={stats.approved} icon={ShieldCheck} sub={`${stats.pending} pending`} />
          <StatCard label="Pending Review" value={stats.pending} icon={Radio} />
          <StatCard label="Plays Today" value={stats.playsToday.toLocaleString()} icon={PlayCircle} />
          <StatCard label="Revenue (Month)" value={`₱${stats.revenueMonth.toLocaleString()}`} icon={Wallet} sub={revenueNote} />
          <StatCard label="Active Creatives" value={stats.creatives} icon={PlayCircle} />
        </div>

        {/* Ad Spaces list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-zinc-900">My Ad Spaces</h2>
            {spaces.length > 0 && (
              <Link to="/venue/register" className="text-sm text-green-600 hover:underline">+ Register another</Link>
            )}
          </div>
          {spaces.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">No ad spaces yet</h3>
              <p className="text-sm text-zinc-600 mb-4">Register your commercial space to start earning from brand advertisers.</p>
              <Link to="/venue/register">
                <Button className="bg-green-600 hover:bg-green-500 text-white">
                  <Plus className="w-4 h-4 mr-1.5" /> Register Ad Space
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {spaces.map((s) => (
                <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">{s.media_type || "OOH"}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.approval_status === "approved" ? "bg-green-100 text-green-700" : s.approval_status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                        {s.approval_status}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                  <h3 className="font-bold text-zinc-900 truncate">{s.title}</h3>
                  <p className="text-xs text-zinc-500 truncate mb-3">{s.location}</p>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div><div className="text-xs text-zinc-500">Active</div><div className="font-bold text-green-600">{spaceStats[s.id]?.active || 0}</div></div>
                    <div><div className="text-xs text-zinc-500">Plays</div><div className="font-bold text-green-600">{(spaceStats[s.id]?.plays || 0).toLocaleString()}</div></div>
                    <div><div className="text-xs text-zinc-500">₱ Month</div><div className="font-bold text-green-600">{Math.round(spaceStats[s.id]?.revenue || 0).toLocaleString()}</div></div>
                  </div>
                  <Link to={`/retailer-dashboard/creatives?space=${s.id}`}>
                    <Button variant="outline" size="sm" className="w-full border-green-500 text-green-600 hover:bg-green-50">Manage</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RetailerDashboard;
