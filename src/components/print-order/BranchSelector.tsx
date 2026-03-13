import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface BranchOption {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface BranchSelectorProps {
  branches: BranchOption[];
  selectedIds: Set<string>;
  onChange: (selectedIds: Set<string>) => void;
}

export const BranchSelector = ({ branches, selectedIds, onChange }: BranchSelectorProps) => {
  const toggleBranch = (branchId: string) => {
    const next = new Set(selectedIds);
    if (next.has(branchId)) next.delete(branchId);
    else next.add(branchId);
    onChange(next);
  };

  const selectAll = () => {
    onChange(new Set(branches.map((b) => b.id)));
  };

  const deselectAll = () => {
    onChange(new Set());
  };

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No branch locations found for this listing.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-primary" />
          Select Branch Locations
        </CardTitle>
        <CardDescription>Choose one or more branches to configure print materials for.</CardDescription>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Deselect All
          </Button>
          <Badge variant="secondary" className="ml-auto">
            {selectedIds.size} / {branches.length} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {branches.map((branch) => {
          const isSelected = selectedIds.has(branch.id);
          return (
            <div
              key={branch.id}
              className={`p-3 rounded-[14px] border-2 cursor-pointer transition-all flex items-center gap-3 ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-[rgba(255,255,255,0.12)] hover:border-primary/40"
              }`}
              onClick={() => toggleBranch(branch.id)}
            >
              <Checkbox checked={isSelected} onCheckedChange={() => toggleBranch(branch.id)} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{branch.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {branch.city || branch.address}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
