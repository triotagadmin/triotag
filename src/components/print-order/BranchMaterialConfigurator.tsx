import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MapPin, Package } from "lucide-react";
import { MaterialQuantityInput } from "./MaterialQuantityInput";
import { BranchShippingForm, type ShippingAddress } from "./BranchShippingForm";

export interface BranchMaterialConfig {
  branchId: string;
  branchName: string;
  fullAddress: string;
  city: string;
  materials: { materialType: string; materialLabel: string; quantity: number }[];
  shippingAddress: ShippingAddress;
}

interface BranchMaterialConfiguratorProps {
  branches: BranchMaterialConfig[];
  onChange: (branches: BranchMaterialConfig[]) => void;
  availableMaterials: { type: string; label: string }[];
}

export const BranchMaterialConfigurator = ({
  branches,
  onChange,
  availableMaterials,
}: BranchMaterialConfiguratorProps) => {
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());

  const toggleExpand = (branchId: string) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) next.delete(branchId);
      else next.add(branchId);
      return next;
    });
  };

  const updateBranchMaterialQty = (branchId: string, materialType: string, qty: number) => {
    onChange(
      branches.map((b) =>
        b.branchId === branchId
          ? {
              ...b,
              materials: b.materials.map((m) =>
                m.materialType === materialType ? { ...m, quantity: qty } : m
              ),
            }
          : b
      )
    );
  };

  const updateBranchShipping = (branchId: string, address: ShippingAddress) => {
    onChange(
      branches.map((b) => (b.branchId === branchId ? { ...b, shippingAddress: address } : b))
    );
  };

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No branch locations found for this franchise.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {branches.map((branch) => {
        const isExpanded = expandedBranches.has(branch.branchId);
        const totalMaterials = branch.materials.reduce((sum, m) => sum + m.quantity, 0);

        return (
          <Card key={branch.branchId}>
            <div
              className="p-4 cursor-pointer flex items-center justify-between"
              onClick={() => toggleExpand(branch.branchId)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{branch.branchName}</p>
                  {totalMaterials > 0 && (
                    <Badge variant="default" className="text-xs">
                      {totalMaterials} units
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {branch.city || branch.fullAddress}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {isExpanded && (
              <CardContent className="pt-0 space-y-4">
                {/* Ad Unit Materials */}
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Ad Unit Materials
                  </p>
                  <div className="space-y-1 border rounded-lg p-3">
                    {branch.materials.map((mat) => (
                      <MaterialQuantityInput
                        key={mat.materialType}
                        materialName={mat.materialLabel}
                        quantity={mat.quantity}
                        onChange={(qty) => updateBranchMaterialQty(branch.branchId, mat.materialType, qty)}
                      />
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <p className="text-sm font-medium mb-2">Shipping Address</p>
                  <BranchShippingForm
                    address={branch.shippingAddress}
                    onChange={(addr) => updateBranchShipping(branch.branchId, addr)}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
