import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu, X, TrendingUp, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { MessengerBell } from "@/components/MessengerBell";
import { BRAND_NAME } from "@/lib/brand";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type Role = "retailer" | "agent" | "print_partner" | "talent" | "admin" | null;

interface NavLinkDef { label: string; to: string; gated?: boolean; }
interface NavItemDef { label: string; to?: string; children?: { label: string; to: string }[]; }

const INVENTORY_LINK: NavLinkDef = { label: "Advertise Your Brand", to: "/advertiser/explore" };
const CAMPAIGNS_LINK: NavLinkDef = { label: "Campaigns", to: "/campaigns" };

const NAV_ITEMS_PUBLIC: NavItemDef[] = [
  {
    label: "Industries",
    children: [
      { label: "Outsource AdOps", to: "/industries/sspsource" },
      { label: "Retail Media DSP", to: "/industries/retaildsp" },
      { label: "eCommerce SEO Microsites", to: "/services/ecommerce-seo" },
    ],
  },
  {
    label: "Solutions",
    children: [
      { label: "OOH", to: "/solutions/ooh" },
      { label: "DOOH", to: "/solutions/dooh" },
      { label: "AOOH", to: "/solutions/aooh" },
      { label: "Media Truck", to: "/solutions/media-truck" },
    ],
  },
  { label: "Advertise Your Brand", to: "/advertiser/explore" },
];

const NAV_ITEMS_ADMIN: NavItemDef[] = [
  ...NAV_ITEMS_PUBLIC,
  { label: "Campaigns", to: "/campaigns" },
];

const PUBLIC_LINKS: NavLinkDef[] = [
  INVENTORY_LINK,
];

const linksForRole = (role: Role, loggedIn: boolean): NavLinkDef[] => {
  if (!loggedIn) return PUBLIC_LINKS;
  const retailerLink: NavLinkDef =
    role === "agent"
      ? { label: "For Retailers", to: "/retailer/dashboard" }
      : { label: "For Retailers", to: "/#for-retailers" };
  switch (role) {
    case "retailer":
      return [
        { label: "Home", to: "/" },
        retailerLink,
        INVENTORY_LINK,
        { label: "Resources", to: "/insights" },
        { label: "Company", to: "/contact" },
      ];
    case "agent":
      return [
        { label: "Home", to: "/" },
        retailerLink,
        INVENTORY_LINK,
        { label: "Resources", to: "/insights" },
        { label: "Company", to: "/contact" },
      ];
    case "print_partner":
      return [
        { label: "Home", to: "/" },
        retailerLink,
        INVENTORY_LINK,
        { label: "Resources", to: "/insights" },
        { label: "Company", to: "/contact" },
      ];
    case "talent":
      return [
        { label: "Home", to: "/" },
        INVENTORY_LINK,
        { label: "Resources", to: "/insights" },
        { label: "Company", to: "/contact" },
      ];
    case "admin":
      return [
        { label: "Home", to: "/" },
        INVENTORY_LINK,
        CAMPAIGNS_LINK,
        { label: "Admin Dashboard", to: "/admin/dashboard" },
      ];
    default:
      return PUBLIC_LINKS;
  }
};

interface MenuItem { label: string; to: string; }

const dropdownForRole = (role: Role): MenuItem[] => {
  switch (role) {
    case "retailer": return [
      { label: "Dashboard", to: "/retailer-dashboard" },
      { label: "My Campaigns", to: "/advertiser/campaigns" },
      { label: "Wallet", to: "/advertiser-settings" },
      { label: "Settings", to: "/advertiser-settings" },
    ];
    case "agent": return [
      { label: "My Dashboard", to: "/venue-publishers" },
      { label: "My Ad Spaces", to: "/venue-inventory" },
      { label: "Campaigns", to: "/publisher/campaigns" },
      { label: "Earnings", to: "/venue-publishers" },
      { label: "Settings", to: "/publisher/settings" },
    ];
    case "print_partner": return [
      { label: "POS Dashboard", to: "/print-partner/dashboard" },
      { label: "My Clients", to: "/print-partner/clients" },
      { label: "Venue Listings", to: "/print-partner/jobs" },
      { label: "Earnings", to: "/print-partner/revenue" },
      { label: "Settings", to: "/print-partner/settings" },
    ];
    case "talent": return [
      { label: "My Dashboard", to: "/talent-dashboard" },
      { label: "My Campaigns", to: "/talent/campaigns" },
      { label: "Campaign Invites", to: "/talent-dashboard" },
      { label: "Submissions", to: "/talent-dashboard" },
      { label: "Earnings", to: "/talent-dashboard" },
      { label: "Settings", to: "/talent-profile" },
    ];
    case "admin": return [
      { label: "Admin Dashboard", to: "/admin/dashboard" },
      { label: "All Campaigns", to: "/admin/campaigns" },
      { label: "Settings", to: "/admin/dashboard" },
    ];
    default: return [];
  }
};

const ROLE_LABEL: Record<string, string> = {
  retailer: "Retailer",
  agent: "Agent",
  print_partner: "Print Partner",
  talent: "Talent",
  admin: "Admin",
};

