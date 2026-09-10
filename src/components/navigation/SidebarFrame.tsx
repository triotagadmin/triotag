import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronDown, TrendingUp, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Presentational sidebar frame ONLY.
 *
 * This component knows nothing about roles, accounts or routes. Every account
 * type owns its own sidebar component that supplies its own `items` and
 * `settingsPath`. Changing one account's navigation therefore cannot affect
 * another account's navigation.
 */
export type SidebarItem = {
  to: string;
  label: string;
  icon: any;
  badgeCount?: number;
  children?: { to: string; label: string; icon: any }[];
};

export function SidebarFrame({
  items,
  settingsPath,
  title = BRAND_NAME,
  logoutTo = "/auth",
}: {
  items: SidebarItem[];
  settingsPath: string;
  title?: string;
  logoutTo?: string;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    items.forEach((it) => {
      if (it.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + "/"))) init[it.to] = true;
    });
    return init;
  });

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
    window.location.replace(logoutTo);
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
        {expanded && <span className="font-bold text-lg tracking-tight truncate">{title}</span>}
      </div>

      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = isActive(it.to);
          const Icon = it.icon;
          const badge = it.badgeCount && it.badgeCount > 0 ? it.badgeCount : 0;
          const hasChildren = !!it.children?.length;
          const groupOpen = !!openGroups[it.to];
          return (
            <div key={it.to}>
              <div className="relative flex items-center">
                <NavLink
                  to={it.to}
                  title={it.label}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex-1 min-w-0 ${
                    active
                      ? "bg-green-900/40 text-green-400 border-l-2 border-green-500"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                  }`}
                >
                  <div className="relative shrink-0">
                    <Icon className="w-5 h-5" />
                    {!!badge && !expanded && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  {expanded && (
                    <>
                      <span className="truncate flex-1">{it.label}</span>
                      {!!badge && (
                        <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
                {expanded && hasChildren && (
                  <button
                    type="button"
                    aria-label={groupOpen ? `Collapse ${it.label}` : `Expand ${it.label}`}
                    onClick={() => setOpenGroups((p) => ({ ...p, [it.to]: !p[it.to] }))}
                    className="p-1.5 mr-1 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${groupOpen ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
              {expanded && hasChildren && groupOpen && (
                <div className="mt-1 space-y-1">
                  {it.children!.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = isActive(child.to);
                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        title={child.label}
                        className={`flex items-center gap-2.5 pl-8 pr-3 py-2 rounded-md text-xs font-medium transition-colors ${
                          childActive
                            ? "bg-green-900/40 text-green-400 border-l-2 border-green-500"
                            : "text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                        }`}
                      >
                        <ChildIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
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
