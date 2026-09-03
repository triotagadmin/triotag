import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search, Send, Loader2, StickyNote, ShieldCheck, Building2, MailCheck, Layers,
  CheckCircle2, XCircle, Clock, Eye, MonitorPlay, Volume2, ImageIcon,
} from "lucide-react";

type Row = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  media_types: string[] | null;
  media_type: string | null;
  approval_status: string | null;
  availability_status: string | null;
  rejection_reason: string | null;
  contact_verified_at: string | null;
  admin_notes: string | null;
  publisher_id: string | null;
  created_at: string;
  submitted_at: string | null;
  submitted_by_agent: string | null;
  media_owner_name: string | null;
  media_owner_contact_person: string | null;
  media_owner_email: string | null;
  media_owner_phone: string | null;
  total_ad_units: number | null;
  campaign_duration_days: number | null;
  campaign_start_date: string | null;
  campaign_end_date: string | null;
  proof_urls: any;
  media_urls: any;
  specifications: any;
  publisher?: { business_name: string | null; contact_email: string | null; user_id: string | null } | null;
  agent?: { business_name: string | null; contact_email: string | null } | null;
  subscription?: {
    id: string;
    email: string;
    contact_person: string | null;
    venue_name: string | null;
    subscription_status: string;
    email_verified: boolean;
  } | null;
};

type Review = { id: string; action: string; reason: string | null; created_at: string };

const PAGE_SIZE = 20;
const FORMAT_ICON: Record<string, any> = { OOH: ImageIcon, DOOH: MonitorPlay, AOOH: Volume2 };

const formatsOf = (r: Row): string[] =>
  (r.media_types?.length ? r.media_types : r.media_type ? [r.media_type] : []) as string[];

const adUnitTypes = (r: Row): string[] => {
  const fd = r.specifications?.format_details || {};
  const out: string[] = [];
  if (fd.OOH?.print_formats?.length) out.push(...fd.OOH.print_formats);
  if (fd.DOOH?.screen_types?.length) out.push(...fd.DOOH.screen_types);
  if (fd.AOOH?.spot_durations?.length) out.push(...fd.AOOH.spot_durations);
  return out;
};

const unitsOf = (r: Row): number => {
  if (r.total_ad_units) return r.total_ad_units;
  const fd = r.specifications?.format_details || {};
  const sum = (m: any): number => Object.values(m || {}).reduce<number>((s, n: any) => s + (Number(n) || 0), 0);
  return sum(fd.OOH?.units_by_format) + sum(fd.DOOH?.units_by_type) + sum(fd.AOOH?.zones_by_duration);
};

