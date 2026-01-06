import { CheckCircle, ShoppingCart, Package, CreditCard, ArrowRight } from "lucide-react";

export type ActivationStep = "design" | "print-order" | "payment";

interface ActivationStepperProps {
  currentStep: ActivationStep;
  approvalStatus?: "pending" | "approved" | "rejected";
}

const steps = [
  { id: "design" as const, label: "Book Ad Space", icon: ShoppingCart },
  { id: "print-order" as const, label: "Print Order", icon: Package },
  { id: "payment" as const, label: "Payment", icon: CreditCard },
];

export function ActivationStepper({ currentStep, approvalStatus }: ActivationStepperProps) {
  const getStepIndex = (step: ActivationStep) => steps.findIndex(s => s.id === step);
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = index < currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-2 md:px-4 rounded-full transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <StepIcon className="h-4 w-4 md:h-5 md:w-5" />
                )}
                <span className="font-medium hidden sm:inline text-sm">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 mx-1 md:mx-2 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
