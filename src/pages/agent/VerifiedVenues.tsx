import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Search, Send, Loader2, ArrowUpDown } from "lucide-react";

type Subscription = {
  id: string;
  venue_name: string | null;
  contact_person: string | null;
  email: string;
  email_verified: boolean;
  subscription_status: "pending" | "active" | "unsubscribed" | "expired";
  verified_at: string | null;
  last_contacted_at: string | null;
  campaign_status: string | null;
  created_at: string;
};

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<string, string> = {
  active: "Active Subscription",
  pending: "Verification Pending",
  expired: "Verification Pending",
  unsubscribed: "Unsubscribed",
};

const VerifiedVenues = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof Subscription>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("campaign_invitation");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("venue_subscriptions")
      .select("id, venue_name, contact_person, email, email_verified, subscription_status, verified_at, last_contacted_at, campaign_status, created_at")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    setRows((data as Subscription[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let out = rows;
    if (statusFilter === "active") out = out.filter(r => r.subscription_status === "active");
    else if (statusFilter === "unverified") out = out.filter(r => !r.email_verified);
    else if (statusFilter === "pending") out = out.filter(r => r.subscription_status === "pending" || r.subscription_status === "expired");
    else if (statusFilter === "unsubscribed") out = out.filter(r => r.subscription_status === "unsubscribed");

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(r =>
        (r.venue_name || "").toLowerCase().includes(q) ||
        (r.contact_person || "").toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }

    out = [...out].sort((a, b) => {
      const av = (a[sortKey] ?? "") as any;
      const bv = (b[sortKey] ?? "") as any;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [rows, statusFilter, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  const toggleSort = (k: keyof Subscription) => {
    if (sortKey === k) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
  };

  const selectedIds = Object.keys(selected).filter(k => selected[k]);
  const selectedActive = filtered.filter(r => selected[r.id] && r.subscription_status === "active");

  const sendCampaign = async () => {
    if (selectedActive.length === 0) {
      toast({ title: "No active venues selected", description: "Only verified & active venues can be messaged.", variant: "destructive" });
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Missing fields", description: "Subject and message are required.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-verified-venue-campaign", {
        body: { subscriptionIds: selectedActive.map(r => r.id), subject, message, messageType },
      });
      if (error) throw error;
      toast({ title: "Sent", description: `Campaign message sent to ${selectedActive.length} venue(s).` });
      setDialogOpen(false);
      setSubject(""); setMessage("");
      setSelected({});
      load();
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const badgeFor = (r: Subscription) => {
    if (r.subscription_status === "active") return <Badge className="bg-green-600">Active</Badge>;
    if (r.subscription_status === "unsubscribed") return <Badge variant="secondary">Unsubscribed</Badge>;
    if (r.subscription_status === "expired") return <Badge variant="outline" className="border-orange-500 text-orange-600">Expired</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-7 w-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold">Verified Venues</h1>
            <p className="text-sm text-muted-foreground">Verified & subscribed venue contacts that can receive advertising campaign requests.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search venue, contact, or email" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-72" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active Subscription</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="pending">Verification Pending</SelectItem>
                    <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button disabled={selectedIds.length === 0} onClick={() => setDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Campaign ({selectedActive.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">No verified venues yet. Send a subscription invitation from a listing.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                      <tr>
                        <th className="p-2 w-8"></th>
                        {[
                          ["venue_name", "Venue"],
                          ["contact_person", "Contact"],
                          ["email", "Email"],
                          ["subscription_status", "Status"],
                          ["verified_at", "Verified"],
                          ["last_contacted_at", "Last Contacted"],
                          ["campaign_status", "Campaign"],
                        ].map(([k, l]) => (
                          <th key={k} className="p-2 cursor-pointer" onClick={() => toggleSort(k as keyof Subscription)}>
                            <span className="inline-flex items-center gap-1">{l}<ArrowUpDown className="h-3 w-3 opacity-50" /></span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map(r => (
                        <tr key={r.id} className="border-b hover:bg-muted/30">
                          <td className="p-2">
                            <Checkbox
                              checked={!!selected[r.id]}
                              onCheckedChange={(v) => setSelected(s => ({ ...s, [r.id]: !!v }))}
                              disabled={r.subscription_status !== "active"}
                            />
                          </td>
                          <td className="p-2 font-medium">{r.venue_name || "—"}</td>
                          <td className="p-2">{r.contact_person || "—"}</td>
                          <td className="p-2">{r.email}</td>
                          <td className="p-2">{badgeFor(r)}</td>
                          <td className="p-2">{r.verified_at ? new Date(r.verified_at).toLocaleDateString() : "—"}</td>
                          <td className="p-2">{r.last_contacted_at ? new Date(r.last_contacted_at).toLocaleDateString() : "—"}</td>
                          <td className="p-2 text-xs">{r.campaign_status || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-muted-foreground">
                    Page {page} of {totalPages} · {filtered.length} venue(s)
                  </span>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send campaign message to {selectedActive.length} venue(s)</DialogTitle>
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
              <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Campaign invitation from TrioTag" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={8} value={message} onChange={e => setMessage(e.target.value)} placeholder="Include any relevant links (e.g. https://...) — clicks and opens will be tracked." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={sendCampaign} disabled={sending}>
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send to {selectedActive.length}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerifiedVenues;
