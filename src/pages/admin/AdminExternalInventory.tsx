import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, Plus, Search, Pencil, Archive, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  supply_source: string;
  venue_name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  media_type: "dooh" | "aooh";
  screen_count: number | null;
  base_cpm: number | null;
  min_spot_seconds: number | null;
  max_spot_seconds: number | null;
  notes: string | null;
  contact_name: string | null;
  contact_info: string | null;
  status: "active" | "inactive" | "pending_verification";
  created_at: string;
};

const emptyForm = {
  venue_name: "",
  supply_source: "",
  location: "",
  latitude: "",
  longitude: "",
  media_type: "dooh" as "dooh" | "aooh",
  screen_count: "1",
  base_cpm: "",
  min_spot_seconds: "",
  max_spot_seconds: "",
  notes: "",
  contact_name: "",
  contact_info: "",
  status: "active" as Row["status"],
};

const fmt = (v: any) => (v == null || v === "" ? "—" : v);
const fmtPHP = (v: any) => (v == null || v === "" ? "—" : `₱${Number(v).toLocaleString()}`);

const statusBadge = (s: string) => {
  if (s === "active") return "bg-green-100 text-green-700 hover:bg-green-100";
  if (s === "inactive") return "bg-gray-100 text-gray-600 hover:bg-gray-100";
  return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
};

const typeBadge = (t: string) =>
  t === "dooh"
    ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-100"
    : "bg-green-100 text-green-700 hover:bg-green-100";

export default function AdminExternalInventory() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("external_inventory")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sourceOptions = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.supply_source && s.add(r.supply_source));
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (sourceFilter !== "all" && r.supply_source !== sourceFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (q) {
        const hay = `${r.venue_name} ${r.supply_source} ${r.location ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, sourceFilter, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setForm({
      venue_name: r.venue_name,
      supply_source: r.supply_source,
      location: r.location ?? "",
      latitude: r.latitude != null ? String(r.latitude) : "",
      longitude: r.longitude != null ? String(r.longitude) : "",
      media_type: r.media_type,
      screen_count: r.screen_count != null ? String(r.screen_count) : "",
      base_cpm: r.base_cpm != null ? String(r.base_cpm) : "",
      min_spot_seconds: r.min_spot_seconds != null ? String(r.min_spot_seconds) : "",
      max_spot_seconds: r.max_spot_seconds != null ? String(r.max_spot_seconds) : "",
      notes: r.notes ?? "",
      contact_name: r.contact_name ?? "",
      contact_info: r.contact_info ?? "",
      status: r.status,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.venue_name.trim() || !form.supply_source.trim()) {
      toast.error("Venue name and supply source are required");
      return;
    }
    setSaving(true);
    const payload: any = {
      venue_name: form.venue_name.trim(),
      supply_source: form.supply_source.trim(),
      location: form.location.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      media_type: form.media_type,
      screen_count: form.screen_count ? Number(form.screen_count) : null,
      base_cpm: form.base_cpm ? Number(form.base_cpm) : null,
      min_spot_seconds: form.min_spot_seconds ? Number(form.min_spot_seconds) : null,
      max_spot_seconds: form.max_spot_seconds ? Number(form.max_spot_seconds) : null,
      notes: form.notes.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_info: form.contact_info.trim() || null,
      status: form.status,
    };

    if (editing) {
      const { error } = await (supabase as any)
        .from("external_inventory")
        .update(payload)
        .eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Updated");
    } else {
      const { data: userRes } = await supabase.auth.getUser();
      payload.added_by = userRes?.user?.id ?? null;
      const { error } = await (supabase as any).from("external_inventory").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Added");
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const softDelete = async (r: Row) => {
    if (r.status === "inactive") { toast.info("Already inactive"); return; }
    if (!confirm(`Archive "${r.venue_name}"? It will be marked inactive.`)) return;
    const { error } = await (supabase as any)
      .from("external_inventory")
      .update({ status: "inactive" })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Archived");
    load();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Network className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">External Inventory</h1>
              <p className="text-muted-foreground text-sm">
                Partner supply sources — independent DOOH/AOOH networks outside TrioTag's owned inventory.
              </p>
            </div>
          </div>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Screen / Network
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search venue, source, location…"
                  className="pl-9"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full lg:w-56"><SelectValue placeholder="Supply source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All supply sources</SelectItem>
                  {sourceOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Networks <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Network className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <div>No external inventory yet</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue</TableHead>
                      <TableHead>Supply Source</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Screens</TableHead>
                      <TableHead>Base CPM</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium max-w-[200px] truncate">{r.venue_name}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground">{r.supply_source}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{fmt(r.location)}</TableCell>
                        <TableCell><Badge className={typeBadge(r.media_type)}>{r.media_type.toUpperCase()}</Badge></TableCell>
                        <TableCell>{fmt(r.screen_count)}</TableCell>
                        <TableCell>{fmtPHP(r.base_cpm)}</TableCell>
                        <TableCell><Badge className={statusBadge(r.status)}>{r.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => softDelete(r)} disabled={r.status === "inactive"}>
                            <Archive className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Network" : "Add Screen / Network"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <Field label="Venue name *">
              <Input value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} />
            </Field>
            <Field label="Supply source *">
              <Input
                value={form.supply_source}
                onChange={(e) => setForm({ ...form, supply_source: e.target.value })}
                placeholder="e.g. independent_manila_gyms"
              />
            </Field>
            <Field label="Location" className="sm:col-span-2">
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Latitude">
              <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </Field>
            <Field label="Longitude">
              <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </Field>
            <Field label="Media type *">
              <Select value={form.media_type} onValueChange={(v) => setForm({ ...form, media_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dooh">DOOH</SelectItem>
                  <SelectItem value="aooh">AOOH</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Screen count">
              <Input type="number" min="0" value={form.screen_count} onChange={(e) => setForm({ ...form, screen_count: e.target.value })} />
            </Field>
            <Field label="Base CPM (₱)">
              <Input type="number" step="any" value={form.base_cpm} onChange={(e) => setForm({ ...form, base_cpm: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Min spot seconds">
              <Input type="number" min="0" value={form.min_spot_seconds} onChange={(e) => setForm({ ...form, min_spot_seconds: e.target.value })} />
            </Field>
            <Field label="Max spot seconds">
              <Input type="number" min="0" value={form.max_spot_seconds} onChange={(e) => setForm({ ...form, max_spot_seconds: e.target.value })} />
            </Field>
            <Field label="Contact name">
              <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </Field>
            <Field label="Contact info">
              <Input value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} placeholder="Email or phone" />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
