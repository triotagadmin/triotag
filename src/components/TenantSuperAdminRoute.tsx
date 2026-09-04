import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c]">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

/** Guards a tenant command center. Membership + role come from the database, never the browser. */
export default function TenantSuperAdminRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState("denied");
        return;
      }
      const { data } = await supabase
        .from("tenant_members")
        .select("member_role, status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const ok = data?.member_role === "super_admin" && data?.status === "active";
      if (!cancelled) setState(ok ? "ok" : "denied");
    })();
    return () => { cancelled = true; };
  }, []);

  if (state === "loading") return <Loader />;
  if (state === "denied") return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
