import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";

type BrandCampaign = {
  id: string;
  brand_advertiser_id: string | null;
  campaign_name: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  environments: string[] | null;
  countries: string[] | null;
  target_age_min: number | null;
  target_age_max: number | null;
  target_gender: string | null;
  creative_format: string | null;
  notes: string | null;
  status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  brand_advertiser_profiles?: { company_name: string | null } | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  draft: "bg-gray-100 text-gray-600 border border-gray-200",
  paid: "bg-blue-100 text-blue-700 border border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
};
const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
  paid: "Awaiting Review",
  completed: "Completed",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}>
      {status === "pending_review" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
      )}
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <div className="text-sm text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

type MediaPlanRequest = {
  id: string;
  campaign_name: string | null;
  campaign_type: string | null;
  requester_email: string | null;
  center_lat: number | null;
  center_lng: number | null;
  radius_meters: number | null;
  selections: any;
  preferred_start_date: string | null;
  preferred_end_date: string | null;

  notes: string | null;
  status: string | null;
  created_at: string | null;
};

const REQUEST_STATUSES = ["pending_review", "paid", "approved", "rejected", "completed"];

function ExploreCampaignRequests() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MediaPlanRequest[]>([]);
  const [selected, setSelected] = useState<MediaPlanRequest | null>(null);
  const [working, setWorking] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media_plan_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[ExploreCampaignRequests]", error);
      toast.error("Failed to load campaign requests");
    }
    setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const setStatus = async (r: MediaPlanRequest, status: string) => {
    setWorking(true);
    const { error } = await supabase
      .from("media_plan_requests" as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", r.id);
    setWorking(false);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Status set to ${status.replace("_", " ")}`);
    setSelected(null);
    await fetchRequests();
  };

  const formats = (s: any): { label: string; quantity: number }[] =>
    Array.isArray(s) ? s.map((x: any) => ({ label: x.label ?? x.variantId ?? "—", quantity: Number(x.quantity) || 0 })) : [];

  return (
    <>
      <Card className="bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">No campaign requests yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Location / Radius</TableHead>
                  <TableHead>Formats</TableHead>
                  <TableHead>Campaign Dates</TableHead>

                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                    <TableCell className="font-medium">{r.campaign_name || "—"}</TableCell>
                    <TableCell className="text-sm">{r.campaign_type || "—"}</TableCell>
                    <TableCell className="text-sm">{r.requester_email || "guest"}</TableCell>
                    <TableCell className="text-xs">
                      {r.center_lat != null && r.center_lng != null
                        ? `${Number(r.center_lat).toFixed(4)}, ${Number(r.center_lng).toFixed(4)}`
                        : "—"}
                      {r.radius_meters ? ` · ${(r.radius_meters / 1000).toFixed(1)} km` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {formats(r.selections).map((f, i) => (
                          <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">
                            {f.label} × {f.quantity}
                          </span>
                        ))}
                        {formats(r.selections).length === 0 && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.preferred_start_date || "—"}
                      {r.preferred_end_date ? ` → ${r.preferred_end_date}` : ""}
                    </TableCell>

                    <TableCell><StatusBadge status={r.status || ""} /></TableCell>
                    <TableCell className="text-xs">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("en-PH") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>{selected.campaign_name || "Untitled Request"}</span>
                  <StatusBadge status={selected.status || ""} />
                </DialogTitle>
                <DialogDescription>{selected.requester_email || "guest"}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Detail label="Campaign Type" value={selected.campaign_type || "—"} />
                <Detail label="Estimated Price" value={`₱${Number(selected.estimated_price || 0).toLocaleString()}`} />
                <Detail label="Map Location" value={
                  selected.center_lat != null && selected.center_lng != null ? (
                    <a
                      className="text-green-700 underline"
                      href={`https://www.openstreetmap.org/?mlat=${selected.center_lat}&mlon=${selected.center_lng}#map=14/${selected.center_lat}/${selected.center_lng}`}
                      target="_blank" rel="noreferrer"
                    >
                      {Number(selected.center_lat).toFixed(5)}, {Number(selected.center_lng).toFixed(5)}
                    </a>
                  ) : "—"
                } />
                <Detail label="Radius" value={selected.radius_meters ? `${(selected.radius_meters / 1000).toFixed(2)} km` : "—"} />
                <Detail label="Preferred Start" value={selected.preferred_start_date || "—"} />
                <Detail label="Submitted" value={selected.created_at ? new Date(selected.created_at).toLocaleString("en-PH") : "—"} />
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-1 text-sm">Selected Formats</h3>
                <div className="flex flex-wrap gap-1">
                  {formats(selected.selections).map((f, i) => (
                    <span key={i} className="text-[11px] font-semibold px-2 py-1 rounded bg-cyan-100 text-cyan-700">
                      {f.label} × {f.quantity}
                    </span>
                  ))}
                  {formats(selected.selections).length === 0 && <span className="text-sm text-gray-500">—</span>}
                </div>
              </div>

              {selected.notes && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1 text-sm">Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded border">{selected.notes}</p>
                </div>
              )}

              <DialogFooter className="mt-4 gap-2 flex-wrap">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                {REQUEST_STATUSES.filter((s) => s !== selected.status).map((s) => (
                  <Button
                    key={s}
                    variant={s === "rejected" ? "destructive" : "default"}
                    className={s === "approved" ? "bg-green-600 hover:bg-green-700 text-white" : undefined}
                    disabled={working}
                    onClick={() => setStatus(selected, s)}
                  >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : `Mark ${s.replace("_", " ")}`}
                  </Button>
                ))}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminBrandCampaigns() {
  const [section, setSection] = useState<string>("brand");
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [tab, setTab] = useState<string>("pending_review");
  const [selected, setSelected] = useState<BrandCampaign | null>(null);
  const [working, setWorking] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<BrandCampaign | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("brand_campaigns")
      .select("*, brand_advertiser_profiles(company_name)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[AdminBrandCampaigns]", error);
      toast.error("Failed to load brand campaigns");
    }
    setCampaigns((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const counts = useMemo(() => ({
    pending_review: campaigns.filter((c) => c.status === "pending_review").length,
    approved: campaigns.filter((c) => c.status === "approved").length,
    rejected: campaigns.filter((c) => c.status === "rejected").length,
  }), [campaigns]);

  const filtered = useMemo(() => {
    if (tab === "all") return campaigns;
    return campaigns.filter((c) => c.status === tab);
  }, [campaigns, tab]);

  const approve = async (c: BrandCampaign) => {
    setWorking(true);
    const { error } = await supabase
      .from("brand_campaigns")
      .update({ status: "approved", rejection_reason: null, updated_at: new Date().toISOString() })
      .eq("id", c.id);
    setWorking(false);
    if (error) {
      toast.error("Failed to approve");
      return;
    }
    toast.success("Campaign approved");
    setSelected(null);
    await fetchCampaigns();
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setWorking(true);
    const { error } = await supabase
      .from("brand_campaigns")
      .update({
        status: "rejected",
        rejection_reason: rejectReason.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rejectTarget.id);
    setWorking(false);
    if (error) {
      toast.error("Failed to reject");
      return;
    }
    toast.success("Campaign rejected");
    setRejectTarget(null);
    setRejectReason("");
    setSelected(null);
    await fetchCampaigns();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Megaphone className="w-7 h-7 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500">Review brand campaigns and Explore campaign requests</p>
          </div>
        </div>

        <Tabs value={section} onValueChange={setSection} className="mb-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="brand">Brand Campaigns</TabsTrigger>
            <TabsTrigger value="explore">Explore Campaign Requests</TabsTrigger>
          </TabsList>
        </Tabs>

        {section === "brand" ? (
        <>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-yellow-50 border-yellow-300 border">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-600">Pending Review</span>
              <div className="text-3xl font-bold text-gray-900 mt-2">{counts.pending_review}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200 border">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-600">Approved</span>
              <div className="text-3xl font-bold text-gray-900 mt-2">{counts.approved}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200 border">
            <CardContent className="p-4">
              <span className="text-xs font-medium text-gray-600">Rejected</span>
              <div className="text-3xl font-bold text-gray-900 mt-2">{counts.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="pending_review" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800">
              Pending Review ({counts.pending_review})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved ({counts.approved})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
            <TabsTrigger value="all">All ({campaigns.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">No campaigns in this view.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Environments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <TableCell className="font-medium">{c.campaign_name || "—"}</TableCell>
                      <TableCell className="text-sm">{c.brand_advertiser_profiles?.company_name || "—"}</TableCell>
                      <TableCell>₱{Number(c.budget || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(c.environments || []).map((e) => (
                            <span key={e} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">
                              {e}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={c.status || ""} /></TableCell>
                      <TableCell className="text-xs">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-PH") : "—"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {c.status === "pending_review" ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                              disabled={working}
                              onClick={() => approve(c)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                              disabled={working}
                              onClick={() => { setRejectTarget(c); setRejectReason(""); }}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </>
        ) : (
          <ExploreCampaignRequests />
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white text-gray-900">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>{selected.campaign_name || "Untitled Campaign"}</span>
                  <StatusBadge status={selected.status || ""} />
                </DialogTitle>
                <DialogDescription>
                  {selected.brand_advertiser_profiles?.company_name || "Unknown company"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Detail label="Budget" value={`₱${Number(selected.budget || 0).toLocaleString()}`} />
                <Detail label="Creative Format" value={selected.creative_format || "—"} />
                <Detail label="Start Date" value={selected.start_date || "—"} />
                <Detail label="End Date" value={selected.end_date || "—"} />
                <Detail label="Target Age" value={
                  selected.target_age_min || selected.target_age_max
                    ? `${selected.target_age_min ?? "—"} – ${selected.target_age_max ?? "—"}`
                    : "Any"
                } />
                <Detail label="Target Gender" value={selected.target_gender || "Any"} />
                <Detail label="Environments" value={
                  <div className="flex flex-wrap gap-1">
                    {(selected.environments || []).map((e) => (
                      <span key={e} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">
                        {e}
                      </span>
                    ))}
                    {(!selected.environments || selected.environments.length === 0) && <span className="text-sm text-gray-500">—</span>}
                  </div>
                } />
                <Detail label="Countries" value={
                  <div className="flex flex-wrap gap-1">
                    {(selected.countries || []).map((c) => (
                      <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        {c}
                      </span>
                    ))}
                    {(!selected.countries || selected.countries.length === 0) && <span className="text-sm text-gray-500">—</span>}
                  </div>
                } />
                <Detail label="Submitted" value={
                  selected.created_at ? new Date(selected.created_at).toLocaleString("en-PH") : "—"
                } />
              </div>

              {selected.notes && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1 text-sm">Notes from Advertiser</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded border">
                    {selected.notes}
                  </p>
                </div>
              )}

              {selected.status === "rejected" && selected.rejection_reason && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1 text-sm text-red-700">Rejection Reason</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-red-50 border border-red-200 rounded">
                    {selected.rejection_reason}
                  </p>
                </div>
              )}

              <DialogFooter className="mt-4 gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                {selected.status === "pending_review" && (
                  <>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={working}
                      onClick={() => { setRejectTarget(selected); setRejectReason(""); }}
                    >
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={working}
                      onClick={() => approve(selected)}
                    >
                      {working ? <Loader2 className="w-4 h-4 animate-spin" /> : "Approve Campaign"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="max-w-md bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Reject Campaign</DialogTitle>
            <DialogDescription>
              Optionally provide a reason. This will be visible to the advertiser.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={working}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmReject}
              disabled={working}
            >
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
