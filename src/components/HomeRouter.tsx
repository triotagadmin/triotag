import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";

const ROLE_HOME: Record<string, string> = {
  retailer: "/retailer-dashboard",
  agent: "/venue-publishers",
  print_partner: "/print-partner/dashboard",
  talent: "/talent-dashboard",
  admin: "/admin/dashboard",
  brand_advertiser: "/brand-advertiser/dashboard",
};

export default function HomeRouter() {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: wm } = await supabase
        .from("webmasters")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (wm) {
        setRedirectTo("/webmaster/dashboard");
        setLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from("tenant_members")
        .select("member_role, status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (membership?.member_role === "super_admin" && membership.status === "active") {
        setRedirectTo("/tenant/dashboard");
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const home = roleData?.role ? ROLE_HOME[roleData.role as string] : null;
      setRedirectTo(home || null);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <Index />;
}
