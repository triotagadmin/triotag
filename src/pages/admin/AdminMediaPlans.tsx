import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Loader2, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Status = "pending_payment" | "paid" | "approved" | "activated" | "rejected";

const STATUS_STYLE: Record<string, string> = {
  pending_payment: "bg-gray-100 text-gray-600 border border-gray-200",
  paid: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  approved: "bg-blue-100 text-blue-700 border border-blue-200",
  activated: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};
const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending Payment",
  paid: "Paid — Awaiting Review",
  approved: "Approved",
  activated: "Activated",
  rejected: "Rejected",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}>
      {status === "paid" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
      )}
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function formatTypes(t: string | null | undefined) {
  if (!t) return [];
  return String(t).split(",").map((s) => s.trim()).filter(Boolean);
}

function typeBadge(t: string) {
  const u = t.toUpperCase();
  if (u === "OOH") return "bg-purple-100 text-purple-700";
  if (u === "DOOH") return "bg-cyan-100 text-cyan-700";
  if (u === "AOOH") return "bg-green-100 text-green-700";
  if (u === "MEDIA_TRUCK") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
}

export default function AdminMediaPlans() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [tab, setTab] = useState<string>("paid");
  const [selected, setSelected] = useState<any | null>(null);
  const [working, setWorking] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media_plan_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[AdminMediaPlans]", error);
      toast.error("Failed to load media plan requests");
    }
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const counts = useMemo(() => ({
    pending_payment: requests.filter((r) => r.status === "pending_payment").length,
    paid: requests.filter((r) => r.status === "paid").length,
    approved: requests.filter((r) => r.status === "approved").length,
    activated: requests.filter((r) => r.status === "activated").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests]);

  const filtered = useMemo(() => {
    if (tab === "all") return requests;
    return requests.filter((r) => r.status === tab);
  }, [requests, tab]);

  const updateStatus = async (id: string, newStatus: string, req: any) => {
    setWorking(true);
    const { error } = await supabase
      .from("media_plan_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update status");
      setWorking(false);
      return;
    }
    if (["approved", "activated", "rejected"].includes(newStatus) && req?.requester_email) {
      supabase.functions.invoke("notify-media-plan-status", {
        body: {
          requestId: id,
          newStatus,
          requesterEmail: req.requester_email,
          campaignName: req.campaign_name,
        },
      }).catch(() => {});
    }
    toast.success(`Marked as ${STATUS_LABEL[newStatus] || newStatus}`);
    await fetchRequests();
    setSelected(null);
    setWorking(false);
  };

  const statCards: Array<{ key: Status; label: string; classes: string; pulse?: boolean }> = [
    { key: "pending_payment", label: "Pending Payment", classes: "bg-gray-50 border-gray-200" },
    { key: "paid", label: "Paid — Awaiting Review", classes: "bg-yellow-50 border-yellow-300", pulse: true },
    { key: "approved", label: "Approved", classes: "bg-blue-50 border-blue-200" },
    { key: "activated", label: "Activated", classes: "bg-green-50 border-green-200" },
    { key: "rejected", label: "Rejected", classes: "bg-red-50 border-red-200" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-7 h-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Plan Requests</h1>
            <p className="text-sm text-gray-500">Review, approve, and activate paid campaigns</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {statCards.map((c) => (
            <Card key={c.key} className={`${c.classes} border`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">{c.label}</span>
                  {c.pulse && counts[c.key] > 0 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{counts[c.key]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
            <TabsTrigger value="paid" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800">
              Needs Action ({counts.paid})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="activated">Activated ({counts.activated})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="pending_payment">Pending Payment ({counts.pending_payment})</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">No requests in this view.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Estimated</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(r)}
                    >
                      <TableCell className="font-medium">{r.campaign_name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {formatTypes(r.campaign_type).map((t) => (
                            <span key={t} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeBadge(t)}`}>{t}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>₱{Number(r.estimated_price || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{r.requester_email || "—"}</TableCell>
                      <TableCell className="text-xs">{r.preferred_start_date || "—"}</TableCell>
                      <TableCell className="text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString("en-PH") : "—"}</TableCell>
                      <TableCell className="text-xs">
                        {r.paid_at ? new Date(r.paid_at).toLocaleDateString("en-PH") : <span className="text-gray-400">Unpaid</span>}
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <ActionButtons request={r} onUpdate={(s) => updateStatus(r.id, s, r)} working={working} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>{selected.campaign_name}</span>
                  <StatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Detail label="Requester Email" value={selected.requester_email || "—"} />
                <Detail label="Estimated Price" value={`₱${Number(selected.estimated_price || 0).toLocaleString()}`} />
                <Detail label="Preferred Start" value={selected.preferred_start_date || "—"} />
                <Detail label="Radius" value={selected.radius_meters ? `${selected.radius_meters} m` : "—"} />
                <Detail label="Venue Count" value={selected.venue_count ?? "—"} />
                <Detail label="Submitted" value={selected.created_at ? new Date(selected.created_at).toLocaleString("en-PH") : "—"} />
                <Detail label="Paid At" value={selected.paid_at ? new Date(selected.paid_at).toLocaleString("en-PH") : "—"} />
                <Detail label="PayMongo ID" value={<span className="text-xs font-mono">{selected.paymongo_checkout_id || "—"}</span>} />
                <Detail label="Units (OOH/DOOH/AOOH)" value={`${selected.ooh_units || 0} / ${selected.dooh_units || 0} / ${selected.aooh_units || 0}`} />
                <Detail label="Campaign Types" value={
                  <div className="flex flex-wrap gap-1">
                    {formatTypes(selected.campaign_type).map((t) => (
                      <span key={t} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeBadge(t)}`}>{t}</span>
                    ))}
                  </div>
                } />
              </div>

              {selected.center_lat && selected.center_lng && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${selected.center_lat}&mlon=${selected.center_lng}#map=14/${selected.center_lat}/${selected.center_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    View campaign location on map
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {Array.isArray(selected.selections) && selected.selections.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 text-sm">Ad Format Selections</h3>
                  <div className="space-y-2">
                    {selected.selections.map((s: any, i: number) => (
                      <div key={i} className="flex justify-between items-start p-3 bg-gray-50 rounded border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{s.label || s.variantId}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {s.category} · ₱{Number(s.price || 0).toLocaleString()} / unit
                          </p>
                          {s.specs && typeof s.specs === "object" && (
                            <div className="text-[11px] text-gray-500 mt-1 space-x-2">
                              {Object.entries(s.specs).map(([k, v]: any) => (
                                <span key={k}>{k}: {String(v)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">× {s.quantity}</p>
                          <p className="text-xs text-gray-600">
                            ₱{(Number(s.price || 0) * Number(s.quantity || 0)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3 py-2 bg-green-50 border border-green-200 rounded font-semibold text-sm">
                      <span>Total Estimate</span>
                      <span>₱{Number(selected.estimated_price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {selected.notes && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1 text-sm">Notes from Advertiser</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{selected.notes}</p>
                </div>
              )}

              <DialogFooter className="mt-4 gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                {selected.status === "paid" && (
                  <>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={working}
                      onClick={() => updateStatus(selected.id, "rejected", selected)}
                    >
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={working}
                      onClick={() => updateStatus(selected.id, "approved", selected)}
                    >
                      {working ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve Campaign"}
                    </Button>
                  </>
                )}
                {selected.status === "approved" && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={working}
                    onClick={() => updateStatus(selected.id, "activated", selected)}
                  >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : "Mark as Activated"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionButtons({ request, onUpdate, working }: { request: any; onUpdate: (s: string) => void; working: boolean }) {
  if (request.status === "paid") {
    return (
      <div className="flex gap-1 justify-end">
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs" disabled={working} onClick={() => onUpdate("approved")}>
          Approve
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50" disabled={working} onClick={() => onUpdate("rejected")}>
          Reject
        </Button>
      </div>
    );
  }
  if (request.status === "approved") {
    return (
      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs" disabled={working} onClick={() => onUpdate("activated")}>
        Mark Activated
      </Button>
    );
  }
  if (request.status === "activated") {
    return <span className="text-green-600 text-xs font-medium">✓ Live</span>;
  }
  if (request.status === "rejected") {
    return (
      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={working} onClick={() => onUpdate("paid")}>
        Undo Reject
      </Button>
    );
  }
  return <span className="text-gray-400 text-xs">—</span>;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