export default function AdminVerifiedLocations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<Row | null>(null);
  const [history, setHistory] = useState<Review[]>([]);
  const [decisionBusy, setDecisionBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [noteTarget, setNoteTarget] = useState<Row | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [msgTarget, setMsgTarget] = useState<Row | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("campaign_invitation");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: spaces, error } = await supabase
      .from("ad_spaces")
      .select("id, title, description, location, media_types, media_type, approval_status, availability_status, rejection_reason, contact_verified_at, admin_notes, publisher_id, created_at, submitted_at, submitted_by_agent, media_owner_name, media_owner_contact_person, media_owner_email, media_owner_phone, total_ad_units, campaign_duration_days, campaign_start_date, campaign_end_date, proof_urls, media_urls, specifications")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }

    const list = (spaces || []) as any[];
    const spaceIds = list.map(s => s.id);
    const publisherIds = Array.from(new Set(list.map(s => s.publisher_id).filter(Boolean))) as string[];
    const agentIds = Array.from(new Set(list.map(s => s.submitted_by_agent).filter(Boolean))) as string[];

    const [{ data: subs }, { data: pubs }, { data: agents }] = await Promise.all([
      spaceIds.length
        ? supabase.from("venue_subscriptions")
            .select("id, ad_space_id, email, contact_person, venue_name, subscription_status, email_verified")
            .in("ad_space_id", spaceIds)
        : Promise.resolve({ data: [] as any[] }),
      publisherIds.length
        ? supabase.from("publisher_profiles").select("id, business_name, contact_email, user_id").in("id", publisherIds)
        : Promise.resolve({ data: [] as any[] }),
      agentIds.length
        ? supabase.from("publisher_profiles").select("user_id, business_name, contact_email").in("user_id", agentIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const subMap = new Map<string, any>();
    (subs || []).forEach((s: any) => { if (s.ad_space_id) subMap.set(s.ad_space_id, s); });
    const pubMap = new Map<string, any>();
    (pubs || []).forEach((p: any) => pubMap.set(p.id, p));
    const agentMap = new Map<string, any>();
    (agents || []).forEach((a: any) => agentMap.set(a.user_id, a));

    setRows(list.map((s: any) => ({
      ...s,
      subscription: subMap.get(s.id) || null,
      publisher: s.publisher_id ? pubMap.get(s.publisher_id) || null : null,
      agent: s.submitted_by_agent ? agentMap.get(s.submitted_by_agent) || null : null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const mediaOwnerLabel = (r: Row) =>
    r.media_owner_name || r.subscription?.venue_name || r.publisher?.business_name || "—";

  const owners = useMemo(
    () => Array.from(new Set(rows.map(mediaOwnerLabel).filter(o => o !== "—"))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter !== "all") out = out.filter(r => (r.approval_status || "pending") === statusFilter);
    if (formatFilter !== "all") out = out.filter(r => formatsOf(r).includes(formatFilter));
    if (availabilityFilter !== "all") out = out.filter(r => (r.availability_status || "unavailable") === availabilityFilter);
    if (ownerFilter !== "all") out = out.filter(r => mediaOwnerLabel(r) === ownerFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(r =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q) ||
        mediaOwnerLabel(r).toLowerCase().includes(q) ||
        (r.agent?.business_name || "").toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, statusFilter, formatFilter, availabilityFilter, ownerFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const kpis = useMemo(() => {
    const byStatus = (s: string) => rows.filter(r => (r.approval_status || "pending") === s);
    const unitsFor = (list: Row[]) => list.reduce((sum, r) => sum + unitsOf(r), 0);
    const byFormat = (f: string) => {
      const list = rows.filter(r => formatsOf(r).includes(f));
      return { listings: list.length, units: unitsFor(list), approved: list.filter(r => r.approval_status === "approved").length };
    };
    return {
      locations: rows.length,
      owners: owners.length,
      units: unitsFor(rows),
      available: rows.filter(r => r.availability_status === "available" && r.approval_status === "approved").length,
      pending: byStatus("pending").length,
      approved: byStatus("approved").length,
      rejected: byStatus("rejected").length,
      OOH: byFormat("OOH"),
      DOOH: byFormat("DOOH"),
      AOOH: byFormat("AOOH"),
    };
  }, [rows, owners]);

  const openDetail = async (r: Row) => {
    setDetail(r); setRejectReason(""); setHistory([]);
    const { data } = await supabase
      .from("inventory_reviews")
      .select("id, action, reason, created_at")
      .eq("ad_space_id", r.id)
      .order("created_at", { ascending: false });
    setHistory((data || []) as Review[]);
  };

  const decide = async (r: Row, status: "approved" | "rejected", reason?: string) => {
    setDecisionBusy(true);
    const patch: any = { approval_status: status };
    if (status === "approved") patch.availability_status = "available";
    if (status === "rejected") { patch.availability_status = "unavailable"; patch.rejection_reason = reason || null; }
    const { error } = await supabase.from("ad_spaces").update(patch).eq("id", r.id);
    setDecisionBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? "Inventory approved and released to advertisers" : "Inventory rejected");
    setRows(prev => prev.map(x => x.id === r.id ? { ...x, ...patch } : x));
    if (detail?.id === r.id) { setDetail(null); }
  };

  const saveNote = async () => {
    if (!noteTarget) return;
    setSavingNote(true);
    const { error } = await supabase.from("ad_spaces").update({ admin_notes: noteDraft || null }).eq("id", noteTarget.id);
    setSavingNote(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Note saved");
    setRows(prev => prev.map(r => r.id === noteTarget.id ? { ...r, admin_notes: noteDraft || null } : r));
    setNoteTarget(null);
  };

  const sendMessage = async () => {
    if (!msgTarget?.subscription) return;
    if (msgTarget.subscription.subscription_status !== "active") {
      toast.error("Contact must have an active subscription to receive messages.");
      return;
    }
    if (!subject.trim() || !message.trim()) { toast.error("Subject and message required"); return; }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-verified-venue-campaign", {
        body: { subscriptionIds: [msgTarget.subscription.id], subject, message, messageType },
      });
      if (error) throw error;
      toast.success("Message sent");
      setMsgTarget(null); setSubject(""); setMessage("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (r: Row) => {
    const s = r.approval_status || "pending";
    if (s === "approved") return <Badge className="bg-green-600">Approved</Badge>;
    if (s === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="outline" className="border-orange-500 text-orange-600">Pending</Badge>;
  };

  const proofList = (r: Row): string[] => {
    const proof = Array.isArray(r.proof_urls) ? r.proof_urls : [];
    const media = Array.isArray(r.media_urls) ? r.media_urls : [];
    return [...proof, ...media].filter(u => typeof u === "string");
  };

  const kpi = (label: string, value: number | string, Icon: any, tone = "text-green-600") => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className={`h-4 w-4 ${tone}`} />
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-6 px-4 max-w-[1400px]">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="h-7 w-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">SSP — Supply-Side Platform</h1>
            <p className="text-sm text-muted-foreground">
              Central management of TrioTag advertising supply: agent-submitted OOH, DOOH and AOOH inventory, media owners, ad units and availability.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
          {kpi("Total Locations", kpis.locations, Building2)}
          {kpi("Media Owners", kpis.owners, ShieldCheck)}
          {kpi("Total Ad Units", kpis.units, Layers)}
          {kpi("Available Supply", kpis.available, CheckCircle2)}
          {kpi("Pending", kpis.pending, Clock, "text-orange-500")}
          {kpi("Approved", kpis.approved, CheckCircle2)}
          {kpi("Rejected", kpis.rejected, XCircle, "text-destructive")}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {(["OOH", "DOOH", "AOOH"] as const).map(f => {
            const Icon = FORMAT_ICON[f];
            const d = kpis[f];
            return (
              <Card key={f}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-green-600" /> {f} Supply</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold">{d.listings}</p><p className="text-[11px] text-muted-foreground">Listings</p></div>
                  <div><p className="text-lg font-bold">{d.units}</p><p className="text-[11px] text-muted-foreground">Ad units</p></div>
                  <div><p className="text-lg font-bold">{d.approved}</p><p className="text-[11px] text-muted-foreground">Approved</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mb-4">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="relative md:col-span-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Location, owner, agent…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                <SelectItem value="OOH">OOH</SelectItem>
                <SelectItem value="DOOH">DOOH</SelectItem>
                <SelectItem value="AOOH">AOOH</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger><SelectValue placeholder="Availability" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All availability</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger><SelectValue placeholder="Media owner" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All media owners</SelectItem>
                {owners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Supply ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Media Owner</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Ad Unit</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map(r => {
                    const units = adUnitTypes(r);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[200px]">
                          <div className="font-medium truncate">{r.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{r.location || "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">{mediaOwnerLabel(r)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {formatsOf(r).map(f => <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[160px] truncate">
                          {units.length ? `${units.slice(0, 2).join(", ")}${units.length > 2 ? ` +${units.length - 2}` : ""}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{unitsOf(r)}</TableCell>
                        <TableCell className="text-xs">{r.campaign_duration_days ? `${r.campaign_duration_days}d` : "—"}</TableCell>
                        <TableCell className="text-xs capitalize">{r.availability_status || "—"}</TableCell>
                        <TableCell>{statusBadge(r)}</TableCell>
                        <TableCell className="text-xs max-w-[130px] truncate">{r.agent?.business_name || (r.submitted_by_agent ? "Agent" : "—")}</TableCell>
                        <TableCell className="text-xs">{new Date(r.submitted_at || r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button size="sm" variant="ghost" onClick={() => openDetail(r)} title="View / Review">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setNoteTarget(r); setNoteDraft(r.admin_notes || ""); }} title="Admin note">
                            <StickyNote className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" disabled={!r.subscription} onClick={() => setMsgTarget(r)} title="Contact media owner">
                            <MailCheck className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!pageRows.length && (
                    <TableRow><TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">No inventory matches these filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory detail / review */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">{detail.title} {statusBadge(detail)}</DialogTitle>
                <DialogDescription>Verify the supply information below before approving it into TrioTag inventory.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Media Owner</p>
                  <p>{mediaOwnerLabel(detail)}</p>
                  <p className="text-xs text-muted-foreground">{detail.media_owner_contact_person || "—"}</p>
                  <p className="text-xs text-muted-foreground">{detail.media_owner_email || detail.subscription?.email || "—"}</p>
                  <p className="text-xs text-muted-foreground">{detail.media_owner_phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Submitted By (Agent)</p>
                  <p>{detail.agent?.business_name || (detail.submitted_by_agent ? "Agent account" : "—")}</p>
                  <p className="text-xs text-muted-foreground">{detail.agent?.contact_email || "—"}</p>
                  <p className="text-xs text-muted-foreground">Submitted {new Date(detail.submitted_at || detail.created_at).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Venue / Location</p>
                  <p>{detail.title}</p>
                  <p className="text-xs text-muted-foreground">{detail.location || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Availability</p>
                  <p className="capitalize">{detail.availability_status || "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.campaign_start_date || "—"} → {detail.campaign_end_date || "—"}
                    {detail.campaign_duration_days ? ` (${detail.campaign_duration_days} days)` : ""}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Advertising Format & Ad Units</p>
                  <div className="flex flex-wrap gap-1">
                    {formatsOf(detail).map(f => <Badge key={f} variant="secondary">{f}</Badge>)}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {adUnitTypes(detail).map(u => <Badge key={u} variant="outline" className="text-[10px]">{u}</Badge>)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total quantity: <span className="font-semibold text-foreground">{unitsOf(detail)}</span> ad units</p>
                </div>
                {detail.description && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Description</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{detail.description}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Photos / Proof</p>
                  {proofList(detail).length ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {proofList(detail).map((u, i) => (
                        <a key={u + i} href={u} target="_blank" rel="noreferrer" className="rounded-[10px] overflow-hidden border block">
                          <img src={u} alt={`Inventory proof ${i + 1} for ${detail.title}`} className="w-full h-20 object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-xs text-muted-foreground">No proof uploaded.</p>}
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Approval History</p>
                  {history.length ? (
                    <ul className="space-y-1">
                      {history.map(h => (
                        <li key={h.id} className="text-xs text-muted-foreground">
                          <span className="font-medium capitalize text-foreground">{h.action}</span> · {new Date(h.created_at).toLocaleString()}
                          {h.reason ? ` — ${h.reason}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-muted-foreground">No review actions yet.</p>}
                </div>
                {detail.approval_status !== "approved" && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Rejection reason (required to reject)</Label>
                    <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain what the agent must fix…" rows={2} />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
                <Button
                  variant="destructive"
                  disabled={decisionBusy || !rejectReason.trim()}
                  onClick={() => decide(detail, "rejected", rejectReason.trim())}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={decisionBusy || detail.approval_status === "approved"}
                  onClick={() => decide(detail, "approved")}
                >
                  {decisionBusy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} Approve Supply
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin note */}
      <Dialog open={!!noteTarget} onOpenChange={o => !o && setNoteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin note</DialogTitle>
            <DialogDescription>Internal note for {noteTarget?.title}. Not visible to advertisers.</DialogDescription>
          </DialogHeader>
          <Textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={5} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteTarget(null)}>Cancel</Button>
            <Button onClick={saveNote} disabled={savingNote}>
              {savingNote && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact media owner */}
      <Dialog open={!!msgTarget} onOpenChange={o => !o && setMsgTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact media owner</DialogTitle>
            <DialogDescription>{msgTarget?.subscription?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Message type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign_invitation">Campaign invitation</SelectItem>
                  <SelectItem value="inventory_review">Inventory review</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgTarget(null)}>Cancel</Button>
            <Button onClick={sendMessage} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />} Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
