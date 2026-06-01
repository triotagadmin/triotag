import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Briefcase } from "lucide-react";
import { format } from "date-fns";

const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (["accepted", "active", "live"].includes(v)) return "bg-green-500/20 text-green-400 border-green-500/40";
  if (v === "pending") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  if (v === "completed") return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  if (["declined", "cancelled"].includes(v)) return "bg-red-500/20 text-red-400 border-red-500/40";
  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
};

export default function TalentCampaigns() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: t } = await supabase.from("talent_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!t) { setLoading(false); return; }
      const { data } = await supabase
        .from("talent_bookings")
        .select("id, status, campaign_type, start_date, end_date, duration, notes")
        .eq("talent_id", t.id)
        .order("created_at", { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Briefcase className="w-6 h-6 text-green-400" /> My Campaigns</h1>
        <p className="text-zinc-400 text-sm mb-6">Events and bookings you've been hired for.</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
        ) : rows.length === 0 ? (
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-12 text-center text-zinc-400">No bookings yet. Keep your profile updated to attract advertisers.</CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {rows.map((r) => (
              <Card key={r.id} className="bg-[#0c0c0c] border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                    {r.campaign_type && <Badge variant="outline" className="border-zinc-700 text-zinc-300">{r.campaign_type}</Badge>}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-3 flex-wrap mt-1">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />
                      {r.start_date ? format(new Date(r.start_date), "MMM d") : "—"} – {r.end_date ? format(new Date(r.end_date), "MMM d, yyyy") : "—"}
                    </span>
                    {r.duration && <span>{r.duration}</span>}
                  </div>
                  {r.notes && <p className="text-sm text-zinc-300 mt-2">{r.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
