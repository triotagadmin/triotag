import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/logo.png";

export const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [publisherType, setPublisherType] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    setUserRole(data?.role ?? null);
  };

  useEffect(() => {
    const fetchPublisherType = async () => {
      if (userRole === "publisher" && user) {
        const { data } = await supabase
          .from("publisher_profiles")
          .select("publisher_type")
          .eq("user_id", user.id)
          .maybeSingle();
        
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
      if (publisherType === "venue") return "/venue-publishers";
      if (publisherType === "digital") return "/digital-publishers";
      if (publisherType === "agent") return "/agent-publishers";
    }
    return "/dashboard";
  };

  const getInventoryLink = () => {
    if (publisherType === "venue") return "/venue-inventory";
    if (publisherType === "digital") return "/digital-inventory";
    if (publisherType === "agent") return "/agent-inventory";
    return "/inventory";
  };

  const showPublishersLink = () => {
    return userRole === "publisher" && ["venue", "digital", "agent"].includes(publisherType || "");
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to={user ? "/home" : "/"} className="flex items-center space-x-2">
          <img src={logo} alt="Tiny Sticky Ads Logo" className="w-8 h-8" />
          <span className="font-bold text-xl">Tiny Sticky Ads</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {userRole === "advertiser" ? (
                <>
                  <Link to="/insights">
                    <Button variant="ghost">Insights</Button>
                  </Link>
                  <Link to="/habit-tracker">
                    <Button variant="ghost">Ad Tracker</Button>
                  </Link>
                  <Link to="/publishers">
                    <Button variant="ghost">Buy</Button>
                  </Link>
                  <Link to={getDashboardLink()}>
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                </>
              ) : userRole === "publisher" ? (
                <>
                  <Link to="/explore">
                    <Button variant="ghost">Explore</Button>
                  </Link>
                  {showPublishersLink() && (
                    <Link to="/publishers">
                      <Button variant="ghost">Publishers</Button>
                    </Link>
                  )}
                  <Link to={getInventoryLink()}>
                    <Button variant="ghost">Inventory</Button>
                  </Link>
                  <Link to="/insights">
                    <Button variant="ghost">Insights</Button>
                  </Link>
                  <Link to="/habit-tracker">
                    <Button variant="ghost">Ad Tracker</Button>
                  </Link>
                  <Link to={getDashboardLink()}>
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/explore">
                    <Button variant="ghost">Explore</Button>
                  </Link>
                  <Link to="/insights">
                    <Button variant="ghost">Insights</Button>
                  </Link>
                  <Link to="/habit-tracker">
                    <Button variant="ghost">Ad Tracker</Button>
                  </Link>
                  <Link to={getDashboardLink()}>
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                </>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/explore">
                <Button variant="ghost">Explore</Button>
              </Link>
              <Link to="/publishers">
                <Button variant="ghost">Publishers</Button>
              </Link>
              <Link to="/habit-tracker">
                <Button variant="ghost">Ad Tracker</Button>
              </Link>
              <Link to="/insights">
                <Button variant="ghost">Insights</Button>
              </Link>
              <Link to="/list-space">
                <Button variant="ghost">Sell</Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline">Log In</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
