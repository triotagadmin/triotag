import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Send, CreditCard, AlertCircle } from "lucide-react";
import { FranchiseSelector } from "@/components/print-order/FranchiseSelector";
import { BranchMaterialConfigurator, type BranchMaterialConfig } from "@/components/print-order/BranchMaterialConfigurator";
import { PrintOrderSummary } from "@/components/print-order/PrintOrderSummary";
import { BRAND_NAME } from "@/lib/brand";
import { calculateTotalOrderCost, formatCurrency } from "@/lib/materialPricing";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AD_UNIT_MATERIAL_LABELS: Record<string, string> = {
  vinyl_sticker: "Vinyl Sticker",
  table_tent_card: "Table Tent Card",
  acrylic_table_tent: "Acrylic Table Tent",
  coroplast_stand: "Coroplast Stand",
  poster_frame: "Poster Frame",
  wall_decal: "Wall Decal",
};

const OrderPrints = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [userId, setUserId] = useState("");
  const preselectedFranchiseId = (location.state as any)?.preselectedFranchiseId || "";
  const [selectedFranchiseId, setSelectedFranchiseId] = useState(preselectedFranchiseId);
  const [branches, setBranches] = useState<BranchMaterialConfig[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [availableMaterials, setAvailableMaterials] = useState<{ type: string; label: string }[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [franchiseName, setFranchiseName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Check for returning from payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      // User returned from PayMongo, show success
      setOrderComplete(true);
      setOrderId(sessionId.slice(0, 8));
      // Clean the URL
      window.history.replaceState({}, "", "/order-prints");
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data: profile } = await supabase
        .from("advertiser_profiles")
        .select("status")
        .eq("user_id", session.user.id)
        .single();
      if (profile?.status === "approved") {
        setIsVerified(true);
        setUserId(session.user.id);
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const loadBranches = useCallback(async (franchiseId: string) => {
    setBranchesLoading(true);
    const isListing = franchiseId.startsWith("listing_");
    const isAdv = franchiseId.startsWith("adv_");
    const realId = franchiseId.replace(/^(listing_|adv_)/, "");

    let branchData: BranchMaterialConfig[] = [];
    let materials: { type: string; label: string }[] = [];
    let detectedCurrency = "USD";
    let name = "";

    if (isListing) {
      const { data: listing } = await supabase
        .from("ad_spaces")
        .select("title, location, specifications")
        .eq("id", realId)
        .single();

      if (listing) {
        name = listing.title;
        const specs = (listing.specifications as any) || {};
        detectedCurrency = specs.lease_currency || "USD";
        const matTypes: string[] = specs.ad_unit_materials || [];
        materials = matTypes.map((t) => ({ type: t, label: AD_UNIT_MATERIAL_LABELS[t] || t }));
      }

      const { data: fBranches } = await supabase
        .from("franchise_branches")
        .select("id, place_name, full_address")
        .eq("franchise_id", realId)
        .order("created_at");

      const { data: advBranches } = await supabase
        .from("advertiser_branches")
        .select("id, branch_name, full_address, city")
        .eq("listing_id", realId)
        .eq("is_ad_space_listing", true)
        .order("created_at");

      const { data: existingMats } = await supabase
        .from("branch_materials")
        .select("branch_id, material_type, quantity")
        .eq("listing_id", realId);

      const matMap = new Map<string, Map<string, number>>();
      existingMats?.forEach((m: any) => {
        if (!matMap.has(m.branch_id)) matMap.set(m.branch_id, new Map());
        matMap.get(m.branch_id)!.set(m.material_type, m.quantity);
      });

      const seenIds = new Set<string>();
      const allBranches: { id: string; name: string; address: string; city: string }[] = [];

      if (listing) {
        const headAddress = listing.location || "";
        const headParts = headAddress.split(",").map((s: string) => s.trim());
        const headCity = headParts.length >= 2 ? headParts[headParts.length - 2] : "";
        allBranches.push({
          id: `head_${realId}`,
          name: `${listing.title} (Head Office)`,
          address: headAddress,
          city: headCity,
        });
        seenIds.add(`head_${realId}`);
      }

      (fBranches || []).forEach((b: any) => {
        if (!seenIds.has(b.id)) {
          seenIds.add(b.id);
          const addressParts = b.full_address?.split(",") || [];
          allBranches.push({
            id: b.id,
            name: b.place_name,
            address: b.full_address,
            city: addressParts.length >= 2 ? addressParts[addressParts.length - 2]?.trim() : "",
          });
        }
      });

      (advBranches || []).forEach((b: any) => {
        if (!seenIds.has(b.id)) {
          seenIds.add(b.id);
          allBranches.push({
            id: b.id,
            name: b.branch_name || b.full_address,
            address: b.full_address,
            city: b.city || "",
          });
        }
      });

      branchData = allBranches.map((b) => {
        const branchMats = matMap.get(b.id);
        const addressParts = (b.address || "").split(",").map((s: string) => s.trim());
        const derivedCity = b.city || (addressParts.length >= 2 ? addressParts[addressParts.length - 2] : "");
        const derivedProvince = addressParts.length >= 3 ? addressParts[addressParts.length - 3] : "";
        return {
          branchId: b.id,
          branchName: b.name,
          fullAddress: b.address,
          city: derivedCity,
          materials: materials.map((m) => ({
            materialType: m.type,
            materialLabel: m.label,
            quantity: branchMats?.get(m.type) || 0,
          })),
          shippingAddress: {
            recipient: b.name || "",
            street: b.address || "",
            city: derivedCity,
            province: derivedProvince,
            postalCode: "",
            contact: "",
          },
        };
      });
    } else if (isAdv) {
      const { data: franchise } = await supabase
        .from("advertiser_franchises")
        .select("franchise_name")
        .eq("id", realId)
        .single();

      name = franchise?.franchise_name || "Franchise";

      const { data: advBranches } = await supabase
        .from("advertiser_branches")
        .select("id, branch_name, full_address, city, listing_id")
        .eq("advertiser_franchise_id", realId)
        .order("created_at");

      const listingIds = [...new Set((advBranches || []).map((b: any) => b.listing_id).filter(Boolean))];
      if (listingIds.length > 0) {
        const { data: listings } = await supabase
          .from("ad_spaces")
          .select("specifications")
          .in("id", listingIds);

        const matSet = new Set<string>();
        listings?.forEach((l: any) => {
          const specs = (l.specifications as any) || {};
          (specs.ad_unit_materials || []).forEach((t: string) => matSet.add(t));
          if (!detectedCurrency || detectedCurrency === "USD") {
            detectedCurrency = specs.lease_currency || detectedCurrency;
          }
        });
        materials = Array.from(matSet).map((t) => ({ type: t, label: AD_UNIT_MATERIAL_LABELS[t] || t }));
      }

      if (materials.length === 0) {
        materials = [
          { type: "vinyl_sticker", label: "Vinyl Sticker" },
          { type: "table_tent_card", label: "Table Tent Card" },
        ];
      }

      branchData = (advBranches || []).map((b: any) => {
        const addressParts = (b.full_address || "").split(",").map((s: string) => s.trim());
        const derivedCity = b.city || (addressParts.length >= 2 ? addressParts[addressParts.length - 2] : "");
        return {
          branchId: b.id,
          branchName: b.branch_name || b.full_address,
          fullAddress: b.full_address,
          city: derivedCity,
          materials: materials.map((m) => ({
            materialType: m.type,
            materialLabel: m.label,
            quantity: 0,
          })),
          shippingAddress: {
            recipient: b.branch_name || b.full_address || "",
            street: b.full_address || "",
            city: derivedCity,
            province: "",
            postalCode: "",
            contact: "",
          },
        };
      });
    }

    setFranchiseName(name);
    setAvailableMaterials(materials);
    setCurrency(detectedCurrency);
    setBranches(branchData);
    setBranchesLoading(false);
  }, []);

  useEffect(() => {
    if (selectedFranchiseId) loadBranches(selectedFranchiseId);
    else {
      setBranches([]);
      setAvailableMaterials([]);
    }
  }, [selectedFranchiseId, loadBranches]);

  const handleSubmit = async () => {
    const branchesWithMaterials = branches.filter((b) => b.materials.some((m) => m.quantity > 0));

    if (branchesWithMaterials.length === 0) {
      toast({ title: "Select at least one material with quantity > 0", variant: "destructive" });
      return;
    }

    // Validate shipping addresses
    const addressErrors: string[] = [];
    for (const b of branchesWithMaterials) {
      if (!b.shippingAddress.street.trim()) {
        addressErrors.push(`"${b.branchName}" is missing a shipping address`);
      } else if (!b.shippingAddress.city.trim()) {
        addressErrors.push(`"${b.branchName}" is missing a city`);
      }
    }

    if (addressErrors.length > 0) {
      toast({
        title: "Complete shipping address",
        description: addressErrors[0],
        variant: "destructive",
      });
      return;
    }

    const totalCost = calculateTotalOrderCost(branchesWithMaterials);

    if (totalCost <= 0) {
      toast({ title: "Order total must be greater than 0", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const realFranchiseId = selectedFranchiseId.replace(/^(listing_|adv_)/, "");
      const payload = {
        franchiseId: realFranchiseId,
        franchiseName,
        branches: branchesWithMaterials.map((b) => ({
          branchId: b.branchId,
          branchName: b.branchName,
          shippingAddress: b.shippingAddress,
          materials: b.materials.filter((m) => m.quantity > 0).map((m) => ({
            materialType: m.materialType,
            materialLabel: m.materialLabel,
            quantity: m.quantity,
          })),
        })),
        currency,
        submittedBy: userId,
        totalCost,
      };

      // Strip synthetic prefixes (head_, listing_, adv_) from branch IDs for DB storage
      const cleanBranchIds = branchesWithMaterials
        .map((b) => b.branchId.replace(/^head_/, ""))
        .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

      // Insert into advertiser_print_orders with unpaid status
      const { data: order, error } = await supabase
        .from("advertiser_print_orders")
        .insert({
          advertiser_id: userId,
          branch_ids: cleanBranchIds.length > 0 ? cleanBranchIds : [],
          materials: payload as any,
          notes: JSON.stringify({ franchise_name: franchiseName, currency }),
          status: "awaiting_payment",
          payment_status: "unpaid",
          total_cost: totalCost,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Redirect to PayMongo payment link
      setPaymentProcessing(true);
      window.location.href = "https://paymongo.page/l/triotag";
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setPaymentProcessing(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Account Verification Required</CardTitle>
              <CardDescription>Only verified advertiser accounts can order print materials.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/advertiser-dashboard")}>Back to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-lg mx-auto text-center">
            <CardHeader>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Payment Confirmed — Order Submitted!</CardTitle>
              <CardDescription>Your print order has been submitted and payment confirmed. An admin will review it shortly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-[14px]">
                <p className="text-sm text-muted-foreground">Order Reference</p>
                <p className="font-mono font-bold">{orderId.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-[14px]">
                <p className="text-sm font-medium mb-2">Status Flow</p>
                <div className="flex flex-wrap gap-1 justify-center text-xs">
                  <Badge variant="default">Paid</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Approved</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Printing</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Shipped</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="secondary">Completed</Badge>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => { setOrderComplete(false); setSelectedFranchiseId(""); setBranches([]); }}>
                  Place Another Order
                </Button>
                <Button variant="outline" onClick={() => navigate("/advertiser-dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const branchesWithMaterials = branches.filter((b) => b.materials.some((m) => m.quantity > 0));
  const totalCost = calculateTotalOrderCost(branchesWithMaterials);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Print Materials</h1>
          <p className="text-muted-foreground">
            Select a franchise, configure materials per branch, and submit your print order.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Franchise Selection (hidden when preselected) */}
          {!preselectedFranchiseId && (
            <FranchiseSelector
              userId={userId}
              selectedFranchiseId={selectedFranchiseId}
              onSelect={setSelectedFranchiseId}
            />
          )}

          {/* Section 2: Branch-Level Material Configuration */}
          {selectedFranchiseId && (
            <>
              {branchesLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Configure Ad Materials per Branch</h2>
                    <BranchMaterialConfigurator
                      branches={branches}
                      onChange={setBranches}
                      availableMaterials={availableMaterials}
                    />
                  </div>

                  {/* Section 3: Order Summary with Real-Time Pricing */}
                  {branchesWithMaterials.length > 0 && (
                    <>
                      <PrintOrderSummary
                        franchiseName={franchiseName}
                        branches={branches}
                        currency={currency}
                      />

                      {/* Payment Info */}
                      <Alert className="border-primary/30">
                        <CreditCard className="h-4 w-4" />
                        <AlertDescription>
                          Clicking "Pay & Submit" will redirect you to our secure payment gateway.
                          Your order will be submitted after successful payment of{" "}
                          <strong className="text-primary">{formatCurrency(totalCost, currency)}</strong>.
                        </AlertDescription>
                      </Alert>

                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={submitting || paymentProcessing}
                      >
                        {submitting || paymentProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {paymentProcessing ? "Redirecting to payment..." : "Processing..."}
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay & Submit — {formatCurrency(totalCost, currency)}
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderPrints;
