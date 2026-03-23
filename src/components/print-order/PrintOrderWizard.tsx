import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin, Package, CheckCircle, ArrowRight, ArrowLeft, Send, Loader2,
  Coffee, Layers, DoorOpen, LayoutGrid, Image, StickerIcon, XCircle
} from "lucide-react";
import { BranchMaterialConfigurator, type BranchMaterialConfig } from "./BranchMaterialConfigurator";
import { PrintOrderSummary } from "./PrintOrderSummary";
import { PrintingModeSelector, type PrintingMode } from "./PrintingModeSelector";
import { PrintPartnerConfigurator, type PrintPartnerBranchConfig } from "./PrintPartnerConfigurator";
import { ClientCheckoutPreparation } from "./ClientCheckoutPreparation";

type WizardStep = "mode" | "materials" | "configure" | "review" | "submit" | "client-prep";

const TRIOTAG_STEPS: { id: WizardStep; label: string; number: number }[] = [
  { id: "mode", label: "Printing Mode", number: 1 },
  { id: "materials", label: "Select Materials", number: 2 },
  { id: "configure", label: "Configure Per Branch", number: 3 },
  { id: "review", label: "Review Order", number: 4 },
  { id: "submit", label: "Submit", number: 5 },
];

const PARTNER_STEPS: { id: WizardStep; label: string; number: number }[] = [
  { id: "mode", label: "Printing Mode", number: 1 },
  { id: "materials", label: "Select Materials", number: 2 },
  { id: "configure", label: "Custom Pricing", number: 3 },
  { id: "client-prep", label: "Client Checkout", number: 4 },
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
  onSubmitPrintPartner?: (data: {
    printingMode: "print_partner_managed";
    branches: PrintPartnerBranchConfig[];
    selectedMaterialTypes: string[];
    clientInfo: { clientName: string; clientEmail: string; companyName: string; campaignTitle: string; notes: string };
  }) => void;
  onBack?: () => void;
  onCancel?: () => void;
  leaseCost?: number;
  leaseCurrency?: string;
  startDate?: Date;
  endDate?: Date;
}

