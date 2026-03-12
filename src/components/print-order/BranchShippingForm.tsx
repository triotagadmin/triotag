import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ShippingAddress {
  recipient: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  contact: string;
}

interface BranchShippingFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
}

export const BranchShippingForm = ({ address, onChange }: BranchShippingFormProps) => {
  const update = (field: keyof ShippingAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Recipient Name *</Label>
        <Input value={address.recipient} onChange={(e) => update("recipient", e.target.value)} placeholder="Full name" className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Street Address *</Label>
        <Input value={address.street} onChange={(e) => update("street", e.target.value)} placeholder="123 Main Street" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">City *</Label>
          <Input value={address.city} onChange={(e) => update("city", e.target.value)} placeholder="City" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Province / State</Label>
          <Input value={address.province} onChange={(e) => update("province", e.target.value)} placeholder="Province" className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Postal Code *</Label>
          <Input value={address.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="ZIP" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Contact Number</Label>
          <Input value={address.contact} onChange={(e) => update("contact", e.target.value)} placeholder="+63 912 345 6789" className="mt-1" />
        </div>
      </div>
    </div>
  );
};
