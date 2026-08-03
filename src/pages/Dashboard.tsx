import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardByRole } from "@/components/RoleProtectedRoute";

/**
 * Post-authentication landing route.
 * Sends the signed-in user to the dashboard that matches their role
 * (new accounts are always brand_advertiser).
 */
const Dashboard = () => {
  const [state, setState] = useState<{ loading: boolean; target: string }>({
    loading: true,
    target: "/auth",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState({ loading: false, target: "/auth" });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const role = (data?.role as never) ?? "brand_advertiser";
      const target = getDashboardByRole(role);
      if (!cancelled) {
        setState({
          loading: false,
          target: target === "/" ? "/brand-advertiser/dashboard" : target,
        });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <Navigate to={state.target} replace />;
};

export default Dashboard;
