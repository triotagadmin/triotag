import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { loadPlatformData, PlatformData } from "./platformData";
import { LogOut } from "lucide-react";

type Ctx = { data: PlatformData; loading: boolean; reload: () => Promise<void> };
const PlatformCtx = createContext<Ctx | null>(null);
export const usePlatform = () => {
  const ctx = useContext(PlatformCtx);
  if (!ctx) throw new Error("usePlatform must be used inside the Webmaster dashboard");
  return ctx;
};


export default function WebmasterLayout() {
  const navigate = useNavigate();
  const [data, setData] = useState<PlatformData>({
    tenants: [], members: [], invitations: [], spaces: [], logs: [], proposals: [], transactions: [],
  });
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingBrandRequests, setPendingBrandRequests] = useState(0);

  const loadPendingBrandRequests = useCallback(async () => {
    const { count } = await supabase
      .from("brand_advertiser_profiles")
      .select("id", { count: "exact", head: true })
      .eq("approval_status", "pending");
    setPendingBrandRequests(count ?? 0);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setData(await loadPlatformData());
    await loadPendingBrandRequests();
    setLoading(false);
  }, [loadPendingBrandRequests]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const onChanged = () => loadPendingBrandRequests();
    window.addEventListener("brand-requests-changed", onChanged);
    const channel = supabase
      .channel("webmaster-brand-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "brand_advertiser_profiles" }, onChanged)
      .subscribe();
    return () => {
      window.removeEventListener("brand-requests-changed", onChanged);
      supabase.removeChannel(channel);
    };
  }, [loadPendingBrandRequests]);

  const ctx = useMemo(() => ({ data, loading, reload }), [data, loading, reload]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/webmaster", { replace: true });
  };

  return (
    <PlatformCtx.Provider value={ctx}>
      <div className="min-h-screen bg-[#0c0c0c] text-foreground">
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-green-500/15 bg-black/60 backdrop-blur">
          <div className="px-5 py-5 border-b border-green-500/15">
            <p className="text-lg font-black tracking-tight text-green-400">TRIOTAG</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Webmaster</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4"><SidebarNav pendingBrandRequests={pendingBrandRequests} /></div>
          <div className="border-t border-green-500/15 p-3">
            <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-green-500/15 bg-black/70 px-4 py-3 backdrop-blur">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 overflow-y-auto bg-black/95 p-4">
                <p className="mb-4 text-lg font-black text-green-400">TRIOTAG <span className="text-xs font-normal text-muted-foreground">Webmaster</span></p>
                <SidebarNav pendingBrandRequests={pendingBrandRequests} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.25em] text-green-400/70">Global Platform Control</p>
              <p className="truncate text-sm font-semibold">Scope: ALL TENANTS</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] text-green-300 sm:inline">
                {loading ? "Syncing…" : `${data.tenants.length} tenants live`}
              </span>
              <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
            </div>
          </header>
          <main className="p-4 sm:p-6"><Outlet /></main>
        </div>
      </div>
    </PlatformCtx.Provider>
  );
}
