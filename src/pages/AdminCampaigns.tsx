import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, DollarSign, Megaphone } from "lucide-react";
import { format } from "date-fns";

type Row = {
  id: string;
  name: string;
  type: "OOH" | "DOOH" | "AOOH";
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  advertiser_id?: string;
};

const statusColor = (s: string) => {
  const v = (s || "").toLowerCase();
  if (["active", "approved", "live", "playing"].includes(v)) return "bg-green-500/20 text-green-400 border-green-500/40";
  if (["pending", "in_review", "submitted"].includes(v)) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40";
  if (["completed", "ended"].includes(v)) return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  if (["rejected", "cancelled"].includes(v)) return "bg-red-500/20 text-red-400 border-red-500/40";
  return "bg-zinc-500/20 text-zinc-300 border-zinc-500/40";
};

export default function AdminCampaigns() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [type, setType] = useState<"all" | "OOH" | "DOOH" | "AOOH">("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: c1 }, { data: c2 }] = await Promise.all([
        supabase.from("campaigns").select("id, campaign_name, status, start_date, end_date, budget_amount, campaign_type, advertiser_id"),
        supabase.from("aooh_campaigns").select("id, campaign_name, status, start_date, end_date, advertiser_id"),
      ]);
      const list: Row[] = [
        ...((c1 || []) as any[]).map((r) => ({
          id: r.id, name: r.campaign_name || "Untitled",
          type: (r.campaign_type === "dooh" ? "DOOH" : "OOH") as Row["type"],
          status: r.status || "draft", start_date: r.start_date, end_date: r.end_date,
          budget: r.budget_amount, advertiser_id: r.advertiser_id,
        })),
        ...((c2 || []) as any[]).map((r) => ({
          id: r.id, name: r.campaign_name || "Untitled",
          type: "AOOH" as const, status: r.status || "draft",
          start_date: r.start_date, end_date: r.end_date, advertiser_id: r.advertiser_id,
        })),
      ];
      setRows(list);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter((r) =>
    (type === "all" || r.type === type) &&
    (status === "all" || (r.status || "").toLowerCase() === status) &&
    (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  ), [rows, type, status, search]);

  const totalSpend = rows.reduce((s, r) => s + (r.budget || 0), 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1"><Megaphone className="w-6 h-6 text-green-400" /> All Campaigns</h1>
        <p className="text-zinc-400 text-sm mb-6">Global view across all advertisers.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Total</div><div className="text-2xl font-bold">{rows.length}</div></CardContent></Card>
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Active</div><div className="text-2xl font-bold text-green-400">{rows.filter(r => ["active","approved","live","playing"].includes((r.status||"").toLowerCase())).length}</div></CardContent></Card>
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Pending</div><div className="text-2xl font-bold text-yellow-400">{rows.filter(r => ["pending","submitted","in_review"].includes((r.status||"").toLowerCase())).length}</div></CardContent></Card>
          <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-4"><div className="text-xs text-zinc-400">Total Spend</div><div className="text-2xl font-bold">₱{totalSpend.toLocaleString()}</div></CardContent></Card>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Input placeholder="Search campaign name…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0c0c0c] border-white/10 text-white w-64" />
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="w-36 bg-[#0c0c0c] border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0c0c0c] border-white/10 text-white">
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="OOH">OOH</SelectItem>
              <SelectItem value="DOOH">DOOH</SelectItem>
              <SelectItem value="AOOH">AOOH</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 bg-[#0c0c0c] border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#0c0c0c] border-white/10 text-white">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-green-400" /></div>
        ) : (
          <div className="grid gap-2">
            {filtered.map((r) => (
              <Card key={r.id} className="bg-[#0c0c0c] border-white/10">
                <CardContent className="p-3 flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">{r.type}</Badge>
                      <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                    </div>
                    <div className="font-semibold text-sm">{r.name}</div>
                    <div className="text-xs text-zinc-400 mt-0.5 flex gap-3 flex-wrap">
                      {r.start_date && <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(r.start_date), "MMM d, yyyy")}{r.end_date && ` – ${format(new Date(r.end_date), "MMM d, yyyy")}`}</span>}
                      {r.budget != null && <span className="inline-flex items-center gap-1"><DollarSign className="w-3 h-3" />₱{Number(r.budget).toLocaleString()}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <Card className="bg-[#0c0c0c] border-white/10"><CardContent className="p-8 text-center text-zinc-400">No campaigns match filters.</CardContent></Card>}
          </div>
        )}
      </div>
    </div>
  );
}
