import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MapPin, ArrowRightLeft, Loader2 } from "lucide-react";
import type { BranchMaterialConfig } from "./BranchMaterialConfigurator";
import { getMaterialUnitPrice, calculateBranchCost, calculateTotalOrderCost, formatCurrency } from "@/lib/materialPricing";
import { useCurrencyConversion, formatPrice } from "@/hooks/useCurrencyConversion";

const PhpConversion = ({ amountUsd }: { amountUsd: number }) => {
  const { convertedAmount, loading } = useCurrencyConversion(amountUsd, "USD", "PHP");

  if (loading) {
    return <Loader2 className="h-3 w-3 animate-spin inline text-muted-foreground" />;
  }

  const phpAmount = convertedAmount ?? amountUsd;
  return (
    <>
      <span className="font-semibold">
        ₱{phpAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
      </span>
      <span className="text-xs text-muted-foreground font-normal ml-1">
        (${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD)
      </span>
    </>
  );
};

interface PrintOrderSummaryProps {
  franchiseName: string;
  branches: BranchMaterialConfig[];
  currency: string;
}

export const PrintOrderSummary = ({ franchiseName, branches, currency }: PrintOrderSummaryProps) => {
  // Aggregate totals
  const materialTotals = new Map<string, { label: string; total: number; unitPrice: number }>();
  branches.forEach((b) => {
    b.materials.forEach((m) => {
      if (m.quantity > 0) {
        const existing = materialTotals.get(m.materialType);
        const unitPrice = getMaterialUnitPrice(m.materialType);
        if (existing) {
          existing.total += m.quantity;
        } else {
          materialTotals.set(m.materialType, { label: m.materialLabel, total: m.quantity, unitPrice });
        }
      }
    });
  });

  const branchesWithMaterials = branches.filter((b) => b.materials.some((m) => m.quantity > 0));
  const totalCost = calculateTotalOrderCost(branches);

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
        {branchesWithMaterials.map((branch) => {
          const branchCost = calculateBranchCost(branch.materials);
          return (
            <div key={branch.branchId} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{branch.branchName}</p>
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {branch.city}
                  </Badge>
                </div>
                <div className="text-right text-sm">
                  <PhpConversion amountUsd={branchCost} />
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Shipping: {branch.shippingAddress.city || branch.city}, {branch.shippingAddress.province}
              </div>
            </div>
          );
        })}

        {/* Aggregated totals */}
        {materialTotals.size > 0 && (
          <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Price Breakdown</p>
            {Array.from(materialTotals.entries()).map(([type, { label, total, unitPrice }]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {label} ({total} units × ${unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                </span>
                <div className="text-right">
                  <PhpConversion amountUsd={total * unitPrice} />
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-1.5">
                <span>Total Order Cost</span>
                <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="text-right text-primary">
                <PhpConversion amountUsd={totalCost} />
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          Status: Pending → Approved → Printing → Shipped → Completed
        </p>
      </CardContent>
    </Card>
  );
};
