import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Globe, Megaphone, Calendar, BarChart3, Wallet, Palette, Headphones, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Item = { to: string; label: string; icon: any; protected?: boolean };

const items: Item[] = [
  { to: "/advertiser/explore", label: "Explore Inventory", icon: Globe },
  { to: "/advertiser/campaigns", label: "Campaigns", icon: Megaphone, protected: true },
  { to: "/advertiser/bookings", label: "Bookings", icon: Calendar, protected: true },
  { to: "/advertiser/reports", label: "Reports", icon: BarChart3, protected: true },
  { to: "/advertiser/wallet", label: "Wallet", icon: Wallet, protected: true },
  { to: "/advertiser/creative", label: "Creative Hub", icon: Palette, protected: true },
];

export function AdvertiserSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [promptTarget, setPromptTarget] = useState<string | null>(null);
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const handleClick = (it: Item, e: React.MouseEvent) => {
    if (it.protected && loggedIn === false) {
      e.preventDefault();
      setPromptTarget(it.to);
    }
  };

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 bg-[#0c0c0c] text-white min-h-screen sticky top-0">

        <nav className="flex-1 py-4 px-3 space-y-1">
          {items.map((it) => {
            const active = isActive(it.to);
            const Icon = it.icon;
            return (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={(e) => handleClick(it, e)}
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

        {loggedIn && (
          <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">A</div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">Retailer</div>
              <div className="text-gray-400 text-xs">Advertiser</div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </aside>

      <Dialog open={!!promptTarget} onOpenChange={(o) => !o && setPromptTarget(null)}>
        <DialogContent className="bg-[#0c0c0c] border border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Sign in to access your campaigns</DialogTitle>
            <DialogDescription className="text-zinc-400">
              You need an account to view this section. Log in or create one to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full bg-green-600 hover:bg-green-500 text-white"
              onClick={() => navigate(`/auth?redirect=${encodeURIComponent(promptTarget || "/advertiser/explore")}`)}
            >
              Log In
            </Button>
            <Button
              variant="outline"
              className="w-full border-green-500 text-green-500 hover:bg-green-500/10"
              onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent(promptTarget || "/advertiser/explore")}`)}
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
