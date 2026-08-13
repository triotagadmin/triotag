import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Loader2, Copy, Plus } from "lucide-react";
import { toast } from "sonner";

type LocalListingClient = {
  id: string;
  business_name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  category: string | null;
  business_hours: string | null;
  description: string | null;
  gbp_status: string;
  notes: string | null;
  assigned_admin_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600 border border-gray-200",
  profile_created: "bg-blue-100 text-blue-700 border border-blue-200",
  verification_pending: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  verified_live: "bg-green-100 text-green-700 border border-green-200",
};
const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  profile_created: "Profile Created",
  verification_pending: "Verification Pending",
  verified_live: "Verified & Live",
};
const STATUSES = Object.keys(STATUS_LABEL);

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}>
      {status === "verification_pending" && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </span>
      )}
      {STATUS_LABEL[status] || status}
    </span>
  );
}

const EMPTY_FORM = {
  business_name: "",
  address: "",
  phone: "",
  website: "",
  category: "",
  business_hours: "",
  description: "",
  gbp_status: "not_started",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

function buildJsonLd(c: FormState) {
  const hours = (c.business_hours || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: c.business_name || undefined,
    address: c.address
      ? { "@type": "PostalAddress", streetAddress: c.address }
      : undefined,
    telephone: c.phone || undefined,
    url: c.website || undefined,
    description: c.description || undefined,
    openingHours: hours.length ? hours : undefined,
  };
  if (c.category) (schema as any).additionalType = c.category;
  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function buildNap(c: FormState) {
  return [
    `Business Name: ${c.business_name || "-"}`,
    `Address: ${c.address || "-"}`,
    `Phone: ${c.phone || "-"}`,
    `Website: ${c.website || "-"}`,
    `Category: ${c.category || "-"}`,
    "",
    "Hours:",
    c.business_hours || "-",
    "",
    "Description:",
    c.description || "-",
  ].join("\n");
}

function CopyBlock({ title, value }: { title: string; value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${title} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <span className="text-xs font-semibold text-gray-700">{title}</span>
        <Button size="sm" variant="outline" onClick={copy}>
          <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
        </Button>
      </div>
      <pre className="p-3 text-xs whitespace-pre-wrap break-words text-gray-700 max-h-64 overflow-auto">{value}</pre>
    </div>
  );
}

function ClientForm({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const set = (k: keyof FormState) => (e: any) =>
    setForm({ ...form, [k]: e?.target ? e.target.value : e });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Business Name</Label>
        <Input value={form.business_name} onChange={set("business_name")} />
      </div>
      <div className="sm:col-span-2">
        <Label>Address</Label>
        <Input value={form.address} onChange={set("address")} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input value={form.phone} onChange={set("phone")} />
      </div>
      <div>
        <Label>Website</Label>
        <Input value={form.website} onChange={set("website")} />
      </div>
      <div>
        <Label>Category</Label>
        <Input value={form.category} onChange={set("category")} />
      </div>
      <div>
        <Label>Google Business Profile Status</Label>
        <Select value={form.gbp_status} onValueChange={(v) => setForm({ ...form, gbp_status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label>Business Hours (one line per day)</Label>
        <Textarea rows={4} value={form.business_hours} onChange={set("business_hours")} />
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea rows={3} value={form.description} onChange={set("description")} />
      </div>
      <div className="sm:col-span-2">
        <Label>Internal Notes</Label>
        <Textarea rows={3} value={form.notes} onChange={set("notes")} />
      </div>
    </div>
  );
}

export default function AdminLocalListings() {
  const [rows, setRows] = useState<LocalListingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [selected, setSelected] = useState<LocalListingClient | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("local_listing_clients")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    const list = (data || []) as LocalListingClient[];
    setRows(list);
    const ids = Array.from(new Set(list.map((r) => r.assigned_admin_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: admins } = await supabase
        .from("admin_profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      const map: Record<string, string> = {};
      (admins || []).forEach((a: any) => { map[a.user_id] = a.full_name; });
      setAdminNames(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = (row: LocalListingClient) => {
    setSelected(row);
    setEditForm({
      business_name: row.business_name || "",
      address: row.address || "",
      phone: row.phone || "",
      website: row.website || "",
      category: row.category || "",
      business_hours: row.business_hours || "",
      description: row.description || "",
      gbp_status: row.gbp_status || "not_started",
      notes: row.notes || "",
    });
  };

  const handleAdd = async () => {
    if (!addForm.business_name.trim()) { toast.error("Business name is required"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("local_listing_clients").insert({
      ...addForm,
      assigned_admin_id: user?.id ?? null,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Client added");
    setAddOpen(false);
    setAddForm(EMPTY_FORM);
    load();
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("local_listing_clients")
      .update(editForm)
      .eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setSelected(null);
    load();
  };

  const jsonLd = useMemo(() => buildJsonLd(editForm), [editForm]);
  const nap = useMemo(() => buildNap(editForm), [editForm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <MapPin className="w-7 h-7 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Local SEO / Maps Listings</h1>
              <p className="text-sm text-gray-500">Track client setup across Google Business Profile and local directories</p>
            </div>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Client
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : rows.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">No clients yet. Add your first one.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Admin</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                      <TableCell className="font-medium">{r.business_name}</TableCell>
                      <TableCell>{r.category || "—"}</TableCell>
                      <TableCell><StatusBadge status={r.gbp_status} /></TableCell>
                      <TableCell>{r.assigned_admin_id ? (adminNames[r.assigned_admin_id] || "Admin") : "—"}</TableCell>
                      <TableCell>{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>Intake details used to build listings across directories.</DialogDescription>
          </DialogHeader>
          <ClientForm form={addForm} setForm={setAddForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Save Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selected?.business_name}
              {selected && <StatusBadge status={editForm.gbp_status} />}
            </DialogTitle>
            <DialogDescription>Update details and track verification progress.</DialogDescription>
          </DialogHeader>

          <ClientForm form={editForm} setForm={setEditForm} />

          <div className="mt-6 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Generate Listing Info</h3>
              <p className="text-xs text-gray-500 mt-1">
                No API can create a Google Maps listing directly. What actually helps Google trust and surface a
                business is consistent NAP (Name / Address / Phone) info across Bing Places, Apple Business Connect,
                Yelp and Facebook — plus LocalBusiness schema on the client's own site.
              </p>
            </div>
            <CopyBlock title="LocalBusiness JSON-LD Schema" value={jsonLd} />
            <CopyBlock title="NAP Block (Bing / Apple / Yelp / Facebook)" value={nap} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
