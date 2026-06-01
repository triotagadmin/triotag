import { useEffect, useState, ReactNode } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Home, PlayCircle, Megaphone, Calendar, Grid3x3, Inbox,
  Users, Banknote, Monitor, Settings as SettingsIcon, Headset, ChevronRight,
  Bell, Plus,
} from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c]">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

interface Counts {
  creatives: number;
  houseAds: number;
  pendingBookings: number;
  anyOnline: boolean;
}

export const RetailerLayout = ({ children, title }: { children: ReactNode; title?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [businessName, setBusinessName] = useState("Retailer");
  const [publisherId, setPublisherId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts>({ creatives: 0, houseAds: 0, pendingBookings: 0, anyOnline: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const r = encodeURIComponent(location.pathname + location.search);
        navigate(`/auth?redirect=${r}`, { replace: true });
        return;
      }
      const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
      const role = roleRow?.role;
      if (role !== "publisher") {
        const map: Record<string, string> = {
          admin: "/admin/dashboard",
          advertiser: "/advertiser-dashboard",
          print_partner: "/print-partner/dashboard",
          talent: "/talent-dashboard",
        };
        navigate(map[role as string] || "/", { replace: true });
        return;
      }
      const { data: pub } = await supabase
        .from("publisher_profiles")
        .select("id, business_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setPublisherId(pub?.id || null);
      setBusinessName(pub?.business_name || "Retailer");
      setAuthorized(true);
      setLoading(false);

      if (pub?.id) {
        const [{ count: cCount }, { count: hCount }, { data: spaces }] = await Promise.all([
          supabase.from("retailer_creatives").select("id", { count: "exact", head: true }).eq("publisher_id", pub.id).eq("status", "active"),
          supabase.from("house_ad_schedules").select("id", { count: "exact", head: true }).eq("publisher_id", pub.id).eq("status", "active"),
          supabase.from("ad_spaces").select("id").eq("publisher_id", pub.id),
        ]);
        const spaceIds = (spaces || []).map((s: any) => s.id);
        let pendingCount = 0;
        let anyOnline = false;
        if (spaceIds.length > 0) {
          const { count: pc } = await supabase
            .from("activations")
            .select("id", { count: "exact", head: true })
            .in("ad_space_id", spaceIds)
            .eq("status", "pending_publisher_approval" as any);
          pendingCount = pc || 0;
          const [{ data: dOn }, { data: aOn }] = await Promise.all([
            supabase.from("dooh_player_sessions").select("id").in("ad_space_id", spaceIds).eq("is_online", true).limit(1),
            supabase.from("aooh_player_sessions").select("id").in("ad_space_id", spaceIds).eq("is_online", true).limit(1),
          ]);
          anyOnline = (dOn?.length || 0) + (aOn?.length || 0) > 0;
        }
        if (!cancelled) setCounts({ creatives: cCount || 0, houseAds: hCount || 0, pendingBookings: pendingCount, anyOnline });
      }
    })();
    return () => { cancelled = true; };
  }, [location.pathname, navigate]);

  if (loading || !authorized) return <PageLoader />;

  const navItems: Array<{ label: string; to: string; icon: any; badge?: number; pulse?: boolean; badgeColor?: string }> = [
    { label: "Overview", to: "/retailer/dashboard", icon: Home },
    { label: "Creative Library", to: "/retailer/creative-library", icon: PlayCircle, badge: counts.creatives },
    { label: "House Ads", to: "/retailer/house-ads", icon: Megaphone, badge: counts.houseAds },
    { label: "Campaigns", to: "/retailer/campaigns", icon: Megaphone },
    { label: "Campaign Calendar", to: "/retailer/campaign-calendar", icon: Calendar },
    { label: "My Inventory", to: "/retailer/inventory", icon: Grid3x3 },
    { label: "Booking Requests", to: "/retailer/booking-requests", icon: Inbox, badge: counts.pendingBookings, badgeColor: "bg-orange-500" },
    { label: "Audience Insights", to: "/retailer/audience-insights", icon: Users },
    { label: "Revenue", to: "/retailer/revenue", icon: Banknote },
    { label: "Screen Monitor", to: "/retailer/screen-monitor", icon: Monitor, pulse: counts.anyOnline },
    { label: "Settings", to: "/retailer/settings", icon: SettingsIcon },
  ];

  const isActive = (to: string) => location.pathname === to;
  const initial = (businessName[0] || "R").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0c0c0c] text-white flex-col fixed inset-y-0 left-0 z-30">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-600">
            <ChevronRight className="w-4 h-4" />
          </span>
          <span className="font-bold text-lg tracking-tight">{BRAND_NAME}</span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-green-600/20 text-green-400 border border-green-500/30" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.pulse && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
                {item.badge != null && item.badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${item.badgeColor || "bg-green-600"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-white/10 space-y-2">
          <Link to="/contact" className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-green-400">
            <Headset className="w-4 h-4" /> Need Help? Chat with our team
          </Link>
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">{initial}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{businessName}</div>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "rgba(34,197,94,0.18)", color: "#22C55E" }}>Retailer</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-green-600 font-bold">Retailer Portal</div>
            <h1 className="text-base md:text-lg font-bold text-zinc-900 truncate">{title || businessName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-zinc-600 hover:text-green-600"><Bell className="w-5 h-5" /></button>
            <Link to="/retailer/creative-library?upload=1">
              <button className="hidden sm:flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                <Plus className="w-4 h-4" /> Upload Creative
              </button>
            </Link>
          </div>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export const useRetailerPublisher = () => {
  const [pubId, setPubId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      setPubId(data?.id || null);
    });
  }, []);
  return pubId;
};

export default RetailerLayout;
