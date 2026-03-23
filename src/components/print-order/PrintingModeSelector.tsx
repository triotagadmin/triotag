import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Printer, Users } from "lucide-react";

export type PrintingMode = "triotag_managed" | "print_partner_managed";

interface PrintingModeSelectorProps {
  value: PrintingMode | null;
  onChange: (mode: PrintingMode) => void;
}

export const PrintingModeSelector = ({ value, onChange }: PrintingModeSelectorProps) => {
  const options: { mode: PrintingMode; icon: React.ReactNode; title: string; description: string }[] = [
    {
      mode: "triotag_managed",
      icon: <Printer className="h-8 w-8" />,
      title: "I will let Triotag handle printing",
      description: "Triotag manages production, shipping, and fulfillment at standard catalog prices.",
    },
    {
      mode: "print_partner_managed",
      icon: <Users className="h-8 w-8" />,
      title: "I am a Print Partner",
      description: "Set your own custom pricing per material and generate a checkout page for your client.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Who will handle printing?</CardTitle>
        <CardDescription>Select how print materials will be produced and priced.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {options.map((opt) => {
            const isSelected = value === opt.mode;
            return (
              <div
                key={opt.mode}
                className={`p-5 rounded-[14px] border-2 cursor-pointer transition-all text-center ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-[0_0_12px_hsl(var(--primary)_/_0.15)]"
                    : "border-border hover:border-primary/40"
                }`}
                onClick={() => onChange(opt.mode)}
              >
                <div
                  className={`mx-auto mb-3 w-14 h-14 rounded-xl flex items-center justify-center ${
                    isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opt.icon}
                </div>
                <p className="font-semibold text-sm">{opt.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
