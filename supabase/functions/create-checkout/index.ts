import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Material unit prices in USD (server-side source of truth)
const MATERIAL_PRICES_USD: Record<string, number> = {
  vinyl_sticker: 2,
  vinyl: 2,
  table_tent_card: 3,
  acrylic_table_tent: 5,
  acrylic: 5,
  coroplast_stand: 3,
  coroplast: 3,
  poster_frame: 2,
  wall_decal: 2,
};

const USD_TO_PHP = 56;

interface CheckoutRequest {
  activationId: string;
  paymentMethod?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  companyName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingCountry?: string;
  billingZip?: string;
  successUrl: string;
  cancelUrl: string;
}

interface BranchLineItem {
  branchName: string;
  leaseCostPhp: number;
  materialCostPhp: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!paymongoSecretKey) {
      throw new Error("Payment gateway not configured. Please contact support.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    const {
      activationId, paymentMethod, buyerName, buyerEmail, buyerPhone,
      companyName, billingAddress, billingCity, billingCountry, billingZip,
      successUrl, cancelUrl,
    } = body;

    if (!activationId) throw new Error("activationId is required");
    if (!buyerName || !buyerEmail) throw new Error("buyerName and buyerEmail are required");
    if (!successUrl || !cancelUrl) throw new Error("successUrl and cancelUrl are required");

    // ── 1. Fetch activation with ad space details ──
    const { data: activation, error: activationError } = await supabase
      .from("activations")
      .select(`*, ad_spaces (title, specifications, pricing)`)
      .eq("id", activationId)
      .single();

    if (activationError || !activation) {
      console.error("[create-checkout] Activation not found:", activationError);
      throw new Error("Activation not found");
    }

    const adSpace = activation.ad_spaces;
    const specs = adSpace?.specifications || {};
    const pricing = adSpace?.pricing || {};
    const leaseCurrency = specs?.lease_currency || specs?.currency || "PHP";
    const listingTitle = adSpace?.title || "Ad Space Booking";
    const adSpaceId = activation.ad_space_id;

    console.log("[create-checkout] Activation:", {
      id: activation.id, status: activation.status,
      start_date: activation.start_date, end_date: activation.end_date,
      print_order_id: activation.print_order_id,
    });

    // ── 2. Compute per-branch lease rate ──
    const adUnits = specs?.ad_units || pricing?.ad_units || [];
    const selectedAdUnit = adUnits[0];
    const weeklyRate = selectedAdUnit?.pricePerWeek || pricing?.weekly || 0;
    const monthlyRate = selectedAdUnit?.pricePerMonth || pricing?.monthly || 0;

    let diffWeeks = 1;
    if (activation.start_date && activation.end_date) {
      const startDate = new Date(activation.start_date);
      const endDate = new Date(activation.end_date);
      const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      diffWeeks = Math.ceil(diffDays / 7);
    }

    let perBranchLease = 0;
    if (diffWeeks >= 4 && monthlyRate > 0) {
      const fullMonths = Math.floor(diffWeeks / 4);
      const remainingWeeks = diffWeeks % 4;
      perBranchLease = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
    } else {
      perBranchLease = diffWeeks * weeklyRate;
    }

    console.log("[create-checkout] Per-branch lease:", { diffWeeks, weeklyRate, monthlyRate, perBranchLease });

    // ── 3. Fetch branch data & compute per-branch materials ──
    // Get franchise branches
    const { data: fBranches } = await supabase
      .from("franchise_branches")
      .select("id, place_name, full_address")
      .eq("franchise_id", adSpaceId);

    // Get advertiser branches
    const { data: advBranches } = await supabase
      .from("advertiser_branches")
      .select("id, branch_name, full_address, city")
      .eq("listing_id", adSpaceId)
      .eq("is_ad_space_listing", true);

    // Build branch map
    const branchMap = new Map<string, string>();
    (fBranches || []).forEach((b: any) => branchMap.set(b.id, b.place_name));
    (advBranches || []).forEach((b: any) => branchMap.set(b.id, b.branch_name || b.full_address));

    // Get material data from print order
    let branchLineItems: BranchLineItem[] = [];
    let totalMaterialCost = 0;

    if (activation.print_order_id) {
      const { data: advPrintOrder } = await supabase
        .from("advertiser_print_orders")
        .select("total_cost, materials, branch_ids")
        .eq("id", activation.print_order_id)
        .single();

      if (advPrintOrder?.materials) {
        const mats = advPrintOrder.materials as any;
        const branches = mats?.branches || [];

        for (const branch of branches) {
          const branchId = branch?.branchId || "";
          const branchName = branchMap.get(branchId) || branch?.branchName || "Branch";
          let branchMatCost = 0;

          for (const mat of (branch?.materials || [])) {
            if (mat.quantity > 0) {
              const unitPrice = MATERIAL_PRICES_USD[mat.materialType] || 2;
              branchMatCost += unitPrice * mat.quantity;
            }
          }

          totalMaterialCost += branchMatCost;
          branchLineItems.push({
            branchName,
            leaseCostPhp: 0, // will be set below
            materialCostPhp: 0,
          });
        }

        // If materials JSON has branch data, use those branch IDs for lease
        if (branchLineItems.length > 0) {
          // Each branch gets the per-branch lease
          branchLineItems = branchLineItems.map((item) => ({
            ...item,
            leaseCostPhp: leaseCurrency === "USD" ? perBranchLease * USD_TO_PHP : perBranchLease,
          }));
        }
      }

      // Fallback: use stored total_cost
      if (totalMaterialCost <= 0 && advPrintOrder?.total_cost) {
        totalMaterialCost = advPrintOrder.total_cost;
      }

      // Re-compute per-branch material costs in PHP
      if (advPrintOrder?.materials) {
        const mats = advPrintOrder.materials as any;
        const branches = mats?.branches || [];
        branchLineItems = branches.map((branch: any, i: number) => {
          const branchId = branch?.branchId || "";
          const branchName = branchMap.get(branchId) || branch?.branchName || `Branch ${i + 1}`;
          let branchMatCost = 0;
          for (const mat of (branch?.materials || [])) {
            if (mat.quantity > 0) {
              const unitPrice = MATERIAL_PRICES_USD[mat.materialType] || 2;
              branchMatCost += unitPrice * mat.quantity;
            }
          }
          const matPhp = leaseCurrency === "USD" ? branchMatCost * USD_TO_PHP : branchMatCost;
          const leasePhp = leaseCurrency === "USD" ? perBranchLease * USD_TO_PHP : perBranchLease;
          return { branchName, leaseCostPhp: leasePhp, materialCostPhp: matPhp };
        });
      }
    }

    // If no branch data from print order, count branches and compute flat lease
    if (branchLineItems.length === 0) {
      const branchCount = Math.max((fBranches?.length || 0) + (advBranches?.length || 0), 1);
      // Use total activation amount or compute from branch count
      let totalLease = activation.total_amount || activation.estimated_publisher_payout || 0;
      if (totalLease <= 0) totalLease = perBranchLease * branchCount;

      const leasePhp = leaseCurrency === "USD" ? totalLease * USD_TO_PHP : totalLease;
      branchLineItems = [{
        branchName: listingTitle,
        leaseCostPhp: leasePhp,
        materialCostPhp: 0,
      }];
    }

    // ── 4. Build PayMongo line items (per-branch) ──
    const lineItems: any[] = [];
    let totalCentavos = 0;

    for (const item of branchLineItems) {
      if (item.leaseCostPhp > 0) {
        const centavos = Math.round(item.leaseCostPhp * 100);
        lineItems.push({
          currency: "PHP",
          amount: centavos,
          description: `Lease: ${activation.start_date || "N/A"} to ${activation.end_date || "N/A"}`,
          name: `Lease — ${item.branchName}`,
          quantity: 1,
        });
        totalCentavos += centavos;
      }
      if (item.materialCostPhp > 0) {
        const centavos = Math.round(item.materialCostPhp * 100);
        lineItems.push({
          currency: "PHP",
          amount: centavos,
          description: `Print materials for ${item.branchName}`,
          name: `Materials — ${item.branchName}`,
          quantity: 1,
        });
        totalCentavos += centavos;
      }
    }

    // Fallback: if no line items were generated
    if (lineItems.length === 0) {
      // Use activation total
      let fallbackAmount = activation.total_amount || activation.estimated_publisher_payout || 0;
      if (fallbackAmount <= 0) fallbackAmount = perBranchLease;
      const fallbackPhp = leaseCurrency === "USD" ? fallbackAmount * USD_TO_PHP : fallbackAmount;
      const centavos = Math.round(fallbackPhp * 100);
      lineItems.push({
        currency: "PHP",
        amount: centavos,
        description: `Ad Space Booking`,
        name: listingTitle,
        quantity: 1,
      });
      totalCentavos = centavos;
    }

    if (totalCentavos < 100) {
      throw new Error("Minimum payment amount is ₱1.00");
    }

    const totalPhp = totalCentavos / 100;

    console.log("[create-checkout] Line items:", lineItems.length, "Total PHP:", totalPhp);

    // ── 5. Map payment method ──
    const methodMap: Record<string, string[]> = {
      card: ["card"],
      gcash: ["gcash"],
      maya: ["paymaya"],
    };
    const paymentMethodTypes = methodMap[paymentMethod || "card"] || ["card", "gcash", "paymaya"];

    // ── 6. Create PayMongo Checkout Session ──
    const checkoutPayload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: lineItems,
          payment_method_types: paymentMethodTypes,
          success_url: `${successUrl}?session_id={id}&activation_id=${activationId}`,
          cancel_url: cancelUrl,
          description: `Ad Space Activation — ${listingTitle}`,
          billing: {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone || "",
          },
          metadata: {
            activation_id: activationId,
            total_php: totalPhp.toString(),
            branch_count: branchLineItems.length.toString(),
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            company_name: companyName || "",
            type: "activation_payment",
          },
        },
      },
    };

    const paymongoResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${btoa(paymongoSecretKey + ":")}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    const paymongoData = await paymongoResponse.json();
    console.log("[create-checkout] PayMongo status:", paymongoResponse.status);

    if (!paymongoResponse.ok) {
      const errorDetail = paymongoData.errors?.[0]?.detail || `PayMongo API error (HTTP ${paymongoResponse.status})`;
      console.error("[create-checkout] PayMongo error:", paymongoData.errors);
      throw new Error(`Payment gateway error: ${errorDetail}`);
    }

    const checkoutUrl = paymongoData.data?.attributes?.checkout_url;
    const sessionId = paymongoData.data?.id;

    if (!checkoutUrl || !sessionId) {
      throw new Error("Payment gateway returned an invalid response");
    }

    // ── 7. Update activation with server-computed total ──
    const totalUsd = leaseCurrency === "USD" ? totalPhp / USD_TO_PHP : totalPhp;
    await supabase
      .from("activations")
      .update({
        status: "payment_pending",
        total_amount: totalUsd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activationId);

    console.log("[create-checkout] SUCCESS — Session:", sessionId, "Total PHP:", totalPhp);

    return new Response(
      JSON.stringify({
        checkout_url: checkoutUrl,
        sessionId,
        total_php: totalPhp,
        branch_count: branchLineItems.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[create-checkout] ERROR:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
