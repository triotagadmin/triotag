import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Megaphone, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (["active", "approved", "live"].includes(v)) return "bg-green-500/20 text-green-400 border-green-500/40";
  if (v === "pending") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  if (v === "completed") return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
};

export default function PublisherCampaigns() {
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
        .select("id, status, start_date, end_date, total_amount, estimated_publisher_payout, campaign_objective, ad_space_id, ad_spaces(title)")
        .eq("publisher_id", pub.id)
        .order("created_at", { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const totalRev = rows.reduce((s, r) => s + Number(r.estimated_publisher_payout || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6 text-green-400" /> Campaigns at Your Spaces</h1>
            <p className="text-zinc-400 text-sm mt-1">Bookings and ad requests across your inventory.</p>
          </div>
          <Button asChild variant="outline" className="border-green-500/40 text-green-400 hover:bg-green-500/10">
            <Link to="/publisher/ad-requests">Ad Requests</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Total</div><div className="text-2xl font-bold">{rows.length}</div></CardContent></Card>
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Active</div><div className="text-2xl font-bold">{rows.filter(r => ["active","approved","live"].includes((r.status||"").toLowerCase())).length}</div></CardContent></Card>
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Completed</div><div className="text-2xl font-bold">{rows.filter(r => (r.status||"").toLowerCase() === "completed").length}</div></CardContent></Card>
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Est. Revenue</div><div className="text-2xl font-bold text-green-400">₱{totalRev.toLocaleString()}</div></CardContent></Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
        ) : rows.length === 0 ? (
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-12 text-center text-zinc-400">No campaigns booked yet at your spaces.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <Card key={r.id} className="bg-[#0c0c0c] border-white/10">
                <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge></div>
                    <div className="font-semibold">{r.ad_spaces?.title || "Booking"}</div>
                    <div className="text-xs text-zinc-400 mt-1 flex gap-3 flex-wrap">
                      {r.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.start_date), "MMM d")} – {r.end_date ? format(new Date(r.end_date), "MMM d, yyyy") : "—"}</span>}
                      {r.estimated_publisher_payout && <span className="flex items-center gap-1 text-green-400"><DollarSign className="w-3 h-3" />₱{Number(r.estimated_publisher_payout).toLocaleString()}</span>}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-green-500/40 text-green-400 hover:bg-green-500/10">
                    <Link to={`/publisher/ad-requests/${r.id}`}>View</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
