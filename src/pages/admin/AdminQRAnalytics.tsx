import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BarChart3 } from "lucide-react";
import { buildFunnel, statusBadgeClass, type FunnelCounts } from "@/lib/mobileQr";

type Qr = { id: string; name: string | null; qr_ref: string | null; status: string; campaign_id: string | null };

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export default function AdminQRAnalytics() {
  const navigate = useNavigate();
  const [qrs, setQrs] = useState<Qr[]>([]);
  const [funnels, setFunnels] = useState<Record<string, FunnelCounts>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: qrRows } = await supabase
        .from("qr_codes")
        .select("id, name, qr_ref, status, campaign_id")
        .eq("qr_type", "MOBILE_QR")
        .order("created_at", { ascending: false });
      const list = (qrRows as Qr[]) || [];
      setQrs(list);

      let query = supabase.from("mobile_qr_events").select("qr_id, event_type, session_id");
      if (range !== "all") {
        const since = new Date(Date.now() - Number(range) * 86400000).toISOString();
        query = query.gte("created_at", since);
      }
      const { data: events } = await query;
      const grouped: Record<string, { event_type: string; session_id: string | null }[]> = {};
      (events || []).forEach((e: any) => {
        (grouped[e.qr_id] ||= []).push(e);
      });
      const f: Record<string, FunnelCounts> = {};
      list.forEach((q) => (f[q.id] = buildFunnel(grouped[q.id] || [])));
      setFunnels(f);
      setLoading(false);
    })();
  }, [range]);

  const totals = useMemo(() => {
    return Object.values(funnels).reduce(
      (acc, f) => ({
        scan: acc.scan + f.scan,
        unique: acc.unique + f.unique_sessions,
        landing: acc.landing + f.landing_view,
        submissions: acc.submissions + f.form_submit,
        verified: acc.verified + f.otp_verified,
        redemptions: acc.redemptions + f.offer_redeemed,
      }),
      { scan: 0, unique: 0, landing: 0, submissions: 0, verified: 0, redemptions: 0 },
    );
  }, [funnels]);

  const rate = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "0%");

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="h-6 w-6 text-primary" /> QR Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Mobile QR performance across all campaigns.</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </header>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Total Scans", totals.scan],
          ["Unique Visitors", totals.unique],
          ["Landing Views", totals.landing],
          ["Submissions", totals.submissions],
          ["Verified Leads", totals.verified],
          ["Redemptions", totals.redemptions],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold tabular-nums">{Number(value).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Performance by Mobile QR</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>QR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead className="text-right">Unique</TableHead>
                    <TableHead className="text-right">Submissions</TableHead>
                    <TableHead className="text-right">Verified</TableHead>
                    <TableHead className="text-right">Verification Rate</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrs.map((q) => {
                    const f = funnels[q.id];
                    return (
                      <TableRow key={q.id}>
                        <TableCell>
                          <div className="font-medium">{q.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{q.qr_ref}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={statusBadgeClass(q.status)}>{q.status}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{f?.scan ?? 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{f?.unique_sessions ?? 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{f?.form_submit ?? 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{f?.otp_verified ?? 0}</TableCell>
                        <TableCell className="text-right tabular-nums">{rate(f?.otp_verified ?? 0, f?.form_submit ?? 0)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/mobile-qr/${q.id}/analytics`)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!qrs.length && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                        No Mobile QRs yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
