import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { ArrowLeft, Loader2 } from "lucide-react";
import { buildFunnel, emptyFunnel, statusBadgeClass, trackingUrl } from "@/lib/mobileQr";

type EventRow = { event_type: string; session_id: string | null; created_at: string };

export default function AdminMobileQRAnalytics() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [qr, setQr] = useState<any>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: qrRow }, { data: evs }] = await Promise.all([
        supabase.from("qr_codes").select("*").eq("id", id).maybeSingle(),
        supabase.from("mobile_qr_events").select("event_type, session_id, created_at").eq("qr_id", id).order("created_at"),
      ]);
      setQr(qrRow);
      setEvents((evs as EventRow[]) || []);
      setLoading(false);
    })();
  }, [id]);

  const funnel = useMemo(() => (events.length ? buildFunnel(events) : emptyFunnel()), [events]);

  const daily = useMemo(() => {
    const map: Record<string, { day: string; scans: number; leads: number; verified: number; redemptions: number }> = {};
    events.forEach((e) => {
      const day = e.created_at.slice(0, 10);
      map[day] ||= { day, scans: 0, leads: 0, verified: 0, redemptions: 0 };
      if (e.event_type === "scan") map[day].scans += 1;
      if (e.event_type === "lead_created") map[day].leads += 1;
      if (e.event_type === "otp_verified") map[day].verified += 1;
      if (e.event_type === "offer_redeemed") map[day].redemptions += 1;
    });
    return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
  }, [events]);

  const funnelSteps = [
    ["Scans", funnel.scan],
    ["Landing Views", funnel.landing_view],
    ["Form Starts", funnel.form_start],
    ["Submissions", funnel.form_submit],
    ["Verified Leads", funnel.otp_verified],
    ["Redemptions", funnel.offer_redeemed],
  ] as [string, number][];

  const max = Math.max(1, ...funnelSteps.map(([, v]) => v));
  const rate = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "0%");

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!qr) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Mobile QR not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/mobile-qr")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Mobile QR
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground">MOBILE QR</p>
          <h1 className="text-2xl font-bold">{qr.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{qr.qr_ref}</p>
          {qr.qr_ref && (
            <a href={trackingUrl(qr.qr_ref)} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
              {trackingUrl(qr.qr_ref)}
            </a>
          )}
        </div>
        <Badge variant="outline" className={statusBadgeClass(qr.status)}>{qr.status}</Badge>
      </header>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[
          ["Scans", funnel.scan],
          ["Unique Visitors", funnel.unique_sessions],
          ["Landing Views", funnel.landing_view],
          ["Form Starts", funnel.form_start],
          ["Submissions", funnel.form_submit],
          ["Verified Leads", funnel.otp_verified],
          ["Redemptions", funnel.offer_redeemed],
          ["Verification Rate", rate(funnel.otp_verified, funnel.form_submit)],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold tabular-nums">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {funnelSteps.map(([label, value], i) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {value.toLocaleString()}
                  {i > 0 && ` · ${rate(value, funnelSteps[i - 1][1])}`}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted">
                <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${(value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Scans by day</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="scans" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Leads &amp; verifications by day</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="verified" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Redemptions by day</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="redemptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
