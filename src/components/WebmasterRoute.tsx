import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0c0c0c]">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

/** Guards the Webmaster command center. Authorization is verified server-side. */
export default function WebmasterRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!cancelled) setState("denied");
        return;
      }
      const { data, error } = await supabase
        .from("webmasters")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!cancelled) setState(!error && data ? "ok" : "denied");
    })();
    return () => { cancelled = true; };
  }, []);

  if (state === "loading") return <Loader />;
  if (state === "denied") return <Navigate to="/webmaster" replace />;
  return <>{children}</>;
}