export const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<Role>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    setUserRole((data?.role as Role) ?? null);
  };

  const handleSignOut = async () => {
    try { await supabase.auth.signOut(); } catch (e) { console.error(e); }
    setUser(null); setUserRole(null); setMobileMenuOpen(false);
    navigate("/");
  };

  const close = () => setMobileMenuOpen(false);

  const handleGatedClick = (link: NavLinkDef, e: React.MouseEvent) => {
    if (link.gated && !user) {
      e.preventDefault();
      navigate(`/auth?redirect=${encodeURIComponent(link.to)}`);
      close();
    }
  };

  const links = linksForRole(userRole, !!user);
  const menu = dropdownForRole(userRole);
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Account";
  const initial = (userName[0] || "U").toUpperCase();

  const isActive = (to: string) => location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  if (user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <Link to="/" onClick={close} className="flex items-center gap-2 group">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-600 text-white">
            <TrendingUp className="w-4 h-4" />
          </span>
          <span className="font-bold text-lg text-white tracking-tight">{BRAND_NAME}</span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {(userRole === "admin" ? NAV_ITEMS_ADMIN : NAV_ITEMS_PUBLIC).map((item) =>
            item.children ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-2 text-sm transition-colors border-b-2 border-transparent text-zinc-300 hover:text-green-500 inline-flex items-center gap-1 outline-none">
                    {item.label}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="min-w-[12rem] rounded-xl shadow-2xl p-2 border border-white/10 bg-[#0c0c0c]"
                >
                  {item.children.map((c) => (
                    <DropdownMenuItem
                      key={c.label}
                      onClick={() => navigate(c.to)}
                      className="cursor-pointer text-zinc-100 font-medium hover:text-green-400 hover:bg-white/5 focus:bg-white/5 focus:text-green-400"
                    >
                      {c.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.label}
                to={item.to!}
                className={`px-3 py-2 text-sm transition-colors border-b-2 ${
                  isActive(item.to!)
                    ? "text-green-500 border-green-500"
                    : "text-zinc-300 border-transparent hover:text-green-500"
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              {userRole === "admin" && (
                <Badge className="bg-green-600 hover:bg-green-600 text-white">Admin Panel</Badge>
              )}
              <MessengerBell />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-9 h-9 rounded-full bg-green-600 text-white font-semibold flex items-center justify-center hover:bg-green-500 transition-colors">
                    {initial}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 rounded-xl shadow-2xl p-2 border border-white/10 backdrop-blur-md"
                  style={{ background: "rgba(17,17,17,0.92)" }}
                >
                  <DropdownMenuLabel className="px-2 pt-1 pb-2">
                    <div className="text-sm font-semibold text-white truncate">{userName}</div>
                    {userRole && (
                      <span
                        className="inline-block mt-1.5 px-2 py-0.5 text-[11px] rounded-full font-semibold"
                        style={{ background: "rgba(34,197,94,0.18)", color: "#22C55E" }}
                      >
                        {ROLE_LABEL[userRole] || userRole}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  {menu.map((m) => (
                    <DropdownMenuItem
                      key={m.label}
                      onClick={() => navigate(m.to)}
                      className="cursor-pointer text-zinc-100 font-medium focus:bg-white/10 focus:text-white"
                    >
                      <UserIcon className="w-4 h-4 mr-2 text-zinc-300" />
                      {m.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-400 cursor-pointer font-medium focus:text-red-300 focus:bg-white/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/auth"><Button variant="outline" size="sm" className="border-green-500 text-green-500 hover:bg-green-500/10">Log In</Button></Link>
              
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
        <div className="lg:hidden fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-[#0c0c0c] border-l border-white/10 shadow-2xl overflow-y-auto z-50">
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-white font-bold">{BRAND_NAME}</span>
            <button onClick={close} className="text-white p-1"><X className="w-5 h-5" /></button>
          </div>
          {user && (
            <div className="p-4 border-b border-white/10">
              <div className="text-sm text-white font-semibold truncate">{userName}</div>
              {userRole && (
                <span className="inline-block mt-1 px-2 py-0.5 text-[11px] rounded-full bg-green-600/20 text-green-400 font-medium">
                  {ROLE_LABEL[userRole] || userRole}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-col p-2">
            {(userRole === "admin" ? NAV_ITEMS_ADMIN : NAV_ITEMS_PUBLIC).map((item) =>
              item.children ? (
                <div key={item.label}>
                  <div className="text-xs text-zinc-400 uppercase tracking-wider px-3 pt-3 pb-1">
                    {item.label}
                  </div>
                  {item.children.map((c) => (
                    <Link
                      key={c.label}
                      to={c.to}
                      onClick={close}
                      className={`block pl-6 pr-3 py-2 text-sm rounded-md ${
                        isActive(c.to) ? "text-green-500 bg-white/5" : "text-zinc-200 hover:bg-white/5 hover:text-green-500"
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.to!}
                  onClick={close}
                  className={`px-3 py-3 text-sm rounded-md ${
                    isActive(item.to!) ? "text-green-500 bg-white/5" : "text-zinc-200 hover:bg-white/5 hover:text-green-500"
                  }`}
                >
                  {item.label}
                </Link>
              )
            )}
            {user && menu.length > 0 && (
              <>
                <div className="border-t border-white/10 my-2" />
                {menu.map((m) => (
                  <Link key={m.label} to={m.to} onClick={close} className="px-3 py-3 text-sm text-zinc-200 hover:text-green-500 hover:bg-white/5 rounded-md">
                    {m.label}
                  </Link>
                ))}
              </>
            )}
            <div className="border-t border-white/10 my-2" />
            {user ? (
              <button onClick={handleSignOut} className="px-3 py-3 text-sm text-red-500 hover:bg-white/5 rounded-md text-left">
                Log Out
              </button>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                <Link to="/auth" onClick={close}>
                  <Button variant="outline" size="sm" className="w-full border-green-500 text-green-500">Log In</Button>
                </Link>
                <Link to="/auth" onClick={close}>
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-500 text-white">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
