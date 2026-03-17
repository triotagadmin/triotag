import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Material unit prices in USD (fallback if not stored)
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

    console.log("[create-checkout] Activation:", {
      id: activation.id,
      status: activation.status,
      total_amount: activation.total_amount,
      start_date: activation.start_date,
      end_date: activation.end_date,
      print_order_id: activation.print_order_id,
    });

    // ── 2. Compute lease cost from ad space rates & booking dates ──
    let leaseCost = activation.total_amount || activation.estimated_publisher_payout || 0;

    if (leaseCost <= 0 && activation.start_date && activation.end_date) {
      const startDate = new Date(activation.start_date);
      const endDate = new Date(activation.end_date);
      const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const diffWeeks = Math.ceil(diffDays / 7);

      const adSpace = activation.ad_spaces;
      const specs = adSpace?.specifications || {};
      const pricing = adSpace?.pricing || {};
      const adUnits = specs?.ad_units || pricing?.ad_units || [];
      const selectedAdUnit = adUnits[0];
      const weeklyRate = selectedAdUnit?.pricePerWeek || pricing?.weekly || 0;
      const monthlyRate = selectedAdUnit?.pricePerMonth || pricing?.monthly || 0;

      if (diffWeeks >= 4 && monthlyRate > 0) {
        const fullMonths = Math.floor(diffWeeks / 4);
        const remainingWeeks = diffWeeks % 4;
        leaseCost = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
      } else {
        leaseCost = diffWeeks * weeklyRate;
      }
      console.log("[create-checkout] Computed lease from dates:", { diffWeeks, weeklyRate, monthlyRate, leaseCost });
    }

    // ── 3. Compute material cost from print orders ──
    let materialCost = 0;

    if (activation.print_order_id) {
      // Try advertiser_print_orders first
      const { data: advPrintOrder } = await supabase
        .from("advertiser_print_orders")
        .select("total_cost, materials")
        .eq("id", activation.print_order_id)
        .single();

      materialCost = advPrintOrder?.total_cost || 0;

      // Fallback: calculate from materials JSON
      if (materialCost <= 0 && advPrintOrder?.materials) {
        const mats = advPrintOrder.materials as any;
        const branches = mats?.branches || [];
        for (const branch of branches) {
          for (const mat of (branch?.materials || [])) {
            if (mat.quantity > 0) {
              const unitPrice = MATERIAL_PRICES_USD[mat.materialType] || 2;
              materialCost += unitPrice * mat.quantity;
            }
          }
        }
      }

      // Final fallback to print_orders table
      if (materialCost <= 0) {
        const { data: printOrder } = await supabase
          .from("print_orders")
          .select("total_price")
          .eq("id", activation.print_order_id)
          .single();
        if (printOrder?.total_price) materialCost = printOrder.total_price;
      }

      console.log("[create-checkout] Material cost:", materialCost);
    }

    // ── 4. Determine currency & convert ──
    const specs = activation.ad_spaces?.specifications || {};
    const leaseCurrency = specs?.lease_currency || specs?.currency || "PHP";
    const listingTitle = activation.ad_spaces?.title || "Ad Space Booking";

    // Convert amounts to PHP if needed
    const USD_TO_PHP = 56;
    let leasePhp = leaseCurrency === "USD" ? leaseCost * USD_TO_PHP : leaseCost;
    let materialPhp = leaseCurrency === "USD" ? materialCost * USD_TO_PHP : materialCost;

    // If both are 0, it's invalid
    const totalPhp = leasePhp + materialPhp;
    if (totalPhp <= 0) {
      throw new Error("Invalid booking amount. Please ensure dates and pricing are configured.");
    }

    const leaseCentavos = Math.round(leasePhp * 100);
    const materialCentavos = Math.round(materialPhp * 100);
    const totalCentavos = leaseCentavos + materialCentavos;

    if (totalCentavos < 100) {
      throw new Error("Minimum payment amount is ₱1.00");
    }

    console.log("[create-checkout] Pricing breakdown:", {
      leaseCost, materialCost, leaseCurrency,
      leasePhp, materialPhp, totalPhp,
      leaseCentavos, materialCentavos, totalCentavos,
    });

    // ── 5. Build PayMongo line items ──
    const lineItems: any[] = [];

    if (leaseCentavos > 0) {
      lineItems.push({
        currency: "PHP",
        amount: leaseCentavos,
        description: `Booking: ${activation.start_date || "N/A"} to ${activation.end_date || "N/A"}`,
        name: `Ad Space Lease — ${listingTitle}`,
        quantity: 1,
      });
    }

    if (materialCentavos > 0) {
      lineItems.push({
        currency: "PHP",
        amount: materialCentavos,
        description: "Print materials for all selected branches",
        name: "Print Materials",
        quantity: 1,
      });
    }

    // Fallback: single line item if somehow only total is available
    if (lineItems.length === 0) {
      lineItems.push({
        currency: "PHP",
        amount: totalCentavos,
        description: `Ad Space Booking — ${listingTitle}`,
        name: "Ad Space Booking",
        quantity: 1,
      });
    }

    // ── 6. Map payment method ──
    const methodMap: Record<string, string[]> = {
      card: ["card"],
      gcash: ["gcash"],
      maya: ["paymaya"],
    };
    const paymentMethodTypes = methodMap[paymentMethod || "card"] || ["card", "gcash", "paymaya"];

    // ── 7. Create PayMongo Checkout Session ──
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
            lease_cost_php: leasePhp.toString(),
            material_cost_php: materialPhp.toString(),
            total_php: totalPhp.toString(),
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

    // ── 8. Update activation with server-computed total ──
    const totalUsd = leaseCurrency === "USD" ? (leaseCost + materialCost) : totalPhp / USD_TO_PHP;
    await supabase
      .from("activations")
      .update({
        status: "payment_pending",
        total_amount: totalUsd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activationId);

    console.log("[create-checkout] SUCCESS — Session:", sessionId);

    return new Response(
      JSON.stringify({
        checkout_url: checkoutUrl,
        sessionId,
        lease_php: leasePhp,
        material_php: materialPhp,
        total_php: totalPhp,
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
