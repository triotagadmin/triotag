import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { loadPlatformData, PlatformData } from "./platformData";
import {
  LayoutDashboard, Building2, PlusCircle, ShieldCheck, Users, Store, MapPin, Boxes,
  BadgeCheck, ClipboardCheck, Megaphone, FileText, Receipt, Percent, BarChart3,
  UserCog, KeyRound, ScrollText, Settings, Lock, Activity, FileSearch, LogOut, Menu,
  Target, Radar,
} from "lucide-react";

type Ctx = { data: PlatformData; loading: boolean; reload: () => Promise<void> };
const PlatformCtx = createContext<Ctx | null>(null);
export const usePlatform = () => {
  const ctx = useContext(PlatformCtx);
  if (!ctx) throw new Error("usePlatform must be used inside the Webmaster dashboard");
  return ctx;
};

const NAV: { group: string; items: { to: string; label: string; icon: React.ElementType; end?: boolean }[] }[] = [
  { group: "", items: [{ to: "/webmaster/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true }] },
  {
    group: "Tenant Management",
    items: [
      { to: "/webmaster/tenants", label: "Tenants", icon: Building2, end: true },
      { to: "/webmaster/tenants/new", label: "Create Tenant", icon: PlusCircle },
      { to: "/webmaster/super-admins", label: "Super Admins", icon: ShieldCheck },
      { to: "/webmaster/agents", label: "Agent Accounts", icon: Users },
    ],
  },
  {
    group: "Platform Supply",
    items: [
      { to: "/webmaster/media-owners", label: "All Media Owners", icon: Store },
      { to: "/webmaster/locations", label: "All Locations", icon: MapPin },
      { to: "/webmaster/inventory", label: "All Inventory", icon: Boxes },
      { to: "/webmaster/inventory-verification", label: "Inventory Verification", icon: BadgeCheck },
      { to: "/webmaster/pending-approvals", label: "Pending Approvals", icon: ClipboardCheck },
      { to: "/webmaster/media-partners", label: "Media Partners", icon: Users },
    ],
  },
  {
    group: "Platform Operations",
    items: [
      { to: "/webmaster/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/webmaster/proposals", label: "Proposals", icon: FileText },
      { to: "/webmaster/transactions", label: "Transactions", icon: Receipt },
      { to: "/webmaster/commissions", label: "Commissions", icon: Percent },
      { to: "/webmaster/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    group: "Growth Tools",
    items: [
      { to: "/webmaster/business-prospecting", label: "Business Prospecting", icon: Target },
      { to: "/webmaster/social-scanner", label: "Social Scanner", icon: Radar },
      { to: "/webmaster/local-listings", label: "Local SEO / Maps", icon: MapPin },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/webmaster/users", label: "User Management", icon: UserCog },
      { to: "/webmaster/roles", label: "Roles & Permissions", icon: KeyRound },
      { to: "/webmaster/audit-logs", label: "Audit Logs", icon: ScrollText },
      { to: "/webmaster/settings", label: "Platform Settings", icon: Settings },
    ],
  },
  {
    group: "Security",
    items: [
      { to: "/webmaster/security", label: "Security Overview", icon: Lock },
      { to: "/webmaster/auth-activity", label: "Authentication Activity", icon: Activity },
      { to: "/webmaster/access-logs", label: "Access Logs", icon: FileSearch },
    ],
  },
];

const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav className="space-y-5 pb-10">
    {NAV.map((section, idx) => (
      <div key={idx} className="space-y-1">
        {section.group && (
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-green-400/50">
            {section.group}
          </p>
        )}
        {section.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-green-500/15 text-green-300 border border-green-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    ))}
  </nav>
);

export default function WebmasterLayout() {
  const navigate = useNavigate();
  const [data, setData] = useState<PlatformData>({
    tenants: [], members: [], invitations: [], spaces: [], logs: [], proposals: [], transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setData(await loadPlatformData());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const ctx = useMemo(() => ({ data, loading, reload }), [data, loading, reload]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/webmaster", { replace: true });
  };

  return (
    <PlatformCtx.Provider value={ctx}>
      <div className="min-h-screen bg-[#0c0c0c] text-foreground">
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-green-500/15 bg-black/60 backdrop-blur">
          <div className="px-5 py-5 border-b border-green-500/15">
            <p className="text-lg font-black tracking-tight text-green-400">TRIOTAG</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Webmaster</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4"><SidebarNav /></div>
          <div className="border-t border-green-500/15 p-3">
            <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-green-500/15 bg-black/70 px-4 py-3 backdrop-blur">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto bg-black/95 p-4">
                <p className="mb-4 text-lg font-black text-green-400">TRIOTAG <span className="text-xs font-normal text-muted-foreground">Webmaster</span></p>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-green-400/70">Global Platform Control</p>
              <p className="truncate text-sm font-semibold">Scope: ALL TENANTS</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] text-green-300 sm:inline">
                {loading ? "Syncing…" : `${data.tenants.length} tenants live`}
              </span>
              <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
            </div>
          </header>
          <main className="p-4 sm:p-6"><Outlet /></main>
        </div>
      </div>
    </PlatformCtx.Provider>
  );
}
