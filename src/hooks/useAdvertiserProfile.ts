import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Shared advertiser identity + budget used by the advertiser top bar. */
export function useAdvertiserProfile() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("My Brand");
  const [totalBudget, setTotalBudget] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (!cancelled) setLoading(false); return; }
      const { data: profile } = await supabase
        .from("brand_advertiser_profiles")
        .select("id, company_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (profile) {
        setProfileId(profile.id);
        setCompanyName(profile.company_name || session.user.email?.split("@")[0] || "My Brand");
        const { data: camps } = await supabase
          .from("brand_campaigns")
          .select("budget")
          .eq("brand_advertiser_id", profile.id);
        if (!cancelled) setTotalBudget((camps || []).reduce((s, c: any) => s + Number(c.budget || 0), 0));
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { profileId, companyName, totalBudget, loading };
}
