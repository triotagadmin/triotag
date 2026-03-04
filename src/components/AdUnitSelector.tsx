import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, getCurrencySymbol } from "@/hooks/useCurrencyConversion";

export interface AdUnitConfig {
  type: string;
  quantity: number;
  pricePerWeek: number;
  pricePerMonth: number;
  specialRules: string;
  customFormat?: string;
  thumbnailUrl?: string;
  size?: string;
  currency?: string;
}

interface AdUnitSelectorProps {
  selectedUnits: AdUnitConfig[];
  onUnitsChange: (units: AdUnitConfig[]) => void;
  publisherId: string | null;
}

const AD_UNIT_TYPES = [{
  id: "vinyl_sticker",
  label: "Vinyl Sticker (A4 Size)",
  price: "$18",
  description: "Weather-resistant adhesive vinyl, perfect for walls, windows, and countertops"
}, {
  id: "table_tent_card",
  label: "Table Tent Card (A4 Size)",
  price: "$18",
  description: "Premium 350gsm card stock, ideal for tabletops and countertops"
}, {
  id: "table_tent_acrylic",
  label: 'Table Tent Acrylic (4"x6" Size)',
  price: "$32",
  description: "Clear acrylic stand with printed insert for a sleek, professional look"
}, {
  id: "coroplast_a_frame",
  label: 'Coroplast A-Frame Sign (18"x24")',
  price: "$66",
  description: "Durable 4mm corrugated plastic, great for sidewalks and entryways"
}];
export const AdUnitSelector = ({
  selectedUnits,
  onUnitsChange,
  publisherId
}: AdUnitSelectorProps) => {
  const isSelected = (typeId: string) => selectedUnits.some((u) => u.type === typeId);
  const getUnitConfig = (typeId: string): AdUnitConfig | undefined => {
    return selectedUnits.find((u) => u.type === typeId);
  };
  const toggleUnit = (typeId: string) => {
    if (isSelected(typeId)) {
      // Deselect current unit
      onUnitsChange([]);
    } else {
      // Select only this unit (single selection)
      onUnitsChange([{
        type: typeId,
        quantity: 1,
        pricePerWeek: 0,
        pricePerMonth: 0,
        specialRules: "",
        customFormat: typeId === "custom_format" ? "" : undefined,
        size: "",
        currency: "USD"
      }]);
    }
  };
  const updateUnit = (typeId: string, updates: Partial<AdUnitConfig>) => {
    onUnitsChange(selectedUnits.map((u) => u.type === typeId ? {
      ...u,
      ...updates
    } : u));
  };
  return <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Ad Unit Material for This Venue</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select one ad unit material for your venue listing and configure pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AD_UNIT_TYPES.map((unitType) => {
        const selected = isSelected(unitType.id);
        const config = getUnitConfig(unitType.id);
        return <Card key={unitType.id} className={`cursor-pointer transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={selected} onCheckedChange={() => toggleUnit(unitType.id)} className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <div className="cursor-pointer" onClick={() => toggleUnit(unitType.id)}>
                      <span className="font-medium">{unitType.label}</span>
                      <span className="ml-2 text-sm font-semibold text-primary">{unitType.price} / unit</span>
                      <p className="text-xs text-muted-foreground mt-1">{unitType.description}</p>
                    </div>

                    {selected && <div className="space-y-3 mt-3">

                        <div>
                          <Label className="text-xs">Size *</Label>
                          <Input placeholder='e.g., 2x2 inches, A4, 24" x 36"' value={config?.size || ""} onChange={(e) => updateUnit(unitType.id, {
                      size: e.target.value
                    })} className="mt-1" />
                        </div>

                        <div>
                          <Label className="text-xs">Currency</Label>
                          <Select value={config?.currency || "USD"} onValueChange={(val) => updateUnit(unitType.id, { currency: val })}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {CURRENCIES.map((c) =>
                        <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>
                        )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Ad Units Available (Quantity) *</Label>
                          <Input type="number" min="1" step="1" value={config?.quantity || ""} onChange={(e) => updateUnit(unitType.id, {
                      quantity: parseInt(e.target.value, 10) || 1
                    })} className="mt-1" placeholder="1" />
                          <p className="text-xs text-muted-foreground mt-1">Number of ad placements available at this venue</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">{getCurrencySymbol(config?.currency)}/Week</Label>
                            <Input type="number" min="0" step="0.01" value={config?.pricePerWeek || ""} onChange={(e) => updateUnit(unitType.id, {
                        pricePerWeek: parseFloat(e.target.value) || 0
                      })} className="mt-1" placeholder="0" />
                          </div>
                          <div>
                            <Label className="text-xs">{getCurrencySymbol(config?.currency)}/Month</Label>
                            <Input type="number" min="0" step="0.01" value={config?.pricePerMonth || ""} onChange={(e) => updateUnit(unitType.id, {
                        pricePerMonth: parseFloat(e.target.value) || 0
                      })} className="mt-1" placeholder="0" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Set the rental price advertisers will pay per week or per month for this ad placement. Rental price is per ad unit. The currency symbol updates based on your selection above.</p>
                      </div>}
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};