export const PrintOrderWizard = ({
  branches,
  availableMaterials,
  franchiseName,
  currency,
  loading,
  submitting,
  onSubmit,
  onSubmitPrintPartner,
  onBack,
  onCancel,
  leaseCost = 0,
  leaseCurrency = "PHP",
  startDate,
  endDate,
}: PrintOrderWizardProps) => {
  const [printingMode, setPrintingMode] = useState<PrintingMode | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>("mode");
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<Set<string>>(new Set());
  const [branchConfigs, setBranchConfigs] = useState<BranchMaterialConfig[]>([]);
  const [partnerBranchConfigs, setPartnerBranchConfigs] = useState<PrintPartnerBranchConfig[]>([]);

  const steps = printingMode === "print_partner_managed" ? PARTNER_STEPS : TRIOTAG_STEPS;
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  // Build branch configs when moving to configure step (Triotag mode)
  useEffect(() => {
    if (currentStep === "configure" && printingMode === "triotag_managed") {
      setBranchConfigs((prev) => {
        const existing = new Map(prev.map((b) => [b.branchId, b]));
        return branches.map((b) => {
          const ex = existing.get(b.id);
          return {
            branchId: b.id,
            branchName: b.name,
            fullAddress: b.address,
            city: b.city,
            materials: Array.from(selectedMaterialTypes).map((type) => {
              const label = availableMaterials.find((m) => m.type === type)?.label || type;
              const exMat = ex?.materials.find((m) => m.materialType === type);
              return { materialType: type, materialLabel: label, quantity: exMat?.quantity || 0 };
            }),
            shippingAddress: ex?.shippingAddress || {
              recipient: "", street: b.address || "", city: b.city || "", province: "", postalCode: "", contact: "",
            },
          };
        });
      });
    }
  }, [currentStep, selectedMaterialTypes, branches, availableMaterials, printingMode]);

  // Build partner branch configs
  useEffect(() => {
    if (currentStep === "configure" && printingMode === "print_partner_managed") {
      setPartnerBranchConfigs((prev) => {
        const existing = new Map(prev.map((b) => [b.branchId, b]));
        return branches.map((b) => {
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
                customUnitPrice: exMat?.customUnitPrice || 0,
              };
            }),
          };
        });
      });
    }
  }, [currentStep, selectedMaterialTypes, branches, availableMaterials, printingMode]);

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
      case "mode":
        return printingMode !== null;
      case "materials":
        return selectedMaterialTypes.size > 0;
      case "configure":
        if (printingMode === "print_partner_managed") {
          return partnerBranchConfigs.some((b) => b.materials.some((m) => m.quantity > 0 && m.customUnitPrice > 0));
        }
        return branchConfigs.some((b) => b.materials.some((m) => m.quantity > 0));
      case "review":
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1].id);
    }
  };

  const goPrev = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(steps[idx - 1].id);
    } else {
      onBack?.();
    }
  };

  const handleTriotagSubmit = () => {
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
      {/* Step Indicator */}
      <Card>
        <CardContent className="pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, idx) => {
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
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mt-[-18px] ${idx < currentStepIndex ? "bg-primary/50" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </CardContent>
      </Card>

      {/* Step: Mode Selection */}
      {currentStep === "mode" && (
        <PrintingModeSelector value={printingMode} onChange={setPrintingMode} />
      )}

      {/* Step: Select Materials */}
      {currentStep === "materials" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              Select Print Materials
            </CardTitle>
            <CardDescription>Choose which advertising materials you want to order.</CardDescription>
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
                        ? "border-primary bg-primary/5 shadow-[0_0_12px_hsl(var(--primary)_/_0.15)]"
                        : "border-border hover:border-primary/40"
                    }`}
                    onClick={() => toggleMaterial(mat.type)}
                  >
                    <div className={`mx-auto mb-3 w-14 h-14 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {icon}
                    </div>
                    <p className="font-semibold text-sm">{mat.label}</p>
                    {isSelected && (
                      <Badge variant="default" className="mt-2 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />Selected
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary">{selectedMaterialTypes.size} material{selectedMaterialTypes.size !== 1 ? "s" : ""} selected</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Configure (Triotag) */}
      {currentStep === "configure" && printingMode === "triotag_managed" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />Configure Materials Per Branch
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Set quantities and shipping for each location.</p>
          </div>
          <BranchMaterialConfigurator
            branches={branchConfigs}
            onChange={setBranchConfigs}
            availableMaterials={availableMaterials.filter((m) => selectedMaterialTypes.has(m.type))}
          />
        </div>
      )}

      {/* Step: Configure (Print Partner - Custom Pricing) */}
      {currentStep === "configure" && printingMode === "print_partner_managed" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />Set Custom Pricing Per Branch
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Enter quantity and your custom unit price for each material. These are the prices your client will see.</p>
          </div>
          <PrintPartnerConfigurator branches={partnerBranchConfigs} onChange={setPartnerBranchConfigs} />
        </div>
      )}

      {/* Step: Review (Triotag only) */}
      {currentStep === "review" && printingMode === "triotag_managed" && (
        <div className="space-y-4">
          <PrintOrderSummary
            franchiseName={franchiseName}
            branches={branchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0))}
            currency={currency}
          />
          <Card>
            <CardHeader><CardTitle className="text-lg">Branch Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {branchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0)).map((branch) => (
                <div key={branch.branchId} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">{branch.branchName}</p>
                    <Badge variant="outline" className="text-xs">{branch.city}</Badge>
                  </div>
                  <div className="pl-6 space-y-1">
                    {branch.materials.filter((m) => m.quantity > 0).map((m) => (
                      <div key={m.materialType} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{m.materialLabel}</span>
                        <span className="font-medium">{m.quantity} units</span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      <span className="font-medium">Ship to:</span>{" "}
                      {[branch.shippingAddress.recipient, branch.shippingAddress.street, branch.shippingAddress.city].filter(Boolean).join(", ") || "Address not set"}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Submit (Triotag only) */}
      {currentStep === "submit" && printingMode === "triotag_managed" && (
        <Card className="border-primary/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Send className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Ready to Submit</CardTitle>
            <CardDescription>
              Your print order for <span className="font-semibold text-foreground">{franchiseName}</span> is ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full glow-breathe" size="lg" onClick={handleTriotagSubmit} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting Print Order...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Submit Print Order</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Client Checkout Preparation (Print Partner) */}
      {currentStep === "client-prep" && printingMode === "print_partner_managed" && (
        <ClientCheckoutPreparation
          franchiseName={franchiseName}
          branches={partnerBranchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0))}
          leaseCost={leaseCost}
          leaseCurrency={leaseCurrency}
          startDate={startDate}
          endDate={endDate}
          generating={submitting}
          onGenerate={(clientInfo) => {
            onSubmitPrintPartner?.({
              printingMode: "print_partner_managed",
              branches: partnerBranchConfigs.filter((b) => b.materials.some((m) => m.quantity > 0)),
              selectedMaterialTypes: Array.from(selectedMaterialTypes),
              clientInfo,
            });
          }}
          onBack={goPrev}
        />
      )}

      {/* Navigation Buttons (not shown on submit/client-prep) */}
      {!["submit", "client-prep"].includes(currentStep) && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={goPrev}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStepIndex === 0 ? "Back to Design" : "Previous"}
            </Button>
            <Button onClick={goNext} disabled={!canProceed()}>
              Next<ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <XCircle className="h-4 w-4 mr-2" />Cancel Booking
            </Button>
          )}
        </div>
      )}

      {currentStep === "submit" && printingMode === "triotag_managed" && (
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={goPrev} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Review
          </Button>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
              <XCircle className="h-4 w-4 mr-2" />Cancel Booking
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
