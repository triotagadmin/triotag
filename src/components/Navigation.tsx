import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import logo from "@/assets/logo.png";

export const Navigation = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (userRole === "advertiser") {
      return "/advertiser-dashboard";
    }
    return "/dashboard";
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
              <Link to="/home">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link to="/insights">
                <Button variant="ghost">Insights</Button>
              </Link>
              {userRole === "advertiser" ? (
                <Link to="/publishers">
                  <Button variant="ghost">Explore</Button>
                </Link>
              ) : userRole === "publisher" ? (
                <Link to={getDashboardLink()}>
                  <Button variant="ghost">My Space</Button>
                </Link>
              ) : null}
              <Link to={getDashboardLink()}>
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/insights">
                <Button variant="ghost">Insights</Button>
              </Link>
              <Link to="/publishers">
                <Button variant="ghost">Buy</Button>
              </Link>
              <Link to="/auth">
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
