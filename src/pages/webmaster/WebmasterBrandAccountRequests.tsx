import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, StatusBadge, Empty } from "./ui";
import { Loader2, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  user_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  industry: string | null;
  website_domain: string | null;
  campaign_pillar: string | null;
  approval_status: string | null;
  rejection_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string | null;
};

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString() : "—");

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-sm">{value || "—"}</p>
  </div>
);

export default function WebmasterBrandAccountRequests() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Row | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brand_advertiser_profiles")
      .select("id, user_id, company_name, contact_name, contact_email, contact_phone, industry, website_domain, campaign_pillar, approval_status, rejection_reason, approved_at, rejected_at, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load brand account requests");
    setRows((data as unknown as Row[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, suspended: 0 };
    rows.forEach((r) => {
      const s = (r.approval_status || "pending") as keyof typeof c;
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const s = r.approval_status || "pending";
      if (tab !== "all" && s !== tab) return false;
      if (!q) return true;
      return [r.company_name, r.contact_name, r.contact_email, r.industry]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, tab, search]);

  const review = async (row: Row, decision: "approved" | "rejected", rejectionReason?: string) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("webmaster-brand-account-review", {
      body: { profileId: row.id, decision, reason: rejectionReason || null },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || "Action failed — Webmaster authorization required");
      return;
    }
    toast.success(decision === "approved" ? "Account approved" : "Request rejected");
    setDetail(null);
    setRejectTarget(null);
    setReason("");
    await load();
    window.dispatchEvent(new CustomEvent("brand-requests-changed"));
  };

  return (
    <div>
      <PageHeader
        title="Brand Account Request"
        subtitle="Review and manage Brand Advertiser account registration requests."
        scope="GLOBAL BRAND ADVERTISERS"
        actions={<Button variant="outline" size="sm" onClick={load}>Refresh</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Rejected" value={counts.rejected} />
        <Stat label="Total" value={rows.length} />
      </div>

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact or email"
            className="h-9 max-w-xs"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-green-400" /></div>
        ) : filtered.length === 0 ? (
          <Empty>No {tab === "all" ? "" : tab} brand account requests.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company / Brand</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const status = r.approval_status || "pending";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.company_name || "—"}</TableCell>
                      <TableCell>{r.contact_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.contact_email || "—"}</TableCell>
                      <TableCell>{r.industry || "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{fmt(r.created_at)}</TableCell>
                      <TableCell><StatusBadge status={status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setDetail(r)}>
                            <Eye className="mr-1 h-3.5 w-3.5" />View
                          </Button>
                          {status === "pending" && (
                            <>
                              <Button size="sm" disabled={busy} onClick={() => review(r, "approved")}>
                                <Check className="mr-1 h-3.5 w-3.5" />Approve
                              </Button>
                              <Button size="sm" variant="destructive" disabled={busy} onClick={() => { setRejectTarget(r); setReason(""); }}>
                                <X className="mr-1 h-3.5 w-3.5" />Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.company_name || "Brand account request"}</DialogTitle>
            <DialogDescription>Registration details submitted by the applicant.</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company / Brand" value={detail.company_name} />
              <Field label="Contact Person" value={detail.contact_name} />
              <Field label="Business Email" value={detail.contact_email} />
              <Field label="Phone" value={detail.contact_phone} />
              <Field label="Website" value={detail.website_domain} />
              <Field label="Industry" value={detail.industry} />
              <Field label="Campaign Focus" value={detail.campaign_pillar} />
              <Field label="Account Type" value="Brand Advertiser (global)" />
              <Field label="Registered" value={fmt(detail.created_at)} />
              <Field label="Current Status" value={<StatusBadge status={detail.approval_status || "pending"} />} />
              <Field label="Auth User ID" value={detail.user_id ? <span className="break-all text-xs">{detail.user_id}</span> : <span className="text-amber-300">Unlinked — needs manual resolution</span>} />
              {detail.rejection_reason && <Field label="Rejection Reason" value={detail.rejection_reason} />}
            </div>
          )}
          <DialogFooter>
            {detail && (detail.approval_status || "pending") === "pending" && (
              <>
                <Button variant="destructive" disabled={busy} onClick={() => { setRejectTarget(detail); setReason(""); }}>Reject</Button>
                <Button disabled={busy} onClick={() => review(detail, "approved")}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this brand account request?</DialogTitle>
            <DialogDescription>
              {rejectTarget?.company_name} will be notified. The request is kept in your history.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={busy} onClick={() => rejectTarget && review(rejectTarget, "rejected", reason)}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
