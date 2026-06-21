import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Role = "retailer" | "agent" | "print_partner" | "talent" | "admin" | "brand_advertiser";

interface Props {
  children: React.ReactNode;
  /** If set, user must be logged in AND have one of these roles */
  allowedRoles?: Role[];
  /** If true, only requires login (any role) */
  requireAuth?: boolean;
}

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c]">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

export const getDashboardByRole = (role: Role | null | undefined): string => {
  switch (role) {
    case "admin": return "/admin/dashboard";
    case "retailer": return "/advertiser-dashboard";
    case "agent": return "/venue-publishers";
    case "print_partner": return "/print-partner/dashboard";
    case "talent": return "/talent-dashboard";
    case "brand_advertiser": return "/brand-advertiser/dashboard";
    default: return "/";
  }
};

export const RoleProtectedRoute = ({ children, allowedRoles, requireAuth = true }: Props) => {
  const location = useLocation();
  const [state, setState] = useState<{ loading: boolean; loggedIn: boolean; role: Role | null }>({
    loading: true, loggedIn: false, role: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState({ loading: false, loggedIn: false, role: null });
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const role = (data?.role as Role | undefined) ?? null;
      if (!cancelled) setState({ loading: false, loggedIn: true, role });
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (state.loading) return <PageLoader />;

  if (!state.loggedIn) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectParam}`} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!state.role || !allowedRoles.includes(state.role)) {
      return <Navigate to={getDashboardByRole(state.role)} replace />;
    }
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
