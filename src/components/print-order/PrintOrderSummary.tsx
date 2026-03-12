import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MapPin } from "lucide-react";
import type { BranchMaterialConfig } from "./BranchMaterialConfigurator";

interface PrintOrderSummaryProps {
  franchiseName: string;
  branches: BranchMaterialConfig[];
  currency: string;
}

export const PrintOrderSummary = ({ franchiseName, branches, currency }: PrintOrderSummaryProps) => {
  // Aggregate totals
  const materialTotals = new Map<string, { label: string; total: number }>();
  branches.forEach((b) => {
    b.materials.forEach((m) => {
      if (m.quantity > 0) {
        const existing = materialTotals.get(m.materialType);
        if (existing) {
          existing.total += m.quantity;
        } else {
          materialTotals.set(m.materialType, { label: m.materialLabel, total: m.quantity });
        }
      }
    });
  });

  const branchesWithMaterials = branches.filter((b) => b.materials.some((m) => m.quantity > 0));

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Print Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Franchise</span>
          <span className="font-medium">{franchiseName}</span>
        </div>

        {/* Per-branch breakdown */}
        {branchesWithMaterials.map((branch) => (
          <div key={branch.branchId} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{branch.branchName}</p>
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                {branch.city}
              </Badge>
            </div>
            {branch.materials
              .filter((m) => m.quantity > 0)
              .map((m) => (
                <div key={m.materialType} className="flex justify-between text-xs pl-2">
                  <span className="text-muted-foreground">{m.materialLabel}</span>
                  <span className="font-medium">{m.quantity} units</span>
                </div>
              ))}
            <div className="text-xs text-muted-foreground mt-1">
              Shipping: {branch.shippingAddress.city || branch.city}, {branch.shippingAddress.province}
            </div>
          </div>
        ))}

        {/* Aggregated totals */}
        {materialTotals.size > 0 && (
          <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
            <p className="text-xs font-medium text-muted-foreground mb-2">Aggregated Totals</p>
            {Array.from(materialTotals.entries()).map(([type, { label, total }]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total {label}</span>
                <span className="font-medium">{total} units</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Status: Pending → Approved → Printing → Shipped → Completed
        </p>
      </CardContent>
    </Card>
  );
};
