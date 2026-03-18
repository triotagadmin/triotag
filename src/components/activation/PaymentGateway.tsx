import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Smartphone, Loader2, CheckCircle, Shield, Lock, ExternalLink, Building2, Wallet, MapPin, Package, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { calculateTotalOrderCost, getMaterialUnitPrice } from "@/lib/materialPricing";
import { type BranchMaterialConfig } from "@/components/print-order/BranchMaterialConfigurator";

export interface BranchBreakdown {
  branchId: string;
  branchName: string;
  city: string;
  leaseCost: number;
  materialCost: number;
  materials: { label: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
}

interface PaymentGatewayProps {
  activationId: string;
  listingTitle: string;
  onPaymentSuccess: () => void;
  onBack: () => void;
  onCancelBooking?: () => void;
  disabled?: boolean;
  /** Order parameters sent to backend for server-side pricing */
  orderParams?: {
    locations: number;
    weeks: number;
    material: string;
  };
  /** Branch-level configs for itemized breakdown */
  branchConfigs?: BranchMaterialConfig[];
  /** Selected branch IDs */
  selectedBranchIds?: Set<string>;
  /** Booking dates for lease calculation */
  startDate?: Date;
  endDate?: Date;
}

type PaymentMethod = "card" | "gcash" | "maya";

const PAYMENT_METHODS = [
  {
    id: "card" as PaymentMethod,
    name: "Credit / Debit Card",
    description: "Pay securely with Visa or Mastercard",
    icon: CreditCard,
  },
  {
    id: "gcash" as PaymentMethod,
    name: "GCash",
    description: "Pay instantly with your GCash e-wallet",
    icon: Smartphone,
  },
  {
    id: "maya" as PaymentMethod,
    name: "Maya",
    description: "Pay with your Maya digital wallet",
    icon: Wallet,
  },
];

const COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "US", name: "United States" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "JP", name: "Japan" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

const PhpConversionInline = ({ amountUsd }: { amountUsd: number }) => {
  const { convertedAmount, loading } = useCurrencyConversion(amountUsd, "USD", "PHP");
  if (amountUsd <= 0) return null;
  if (loading) return <Loader2 className="h-3 w-3 animate-spin inline ml-1" />;
  const phpAmount = convertedAmount ?? amountUsd;
  return (
    <>
      <span className="font-semibold">₱{phpAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
      <span className="text-xs text-muted-foreground font-normal ml-1">
        (${amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD)
      </span>
    </>
  );
};

const BranchBreakdownCard = ({
  branches,
  currency,
  formatPriceFn,
}: {
  branches: BranchBreakdown[];
  currency: string;
  formatPriceFn: (price: number, curr?: string) => string;
}) => {
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const isUsd = currency === "USD";

  const toggleBranch = (id: string) => {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (branches.length === 0) return null;

  const totalLease = branches.reduce((s, b) => s + b.leaseCost, 0);
  const totalMaterial = branches.reduce((s, b) => s + b.materialCost, 0);
  const grandTotal = totalLease + totalMaterial;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Itemized Order Summary
        </CardTitle>
        <CardDescription>{branches.length} branch{branches.length !== 1 ? "es" : ""} selected</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {branches.map((branch) => {
          const isExpanded = expandedBranches.has(branch.branchId);
          return (
            <div key={branch.branchId} className="rounded-lg border border-border/50 overflow-hidden">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleBranch(branch.branchId)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{branch.branchName}</p>
                    {branch.city && <p className="text-xs text-muted-foreground">{branch.city}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold text-sm">
                    {isUsd ? (
                      <PhpConversionInline amountUsd={branch.subtotal} />
                    ) : (
                      formatPriceFn(branch.subtotal)
                    )}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border/50 p-3 bg-muted/10 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lease Fee</span>
                    <span>
                      {isUsd ? <PhpConversionInline amountUsd={branch.leaseCost} /> : formatPriceFn(branch.leaseCost)}
                    </span>
                  </div>
                  {branch.materials.filter(m => m.quantity > 0).map((mat, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {mat.label} × {mat.quantity}
                      </span>
                      <span>
                        {isUsd ? <PhpConversionInline amountUsd={mat.total} /> : formatPriceFn(mat.total)}
                      </span>
                    </div>
                  ))}
                  {branch.materialCost > 0 && (
                    <div className="flex justify-between border-t border-border/30 pt-1.5">
                      <span className="text-muted-foreground">Materials Subtotal</span>
                      <span className="font-medium">
                        {isUsd ? <PhpConversionInline amountUsd={branch.materialCost} /> : formatPriceFn(branch.materialCost)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Totals */}
        <div className="border-t border-primary/20 pt-3 mt-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Lease Fees ({branches.length} branches)</span>
            <span>
              {isUsd ? <PhpConversionInline amountUsd={totalLease} /> : <span className="font-medium">{formatPriceFn(totalLease)}</span>}
            </span>
          </div>
          {totalMaterial > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Print Materials</span>
              <span>
                {isUsd ? <PhpConversionInline amountUsd={totalMaterial} /> : <span className="font-medium">{formatPriceFn(totalMaterial)}</span>}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-lg">Grand Total</span>
            <div className="text-right">
              {isUsd ? (
                <span className="text-2xl font-bold text-primary">
                  <PhpConversionInline amountUsd={grandTotal} />
                </span>
              ) : (
                <span className="text-2xl font-bold text-primary">{formatPriceFn(grandTotal)}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrderSummaryCard = ({
  listingTitle,
  activationId,
  leaseCost,
  materialCost,
  bookingAmount,
  currency,
  formatPrice,
}: {
  listingTitle: string;
  activationId: string;
  leaseCost: number;
  materialCost: number;
  bookingAmount: number;
  currency: string;
  formatPrice: (price: number, curr?: string) => string;
}) => {
  const isUsd = currency === "USD";
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ad Space Activation</span>
            <span className="font-medium">{listingTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Booking ID</span>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{activationId.slice(0, 8).toUpperCase()}</span>
          </div>

          <div className="border-t border-border/50 pt-2 mt-2 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ad Space Lease Fee</span>
              <span>
                {isUsd ? (
                  <PhpConversionInline amountUsd={leaseCost} />
                ) : (
                  <span className="font-medium">{formatPrice(leaseCost)}</span>
                )}
              </span>
            </div>
            {materialCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ad Material Cost</span>
                <span>
                  {isUsd ? (
                    <PhpConversionInline amountUsd={materialCost} />
                  ) : (
                    <span className="font-medium">{formatPrice(materialCost)}</span>
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-primary/20 pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-lg">Total Amount</span>
              <div className="text-right">
                {isUsd ? (
                  <span className="text-2xl font-bold text-primary">
                    <PhpConversionInline amountUsd={bookingAmount} />
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-primary">{formatPrice(bookingAmount)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export const PaymentGateway = ({
  activationId,
  listingTitle,
  onPaymentSuccess,
  onBack,
  onCancelBooking,
  disabled = false,
  orderParams,
  branchConfigs,
  selectedBranchIds,
  startDate,
  endDate,
}: PaymentGatewayProps) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingAmount, setBookingAmount] = useState(0);
  const [leaseCost, setLeaseCost] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [currency, setCurrency] = useState("PHP");
  const [branchBreakdowns, setBranchBreakdowns] = useState<BranchBreakdown[]>([]);

  // Billing info
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("PH");
  const [zipCode, setZipCode] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!activationId) {
        setIsLoading(false);
        return;
      }
      try {
        const { data: activation, error } = await supabase
          .from("activations")
          .select(`*, ad_spaces (title, specifications, pricing)`)
          .eq("id", activationId)
          .single();

        if (error) throw error;

        // Get ad space pricing info
        const adSpace = activation.ad_spaces as Record<string, unknown>;
        const specs = adSpace?.specifications as Record<string, unknown>;
        const pricing = adSpace?.pricing as Record<string, unknown>;
        const adUnits = (specs?.ad_units || pricing?.ad_units || []) as Array<Record<string, unknown>>;
        const selectedAdUnit = adUnits[0];
        const weeklyRate = (selectedAdUnit?.pricePerWeek || pricing?.weekly || 0) as number;
        const monthlyRate = (selectedAdUnit?.pricePerMonth || pricing?.monthly || 0) as number;
        const detectedCurrency = (specs?.lease_currency as string) || (specs?.currency as string) || "PHP";
        setCurrency(detectedCurrency);

        // Calculate duration
        const activationStartDate = startDate || (activation.start_date ? new Date(activation.start_date) : null);
        const activationEndDate = endDate || (activation.end_date ? new Date(activation.end_date) : null);
        let diffWeeks = 1;
        if (activationStartDate && activationEndDate) {
          const diffDays = Math.ceil(Math.abs(activationEndDate.getTime() - activationStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          diffWeeks = Math.ceil(diffDays / 7);
        }

        // Calculate per-unit lease cost
        let perBranchLease = 0;
        if (diffWeeks >= 4 && monthlyRate > 0) {
          const fullMonths = Math.floor(diffWeeks / 4);
          const remainingWeeks = diffWeeks % 4;
          perBranchLease = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
        } else {
          perBranchLease = diffWeeks * weeklyRate;
        }

        // Build per-branch breakdowns
        const activeBranches = branchConfigs?.filter(
          (b) => !selectedBranchIds || selectedBranchIds.has(b.branchId)
        ) || [];

        if (activeBranches.length > 0) {
          const breakdowns: BranchBreakdown[] = activeBranches.map((branch) => {
            const branchMaterials = branch.materials
              .filter((m) => m.quantity > 0)
              .map((m) => ({
                label: m.materialLabel,
                quantity: m.quantity,
                unitPrice: getMaterialUnitPrice(m.materialType),
                total: getMaterialUnitPrice(m.materialType) * m.quantity,
              }));
            const branchMatCost = branchMaterials.reduce((s, m) => s + m.total, 0);
            return {
              branchId: branch.branchId,
              branchName: branch.branchName,
              city: branch.city,
              leaseCost: perBranchLease,
              materialCost: branchMatCost,
              materials: branchMaterials,
              subtotal: perBranchLease + branchMatCost,
            };
          });

          setBranchBreakdowns(breakdowns);
          const totalLease = breakdowns.reduce((s, b) => s + b.leaseCost, 0);
          const totalMat = breakdowns.reduce((s, b) => s + b.materialCost, 0);
          setLeaseCost(totalLease);
          setMaterialCost(totalMat);
          setBookingAmount(totalLease + totalMat);
        } else {
          // Fallback: no branch data, use activation-level totals
          let amount = activation.total_amount || activation.estimated_publisher_payout || 0;
          if (amount <= 0) amount = perBranchLease;
          setLeaseCost(amount);

          if (activation.print_order_id) {
            const { data: advPrintOrder } = await supabase
              .from("advertiser_print_orders")
              .select("total_cost, materials")
              .eq("id", activation.print_order_id)
              .single();

            let matCost = advPrintOrder?.total_cost || 0;
            if (matCost <= 0 && advPrintOrder?.materials) {
              const mats = advPrintOrder.materials as Record<string, unknown>;
              const branches = (mats?.branches || []) as Array<{ materials: { materialType: string; quantity: number }[] }>;
              matCost = calculateTotalOrderCost(branches);
            }
            if (matCost > 0) {
              setMaterialCost(matCost);
              amount += matCost;
            } else {
              const { data: printOrder } = await supabase
                .from("print_orders")
                .select("total_price")
                .eq("id", activation.print_order_id)
                .single();
              if (printOrder?.total_price) {
                setMaterialCost(printOrder.total_price);
                amount += printOrder.total_price;
              }
            }
          }
          setBookingAmount(amount);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) setBuyerEmail(session.user.email);
      } catch (error) {
        console.error("Error fetching booking details:", error);
        toast({ title: "Error", description: "Failed to load booking details", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookingDetails();
  }, [activationId, toast, branchConfigs, selectedBranchIds, startDate, endDate]);

  const formatPrice = (price: number, curr: string = currency) => {
    const symbols: Record<string, string> = { PHP: "₱", USD: "$", EUR: "€" };
    return `${symbols[curr] || curr} ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const isBillingComplete = buyerName && buyerEmail && billingAddress && city && country && zipCode;

  const handleProceedToCheckout = async () => {
    if (!isBillingComplete) {
      toast({ title: "Missing Information", description: "Please complete all required billing fields.", variant: "destructive" });
      return;
    }

    if (bookingAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Unable to calculate booking total. Please check branch data and pricing.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          activationId,
          paymentMethod: selectedMethod,
          buyerName,
          buyerEmail,
          buyerPhone,
          companyName,
          billingAddress,
          billingCity: city,
          billingCountry: country,
          billingZip: zipCode,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: window.location.href,
        },
      });

      if (error) throw new Error(error.message || "Unable to proceed to payment. Please try again.");
      if (data?.error) throw new Error(data.error);

      const checkoutUrl = data?.checkout_url;
      if (!checkoutUrl) throw new Error("Unable to proceed to payment. Please try again.");

      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({ title: "Checkout Failed", description: error.message || "Unable to proceed to payment. Please try again.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading booking details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasBranchBreakdowns = branchBreakdowns.length > 0;

  return (
    <div className="space-y-6">
      {/* Itemized per-branch summary OR flat summary */}
      {hasBranchBreakdowns ? (
        <BranchBreakdownCard
          branches={branchBreakdowns}
          currency={currency}
          formatPriceFn={formatPrice}
        />
      ) : (
        <OrderSummaryCard
          listingTitle={listingTitle}
          activationId={activationId}
          leaseCost={leaseCost}
          materialCost={materialCost}
          bookingAmount={bookingAmount}
          currency={currency}
          formatPrice={formatPrice}
        />
      )}

      {/* Section 1 — Billing Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Billing Information
          </CardTitle>
          <CardDescription>Enter your billing details for this transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="buyerName">Full Name *</Label>
              <Input id="buyerName" placeholder="Juan Dela Cruz" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} disabled={isProcessing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerEmail">Email Address *</Label>
              <Input id="buyerEmail" type="email" placeholder="juan@example.com" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} disabled={isProcessing} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (optional)</Label>
              <Input id="companyName" placeholder="Acme Corp" value={companyName} onChange={(e) => setCompanyName(e.target.value)} disabled={isProcessing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerPhone">Phone Number (optional)</Label>
              <Input id="buyerPhone" type="tel" placeholder="09XX XXX XXXX" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} disabled={isProcessing} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="billingAddress">Billing Address *</Label>
            <Input id="billingAddress" placeholder="123 Main Street, Barangay" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} disabled={isProcessing} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" placeholder="Manila" value={city} onChange={(e) => setCity(e.target.value)} disabled={isProcessing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select value={country} onValueChange={setCountry} disabled={isProcessing}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP / Postal Code *</Label>
              <Input id="zipCode" placeholder="1000" value={zipCode} onChange={(e) => setZipCode(e.target.value)} disabled={isProcessing} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Payment Method */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
          <CardDescription>Select your preferred payment option</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <div
                  key={method.id}
                  className={`relative flex flex-col rounded-xl border-2 p-4 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => !isProcessing && setSelectedMethod(method.id)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{method.name}</p>
                    </div>
                    {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{method.description}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    {method.id === "card" && (
                      <>
                        <div className="bg-[#1A1F71] text-white text-[10px] font-bold px-2 py-1 rounded italic">VISA</div>
                        <div className="flex">
                          <div className="w-4 h-4 bg-[#EB001B] rounded-full -mr-1.5"></div>
                          <div className="w-4 h-4 bg-[#F79E1B] rounded-full opacity-90"></div>
                        </div>
                      </>
                    )}
                    {method.id === "gcash" && (
                      <div className="bg-[#007DFE] text-white text-[10px] font-bold px-3 py-1 rounded-full">GCash</div>
                    )}
                    {method.id === "maya" && (
                      <div className="bg-[#22B24C] text-white text-[10px] font-bold px-3 py-1 rounded-full">Maya</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedMethod === "card" && (
            <div className="bg-muted/50 rounded-lg p-4 border mt-2">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure Card Payment</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your card details are entered directly on PayMongo's secure checkout page. TrioTag never stores your card information.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secure Notice */}
      <div className="bg-muted/50 rounded-lg p-4 border">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-sm">Payments are securely processed by PayMongo.</p>
            <p className="text-xs text-muted-foreground mt-1">
              You will be redirected to PayMongo's PCI-DSS compliant checkout page. Card details are tokenized and never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <Button
        onClick={handleProceedToCheckout}
        disabled={isProcessing || disabled || !isBillingComplete || bookingAmount <= 0}
        className="w-full h-14 text-lg font-semibold"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Redirecting to Secure Checkout...
          </>
        ) : (
          <>
            <ExternalLink className="h-5 w-5 mr-2" />
            Pay and Confirm Booking — {formatPrice(bookingAmount)}
          </>
        )}
      </Button>

      {/* Security Footer */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>256-bit SSL encrypted payment</span>
        </div>
        <div className="flex items-center gap-3 opacity-60">
          <div className="bg-[#1A1F71] text-white text-[8px] font-bold px-1.5 py-0.5 rounded italic">VISA</div>
          <div className="flex">
            <div className="w-3 h-3 bg-[#EB001B] rounded-full -mr-1"></div>
            <div className="w-3 h-3 bg-[#F79E1B] rounded-full opacity-90"></div>
          </div>
          <div className="bg-[#007DFE] text-white text-[8px] font-bold px-2 py-0.5 rounded-full">GCash</div>
          <div className="bg-[#22B24C] text-white text-[8px] font-bold px-2 py-0.5 rounded-full">Maya</div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={onBack} disabled={isProcessing} className="flex-1">
          Back to Print Order
        </Button>
        {onCancelBooking && (
          <Button variant="destructive" onClick={onCancelBooking} disabled={isProcessing} className="flex-1">
            Cancel & Restart Booking
          </Button>
        )}
      </div>
    </div>
  );
};
