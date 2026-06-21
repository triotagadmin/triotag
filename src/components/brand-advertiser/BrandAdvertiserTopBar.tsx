import { Bell, ChevronDown } from "lucide-react";

interface Props {
  companyName: string;
  totalBudget: number;
}

export function BrandAdvertiserTopBar({ companyName, totalBudget }: Props) {
  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-2 text-gray-700 font-medium">
        {companyName}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex items-center gap-6">
        <span className="text-gray-600 text-sm">
          Budget:{" "}
          <span className="font-semibold text-gray-900">
            ₱{Number(totalBudget || 0).toLocaleString()}
          </span>
        </span>
        <Bell className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}

export default BrandAdvertiserTopBar;
