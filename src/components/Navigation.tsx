import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import favicon from "/favicon.gif";
import { NotificationBell } from "@/components/NotificationBell";
import { MessengerBell } from "@/components/MessengerBell";
export const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [publisherType, setPublisherType] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setPublisherType(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  const fetchUserRole = async (userId: string) => {
    const {
      data
    } = await supabase.from("user_roles").select("role").eq("user_id", userId).single();
    setUserRole(data?.role ?? null);
  };
  useEffect(() => {
    const fetchPublisherType = async () => {
      if (userRole === "publisher" && user) {
        const {
          data
        } = await supabase.from("publisher_profiles").select("publisher_type").eq("user_id", user.id).maybeSingle();
        setPublisherType(data?.publisher_type ?? null);
      }
    };
    fetchPublisherType();
  }, [userRole, user]);
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserRole(null);
      setPublisherType(null);
      setMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      setUser(null);
      setUserRole(null);
      setPublisherType(null);
      navigate("/");
    }
  };
  const getDashboardLink = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "advertiser") return "/advertiser-dashboard";
    if (userRole === "publisher") {
      return "/venue-publishers";
    }
    return "/dashboard";
  };
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const NavLinks = ({
    mobile = false


  }: {mobile?: boolean;}) => {
    const baseLinkClass = "text-white hover:text-primary hover:drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300";
    const linkClass = mobile ? `w-full text-left py-3 px-4 ${baseLinkClass}` : baseLinkClass;
    return <>
        {user ? <>
            <Link to="/explore" onClick={closeMobileMenu}>
              <Button variant="ghost" size="sm" className={linkClass}>Ad Space</Button>
            </Link>
            {userRole !== "publisher" && (
              <Link to="/services" onClick={closeMobileMenu}>
                <Button variant="ghost" size="sm" className={linkClass}>Services</Button>
              </Link>
            )}
            <Link to="/habit-tracker" onClick={closeMobileMenu}>
              <Button variant="ghost" size="sm" className={linkClass}>Apps</Button>
            </Link>
            <Link to="/insights" onClick={closeMobileMenu}>
              <Button variant="ghost" size="sm" className={linkClass}>Insights</Button>
            </Link>
            <Link to={getDashboardLink()} onClick={closeMobileMenu}>
              <Button variant="ghost" size="sm" className={linkClass}>Dashboard</Button>
            </Link>
            {!mobile &&
        <>
                <MessengerBell />
                <NotificationBell />
              </>
        }
            <Button variant="outline" size="sm" onClick={handleSignOut} className={`${baseLinkClass} ${mobile ? "w-full mt-2" : ""}`}>
              Log Out
            </Button>
            {mobile &&
        <div className="py-2 flex items-center gap-2">
                <MessengerBell />
                <NotificationBell />
              </div>
        }
          </> : <>
            <Link to="/explore" onClick={closeMobileMenu}>
              <Button variant="ghost" size="sm" className={linkClass}>Ad Space</Button>
            </Link>
            <Link to="/services" onClick={closeMobileMenu}>
              
            </Link>
            <Link to="/habit-tracker" onClick={closeMobileMenu}>
              <Button variant="ghost" size="sm" className={linkClass}>Apps</Button>
            </Link>
            <Link to="/insights" onClick={closeMobileMenu}>
              <Button variant="ghost" size="sm" className={linkClass}>Insights</Button>
            </Link>
            <Link to="/auth" onClick={closeMobileMenu}>
              <Button variant="outline" size="sm" className={`${baseLinkClass} ${mobile ? "w-full mt-2" : ""}`}>Log In</Button>
            </Link>
          </>}
      </>;
  };
  return <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 md:space-x-3 group">
          <img src={favicon} alt="Tiny Sticky Ads Logo" className="w-6 h-6 md:w-8 md:h-8" />
          <span className="font-bold text-base md:text-xl text-foreground group-hover:text-primary transition-colors duration-300">
            Tiny Sticky Ads     
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-2">
          <NavLinks />
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden p-2 text-foreground hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-50">
          <div className="flex flex-col p-4 space-y-1">
            <NavLinks mobile />
          </div>
        </div>}
    </nav>;
};