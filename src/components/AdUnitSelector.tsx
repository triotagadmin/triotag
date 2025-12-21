import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, ImageIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  id: "custom_format",
  label: "Custom Format"
}];
const AD_UNIT_PROMPTS: Record<string, string> = {
  sticker_spot: `Small adhesive sticker advertisement placed on a clean interior surface (glass, metal, or wall). Head Title: Tiny Sticky Ads. Subtitle: Advertise Now. Modern, minimalistic sticker design, bold typography, sharp edges. Scene: close-up macro shot, shallow depth of field. Background: subtle indoor environment such as café counter, gym locker, or restroom wall, softly blurred. Bright, clean lighting, high-resolution product shot.`,
  door_poster: `A poster advertisement mounted on a café or store door (glass or wooden surface). Head Title: Tiny Sticky Ads. Subtitle: Advertise Now. Clean and modern poster layout with bold, readable typography. Scene: frontal or angled view of the door with natural daylight. People walking outside softly blurred through the glass. High-resolution promotional-style shot with realistic textures. Poster aspect ratio must match A4 or A3 format.`,
  countertop_display: `Small countertop display advertisement placed on a checkout counter or café counter. Head Title: Tiny Sticky Ads. Subtitle: Advertise Now. Modern, minimalistic card-style ad stand. Scene: well-lit counter with barista tools, cash register, or product shelves blurred in the background. Focus: the display standing upright, sharp and centered. Warm ambient lighting and polished product-style photography.`,
  mirror_sticker: `Mirror-mounted sticker advertisement placed at eye level on a restroom or gym mirror. Head Title: Tiny Sticky Ads. Subtitle: Advertise Now. Clean, minimal sticker design with bold typography. Scene: reflection of a restroom, gym, or wash area softly blurred. Focus on the sticker adhered cleanly on the mirror surface with light reflections. Sharp, high-resolution product-style shot.`,
  table_tent_card: `Table tent card micro advertisement placed on a wooden bar or café table. Head Title: Tiny Sticky Ads. Subtitle: Advertise Now. Clean, modern, minimalistic design with bold typography. Scene: warm ambient lighting inside a bar or café, customers blurred in the background. Focus on the table tent card standing upright near a drink or coffee cup. High-resolution, cinematic, product-style shot.`,
  wall_frame_display: `Framed wall advertisement mounted on a clean interior wall inside a café, salon, gym, or retail store. Head Title: Tiny Sticky Ads. Subtitle: Advertise Now. Modern framed print design with strong typography. Scene: warm indoor environment with décor elements softly blurred (plants, furniture, lighting). Focus on the framed display hung at eye level. High-resolution, cinematic interior shot with balanced lighting.`
};
export const AdUnitSelector = ({
  selectedUnits,
  onUnitsChange,
  publisherId
}: AdUnitSelectorProps) => {
  const {
    toast
  } = useToast();
  const [generatingThumbnails, setGeneratingThumbnails] = useState<Record<string, boolean>>({});
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
  const generateThumbnail = async (typeId: string) => {
    if (!publisherId) {
      toast({
        title: "Error",
        description: "Publisher ID not found",
        variant: "destructive"
      });
      return;
    }
    const unit = getUnitConfig(typeId);
    if (!unit) return;
    let prompt = AD_UNIT_PROMPTS[typeId];
    if (typeId === "custom_format" && unit.customFormat) {
      prompt = `Advertisement concept for: ${unit.customFormat}. Clean, modern composition with product-style lighting. Minimalist design with bold typography. Head Title: Tiny Sticky Ads. Subtitle: Advertise Now. High-resolution product shot with professional indoor setting.`;
    }
    if (!prompt) {
      toast({
        title: "Error",
        description: "No prompt available for this ad unit type",
        variant: "destructive"
      });
      return;
    }
    setGeneratingThumbnails(prev => ({
      ...prev,
      [typeId]: true
    }));
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-ad-thumbnail', {
        body: {
          prompt,
          adUnitType: typeId
        }
      });
      if (error) throw error;
      if (data?.imageUrl) {
        updateUnit(typeId, {
          thumbnailUrl: data.imageUrl
        });
        toast({
          title: "Success",
          description: "AI thumbnail generated successfully!"
        });
      }
    } catch (error: any) {
      console.error("Thumbnail generation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate thumbnail",
        variant: "destructive"
      });
    } finally {
      setGeneratingThumbnails(prev => ({
        ...prev,
        [typeId]: false
      }));
    }
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
        const isGenerating = generatingThumbnails[unitType.id];
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

                        <div>
                          <Label className="text-xs">Special Rules (Optional)</Label>
                          
                        </div>

                        {/* AI Thumbnail Section */}
                        <div className="border-t pt-3 mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Generated Thumbnail
                            </Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => generateThumbnail(unitType.id)} disabled={isGenerating || unitType.id === "custom_format" && !config?.customFormat}>
                              {isGenerating ? <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Generating...
                                </> : <>
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  Generate
                                </>}
                            </Button>
                          </div>
                          
                          {config?.thumbnailUrl ? <div className="relative rounded-lg overflow-hidden">
                              <img src={config.thumbnailUrl} alt={`${unitType.label} thumbnail`} className="w-full h-32 object-cover rounded-lg" />
                            </div> : <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                              <p className="text-xs text-muted-foreground text-center px-4">
                                Click "Generate" to create an AI thumbnail for marketplace display
                              </p>
                            </div>}
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