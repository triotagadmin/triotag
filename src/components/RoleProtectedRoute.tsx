import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Role = "advertiser" | "publisher" | "print_partner" | "talent" | "admin";

interface Props {
  children: React.ReactNode;
  /** If set, user must be logged in AND have one of these roles */
  allowedRoles?: Role[];
  /** If true, only requires login (any role) */
  requireAuth?: boolean;
}

export const RoleProtectedRoute = ({ children, allowedRoles, requireAuth = true }: Props) => {
  const location = useLocation();
  const [state, setState] = useState<{ loading: boolean; ok: boolean }>({ loading: true, ok: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { if (!cancelled) setState({ loading: false, ok: false }); return; }
      if (!allowedRoles || allowedRoles.length === 0) {
        if (!cancelled) setState({ loading: false, ok: true });
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle();
      const role = data?.role as Role | undefined;
      if (!cancelled) setState({ loading: false, ok: !!role && allowedRoles.includes(role) });
    })();
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (state.loading) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-400">Loading…</div>;
  }
  if (!state.ok) {
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectParam}`} replace />;
  }
  return <>{children}</>;
};

export default RoleProtectedRoute;
