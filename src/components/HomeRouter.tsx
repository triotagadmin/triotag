import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import { getDashboardByRole } from "@/components/RoleProtectedRoute";

const sanitizePath = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : null;

export default function HomeRouter() {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = async (userId: string) => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const stored = sanitizePath(sessionStorage.getItem("post_auth_redirect"));
      sessionStorage.removeItem("post_auth_redirect");

      let target = stored && stored !== "/" ? stored : null;
      if (!target) {
        const byRole = getDashboardByRole((roleData?.role as never) ?? "brand_advertiser");
        target = byRole === "/" ? "/brand-advertiser/dashboard" : byRole;
      }

      if (!cancelled) {
        setRedirectTo(target);
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) resolve(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session?.user) {
        setLoading(false);
        return;
      }
      resolve(session.user.id);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <Index />;
}
