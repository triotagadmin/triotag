import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

type BrandProfile = {
  id: string;
  user_id: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  industry: string | null;
  approval_status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
};


const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}>
      {status === "pending" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
      )}
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function AdminBrandAdvertiserApprovals() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BrandProfile[]>([]);
  const [working, setWorking] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<BrandProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detail, setDetail] = useState<BrandProfile | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brand_advertiser_profiles")
      .select("id, user_id, company_name, contact_name, contact_email, contact_phone, industry, approval_status, rejection_reason, created_at")
      .order("created_at", { ascending: false });
    if (error) {

      console.error("[AdminBrandAdvertiserApprovals]", error);
      toast.error("Failed to load brand advertiser accounts");
    }
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0 };
    rows.forEach((r) => {
      const s = (r.approval_status || "pending") as keyof typeof c;
      if (c[s] !== undefined) c[s] += 1;
    });
    return c;
  }, [rows]);

  const approve = async (r: BrandProfile) => {
    setWorking(true);
    const { error } = await supabase
      .from("brand_advertiser_profiles")
      .update({ approval_status: "approved", rejection_reason: null })
      .eq("id", r.id);
    setWorking(false);
    if (error) { toast.error("Failed to approve account"); return; }
    toast.success("Account approved");
    setDetail(null);
    await fetchRows();

  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setWorking(true);
    const { error } = await supabase
      .from("brand_advertiser_profiles")
      .update({ approval_status: "rejected", rejection_reason: rejectReason || null })
      .eq("id", rejectTarget.id);
    setWorking(false);
    if (error) { toast.error("Failed to reject account"); return; }
    toast.success("Account rejected");
    setRejectTarget(null);
    setDetail(null);
    setRejectReason("");

    await fetchRows();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-green-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Brand Advertiser Approvals</h1>
            <p className="text-sm text-gray-500">Review and approve new Brand Advertiser accounts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <Card key={s} className="bg-white">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">{STATUS_LABEL[s]}</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{counts[s]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">No brand advertiser accounts yet.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const status = r.approval_status || "pending";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.company_name || "—"}</TableCell>
                        <TableCell>{r.contact_name || "—"}</TableCell>
                        <TableCell className="text-sm text-gray-600">{r.contact_email || "—"}</TableCell>
                        <TableCell>{r.industry || "—"}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell><StatusBadge status={status} /></TableCell>
                        <TableCell className="text-right space-x-2">
                          {status !== "approved" && (
                            <Button size="sm" disabled={working} onClick={() => approve(r)}>
                              {working && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                              Approve
                            </Button>
                          )}
                          {status !== "rejected" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={working}
                              onClick={() => { setRejectTarget(r); setRejectReason(r.rejection_reason || ""); }}
                            >
                              Reject
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectReason(""); } }}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reject account</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {rejectTarget?.company_name || "this account"}. The advertiser will see it.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" disabled={working} onClick={confirmReject}>
              {working && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
