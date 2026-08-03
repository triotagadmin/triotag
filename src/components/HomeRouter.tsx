import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";

const sanitize = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : null;

export default function HomeRouter() {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolve = (session: unknown) => {
      if (cancelled) return;
      if (!session) {
        setLoading(false);
        return;
      }
      const stored = sanitize(sessionStorage.getItem("post_auth_redirect"));
      sessionStorage.removeItem("post_auth_redirect");
      setRedirectTo(stored && stored !== "/" ? stored : "/dashboard");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => resolve(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) resolve(session);
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

