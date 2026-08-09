import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Trash2, Users } from "lucide-react";
import { formatMobile, maskMobile } from "@/lib/mobileQr";

type Lead = {
  id: string;
  qr_id: string;
  campaign_id: string | null;
  mobile_number: string;
  mobile_verified: boolean;
  consent_marketing: boolean;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  offer_redeemed_at: string | null;
};

const PAGE_SIZE = 25;

export default function AdminMobileLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [qrs, setQrs] = useState<{ id: string; name: string | null; qr_ref: string | null; campaign_id: string | null }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [qrFilter, setQrFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);

  const load = async () => {
    setLoading(true);
    const [{ data: l }, { data: q }, { data: c }] = await Promise.all([
      supabase.from("mobile_qr_leads").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("qr_codes").select("id, name, qr_ref, campaign_id").eq("qr_type", "MOBILE_QR"),
      supabase.from("campaigns").select("id, name").limit(200),
    ]);
    setLeads((l as Lead[]) || []);
    setQrs((q as any) || []);
    setCampaigns((c as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = search.trim().replace(/\s+/g, "");
    return leads.filter((l) => {
      if (s && !l.mobile_number.includes(s)) return false;
      if (qrFilter !== "all" && l.qr_id !== qrFilter) return false;
      if (campaignFilter !== "all" && l.campaign_id !== campaignFilter) return false;
      if (verifiedFilter === "verified" && !l.mobile_verified) return false;
      if (verifiedFilter === "unverified" && l.mobile_verified) return false;
      if (fromDate && l.created_at < fromDate) return false;
      return true;
    });
  }, [leads, search, qrFilter, campaignFilter, verifiedFilter, fromDate]);

  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const stats = useMemo(() => ({
    total: leads.length,
    verified: leads.filter((l) => l.mobile_verified).length,
    consented: leads.filter((l) => l.consent_marketing).length,
    redeemed: leads.filter((l) => l.offer_redeemed_at).length,
  }), [leads]);

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("mobile_qr_leads").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Lead permanently deleted" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Users className="h-6 w-6 text-primary" /> Mobile Leads
        </h1>
        <p className="text-sm text-muted-foreground">
          Centralized, permission-controlled lead database captured through Mobile QR.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Submitted Leads", stats.total],
          ["Verified Leads", stats.verified],
          ["Marketing Consent", stats.consented],
          ["Offer Redemptions", stats.redeemed],
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
        <CardHeader><CardTitle className="text-base">{filtered.length} leads</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-5">
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search number" />
            <Select value={campaignFilter} onValueChange={(v) => { setCampaignFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="Campaign" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name || c.id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={qrFilter} onValueChange={(v) => { setQrFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue placeholder="QR" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All QRs</SelectItem>
                {qrs.map((q) => <SelectItem key={q.id} value={q.id}>{q.qr_ref} · {q.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={(v) => { setVerifiedFilter(v); setPage(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} />
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mobile Number</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>QR</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Consent</TableHead>
                    <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((l) => {
                    const qr = qrs.find((q) => q.id === l.qr_id);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-sm">
                          <span className="mr-2">{revealed[l.id] ? formatMobile(l.mobile_number) : maskMobile(l.mobile_number)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setRevealed((p) => ({ ...p, [l.id]: !p[l.id] }))}
                          >
                            {revealed[l.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm">{campaigns.find((c) => c.id === l.campaign_id)?.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{qr?.qr_ref || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={l.mobile_verified ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600" : ""}>
                            {l.mobile_verified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{l.consent_marketing ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(l.first_seen_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(l.last_seen_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteLead(l.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!paged.length && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                        No leads match these filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
