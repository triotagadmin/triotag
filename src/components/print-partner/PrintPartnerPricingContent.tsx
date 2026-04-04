import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Power, PowerOff, DollarSign, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRINT_PRODUCTS } from "@/lib/printProducts";

interface MaterialPricing {
  id: string;
  partner_id: string;
  material_name: string;
  unit_type: string;
  base_price: number;
  min_quantity: number;
  rush_fee: number;
  design_fee: number;
  is_active: boolean;
}

interface PrintPartnerPricingContentProps {
  partnerId: string;
}

export const PrintPartnerPricingContent = ({ partnerId }: PrintPartnerPricingContentProps) => {
  const { toast } = useToast();
  const [materialPricing, setMaterialPricing] = useState<MaterialPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<MaterialPricing | null>(null);
  const [pricingForm, setPricingForm] = useState({ material_name: "", base_price: "", min_quantity: "1", rush_fee: "0", design_fee: "0" });

  const fetchPricing = useCallback(async () => {
    const { data } = await supabase
      .from("print_partner_material_pricing")
      .select("*")
      .eq("partner_id", partnerId)
      .order("created_at", { ascending: false });
    if (data) setMaterialPricing(data as unknown as MaterialPricing[]);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => { fetchPricing(); }, [fetchPricing]);

  const openAddPricing = () => {
    setEditingPricing(null);
    setPricingForm({ material_name: "", base_price: "", min_quantity: "1", rush_fee: "0", design_fee: "0" });
    setPricingDialogOpen(true);
  };

  const openEditPricing = (p: MaterialPricing) => {
    setEditingPricing(p);
    setPricingForm({
      material_name: p.material_name, base_price: String(p.base_price),
      min_quantity: String(p.min_quantity), rush_fee: String(p.rush_fee), design_fee: String(p.design_fee),
    });
    setPricingDialogOpen(true);
  };

  const savePricing = async () => {
    if (!pricingForm.material_name || !pricingForm.base_price) { toast({ title: "Material name and price required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      partner_id: partnerId,
      material_name: pricingForm.material_name,
      base_price: parseFloat(pricingForm.base_price) || 0,
      min_quantity: parseInt(pricingForm.min_quantity) || 1,
      rush_fee: parseFloat(pricingForm.rush_fee) || 0,
      design_fee: parseFloat(pricingForm.design_fee) || 0,
    };
    if (editingPricing) {
      const { error } = await supabase.from("print_partner_material_pricing").update(payload).eq("id", editingPricing.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Pricing updated" }); setPricingDialogOpen(false); fetchPricing(); }
    } else {
      const { error } = await supabase.from("print_partner_material_pricing").insert(payload);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "Pricing added" }); setPricingDialogOpen(false); fetchPricing(); }
    }
    setSaving(false);
  };

  const deletePricing = async (id: string) => {
    const { error } = await supabase.from("print_partner_material_pricing").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Pricing removed" }); fetchPricing(); }
  };

  const togglePricingActive = async (p: MaterialPricing) => {
    const { error } = await supabase.from("print_partner_material_pricing").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else fetchPricing();
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Material Pricing
          </h3>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="inline-flex items-center justify-center rounded-full h-5 w-5 bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-sm" side="bottom" align="start">
              <p className="font-medium mb-1">Custom Material Pricing</p>
              <p className="text-muted-foreground">Set your own prices for each ad material type. These prices will be used when generating client checkout links and invoices.</p>
            </PopoverContent>
          </Popover>
        </div>
        <Button size="sm" onClick={openAddPricing} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      </div>

      {materialPricing.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <DollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground text-sm mb-1">No custom pricing set</p>
            <p className="text-xs text-muted-foreground mb-4">Add your material prices to start generating checkout links.</p>
            <Button size="sm" onClick={openAddPricing}><Plus className="h-4 w-4 mr-1" />Add Material Price</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {materialPricing.map(p => (
            <Card key={p.id} className={`transition-all ${!p.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{p.material_name}</p>
                    <p className="text-lg font-bold text-primary mt-1">₱{p.base_price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/{p.unit_type}</span></p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-2">
                      <span>Min qty: {p.min_quantity}</span>
                      {p.rush_fee > 0 && <span>Rush: ₱{p.rush_fee}</span>}
                      {p.design_fee > 0 && <span>Design: ₱{p.design_fee}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePricingActive(p)}>
                      {p.is_active ? <Power className="h-3.5 w-3.5 text-primary" /> : <PowerOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPricing(p)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deletePricing(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Material Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPricing ? "Edit Material Pricing" : "Add Material Pricing"}</DialogTitle>
            <DialogDescription>Set your custom price for this ad material type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Material Name *</Label>
              {editingPricing ? (
                <Input value={pricingForm.material_name} disabled />
              ) : (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pricingForm.material_name}
                  onChange={e => setPricingForm(f => ({ ...f, material_name: e.target.value }))}
                >
                  <option value="">Select material...</option>
                  {PRINT_PRODUCTS.map(p => (
                    <option key={p.id} value={p.name}>{p.name} (Default: ${p.pricePerUnit})</option>
                  ))}
                  <option value="Custom Material">Custom Material</option>
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Price per Unit (₱) *</Label>
              <Input type="number" min="0" step="0.01" value={pricingForm.base_price} onChange={e => setPricingForm(f => ({ ...f, base_price: e.target.value }))} placeholder="0.00" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Min Qty</Label>
                <Input type="number" min="1" value={pricingForm.min_quantity} onChange={e => setPricingForm(f => ({ ...f, min_quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Rush Fee (₱)</Label>
                <Input type="number" min="0" step="0.01" value={pricingForm.rush_fee} onChange={e => setPricingForm(f => ({ ...f, rush_fee: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Design Fee (₱)</Label>
                <Input type="number" min="0" step="0.01" value={pricingForm.design_fee} onChange={e => setPricingForm(f => ({ ...f, design_fee: e.target.value }))} />
              </div>
            </div>
            <Button onClick={savePricing} disabled={saving} className="w-full">
              {saving ? "Saving..." : editingPricing ? "Update Pricing" : "Save Pricing"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
