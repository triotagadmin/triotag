import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, Package, CheckCircle, ArrowRight, ArrowLeft, Send, Loader2,
  Coffee, Layers, DoorOpen, LayoutGrid, Image, StickerIcon
} from "lucide-react";
import { BranchMaterialConfigurator, type BranchMaterialConfig } from "./BranchMaterialConfigurator";
import { BranchShippingForm, type ShippingAddress } from "./BranchShippingForm";
import { PrintOrderSummary } from "./PrintOrderSummary";

type WizardStep = "materials" | "configure" | "review" | "submit";

const WIZARD_STEPS: { id: WizardStep; label: string; number: number }[] = [
  { id: "materials", label: "Select Materials", number: 1 },
  { id: "configure", label: "Configure Per Branch", number: 2 },
  { id: "review", label: "Review Order", number: 3 },
  { id: "submit", label: "Submit", number: 4 },
];

const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  vinyl_sticker: <StickerIcon className="h-8 w-8" />,
  table_tent_card: <Layers className="h-8 w-8" />,
  acrylic_table_tent: <Layers className="h-8 w-8" />,
  coroplast_stand: <LayoutGrid className="h-8 w-8" />,
  poster_frame: <Image className="h-8 w-8" />,
  wall_decal: <DoorOpen className="h-8 w-8" />,
  coffee_cup_sleeve: <Coffee className="h-8 w-8" />,
  counter_display: <Package className="h-8 w-8" />,
};

export interface BranchOption {
  id: string;
  name: string;
  address: string;
  city: string;
}

interface PrintOrderWizardProps {
  branches: BranchOption[];
  availableMaterials: { type: string; label: string }[];
  franchiseName: string;
  currency: string;
  loading?: boolean;
  submitting?: boolean;
  onSubmit: (data: {
    selectedBranches: BranchMaterialConfig[];
    selectedMaterialTypes: string[];
  }) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export const PrintOrderWizard = ({
  branches,
  availableMaterials,
  franchiseName,
  currency,
  loading,
  submitting,
  onSubmit,
  onBack,
  onCancel,
}: PrintOrderWizardProps) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>("materials");
  const [selectedBranchIds, setSelectedBranchIds] = useState<Set<string>>(new Set());
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<Set<string>>(new Set());
  const [branchConfigs, setBranchConfigs] = useState<BranchMaterialConfig[]>([]);

  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const progressPercent = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  // Auto-select all branches passed from booking step
  useEffect(() => {
    if (branches.length > 0) {
      setSelectedBranchIds(new Set(branches.map((b) => b.id)));
    }
  }, [branches]);

  // Build branch configs when moving to configure step
  useEffect(() => {
    if (currentStep === "configure" && selectedBranchIds.size > 0) {
      setBranchConfigs((prev) => {
        const existing = new Map(prev.map((b) => [b.branchId, b]));
        return branches
          .filter((b) => selectedBranchIds.has(b.id))
          .map((b) => {
            const ex = existing.get(b.id);
            return {
              branchId: b.id,
              branchName: b.name,
              fullAddress: b.address,
              city: b.city,
              materials: Array.from(selectedMaterialTypes).map((type) => {
                const label = availableMaterials.find((m) => m.type === type)?.label || type;
                const exMat = ex?.materials.find((m) => m.materialType === type);
                return {
                  materialType: type,
                  materialLabel: label,
                  quantity: exMat?.quantity || 0,
                };
              }),
              shippingAddress: ex?.shippingAddress || {
                recipient: "",
                street: b.address || "",
                city: b.city || "",
                province: "",
                postalCode: "",
                contact: "",
              },
            };
          });
      });
    }
  }, [currentStep, selectedBranchIds, selectedMaterialTypes, branches, availableMaterials]);

