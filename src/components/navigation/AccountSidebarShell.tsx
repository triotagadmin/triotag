import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { resolveAccount } from "@/lib/account";
import SuperAdminSidebar from "./SuperAdminSidebar";
import AgentSidebar from "./AgentSidebar";
import BrandAdvertiserSidebar from "./BrandAdvertiserSidebar";
import { PrintPartnerSidebar, TalentSidebar, RetailerSidebar } from "./PartnerSidebars";

/**
 * Layout boundary router.
 *
 * Its ONLY job is to pick which isolated sidebar component to render, based on
 * the canonical role resolved from the authenticated Supabase session and the
 * database profile (never the URL, localStorage or transient state).
 *
 * It holds no navigation array of its own, so a change inside one account's
 * sidebar component can never affect another account's navigation.
 *
 * /webmaster/* renders its own layout + sidebar (WebmasterLayout) and is
 * explicitly excluded here so the two never stack.
 */
export function AccountSidebarShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [pillar, setPillar] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (session: any) => {
      const userId = session?.user?.id;
      if (!userId) {
        if (!cancelled) { setRole(null); setPillar(null); setReady(true); }
        return;
      }
      const [account, { data: brandProfile }] = await Promise.all([
        resolveAccount(),
        supabase.from("brand_advertiser_profiles").select("campaign_pillar").eq("user_id", userId).maybeSingle(),
      ]);
      if (cancelled) return;
      setRole((account.role as string) || null);
      setPillar(((brandProfile as any)?.campaign_pillar as string) || null);
      setReady(true);
    };
    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setReady(false);
      load(s);
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const isWebmasterArea = pathname.startsWith("/webmaster");

  const sidebar = (() => {
    if (!ready || isWebmasterArea) return null;
    switch (role) {
      case "admin": return <SuperAdminSidebar />;
      case "agent": return <AgentSidebar />;
      case "brand_advertiser": return <BrandAdvertiserSidebar campaignPillar={pillar} />;
      case "print_partner": return <PrintPartnerSidebar />;
      case "talent": return <TalentSidebar />;
      case "retailer": return <RetailerSidebar />;
      default: return null;
    }
  })();

  return (
    <>
      {sidebar}
      <div className={sidebar ? "md:pl-[68px]" : ""}>{children}</div>
    </>
  );
}

export default AccountSidebarShell;
