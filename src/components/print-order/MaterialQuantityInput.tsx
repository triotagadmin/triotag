import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MaterialQuantityInputProps {
  materialName: string;
  quantity: number;
  onChange: (qty: number) => void;
}

export const MaterialQuantityInput = ({ materialName, quantity, onChange }: MaterialQuantityInputProps) => {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <Label className="text-sm font-medium flex-1">{materialName}</Label>
      <div className="w-24">
        <Input
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="text-center"
        />
      </div>
    </div>
  );
};