  const toggleBranch = (id: string) => {
    setSelectedBranchIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllBranches = () => setSelectedBranchIds(new Set(branches.map((b) => b.id)));
  const deselectAllBranches = () => setSelectedBranchIds(new Set());

  const toggleMaterial = (type: string) => {
    setSelectedMaterialTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case "materials":
        return selectedMaterialTypes.size > 0;
      case "configure":
        return branchConfigs.some((b) => b.materials.some((m) => m.quantity > 0));
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[idx + 1].id);
    }
  };

  const goPrev = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(WIZARD_STEPS[idx - 1].id);
    } else {
      onBack?.();
    }
  };

  const handleSubmit = () => {
    const configuredBranches = branchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0));
    onSubmit({
      selectedBranches: configuredBranches,
      selectedMaterialTypes: Array.from(selectedMaterialTypes),
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Horizontal Step Indicator */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            {WIZARD_STEPS.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isCompleted = idx < currentStepIndex;
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-[var(--neon-glow)]"
                          : isCompleted
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.number}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-medium text-center leading-tight max-w-[80px] ${
                        isActive ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-18px] ${
                        idx < currentStepIndex ? "bg-primary/50" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </CardContent>
      </Card>

      {/* Step 1: Select Print Materials */}

      {/* Step 2: Select Print Materials */}
      {currentStep === "materials" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Select Print Materials
            </CardTitle>
            <CardDescription>
              Choose which advertising materials you want to order for your selected locations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableMaterials.map((mat) => {
                const isSelected = selectedMaterialTypes.has(mat.type);
                const icon = MATERIAL_ICONS[mat.type] || <Package className="h-8 w-8" />;
                return (
                  <div
                    key={mat.type}
                    className={`p-5 rounded-[14px] border-2 cursor-pointer transition-all text-center ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-[0_0_12px_hsl(110_100%_55%_/_0.15)]"
                        : "border-border hover:border-primary/40"
                    }`}
                    onClick={() => toggleMaterial(mat.type)}
                  >
                    <div
                      className={`mx-auto mb-3 w-14 h-14 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {icon}
                    </div>
                    <p className="font-semibold text-sm">{mat.label}</p>
                    {isSelected && (
                      <Badge variant="default" className="mt-2 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary">
                {selectedMaterialTypes.size} material{selectedMaterialTypes.size !== 1 ? "s" : ""} selected
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure Materials Per Branch */}
      {currentStep === "configure" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Configure Materials Per Branch
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Set quantities and shipping addresses for each branch location.
            </p>
          </div>
          <BranchMaterialConfigurator
            branches={branchConfigs}
            onChange={setBranchConfigs}
            availableMaterials={availableMaterials.filter((m) => selectedMaterialTypes.has(m.type))}
          />
        </div>
      )}

      {/* Step 4: Review Order */}
      {currentStep === "review" && (
        <div className="space-y-4">
          <PrintOrderSummary
            franchiseName={franchiseName}
            branches={branchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0))}
            currency={currency}
          />

          {/* Detailed per-branch review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Branch Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {branchConfigs
                .filter((b) => b.materials.some((m) => m.quantity > 0))
                .map((branch) => (
                  <div key={branch.branchId} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <p className="font-semibold text-sm">{branch.branchName}</p>
                      <Badge variant="outline" className="text-xs">{branch.city}</Badge>
                    </div>
                    <div className="pl-6 space-y-1">
                      {branch.materials
                        .filter((m) => m.quantity > 0)
                        .map((m) => (
                          <div key={m.materialType} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{m.materialLabel}</span>
                            <span className="font-medium">{m.quantity} units</span>
                          </div>
                        ))}
                      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                        <span className="font-medium">Ship to:</span>{" "}
                        {[branch.shippingAddress.recipient, branch.shippingAddress.street, branch.shippingAddress.city]
                          .filter(Boolean)
                          .join(", ") || "Address not set"}
                      </div>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 5: Submit */}
      {currentStep === "submit" && (
        <Card className="border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Ready to Submit</CardTitle>
            <CardDescription>
              Your print order for <span className="font-semibold text-foreground">{franchiseName}</span> across{" "}
              <span className="font-semibold text-foreground">
                {branchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0)).length} branch
                {branchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0)).length !== 1 ? "es" : ""}
              </span>{" "}
              is ready for submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Locations</span>
                <span className="font-medium">{branchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0)).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Materials</span>
                <span className="font-medium">{selectedMaterialTypes.size} type{selectedMaterialTypes.size !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Units</span>
                <span className="font-medium">
                  {branchConfigs.reduce((sum, b) => sum + b.materials.reduce((s, m) => s + m.quantity, 0), 0)}
                </span>
              </div>
            </div>
            <Button
              className="w-full glow-breathe"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting Print Order...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Print Order
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      {currentStep !== "submit" && (
        <div className="flex justify-between gap-4">
          <Button variant="outline" onClick={goPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStepIndex === 0 ? "Back to Design" : "Previous"}
          </Button>
          <Button onClick={goNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {currentStep === "submit" && (
        <Button variant="outline" onClick={goPrev} className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Review
        </Button>
      )}
    </div>
  );
};
