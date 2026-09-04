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
    case "retailer": return "/retailer-dashboard";
    case "agent": return "/venue-publishers";
    case "print_partner": return "/print-partner/dashboard";
    case "talent": return "/talent-dashboard";
    case "brand_advertiser": return "/brand-advertiser/dashboard";
    default: return "/";
  }
};

export const RoleProtectedRoute = ({ children, allowedRoles, requireAuth = true }: Props) => {
  const location = useLocation();
  const [state, setState] = useState<{ loading: boolean; loggedIn: boolean; role: Role | null; error: boolean }>({
    loading: true, loggedIn: false, role: null, error: false,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState({ loading: false, loggedIn: false, role: null, error: false });
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) {
        console.error("RoleProtectedRoute: failed to load user role", error);
        if (!cancelled) setState({ loading: false, loggedIn: true, role: null, error: true });
        return;
      }
      const role = (data?.role as Role | undefined) ?? null;
      // Agents lose access the moment their Super Admin suspends or removes them.
      if (role === "agent") {
        const { data: membership } = await supabase
          .from("tenant_members")
          .select("status")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (membership && membership.status !== "active") {
          if (!cancelled) setState({ loading: false, loggedIn: true, role: null, error: false });
          return;
        }
      }
      if (!cancelled) setState({ loading: false, loggedIn: true, role, error: false });
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (state.loading) return <PageLoader />;

  if (state.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0c0c0c] text-center px-6">
        <p className="text-white/80">We couldn't verify your account permissions. Please try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md bg-green-500 text-black font-medium"
        >
          Retry
        </button>
      </div>
    );
  }


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
