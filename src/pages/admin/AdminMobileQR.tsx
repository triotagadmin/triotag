import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, MoreHorizontal, Plus, Smartphone, BarChart3, Copy, Download, Eye, Pencil,
} from "lucide-react";
import { MOBILE_QR_STATUSES, statusBadgeClass, trackingUrl } from "@/lib/mobileQr";

type MobileQr = {
  id: string;
  name: string | null;
  qr_ref: string | null;
  status: string;
  campaign_id: string | null;
  advertiser_id: string | null;
  ad_space_id: string | null;
  placement_label: string | null;
  landing_title: string | null;
  offer_cta: string | null;
  description: string | null;
  destination_url: string;
  logo_url: string | null;
  background_url: string | null;
  brand_name: string | null;
  terms_text: string | null;
  privacy_policy_url: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type FormState = Omit<MobileQr, "id" | "qr_ref" | "created_at">;

const emptyForm = (): FormState => ({
  name: "",
  status: "draft",
  campaign_id: null,
  advertiser_id: null,
  ad_space_id: null,
  placement_label: "",
  landing_title: "",
  offer_cta: "View Offer",
  description: "",
  destination_url: "",
  logo_url: "",
  background_url: "",
  brand_name: "",
  terms_text: "",
  privacy_policy_url: "",
  start_date: null,
  end_date: null,
});

export default function AdminMobileQR() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<MobileQr[]>([]);
  const [stats, setStats] = useState<Record<string, { scans: number; leads: number }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MobileQr | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [downloadQr, setDownloadQr] = useState<MobileQr | null>(null);

  const [campaigns, setCampaigns] = useState<{ id: string; name: string | null; advertiser_id: string | null }[]>([]);
  const [advertisers, setAdvertisers] = useState<{ user_id: string; company_name: string | null }[]>([]);
  const [placements, setPlacements] = useState<{ id: string; title: string | null }[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("qr_codes")
      .select("*")
      .eq("qr_type", "MOBILE_QR")
      .order("created_at", { ascending: false });
    const list = (data as MobileQr[]) || [];
    setRows(list);

    const ids = list.map((r) => r.id);
    if (ids.length) {
      const [{ data: events }, { data: leads }] = await Promise.all([
        supabase.from("mobile_qr_events").select("qr_id").eq("event_type", "scan").in("qr_id", ids),
        supabase.from("mobile_qr_leads").select("qr_id").eq("mobile_verified", true).in("qr_id", ids),
      ]);
      const map: Record<string, { scans: number; leads: number }> = {};
      ids.forEach((id) => (map[id] = { scans: 0, leads: 0 }));
      (events || []).forEach((e: any) => (map[e.qr_id].scans += 1));
      (leads || []).forEach((l: any) => (map[l.qr_id].leads += 1));
      setStats(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    (async () => {
      const [{ data: c }, { data: a }, { data: p }] = await Promise.all([
        supabase.from("campaigns").select("id, name, advertiser_id").order("created_at", { ascending: false }).limit(200),
        supabase.from("advertiser_profiles").select("user_id, company_name").limit(200),
        supabase.from("ad_spaces").select("id, title").eq("approval_status", "approved").limit(200),
      ]);
      setCampaigns((c as any) || []);
      setAdvertisers((a as any) || []);
      setPlacements((p as any) || []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.qr_ref, r.brand_name].some((v) => v?.toLowerCase().includes(q)));
  }, [rows, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: MobileQr) => {
    setEditing(row);
    const { id, qr_ref, created_at, ...rest } = row;
    setForm(rest as FormState);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name?.trim()) return toast({ title: "QR Name is required", variant: "destructive" });
    if (!form.destination_url?.trim()) return toast({ title: "Destination URL is required", variant: "destructive" });
    if (!form.landing_title?.trim()) return toast({ title: "Landing Page Title is required", variant: "destructive" });
    if (!form.offer_cta?.trim()) return toast({ title: "Offer / CTA is required", variant: "destructive" });
    if (!form.campaign_id) return toast({ title: "Campaign is required", variant: "destructive" });
    if (!form.advertiser_id) return toast({ title: "Advertiser is required", variant: "destructive" });
    if (!form.start_date || !form.end_date) return toast({ title: "Start and end dates are required", variant: "destructive" });

    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from("qr_codes").update(form).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Mobile QR updated" });
      } else {
        const { data: refData, error: refError } = await supabase.rpc("next_mobile_qr_ref");
        if (refError) throw refError;
        const qrRef = refData as unknown as string;
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase.from("qr_codes").insert({
          ...form,
          qr_type: "MOBILE_QR",
          qr_ref: qrRef,
          short_code: qrRef.toLowerCase(),
          created_by: userData.user?.id ?? null,
          is_active: form.status === "active",
        });
        if (error) throw error;
        toast({ title: "Mobile QR created", description: qrRef });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (row: MobileQr, status: string) => {
    const { error } = await supabase
      .from("qr_codes")
      .update({ status, is_active: status === "active" })
      .eq("id", row.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    toast({ title: `Mobile QR ${status}` });
    load();
  };

  const copyUrl = (row: MobileQr) => {
    if (!row.qr_ref) return;
    navigator.clipboard.writeText(trackingUrl(row.qr_ref));
    toast({ title: "Tracking URL copied" });
  };

  const downloadPng = () => {
    const canvas = canvasRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas || !downloadQr?.qr_ref) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${downloadQr.qr_ref}.png`;
    a.click();
  };

  const downloadSvg = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg || !downloadQr?.qr_ref) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${downloadQr.qr_ref}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Smartphone className="h-6 w-6 text-primary" /> Mobile QR
          </h1>
          <p className="text-sm text-muted-foreground">
            QR codes designed to drive users to a mobile-first lead capture experience.
          </p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Mobile QR</Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{filtered.length} Mobile QRs</CardTitle>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="max-w-xs" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>QR Name</TableHead>
                    <TableHead>QR ID</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Advertiser</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead className="text-right">Verified Leads</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.qr_ref}</TableCell>
                      <TableCell className="text-sm">
                        {campaigns.find((c) => c.id === r.campaign_id)?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {advertisers.find((a) => a.user_id === r.advertiser_id)?.company_name || r.brand_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{stats[r.id]?.scans ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{stats[r.id]?.leads ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a href={r.qr_ref ? trackingUrl(r.qr_ref) : "#"} target="_blank" rel="noreferrer">
                                <Eye className="mr-2 h-4 w-4" /> View
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/mobile-qr/${r.id}/analytics`)}>
                              <BarChart3 className="mr-2 h-4 w-4" /> Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDownloadQr(r)}>
                              <Download className="mr-2 h-4 w-4" /> Download QR
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyUrl(r)}>
                              <Copy className="mr-2 h-4 w-4" /> Copy tracking URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(r, "active")}>Activate</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(r, "paused")}>Pause</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatus(r, "archived")}>Archive</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                        No Mobile QRs yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Mobile QR" : "New Mobile QR"}</DialogTitle>
            <DialogDescription>
              The QR encodes a TrioTag tracking URL, so every scan is attributed before the landing page loads.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>QR Name</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <Label>Campaign</Label>
              <Select
                value={form.campaign_id ?? undefined}
                onValueChange={(v) => {
                  const c = campaigns.find((x) => x.id === v);
                  setForm({ ...form, campaign_id: v, advertiser_id: form.advertiser_id || c?.advertiser_id || null });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name || c.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Advertiser</Label>
              <Select value={form.advertiser_id ?? undefined} onValueChange={(v) => setForm({ ...form, advertiser_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select advertiser" /></SelectTrigger>
                <SelectContent>
                  {advertisers.map((a) => (
                    <SelectItem key={a.user_id} value={a.user_id}>{a.company_name || a.user_id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Placement (Ad Space)</Label>
              <Select value={form.ad_space_id ?? undefined} onValueChange={(v) => setForm({ ...form, ad_space_id: v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {placements.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title || p.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Placement Label</Label>
              <Input value={form.placement_label ?? ""} onChange={(e) => setForm({ ...form, placement_label: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <Label>Landing Page Title</Label>
              <Input value={form.landing_title ?? ""} onChange={(e) => setForm({ ...form, landing_title: e.target.value })} />
            </div>

            <div>
              <Label>Offer / CTA</Label>
              <Input value={form.offer_cta ?? ""} onChange={(e) => setForm({ ...form, offer_cta: e.target.value })} />
            </div>

            <div>
              <Label>Destination URL</Label>
              <Input value={form.destination_url ?? ""} onChange={(e) => setForm({ ...form, destination_url: e.target.value })} />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOBILE_QR_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Description (optional)</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <Label>Brand Name (optional)</Label>
              <Input value={form.brand_name ?? ""} onChange={(e) => setForm({ ...form, brand_name: e.target.value })} />
            </div>

            <div>
              <Label>Logo URL (optional)</Label>
              <Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
            </div>

            <div>
              <Label>Background Image URL (optional)</Label>
              <Input value={form.background_url ?? ""} onChange={(e) => setForm({ ...form, background_url: e.target.value })} />
            </div>

            <div>
              <Label>Privacy Policy URL (optional)</Label>
              <Input value={form.privacy_policy_url ?? ""} onChange={(e) => setForm({ ...form, privacy_policy_url: e.target.value })} />
            </div>

            <div className="sm:col-span-2">
              <Label>Terms &amp; Conditions (optional)</Label>
              <Textarea value={form.terms_text ?? ""} onChange={(e) => setForm({ ...form, terms_text: e.target.value })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Create Mobile QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download */}
      <Dialog open={!!downloadQr} onOpenChange={(o) => !o && setDownloadQr(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Download QR</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {downloadQr?.qr_ref && trackingUrl(downloadQr.qr_ref)}
            </DialogDescription>
          </DialogHeader>
          {downloadQr?.qr_ref && (
            <div className="flex flex-col items-center gap-4">
              <div ref={canvasRef} className="rounded-xl bg-white p-4">
                <QRCodeCanvas value={trackingUrl(downloadQr.qr_ref)} size={220} level="H" includeMargin />
              </div>
              <div ref={svgRef} className="hidden">
                <QRCodeSVG value={trackingUrl(downloadQr.qr_ref)} size={512} level="H" includeMargin />
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadPng}><Download className="mr-2 h-4 w-4" /> PNG</Button>
                <Button variant="outline" onClick={downloadSvg}><Download className="mr-2 h-4 w-4" /> SVG</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
