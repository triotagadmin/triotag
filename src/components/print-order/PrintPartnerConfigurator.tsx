import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, MapPin, Package, DollarSign } from "lucide-react";
import type { BranchMaterialConfig } from "./BranchMaterialConfigurator";

export interface PrintPartnerMaterialConfig {
  materialType: string;
  materialLabel: string;
  quantity: number;
  customUnitPrice: number;
}

export interface PrintPartnerBranchConfig {
  branchId: string;
  branchName: string;
  fullAddress: string;
  city: string;
  materials: PrintPartnerMaterialConfig[];
}

interface PrintPartnerConfiguratorProps {
  branches: PrintPartnerBranchConfig[];
  onChange: (branches: PrintPartnerBranchConfig[]) => void;
}

export const PrintPartnerConfigurator = ({ branches, onChange }: PrintPartnerConfiguratorProps) => {
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set(branches.map(b => b.branchId)));

  const toggleExpand = (branchId: string) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) next.delete(branchId);
      else next.add(branchId);
      return next;
    });
  };

  const updateMaterial = (branchId: string, materialType: string, field: "quantity" | "customUnitPrice", value: number) => {
    onChange(
      branches.map((b) =>
        b.branchId === branchId
          ? {
              ...b,
              materials: b.materials.map((m) =>
                m.materialType === materialType ? { ...m, [field]: value } : m
              ),
            }
          : b
      )
    );
  };

  const grandTotal = branches.reduce(
    (sum, b) => sum + b.materials.reduce((s, m) => s + m.quantity * m.customUnitPrice, 0),
    0
  );

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No branch locations available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {branches.map((branch) => {
        const isExpanded = expandedBranches.has(branch.branchId);
        const branchTotal = branch.materials.reduce((s, m) => s + m.quantity * m.customUnitPrice, 0);

        return (
          <Card key={branch.branchId}>
            <div
              className="p-4 cursor-pointer flex items-center justify-between"
              onClick={() => toggleExpand(branch.branchId)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{branch.branchName}</p>
                  {branchTotal > 0 && (
                    <Badge variant="default" className="text-xs">
                      ₱{branchTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
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
              <CardContent className="pt-0 space-y-3">
                {branch.materials.map((mat) => {
                  const lineTotal = mat.quantity * mat.customUnitPrice;
                  return (
                    <div key={mat.materialType} className="border rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium">{mat.materialLabel}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            min={0}
                            value={mat.quantity}
                            onChange={(e) => updateMaterial(branch.branchId, mat.materialType, "quantity", Math.max(0, parseInt(e.target.value) || 0))}
                            className="mt-1 text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Unit Price (₱)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={mat.customUnitPrice}
                            onChange={(e) => updateMaterial(branch.branchId, mat.materialType, "customUnitPrice", Math.max(0, parseFloat(e.target.value) || 0))}
                            className="mt-1 text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Line Total</Label>
                          <div className="mt-1 h-10 flex items-center justify-center rounded-[14px] border border-border bg-muted/30 text-sm font-medium">
                            ₱{lineTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        );
      })}

      <div className="flex justify-between items-center p-4 border rounded-[14px] bg-primary/5 border-primary/30">
        <span className="font-semibold">Total Print Cost</span>
        <span className="text-lg font-bold text-primary">
          ₱{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};
