import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";

const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (["active", "approved", "live"].includes(v)) return "bg-green-500/20 text-green-400 border-green-500/40";
  if (v === "pending") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  if (v === "completed") return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
};

export default function VenueCampaigns() {
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: pub } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!pub) { setLoading(false); return; }
      const { data } = await supabase
        .from("activations")
        .select("id, status, start_date, end_date, ad_spaces(title, location)")
        .eq("publisher_id", pub.id)
        .order("start_date", { ascending: false });
      const g: Record<string, any[]> = {};
      (data || []).forEach((r: any) => {
        const key = r.ad_spaces?.title || "Unassigned";
        (g[key] ||= []).push(r);
      });
      setGrouped(g);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-1">Campaigns Across Your Venues</h1>
        <p className="text-zinc-400 text-sm mb-6">Grouped by venue location.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-12 text-center text-zinc-400">No campaigns yet across your venues.</CardContent></Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([venue, list]) => (
              <div key={venue}>
                <div className="flex items-center gap-2 mb-2 text-green-400 font-semibold">
                  <MapPin className="w-4 h-4" /> {venue}
                  <span className="text-xs text-zinc-500 font-normal">({list.length})</span>
                </div>
                <div className="grid gap-2">
                  {list.map((r: any) => (
                    <Card key={r.id} className="bg-[#0c0c0c] border-white/10">
                      <CardContent className="p-3 flex justify-between items-center">
                        <div className="text-sm">
                          <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                          <span className="text-xs text-zinc-400 ml-2 inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {r.start_date ? format(new Date(r.start_date), "MMM d") : "—"} – {r.end_date ? format(new Date(r.end_date), "MMM d, yyyy") : "—"}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500">{r.ad_spaces?.location}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
