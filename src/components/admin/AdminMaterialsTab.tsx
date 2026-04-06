import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, Search, Ban, CheckCircle, Building, DollarSign } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface AdMaterial {
  id: string;
  material_name: string;
  default_size: string;
  base_cost: number;
  selling_price: number;
  currency: string;
  is_active: boolean;
  prodigi_sku: string | null;
  prodigi_variant_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PrintPartner {
  id: string;
  user_id: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string | null;
  status: string;
  is_blocked: boolean;
  blocked_reason: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminMaterialsTab() {
  return (
    <Tabs defaultValue="default-pricing" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="default-pricing">
          <DollarSign className="w-4 h-4 mr-2" />
          Default Pricing (Prodigi)
        </TabsTrigger>
        <TabsTrigger value="print-partners">
          <Building className="w-4 h-4 mr-2" />
          Print Partner Accounts
        </TabsTrigger>
      </TabsList>

      <TabsContent value="default-pricing">
        <DefaultPricingSection />
      </TabsContent>

      <TabsContent value="print-partners">
        <PrintPartnersSection />
      </TabsContent>
    </Tabs>
  );
}

// ─── Default Pricing Section ─────────────────────────────────────────────

function DefaultPricingSection() {
  const [materials, setMaterials] = useState<AdMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMaterial, setEditMaterial] = useState<AdMaterial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    material_name: "",
    default_size: "",
    base_cost: 0,
    selling_price: 0,
    currency: "USD",
    prodigi_sku: "",
    prodigi_variant_id: "",
    is_active: true,
  });

  useEffect(() => { loadMaterials(); }, []);

  const loadMaterials = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("ad_material_pricing")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) { toast.error("Failed to load materials"); console.error(error); }
    else setMaterials(data || []);
    setIsLoading(false);
  };

  const openAdd = () => {
    setEditMaterial(null);
    setFormData({ material_name: "", default_size: "", base_cost: 0, selling_price: 0, currency: "USD", prodigi_sku: "", prodigi_variant_id: "", is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (m: AdMaterial) => {
    setEditMaterial(m);
    setFormData({
      material_name: m.material_name,
      default_size: m.default_size,
      base_cost: m.base_cost,
      selling_price: m.selling_price,
      currency: m.currency,
      prodigi_sku: m.prodigi_sku || "",
      prodigi_variant_id: m.prodigi_variant_id || "",
      is_active: m.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.material_name || !formData.default_size) {
      toast.error("Material name and size are required");
      return;
    }

    const payload = {
      material_name: formData.material_name,
      default_size: formData.default_size,
      base_cost: formData.base_cost,
      selling_price: formData.selling_price,
      currency: formData.currency,
      prodigi_sku: formData.prodigi_sku || null,
      prodigi_variant_id: formData.prodigi_variant_id || null,
      is_active: formData.is_active,
    };

    if (editMaterial) {
      const { error } = await supabase.from("ad_material_pricing").update(payload).eq("id", editMaterial.id);
      if (error) { toast.error("Failed to update material"); return; }
      toast.success("Material updated");
    } else {
      const { error } = await supabase.from("ad_material_pricing").insert(payload);
      if (error) { toast.error("Failed to add material"); return; }
      toast.success("Material added");
    }

    setIsDialogOpen(false);
    loadMaterials();
  };

  const handleToggle = async (m: AdMaterial) => {
    const { error } = await supabase.from("ad_material_pricing").update({ is_active: !m.is_active }).eq("id", m.id);
    if (error) toast.error("Failed to update");
    else loadMaterials();
  };

  const handleDelete = async (m: AdMaterial) => {
    if (!confirm(`Delete "${m.material_name}"?`)) return;
    const { error } = await supabase.from("ad_material_pricing").delete().eq("id", m.id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); loadMaterials(); }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ad Material Pricing Database</CardTitle>
              <CardDescription>Manage default pricing used when Triotag handles printing via Prodigi</CardDescription>
            </div>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add New Material</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : materials.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No materials found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Default Size</TableHead>
                  <TableHead>Base Cost</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.material_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.default_size}</TableCell>
                    <TableCell>${m.base_cost.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">${m.selling_price.toFixed(2)}</TableCell>
                    <TableCell>{m.currency}</TableCell>
                    <TableCell>
                      <Badge className={m.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}>
                        {m.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToggle(m)}>
                          {m.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(m)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editMaterial ? "Edit Material" : "Add New Material"}</DialogTitle>
            <DialogDescription>
              {editMaterial ? "Update material pricing details" : "Add a new material to the default catalog"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Material Name</Label>
              <Input value={formData.material_name} onChange={(e) => setFormData(p => ({ ...p, material_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Default Size</Label>
              <Input value={formData.default_size} onChange={(e) => setFormData(p => ({ ...p, default_size: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Cost</Label>
                <Input type="number" step="0.01" value={formData.base_cost} onChange={(e) => setFormData(p => ({ ...p, base_cost: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <Input type="number" step="0.01" value={formData.selling_price} onChange={(e) => setFormData(p => ({ ...p, selling_price: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value={formData.currency} onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prodigi SKU</Label>
                <Input value={formData.prodigi_sku} onChange={(e) => setFormData(p => ({ ...p, prodigi_sku: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Prodigi Variant ID</Label>
                <Input value={formData.prodigi_variant_id} onChange={(e) => setFormData(p => ({ ...p, prodigi_variant_id: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Print Partners Section ──────────────────────────────────────────────

function PrintPartnersSection() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PrintPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockDialog, setBlockDialog] = useState<{ partner: PrintPartner; action: "block" | "unblock" } | null>(null);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => { loadPartners(); }, []);

  const loadPartners = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("print_partner_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load partners"); console.error(error); }
    else setPartners((data || []) as unknown as PrintPartner[]);
    setIsLoading(false);
  };

  const filtered = partners.filter(p => {
    const matchesSearch = !searchTerm || p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || p.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "blocked" ? p.is_blocked : statusFilter === p.status);
    return matchesSearch && matchesStatus;
  });

  const handleBlockAction = async () => {
    if (!blockDialog) return;
    const { partner, action } = blockDialog;

    const updateData = action === "block"
      ? { is_blocked: true, status: "blocked", blocked_reason: blockReason || null }
      : { is_blocked: false, status: "active", blocked_reason: null };

    const { error } = await supabase.from("print_partner_profiles").update(updateData).eq("id", partner.id);
    if (error) { toast.error(`Failed to ${action} partner`); return; }

    toast.success(`Partner ${action}ed successfully`);
    setBlockDialog(null);
    setBlockReason("");
    loadPartners();
  };

  const getStatusBadge = (p: PrintPartner) => {
    if (p.is_blocked) return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Blocked</Badge>;
    if (p.status === "suspended") return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Suspended</Badge>;
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Print Partner Accounts</CardTitle>
              <CardDescription>View, manage, block, and inspect custom print pricing per partner</CardDescription>
            </div>
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by company or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select
              className="rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No print partner accounts found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.company_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.contact_person}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.contact_email}</TableCell>
                    <TableCell>{getStatusBadge(p)}</TableCell>
                    <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/print-partners/${p.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {p.is_blocked ? (
                          <Button size="sm" variant="ghost" onClick={() => setBlockDialog({ partner: p, action: "unblock" })}>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setBlockDialog({ partner: p, action: "block" })}>
                            <Ban className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Block/Unblock Dialog */}
      <Dialog open={!!blockDialog} onOpenChange={() => { setBlockDialog(null); setBlockReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{blockDialog?.action === "block" ? "Block Print Partner" : "Unblock Print Partner"}</DialogTitle>
            <DialogDescription>
              {blockDialog?.action === "block"
                ? `Block "${blockDialog.partner.company_name}" from using the platform?`
                : `Unblock "${blockDialog?.partner.company_name}" and restore access?`}
            </DialogDescription>
          </DialogHeader>
          {blockDialog?.action === "block" && (
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Reason for blocking..." rows={3} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBlockDialog(null); setBlockReason(""); }}>Cancel</Button>
            <Button variant={blockDialog?.action === "block" ? "destructive" : "default"} onClick={handleBlockAction}>
              {blockDialog?.action === "block" ? "Block Partner" : "Unblock Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
