import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { MessengerBell } from "@/components/MessengerBell";
import { BRAND_NAME } from "@/lib/brand";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "For Retailers", to: "/list-space" },
  { label: "For Advertisers", to: "/campaign-submit" },
  { label: "Inventory Formats", to: "/explore" },
  { label: "Resources", to: "/insights" },
  { label: "Company", to: "/contact" },
];

export const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
      else setUserRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    setUserRole(data?.role ?? null);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setUserRole(null);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const getDashboardLink = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "advertiser") return "/advertiser-dashboard";
    if (userRole === "print_partner") return "/print-partner/dashboard";
    if (userRole === "publisher") return "/venue-publishers";
    if (userRole === "talent") return "/talent-dashboard";
    return "/dashboard";
  };

  const close = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-white/10">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2 group">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-600 text-white">
            <TrendingUp className="w-4 h-4" />
          </span>
          <span className="font-bold text-lg text-white tracking-tight">{BRAND_NAME}</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="px-3 py-2 text-sm text-zinc-300 hover:text-green-500 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <MessengerBell />
              <NotificationBell />
              <Link to={getDashboardLink()}>
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
              <Button variant="default" size="sm" onClick={handleSignOut}>Log Out</Button>
            </>
          ) : (
            <>
              <Link to="/auth"><Button variant="outline" size="sm">Login</Button></Link>
              <Link to="/auth"><Button variant="default" size="sm">Get Started</Button></Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-black border-b border-white/10 shadow-lg">
          <div className="flex flex-col p-4 gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                onClick={close}
                className="px-3 py-3 text-sm text-zinc-200 hover:text-green-500 hover:bg-white/5 rounded-md"
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to={getDashboardLink()} onClick={close}>
                    <Button variant="outline" size="sm" className="w-full">Dashboard</Button>
                  </Link>
                  <Button variant="default" size="sm" className="w-full" onClick={handleSignOut}>Log Out</Button>
                </>
              ) : (
                <>
                  <Link to="/auth" onClick={close}>
                    <Button variant="outline" size="sm" className="w-full">Login</Button>
                  </Link>
                  <Link to="/auth" onClick={close}>
                    <Button variant="default" size="sm" className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
