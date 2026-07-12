import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import {
  Package, Download, Search, Users, CheckCircle2, ChevronLeft, ChevronRight, Plus,
  Check, X, Clock,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type MediaType = "OOH" | "DOOH" | "AOOH";

const PAGE_SIZE = 20;

const fmtPHP = (v: any) =>
  v == null || v === "" ? "—" : `₱${Number(v).toLocaleString()}`;

const formatBadge = (mt: string) => {
  if (mt === "OOH") return "bg-purple-100 text-purple-700 hover:bg-purple-100";
  if (mt === "DOOH") return "bg-cyan-100 text-cyan-700 hover:bg-cyan-100";
  return "bg-green-100 text-green-700 hover:bg-green-100";
};

export default function AdminTotalInventory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [pendingSpaces, setPendingSpaces] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [tab, setTab] = useState<"approved" | "pending">("approved");
  const [search, setSearch] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"ALL" | MediaType>("ALL");
  const [availFilter, setAvailFilter] = useState<string>("all");
  const [retailerFilter, setRetailerFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    location: "",
    media_type: "OOH" as MediaType,
    weekly: "",
    monthly: "",
    specifications: "",
  });

  const loadInventory = async () => {
    setLoading(true);
    setQueryError(null);
    const { data, error } = await supabase
      .from("ad_spaces")
      .select(`
        id, title, location, media_type, approval_status, availability_status,
        monthly_subscription_fee, activation_fee, created_at, approved_at,
        publisher_id,
        publisher_profiles (
          business_name, contact_email, user_id, is_house_account
        )
      `)
      .eq("approval_status", "approved")
      .order("approved_at", { ascending: false });

    if (error) {
      console.error("[AdminTotalInventory] Query error:", error.message);
      setQueryError(error.message);
    }
    setSpaces(data || []);
    setLoading(false);
  };

  const loadPending = async () => {
    setPendingLoading(true);
    const { data, error } = await supabase
      .from("ad_spaces")
      .select(`
        id, title, location, media_type, approval_status, availability_status,
        specifications, created_at, publisher_id,
        publisher_profiles ( business_name, contact_email )
      `)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[AdminTotalInventory] Pending query error:", error.message);
    }
    setPendingSpaces(data || []);
    setPendingLoading(false);
  };

  useEffect(() => { loadInventory(); loadPending(); }, []);

  const handleApprove = async (row: any) => {
    setActionBusyId(row.id);
    try {
      const { error } = await supabase
        .from("ad_spaces")
        .update({
          approval_status: "approved",
          availability_status: "available",
          approved_at: new Date().toISOString(),
        } as any)
        .eq("id", row.id);
      if (error) throw error;
      toast.success(`Approved "${row.title}"`);
      setPendingSpaces((prev) => prev.filter((r) => r.id !== row.id));
      loadInventory();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setActionBusyId(rejectTarget.id);
    try {
      const { error } = await supabase
        .from("ad_spaces")
        .update({
          approval_status: "rejected",
          rejection_reason: rejectReason.trim() || null,
        } as any)
        .eq("id", rejectTarget.id);
      if (error) throw error;
      toast.success(`Rejected "${rejectTarget.title}"`);
      setPendingSpaces((prev) => prev.filter((r) => r.id !== rejectTarget.id));
      setRejectTarget(null);
      setRejectReason("");
    } catch (e: any) {
      toast.error(e.message || "Failed to reject");
    } finally {
      setActionBusyId(null);
    }
  };


  const handleAdd = async () => {
    if (!form.title.trim() || !form.location.trim()) {
      toast.error("Title and location are required");
      return;
    }
    let specs: any = {};
    if (form.specifications.trim()) {
      try {
        specs = JSON.parse(form.specifications);
      } catch {
        toast.error("Specifications must be valid JSON");
        return;
      }
    }
    setSaving(true);
    try {
      // 1. Find or create house publisher_profiles row
      const { data: existing, error: findErr } = await supabase
        .from("publisher_profiles")
        .select("id")
        .eq("is_house_account", true)
        .maybeSingle();
      if (findErr) throw findErr;

      let houseId = existing?.id;
      if (!houseId) {
        const { data: created, error: createErr } = await supabase
          .from("publisher_profiles")
          .insert({
            business_name: "TrioTag",
            contact_email: "tinystickyads@gmail.com",
            publisher_type: "digital",
            verification_status: "approved",
            verified: true,
            is_house_account: true,
            user_id: null,
          } as any)
          .select("id")
          .single();
        if (createErr) throw createErr;
        houseId = created.id;
      }

      const pricing: any = {};
      if (form.weekly) pricing.weekly = parseFloat(form.weekly);
      if (form.monthly) pricing.monthly = parseFloat(form.monthly);

      const { error: insErr } = await supabase.from("ad_spaces").insert({
        publisher_id: houseId,
        title: form.title.trim(),
        location: form.location.trim(),
        media_type: form.media_type,
        approval_status: "approved",
        availability_status: "available",
        approved_at: new Date().toISOString(),
        pricing,
        specifications: specs,
      } as any);
      if (insErr) throw insErr;

      toast.success("Inventory added");
      setAddOpen(false);
      setForm({ title: "", location: "", media_type: "OOH", weekly: "", monthly: "", specifications: "" });
      await loadInventory();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to add inventory");
    } finally {
      setSaving(false);
    }
  };


  const totals = useMemo(() => {
    const by = (mt: string) => spaces.filter((s) => String(s.media_type).toUpperCase() === mt).length;
    return {
      total: spaces.length,
      ooh: by("OOH"),
      dooh: by("DOOH"),
      aooh: by("AOOH"),
      retailers: new Set(spaces.map((s) => s.publisher_id).filter(Boolean)).size,
      available: spaces.filter((s) => s.availability_status === "available").length,
    };
  }, [spaces]);

  const retailerOptions = useMemo(() => {
    const set = new Map<string, string>();
    spaces.forEach((s) => {
      const name = s.publisher_profiles?.business_name;
      if (name) set.set(name, name);
    });
    return Array.from(set.keys()).sort();
  }, [spaces]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spaces.filter((s) => {
      const mt = String(s.media_type || "").toUpperCase();
      if (mediaFilter !== "ALL" && mt !== mediaFilter) return false;
      if (availFilter !== "all" && (s.availability_status || "unknown") !== availFilter) return false;
      if (retailerFilter !== "all" && s.publisher_profiles?.business_name !== retailerFilter) return false;
      if (q) {
        const hay = `${s.title || ""} ${s.location || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [spaces, search, mediaFilter, availFilter, retailerFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, mediaFilter, availFilter, retailerFilter]);

  const chartData = [
    { name: "OOH", value: totals.ooh, fill: "#a855f7" },
    { name: "DOOH", value: totals.dooh, fill: "#06b6d4" },
    { name: "AOOH", value: totals.aooh, fill: "#22c55e" },
  ];

  const exportCSV = () => {
    const headers = [
      "Title", "Location", "Format", "Status", "Retailer", "Contact Email",
      "Monthly Fee", "Activation Fee", "Approved At", "Created At",
    ];
    const rows = filtered.map((s) => [
      s.title || "",
      s.location || "",
      s.media_type || "",
      s.availability_status || "",
      s.publisher_profiles?.business_name || "",
      s.publisher_profiles?.contact_email || "",
      s.monthly_subscription_fee ?? "",
      s.activation_fee ?? "",
      s.approved_at || "",
      s.created_at || "",
    ]);
    const esc = (v: any) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `total-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Package className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Total Inventory</h1>
              <p className="text-muted-foreground text-sm">
                All approved ad spaces across Retailer accounts
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Inventory
            </Button>
            <Button onClick={exportCSV} disabled={!filtered.length} variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {queryError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
            <strong>Failed to load inventory:</strong> {queryError}
          </div>
        )}

        {/* Stats row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Total Ad Spaces" value={totals.total} accent="text-foreground" />
          <StatCard label="OOH Units" value={totals.ooh} accent="text-purple-600" />
          <StatCard label="DOOH Units" value={totals.dooh} accent="text-cyan-600" />
          <StatCard label="AOOH Units" value={totals.aooh} accent="text-green-600" />
        </div>

        {/* Stats row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <StatCard
            label="Active Retailers"
            value={totals.retailers}
            accent="text-foreground"
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            label="Available Now"
            value={totals.available}
            accent="text-foreground"
            icon={<CheckCircle2 className="w-4 h-4" />}
          />
        </div>

        {/* Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Inventory by Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title or location…"
                  className="pl-9"
                />
              </div>
              <Select value={availFilter} onValueChange={setAvailFilter}>
                <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Availability" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All availability</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={retailerFilter} onValueChange={setRetailerFilter}>
                <SelectTrigger className="w-full lg:w-56"><SelectValue placeholder="Retailer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All retailers</SelectItem>
                  {retailerOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["ALL", "OOH", "DOOH", "AOOH"] as const).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mediaFilter === m ? "default" : "outline"}
                  className={mediaFilter === m ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                  onClick={() => setMediaFilter(m)}
                >
                  {m === "ALL" ? "All" : m}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Approved Inventory <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <div>No approved inventory found</div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Retailer</TableHead>
                        <TableHead>Monthly Fee</TableHead>
                        <TableHead>Activation Fee</TableHead>
                        <TableHead>Approved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((s) => {
                        const mt = String(s.media_type || "").toUpperCase();
                        return (
                          <TableRow
                            key={s.id}
                            onClick={() => setSelected(s)}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-medium max-w-[220px] truncate">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{s.title}</span>
                                {s.publisher_profiles?.is_house_account && (
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-primary/20 shrink-0">TrioTag</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate text-muted-foreground">{s.location || "—"}</TableCell>
                            <TableCell><Badge className={formatBadge(mt)}>{mt || "—"}</Badge></TableCell>
                            <TableCell>
                              <Badge variant={s.availability_status === "available" ? "default" : "secondary"}>
                                {s.availability_status || "unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate">
                              {s.publisher_profiles?.is_house_account ? (
                                <span className="inline-flex items-center gap-1">
                                  {s.publisher_profiles?.business_name || "TrioTag"}
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">House</Badge>
                                </span>
                              ) : (s.publisher_profiles?.business_name || "—")}
                            </TableCell>
                            <TableCell>{fmtPHP(s.monthly_subscription_fee)}</TableCell>
                            <TableCell>{fmtPHP(s.activation_fee)}</TableCell>
                            <TableCell>
                              {s.approved_at ? new Date(s.approved_at).toLocaleDateString("en-PH") : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selected?.title}
              {selected && (
                <Badge className={formatBadge(String(selected.media_type).toUpperCase())}>
                  {selected.media_type}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-5 text-sm">
              {/* Status row */}
              <div className="flex flex-wrap gap-2">
                <Badge variant={selected.availability_status === "available" ? "default" : "secondary"}>
                  {selected.availability_status || "unknown"}
                </Badge>
                <Badge variant="outline">{selected.approval_status}</Badge>
              </div>


              {/* Core details */}
              <div>
                <div className="font-semibold text-muted-foreground mb-2">Ad Space Details</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Detail label="Title" value={selected.title || "—"} />
                  <Detail label="Format" value={selected.media_type || "—"} />
                  <Detail label="Location" value={selected.location || "—"} />
                  <Detail label="Availability" value={selected.availability_status || "—"} />
                  <Detail label="Approval Status" value={selected.approval_status || "—"} />
                  <Detail label="Monthly Fee" value={fmtPHP(selected.monthly_subscription_fee)} />
                  <Detail label="Activation Fee" value={fmtPHP(selected.activation_fee)} />
                  <Detail
                    label="Approved At"
                    value={selected.approved_at
                      ? new Date(selected.approved_at).toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" })
                      : "—"}
                  />
                  <Detail
                    label="Submitted At"
                    value={selected.created_at
                      ? new Date(selected.created_at).toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" })
                      : "—"}
                  />
                </div>
              </div>


              {/* Retailer info */}
              <div className="border-t pt-4">
                <div className="font-semibold text-muted-foreground mb-2">Retailer / Publisher</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <Detail label="Business Name" value={selected.publisher_profiles?.business_name || "—"} />
                  <Detail label="Contact Email" value={selected.publisher_profiles?.contact_email || "—"} />
                  <Detail label="Publisher ID" value={
                    <span className="font-mono text-xs text-muted-foreground">{selected.publisher_id || "—"}</span>
                  } />
                </div>
              </div>

              {/* ID */}
              <div className="border-t pt-3">
                <Detail label="Ad Space ID" value={
                  <span className="font-mono text-xs text-muted-foreground">{selected.id}</span>
                } />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Inventory dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => !saving && setAddOpen(o)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add TrioTag Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={200} />
            </div>
            <div>
              <Label>Location *</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} maxLength={300} />
            </div>
            <div>
              <Label>Format *</Label>
              <Select value={form.media_type} onValueChange={(v: MediaType) => setForm((f) => ({ ...f, media_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OOH">OOH</SelectItem>
                  <SelectItem value="DOOH">DOOH</SelectItem>
                  <SelectItem value="AOOH">AOOH</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Weekly Price (₱)</Label>
                <Input type="number" min="0" value={form.weekly} onChange={(e) => setForm((f) => ({ ...f, weekly: e.target.value }))} />
              </div>
              <div>
                <Label>Monthly Price (₱)</Label>
                <Input type="number" min="0" value={form.monthly} onChange={(e) => setForm((f) => ({ ...f, monthly: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Specifications (JSON)</Label>
              <Textarea
                rows={5}
                placeholder='{"venue_type":"mall","dimensions":"3x2m"}'
                value={form.specifications}
                onChange={(e) => setForm((f) => ({ ...f, specifications: e.target.value }))}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">Optional. Must be valid JSON if provided.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
              {saving ? "Adding..." : "Add Inventory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, accent, icon }: { label: string; value: number; accent?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${accent || ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}
