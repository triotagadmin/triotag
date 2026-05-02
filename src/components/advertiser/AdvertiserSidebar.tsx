import { NavLink, useLocation } from "react-router-dom";
import { Globe, Megaphone, Calendar, BarChart3, Wallet, Palette, Headphones, ChevronRight } from "lucide-react";

const items = [
  { to: "/advertiser/explore", label: "Explore Inventory", icon: Globe },
  { to: "/advertiser/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/advertiser/bookings", label: "Bookings", icon: Calendar },
  { to: "/advertiser/reports", label: "Reports", icon: BarChart3 },
  { to: "/advertiser/wallet", label: "Wallet", icon: Wallet },
  { to: "/advertiser/creative", label: "Creative Hub", icon: Palette },
];

export function AdvertiserSidebar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0c0c0c] text-white min-h-screen sticky top-0">
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">Triotag</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {items.map((it) => {
          const active = isActive(it.to);
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={
                active
                  ? "flex items-center gap-3 px-4 py-2.5 rounded-md bg-green-900/40 text-green-400 border-l-2 border-green-500 text-sm font-medium"
                  : "flex items-center gap-3 px-4 py-2.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium border-l-2 border-transparent"
              }
            >
              <Icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 text-xs text-gray-400">
        <div className="flex items-start gap-2 mb-3">
          <Headphones className="w-4 h-4 mt-0.5 text-green-500" />
          <div>
            <div className="text-white font-medium text-xs">Need Help?</div>
            <div>Chat with our team</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">
          A
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">Brand Advertiser</div>
          <div className="text-gray-400 text-xs">Advertiser</div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </aside>
  );
}
