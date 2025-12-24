import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, CheckCircle } from "lucide-react";
import type { PrintProduct } from "@/lib/printProducts";

interface ProductCardProps {
  product: PrintProduct;
  selected: boolean;
  onClick: () => void;
}

export const ProductCard = ({ product, selected, onClick }: ProductCardProps) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:border-primary/50 ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>
          {selected && (
            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
          )}
        </div>

        {/* Specs Legend */}
        <div className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Material:</span>
              <span className="font-medium">{product.specs.material}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Size:</span>
              <span className="font-medium">{product.specs.size}</span>
            </div>
            {product.specs.finish && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Finish:</span>
                <span className="font-medium">{product.specs.finish}</span>
              </div>
            )}
            {product.specs.weight && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-medium">{product.specs.weight}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>{product.leadTime}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              <span>{product.regions.join(", ")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <Badge variant="secondary">Min: {product.minQuantity} units</Badge>
            <div className="text-right">
              <p className="text-xl font-bold text-primary">
                ₱{product.basePrice.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                +₱{product.pricePerUnit}/unit after first
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
