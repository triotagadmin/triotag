import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AdUnitConfig {
  type: string;
  quantity: number;
  pricePerWeek: number;
  pricePerMonth: number;
  specialRules: string;
  customFormat?: string;
  thumbnailUrl?: string;
}

interface AdUnitSelectorProps {
  selectedUnits: AdUnitConfig[];
  onUnitsChange: (units: AdUnitConfig[]) => void;
  publisherId: string | null;
}

const AD_UNIT_TYPES = [{
  id: "sticker_spot",
  label: "Sticker Spot (2x2, 3x3, 4x4)"
}, {
  id: "door_poster",
  label: "Door Poster (A4 / A3)"
}, {
  id: "countertop_display",
  label: "Countertop Display"
}, {
  id: "mirror_sticker",
  label: "Mirror Sticker"
}, {
  id: "table_tent_card",
  label: "Table Tent Card"
}, {
  id: "wall_frame_display",
  label: "Wall Frame Display"
}, {
  id: "mural_painting",
  label: "Mural Painting"
}, {
  id: "wheat_paste",
  label: "Wheat Paste"
}, {
  id: "custom_format",
  label: "Custom Format"
}];
export const AdUnitSelector = ({
  selectedUnits,
  onUnitsChange,
  publisherId
}: AdUnitSelectorProps) => {
  const isSelected = (typeId: string) => selectedUnits.some(u => u.type === typeId);
  const getUnitConfig = (typeId: string): AdUnitConfig | undefined => {
    return selectedUnits.find(u => u.type === typeId);
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
        customFormat: typeId === "custom_format" ? "" : undefined
      }]);
    }
  };
  const updateUnit = (typeId: string, updates: Partial<AdUnitConfig>) => {
    onUnitsChange(selectedUnits.map(u => u.type === typeId ? {
      ...u,
      ...updates
    } : u));
  };
  return <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Ad Unit Type for This Venue</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Select one ad unit type for your venue listing and configure pricing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AD_UNIT_TYPES.map(unitType => {
        const selected = isSelected(unitType.id);
        const config = getUnitConfig(unitType.id);
        return <Card key={unitType.id} className={`cursor-pointer transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={selected} onCheckedChange={() => toggleUnit(unitType.id)} className="mt-1" />
                  <div className="flex-1 space-y-3">
                    <label className="font-medium cursor-pointer" onClick={() => toggleUnit(unitType.id)}>
                      {unitType.label}
                    </label>

                    {selected && <div className="space-y-3 mt-3">
                        {unitType.id === "custom_format" && <div>
                            <Label className="text-xs">Custom Format Description</Label>
                            <Input placeholder="Describe your custom ad format..." value={config?.customFormat || ""} onChange={e => updateUnit(unitType.id, {
                      customFormat: e.target.value
                    })} className="mt-1" />
                          </div>}

                        <div>
                          <Label className="text-xs">Ad Units Available (Quantity) *</Label>
                          <Input type="number" min="1" step="1" value={config?.quantity || ""} onChange={e => updateUnit(unitType.id, {
                        quantity: parseInt(e.target.value, 10) || 1
                      })} className="mt-1" placeholder="1" />
                          <p className="text-xs text-muted-foreground mt-1">Number of ad placements available at this venue</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">$/Week</Label>
                            <Input type="number" min="0" step="0.01" value={config?.pricePerWeek || ""} onChange={e => updateUnit(unitType.id, {
                        pricePerWeek: parseFloat(e.target.value) || 0
                      })} className="mt-1" placeholder="0" />
                          </div>
                          <div>
                            <Label className="text-xs">$/Month</Label>
                            <Input type="number" min="0" step="0.01" value={config?.pricePerMonth || ""} onChange={e => updateUnit(unitType.id, {
                        pricePerMonth: parseFloat(e.target.value) || 0
                      })} className="mt-1" placeholder="0" />
                          </div>
                        </div>
                      </div>}
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};