import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RetailerLayout } from "@/components/retailer/RetailerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (["active", "approved", "live"].includes(v)) return "bg-green-500/20 text-green-400 border-green-500/40";
  if (v === "pending") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  if (v === "completed") return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
};

export default function RetailerCampaigns() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: pub } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!pub) { setLoading(false); return; }
      const { data } = await supabase
        .from("activations")
        .select("id, status, start_date, end_date, estimated_publisher_payout, advertiser_id, ad_spaces(title, location)")
        .eq("publisher_id", pub.id)
        .order("created_at", { ascending: false });
      const advIds = Array.from(new Set((data || []).map((d: any) => d.advertiser_id).filter(Boolean)));
      let advMap: Record<string, string> = {};
      if (advIds.length) {
        const { data: advs } = await supabase.from("advertiser_profiles").select("user_id, company_name").in("user_id", advIds);
        advMap = Object.fromEntries((advs || []).map((a: any) => [a.user_id, a.company_name]));
      }
      setRows((data || []).map((r: any) => ({ ...r, advertiser_name: advMap[r.advertiser_id] || "—" })));
      setLoading(false);
    })();
  }, []);

  return (
    <RetailerLayout title="Campaigns at Your Locations">
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
      ) : rows.length === 0 ? (
        <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-12 text-center text-zinc-400">No campaigns booked at your locations yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.id} className="bg-[#0c0c0c] border-white/10">
              <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge></div>
                  <div className="font-semibold text-white">{r.ad_spaces?.title || "Booking"}</div>
                  <div className="text-xs text-zinc-400 mt-1">Retailer: {(r as any).advertiser_name || "—"} · {r.ad_spaces?.location || ""}</div>
                  <div className="text-xs text-zinc-400 mt-1 flex gap-3 flex-wrap">
                    {r.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.start_date), "MMM d")} – {r.end_date ? format(new Date(r.end_date), "MMM d, yyyy") : "—"}</span>}
                    {r.estimated_publisher_payout && <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" />₱{Number(r.estimated_publisher_payout).toLocaleString()}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </RetailerLayout>
  );
}
