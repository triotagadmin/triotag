import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { ArrowLeft, Edit, Ban, CheckCircle, Building, DollarSign, Phone, Mail, Calendar } from "lucide-react";

interface PartnerMaterial {
  id: string;
  material_name: string;
  default_size: string;
  base_price: number;
  selling_price: number;
  currency: string;
  is_active: boolean;
}

export default function AdminPrintPartnerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<any>(null);
  const [materials, setMaterials] = useState<PartnerMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMaterial, setEditMaterial] = useState<PartnerMaterial | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({ base_price: 0, selling_price: 0, currency: "USD", is_active: true });
  const [blockDialog, setBlockDialog] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (id) { loadPartner(); loadMaterials(); }
  }, [id]);

  const loadPartner = async () => {
    const { data, error } = await supabase
      .from("print_partner_profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) { toast.error("Partner not found"); navigate("/admin/dashboard"); return; }
    setPartner(data);
    setIsLoading(false);
  };

  const loadMaterials = async () => {
    const { data, error } = await supabase
      .from("print_partner_material_pricing")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: true });
    if (error) console.error(error);
    else setMaterials((data || []).map(d => ({
      id: d.id,
      material_name: d.material_name,
      default_size: (d as any).default_size || "",
      base_price: d.base_price || 0,
      selling_price: (d as any).selling_price || 0,
      currency: (d as any).currency || "USD",
      is_active: d.is_active ?? true,
    })));
  };

  const openEditMaterial = (m: PartnerMaterial) => {
    setEditMaterial(m);
    setFormData({ base_price: m.base_price, selling_price: m.selling_price, currency: m.currency, is_active: m.is_active });
    setIsEditOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!editMaterial) return;
    const { error } = await supabase
      .from("print_partner_material_pricing")
      .update({
        base_price: formData.base_price,
        selling_price: formData.selling_price,
        currency: formData.currency,
        is_active: formData.is_active,
      })
      .eq("id", editMaterial.id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Material pricing updated");
    setIsEditOpen(false);
    loadMaterials();
  };

  const handleToggleMaterial = async (m: PartnerMaterial) => {
    const { error } = await supabase
      .from("print_partner_material_pricing")
      .update({ is_active: !m.is_active })
      .eq("id", m.id);
    if (error) toast.error("Failed to update");
    else loadMaterials();
  };

  const handleBlockAction = async (action: "block" | "unblock" | "suspend") => {
    const updateData = action === "block"
      ? { is_blocked: true, status: "blocked", blocked_reason: blockReason || null }
      : action === "suspend"
      ? { status: "suspended" }
      : { is_blocked: false, status: "active", blocked_reason: null };

    const { error } = await supabase.from("print_partner_profiles").update(updateData).eq("id", id);
    if (error) { toast.error(`Failed to ${action}`); return; }
    toast.success(`Partner ${action}ed`);
    setBlockDialog(false);
    setBlockReason("");
    loadPartner();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!partner) return null;

  const isBlocked = partner.is_blocked;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Section A — Account Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-xl">{partner.company_name}</CardTitle>
                  <CardDescription>Print Partner Account Details</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isBlocked ? (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-sm px-3 py-1">Blocked</Badge>
                ) : partner.status === "suspended" ? (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-sm px-3 py-1">Suspended</Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-sm px-3 py-1">Active</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span>{partner.contact_email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{partner.contact_phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Contact Person:</span>
                  <span>{partner.contact_person || "—"}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(partner.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Updated:</span>
                  <span>{new Date(partner.updated_at).toLocaleDateString()}</span>
                </div>
                {partner.blocked_reason && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Blocked Reason:</span>
                    <p className="text-red-500 mt-1">{partner.blocked_reason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Controls */}
            <div className="flex gap-2 mt-6 pt-4 border-t flex-wrap">
              {isBlocked ? (
                <Button onClick={() => handleBlockAction("unblock")}>
                  <CheckCircle className="w-4 h-4 mr-2" />Unblock Account
                </Button>
              ) : (
                <>
                  <Button variant="destructive" onClick={() => setBlockDialog(true)}>
                    <Ban className="w-4 h-4 mr-2" />Block Account
                  </Button>
                  {partner.status !== "suspended" && (
                    <Button variant="outline" onClick={() => handleBlockAction("suspend")}>
                      Suspend Account
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section B — Material Pricing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <DollarSign className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Material Pricing</CardTitle>
                <CardDescription>Custom ad material pricing for this print partner</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {materials.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No material pricing records found for this partner</p>
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
                      <TableCell className="text-sm text-muted-foreground">{m.default_size || "—"}</TableCell>
                      <TableCell>${m.base_price.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">${m.selling_price.toFixed(2)}</TableCell>
                      <TableCell>{m.currency}</TableCell>
                      <TableCell>
                        <Badge className={m.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}>
                          {m.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEditMaterial(m)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleToggleMaterial(m)}>
                            {m.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Material Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Material Price</DialogTitle>
            <DialogDescription>{editMaterial?.material_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Base Cost</Label>
                <Input type="number" step="0.01" value={formData.base_price} onChange={(e) => setFormData(p => ({ ...p, base_price: parseFloat(e.target.value) || 0 }))} />
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
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMaterial}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Print Partner</DialogTitle>
            <DialogDescription>Block "{partner.company_name}" from using the platform?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Reason for blocking..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleBlockAction("block")}>Block Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
