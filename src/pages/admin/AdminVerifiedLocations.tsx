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
import { MapPinCheck, Search, Send, Loader2, StickyNote, ExternalLink, ShieldCheck, ShieldAlert, Building2, MailCheck } from "lucide-react";

type Row = {
  id: string;
  title: string;
  location: string | null;
  media_types: string[] | null;
  approval_status: string | null;
  availability_status: string | null;
  contact_verified_at: string | null;
  admin_notes: string | null;
  publisher_id: string | null;
  created_at: string;
  publisher?: { business_name: string | null; contact_email: string | null } | null;
  subscription?: {
    id: string;
    email: string;
    contact_person: string | null;
    venue_name: string | null;
    subscription_status: string;
    email_verified: boolean;
    verified_at: string | null;
    last_contacted_at: string | null;
  } | null;
};

const PAGE_SIZE = 20;

export default function AdminVerifiedLocations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

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
      .select("id, title, location, media_types, approval_status, availability_status, contact_verified_at, admin_notes, publisher_id, created_at")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }

    const spaceIds = (spaces || []).map(s => s.id);
    const publisherIds = Array.from(new Set((spaces || []).map(s => s.publisher_id).filter(Boolean))) as string[];

    const [{ data: subs }, { data: pubs }] = await Promise.all([
      spaceIds.length
        ? supabase.from("venue_subscriptions")
            .select("id, ad_space_id, email, contact_person, venue_name, subscription_status, email_verified, verified_at, last_contacted_at")
            .in("ad_space_id", spaceIds)
        : Promise.resolve({ data: [] as any[] }),
      publisherIds.length
        ? supabase.from("publisher_profiles").select("id, business_name, contact_email").in("id", publisherIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const subMap = new Map<string, any>();
    (subs || []).forEach((s: any) => { if (s.ad_space_id) subMap.set(s.ad_space_id, s); });
    const pubMap = new Map<string, any>();
    (pubs || []).forEach((p: any) => pubMap.set(p.id, p));

    setRows((spaces || []).map((s: any) => ({
      ...s,
      subscription: subMap.get(s.id) || null,
      publisher: s.publisher_id ? pubMap.get(s.publisher_id) || null : null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter === "verified") out = out.filter(r => r.contact_verified_at || r.subscription?.subscription_status === "active");
    else if (statusFilter === "pending") out = out.filter(r => !r.contact_verified_at && r.subscription && r.subscription.subscription_status !== "active");
    else if (statusFilter === "no_subscription") out = out.filter(r => !r.subscription);
    else if (statusFilter === "unlisted") out = out.filter(r => r.availability_status === "unlisted");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(r =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.location || "").toLowerCase().includes(q) ||
        (r.publisher?.business_name || "").toLowerCase().includes(q) ||
        (r.subscription?.email || "").toLowerCase().includes(q)
      );
    }
    return out;
  }, [rows, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const verified = rows.filter(r => r.contact_verified_at || r.subscription?.subscription_status === "active").length;
    const pending = rows.filter(r => r.subscription && r.subscription.subscription_status !== "active" && !r.contact_verified_at).length;
    const none = rows.filter(r => !r.subscription).length;
    return { total, verified, pending, none };
  }, [rows]);

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
    if (r.contact_verified_at || r.subscription?.subscription_status === "active") {
      return <Badge className="bg-green-600">Verified</Badge>;
    }
    if (r.subscription) return <Badge variant="outline" className="border-orange-500 text-orange-600">Pending</Badge>;
    return <Badge variant="secondary">No subscription</Badge>;
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <MapPinCheck className="h-7 w-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">Verified Locations</h1>
            <p className="text-sm text-muted-foreground">Manage every listing with verified ownership and contact status.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card><CardHeader className="pb-2 flex-row items-center gap-2 space-y-0"><Building2 className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-xs font-medium">Total Listings</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{kpis.total}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex-row items-center gap-2 space-y-0"><ShieldCheck className="h-4 w-4 text-green-600" /><CardTitle className="text-xs font-medium">Verified</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{kpis.verified}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex-row items-center gap-2 space-y-0"><ShieldAlert className="h-4 w-4 text-orange-500" /><CardTitle className="text-xs font-medium">Pending Verification</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{kpis.pending}</div></CardContent></Card>
          <Card><CardHeader className="pb-2 flex-row items-center gap-2 space-y-0"><MailCheck className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-xs font-medium">No Subscription</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{kpis.none}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search title, location, agent, email" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-80" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending verification</SelectItem>
                  <SelectItem value="no_subscription">No subscription</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No listings match your filters.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Last Contacted</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map(r => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="font-medium">{r.title}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[240px]">{r.location || "—"}</div>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {(r.media_types || []).map(mt => <Badge key={mt} variant="secondary" className="text-[10px]">{mt}</Badge>)}
                              {r.availability_status === "unlisted" && <Badge variant="outline" className="text-[10px]">Unlisted</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{r.publisher?.business_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{r.publisher?.contact_email || ""}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.subscription ? (
                              <>
                                <div>{r.subscription.contact_person || "—"}</div>
                                <div className="text-xs text-muted-foreground">{r.subscription.email}</div>
                              </>
                            ) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>{statusBadge(r)}</TableCell>
                          <TableCell className="text-xs">{r.contact_verified_at ? new Date(r.contact_verified_at).toLocaleDateString() : (r.subscription?.verified_at ? new Date(r.subscription.verified_at).toLocaleDateString() : "—")}</TableCell>
                          <TableCell className="text-xs">{r.subscription?.last_contacted_at ? new Date(r.subscription.last_contacted_at).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="max-w-[180px]">
                            {r.admin_notes ? <div className="text-xs line-clamp-2" title={r.admin_notes}>{r.admin_notes}</div> : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="outline" onClick={() => { setNoteTarget(r); setNoteDraft(r.admin_notes || ""); }} title="Admin note">
                                <StickyNote className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" disabled={!r.subscription || r.subscription.subscription_status !== "active"} onClick={() => { setMsgTarget(r); }} title="Message contact">
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" asChild title="Open listing">
                                <a href={`/venue/${r.id}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-muted-foreground">Page {page} of {totalPages} · {filtered.length} listing(s)</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!noteTarget} onOpenChange={(o) => !o && setNoteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin note</DialogTitle>
            <DialogDescription>{noteTarget?.title}</DialogDescription>
          </DialogHeader>
          <Textarea rows={6} value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="Private admin note about this listing…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteTarget(null)}>Cancel</Button>
            <Button onClick={saveNote} disabled={savingNote}>
              {savingNote && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!msgTarget} onOpenChange={(o) => !o && setMsgTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message contact</DialogTitle>
            <DialogDescription>{msgTarget?.title} · {msgTarget?.subscription?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Message type</Label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="campaign_invitation">Campaign Invitation</SelectItem>
                  <SelectItem value="campaign_brief">Campaign Brief</SelectItem>
                  <SelectItem value="media_kit">Media Kit</SelectItem>
                  <SelectItem value="requirements">Campaign Requirements</SelectItem>
                  <SelectItem value="proposal">Proposal Document</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={8} value={message} onChange={e => setMessage(e.target.value)} placeholder="Include any relevant links — clicks and opens will be tracked." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgTarget(null)}>Cancel</Button>
            <Button onClick={sendMessage} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
