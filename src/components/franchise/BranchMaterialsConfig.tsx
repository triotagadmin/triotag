import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package } from "lucide-react";

interface BranchMaterialsConfigProps {
  branchDbId?: string;
  listingId: string;
  branchName: string;
  cityName: string;
  availableMaterials: string[];
  materialLabels: Record<string, string>;
}

interface MaterialQty {
  material_type: string;
  quantity: number;
}

export const BranchMaterialsConfig = ({
  branchDbId,
  listingId,
  branchName,
  cityName,
  availableMaterials,
  materialLabels,
}: BranchMaterialsConfigProps) => {
  const [materials, setMaterials] = useState<MaterialQty[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!branchDbId) {
      // Initialize with zeros for new branches
      setMaterials(availableMaterials.map((m) => ({ material_type: m, quantity: 0 })));
      return;
    }

    const loadMaterials = async () => {
      const { data } = await supabase
        .from("branch_materials")
        .select("material_type, quantity")
        .eq("branch_id", branchDbId)
        .eq("listing_id", listingId);

      const existing = new Map((data || []).map((d: any) => [d.material_type, d.quantity]));
      setMaterials(
        availableMaterials.map((m) => ({
          material_type: m,
          quantity: existing.get(m) || 0,
        }))
      );
    };
    loadMaterials();
  }, [branchDbId, listingId, availableMaterials.join(",")]);

  const updateQuantity = async (materialType: string, qty: number) => {
    const newQty = Math.max(0, qty);
    setMaterials((prev) =>
      prev.map((m) => (m.material_type === materialType ? { ...m, quantity: newQty } : m))
    );

    if (!branchDbId) return;

    setSaving(true);
    try {
      // Upsert the material quantity
      const { error } = await supabase
        .from("branch_materials")
        .upsert(
          {
            branch_id: branchDbId,
            listing_id: listingId,
            material_type: materialType,
            quantity: newQty,
          },
          { onConflict: "branch_id,material_type" }
        );

      if (error) console.error("Failed to save material:", error);
    } finally {
      setSaving(false);
    }
  };

  const totalUnits = materials.reduce((sum, m) => sum + m.quantity, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-[12px] bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 text-left">
            <Package className="h-4 w-4 text-primary shrink-0" />
            <div>
              <p className="text-sm font-medium">{branchName || "Unnamed Branch"}</p>
              <p className="text-xs text-muted-foreground">{cityName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalUnits > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-6 pr-3 py-3 space-y-3 border-l-2 border-primary/20 ml-5 mt-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ad Unit Materials</p>
          {materials.map((mat) => (
            <div key={mat.material_type} className="flex items-center justify-between gap-3">
              <Label className="text-sm font-normal flex-1">
                {materialLabels[mat.material_type] || mat.material_type}
              </Label>
              <div className="w-24">
                <Input
                  type="number"
                  min={0}
                  value={mat.quantity}
                  onChange={(e) => updateQuantity(mat.material_type, parseInt(e.target.value) || 0)}
                  className="h-8 text-sm text-center"
                />
              </div>
            </div>
          ))}
          {!branchDbId && (
            <p className="text-xs text-muted-foreground italic">Save the franchise first to enable material configuration.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
