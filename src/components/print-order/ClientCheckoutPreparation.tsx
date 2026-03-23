import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MapPin, DollarSign, Package, ArrowLeft } from "lucide-react";
import type { PrintPartnerBranchConfig } from "./PrintPartnerConfigurator";

interface ClientCheckoutPreparationProps {
  franchiseName: string;
  branches: PrintPartnerBranchConfig[];
  leaseCost: number;
  leaseCurrency: string;
  startDate?: Date;
  endDate?: Date;
  onGenerate: (clientInfo: {
    clientName: string;
    clientEmail: string;
    companyName: string;
    campaignTitle: string;
    notes: string;
  }) => void;
  onBack: () => void;
  generating?: boolean;
}

export const ClientCheckoutPreparation = ({
  franchiseName,
  branches,
  leaseCost,
  leaseCurrency,
  startDate,
  endDate,
  onGenerate,
  onBack,
  generating,
}: ClientCheckoutPreparationProps) => {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [campaignTitle, setCampaignTitle] = useState(franchiseName ? `Campaign - ${franchiseName}` : "");
  const [notes, setNotes] = useState("");

  const printTotal = branches.reduce(
    (sum, b) => sum + b.materials.reduce((s, m) => s + m.quantity * m.customUnitPrice, 0),
    0
  );

  const grandTotal = leaseCost + printTotal;
  const isValid = clientName.trim() && clientEmail.trim() && clientEmail.includes("@");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Client Checkout Preparation
          </CardTitle>
          <CardDescription>
            Enter your client's details and review the order before generating a checkout page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Client Name *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full name" className="mt-1" />
            </div>
            <div>
              <Label>Client Email *</Label>
              <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" className="mt-1" />
            </div>
            <div>
              <Label>Company Name (optional)</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" className="mt-1" />
            </div>
            <div>
              <Label>Campaign / Booking Title</Label>
              <Input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} placeholder="Campaign title" className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional instructions..." className="mt-1" rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {startDate && endDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Campaign Duration</span>
              <span className="font-medium">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ad Space Lease</span>
            <span className="font-medium">
              {leaseCurrency === "PHP" ? "₱" : "$"}{leaseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {branches.filter(b => b.materials.some(m => m.quantity > 0)).map((branch) => (
            <div key={branch.branchId} className="border rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="font-medium">{branch.branchName}</span>
              </div>
              {branch.materials.filter(m => m.quantity > 0).map((m) => (
                <div key={m.materialType} className="flex justify-between text-xs pl-5">
                  <span className="text-muted-foreground">
                    {m.materialLabel} ({m.quantity} × ₱{m.customUnitPrice.toFixed(2)})
                  </span>
                  <span>₱{(m.quantity * m.customUnitPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          ))}

          <div className="flex justify-between text-sm pt-2 border-t border-border">
            <span className="text-muted-foreground">Print Materials Total</span>
            <span className="font-medium">₱{printTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
            <span>Grand Total</span>
            <span className="text-primary">₱{grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={() => onGenerate({ clientName, clientEmail, companyName, campaignTitle, notes })}
          disabled={!isValid || generating}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Generate Client Checkout Page
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
