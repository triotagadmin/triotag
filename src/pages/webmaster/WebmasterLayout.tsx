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

  const reload = useCallback(async () => {
    setLoading(true);
    setData(await loadPlatformData());
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const ctx = useMemo(() => ({ data, loading, reload }), [data, loading, reload]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/webmaster", { replace: true });
  };

  return (
    <PlatformCtx.Provider value={ctx}>
      <div className="min-h-screen bg-[#0c0c0c] text-foreground">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-green-500/15 bg-black/70 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="text-lg font-black tracking-tight text-green-400">TRIOTAG <span className="text-xs font-normal text-muted-foreground">Webmaster</span></p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-green-400/70">Global Platform Control</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[11px] text-green-300 sm:inline">
              {loading ? "Syncing…" : `${data.tenants.length} tenants live`}
            </span>
            <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />Sign out
            </Button>
          </div>
        </header>
        <main className="p-4 sm:p-6"><Outlet /></main>
      </div>
    </PlatformCtx.Provider>
  );
}
