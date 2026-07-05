import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Globe, Megaphone, BarChart3, MessageSquare, Bell, User, LayoutDashboard, TrendingUp, Package,
  Image as ImageIcon, Users, History, ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND_NAME } from "@/lib/brand";

type Item = { to: string; label: string; icon: any };

const ROLE_SIDEBAR_ITEMS: Record<string, Item[]> = {
  retailer: [
    { to: "/retailer-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/publisher/active", label: "Active Media", icon: BarChart3 },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  agent: [
    { to: "/venue-publishers", label: "Dashboard", icon: LayoutDashboard },
    { to: "/publisher/active", label: "Active Inventory", icon: Package },
    { to: "/venue-inventory", label: "My Ad Spaces", icon: Globe },
    { to: "/advertiser/explore", label: "Advertise Your Brand", icon: Globe },
    { to: "/publisher/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  print_partner: [
    { to: "/print-partner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/print-partner/clients", label: "My Clients", icon: Globe },
    { to: "/print-partner/jobs", label: "Venue Listings", icon: Megaphone },
    { to: "/print-partner/revenue", label: "Earnings", icon: BarChart3 },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  talent: [
    { to: "/talent-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/talent/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/media-plans", label: "Media Plans", icon: ClipboardList },
    { to: "/admin/total-inventory", label: "Total Inventory", icon: Package },
    { to: "/admin/brand-campaigns", label: "Brand Campaigns", icon: Megaphone },
    { to: "/campaigns", label: "All Campaigns", icon: Megaphone },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  brand_advertiser: [
    { to: "/brand-advertiser/creatives", label: "Creative Sets", icon: ImageIcon },
    { to: "/brand-advertiser/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/brand-advertiser/reports", label: "Reports", icon: BarChart3 },
    { to: "/brand-advertiser/audiences", label: "Audiences", icon: Users },
    { to: "/brand-advertiser/changelog", label: "Changelog", icon: History },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
};

const ROLE_SETTINGS_PATH: Record<string, string> = {
  retailer: "/advertiser-settings",
  agent: "/publisher/settings",
  print_partner: "/print-partner/settings",
  talent: "/talent-profile",
  admin: "/admin/dashboard",
  brand_advertiser: "/brand-advertiser/settings",
};

export function AppSidebar({ role }: { role: string }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const items = ROLE_SIDEBAR_ITEMS[role] || [];
  const settingsPath = ROLE_SETTINGS_PATH[role] || "/auth";
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    window.location.replace("/auth");
  };

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`hidden md:flex flex-col ${expanded ? "w-60" : "w-[68px]"} bg-[#0c0c0c] text-white h-screen fixed left-0 top-0 transition-all duration-200 ease-in-out z-40 border-r border-white/5`}
    >
      <div className="flex items-center gap-2 px-4 py-4 border-b border-white/5">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-600 text-white shrink-0">
          <TrendingUp className="w-4 h-4" />
        </span>
        {expanded && <span className="font-bold text-lg tracking-tight truncate">{BRAND_NAME}</span>}
      </div>

      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = isActive(it.to);
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              title={it.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-green-900/40 text-green-400 border-l-2 border-green-500"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {expanded && <span className="truncate">{it.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/5 space-y-1">
        <button
          onClick={() => navigate(settingsPath)}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isActive(settingsPath) ? "bg-green-900/40 text-green-400" : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="w-5 h-5 shrink-0" />
          {expanded && <span className="truncate">Profile & Settings</span>}
        </button>
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <span className="w-5 h-5 shrink-0 inline-flex items-center justify-center text-base">⏻</span>
          {expanded && <span className="truncate">Log Out</span>}
        </button>
      </div>
    </aside>
  );
}

export function AppSidebarShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async (session: any) => {
      const userId = session?.user?.id;
      if (!userId) { setRole(null); setReady(true); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
      const resolved = (data?.role as string) || null;
      setRole(resolved);
      setReady(true);
    };
    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setReady(false);
      load(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!ready) return <>{children}</>;
  return (
    <>
      {role && <AppSidebar role={role} />}
      <div className={role ? "md:pl-[68px]" : ""}>{children}</div>
    </>
  );
}

