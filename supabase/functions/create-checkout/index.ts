import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Canonical material prices (USD) — must match src/lib/printProducts.ts ──
const MATERIAL_UNIT_PRICES_USD: Record<string, number> = {
  "vinyl-sticker": 18, "vinyl_sticker": 18, "vinyl": 18,
  "table-tent-card": 18, "table_tent_card": 18,
  "table-tent-acrylic": 32, "table_tent_acrylic": 32, "acrylic_table_tent": 32, "acrylic": 32,
  "coroplast-a-frame": 66, "coroplast_stand": 66, "coroplast": 66,
  "poster_frame": 18, "wall_decal": 18,
};

const USD_TO_PHP = 56;

function getMaterialPrice(materialType: string): number {
  return MATERIAL_UNIT_PRICES_USD[materialType] ?? 18;
}

// ── Fetch allowed payment methods from PayMongo merchant capabilities ──
async function fetchAllowedPaymentMethods(secretKey: string): Promise<string[]> {
  try {
    const res = await fetch("https://api.paymongo.com/v1/merchants/capabilities/payment_methods", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(secretKey + ":")}`,
      },
    });

    if (!res.ok) {
      console.warn("[create-checkout] Failed to fetch merchant payment methods, status:", res.status);
      const errBody = await res.text();
      console.warn("[create-checkout] Error body:", errBody);
      return [];
    }

    const data = await res.json();
    // PayMongo returns { data: [ { attributes: { payment_method_type: "..." } }, ... ] }
    const methods: string[] = [];
    if (Array.isArray(data?.data)) {
      for (const item of data.data) {
        const methodType = item?.attributes?.payment_method_type;
        if (methodType && typeof methodType === "string") {
          methods.push(methodType);
        }
      }
    }
    console.log("[create-checkout] Merchant allowed payment methods:", methods);
    return methods;
  } catch (err) {
    console.error("[create-checkout] Error fetching merchant payment methods:", err);
    return [];
  }
}

// All PayMongo Checkout-supported payment method types
const ALL_CHECKOUT_METHODS = [
  "card", "gcash", "grab_pay", "paymaya", "qrph",
  "dob", "billease", "shopee_pay",
];

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
    if (!paymongoSecretKey) throw new Error("Payment gateway not configured.");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();

    // ── Route: Guest Booking ──
    if (body.type === "guest_booking") {
      return await handleGuestBookingCheckout(body, paymongoSecretKey, supabase);
    }

    // ── Route: Activation Payment (default) ──
    const {
      activationId, buyerName, buyerEmail, buyerPhone,
      companyName, billingAddress, billingCity, billingCountry, billingZip,
      successUrl, cancelUrl,
    } = body;

    // ── Validate required fields ──
    if (!activationId) throw new Error("activationId is required");
    if (!buyerName || !buyerEmail) throw new Error("buyerName and buyerEmail are required");
    if (!successUrl || !cancelUrl) throw new Error("successUrl and cancelUrl are required");

    // ── 1. Fetch activation + ad space ──
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

    // ── 2. Calculate per-branch weekly lease rate ──
    const adUnits = specs?.ad_units || pricing?.ad_units || [];
    const selectedAdUnit = adUnits[0];
    const weeklyRate = selectedAdUnit?.pricePerWeek || selectedAdUnit?.weekly_subscription_fee || pricing?.weekly || pricing?.pricePerWeek || specs?.weekly_lease_price || 0;
    const monthlyRate = selectedAdUnit?.pricePerMonth || selectedAdUnit?.monthly_subscription_fee || pricing?.monthly || pricing?.pricePerMonth || specs?.monthly_lease_price || 0;

    let diffWeeks = 1;
    if (activation.start_date && activation.end_date) {
      const s = new Date(activation.start_date);
      const e = new Date(activation.end_date);
      const diffDays = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      diffWeeks = Math.max(Math.ceil(diffDays / 7), 1);
    }

    let perBranchLease = 0;
    if (diffWeeks >= 4 && monthlyRate > 0) {
      const fullMonths = Math.floor(diffWeeks / 4);
      const remainingWeeks = diffWeeks % 4;
      perBranchLease = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
    } else {
      perBranchLease = diffWeeks * weeklyRate;
    }

    const perBranchLeasePhp = leaseCurrency === "USD" ? perBranchLease * USD_TO_PHP : perBranchLease;

    // ── 3. Fetch branches ──
    const { data: fBranches } = await supabase
      .from("franchise_branches")
      .select("id, place_name, full_address")
      .eq("franchise_id", adSpaceId);

    const { data: advBranches } = await supabase
      .from("advertiser_branches")
      .select("id, branch_name, full_address, city")
      .eq("listing_id", adSpaceId)
      .eq("is_ad_space_listing", true);

    const branchMap = new Map<string, string>();
    (fBranches || []).forEach((b: any) => branchMap.set(b.id, b.place_name));
    (advBranches || []).forEach((b: any) => branchMap.set(b.id, b.branch_name || b.full_address));

    // ── 4. Build per-branch line items ──
    interface BranchItem { branchName: string; leasePhp: number; materialPhp: number; }
    const branchItems: BranchItem[] = [];

    if (activation.print_order_id) {
      const { data: printOrder } = await supabase
        .from("advertiser_print_orders")
        .select("total_cost, materials, branch_ids")
        .eq("id", activation.print_order_id)
        .single();

      if (printOrder?.materials) {
        const mats = printOrder.materials as any;
        const branches = mats?.branches || [];

        for (const branch of branches) {
          const branchId = branch?.branchId || "";
          const branchName = branchMap.get(branchId) || branch?.branchName || "Branch";

          let branchMatUsd = 0;
          for (const mat of (branch?.materials || [])) {
            if (mat.quantity > 0) {
              branchMatUsd += getMaterialPrice(mat.materialType) * mat.quantity;
            }
          }

          const materialPhp = leaseCurrency === "USD" ? branchMatUsd * USD_TO_PHP : branchMatUsd;

          branchItems.push({ branchName, leasePhp: perBranchLeasePhp, materialPhp });
        }
      }
    }

    // Fallback: no branch data from print order
    if (branchItems.length === 0) {
      const allBranches = [...(fBranches || []), ...(advBranches || [])];
      if (allBranches.length > 0) {
        for (const b of allBranches) {
          branchItems.push({
            branchName: (b as any).place_name || (b as any).branch_name || (b as any).full_address || "Branch",
            leasePhp: perBranchLeasePhp,
            materialPhp: 0,
          });
        }
      } else {
        let totalLease = activation.total_amount || activation.estimated_publisher_payout || perBranchLease;
        const leasePhp = leaseCurrency === "USD" ? totalLease * USD_TO_PHP : totalLease;
        branchItems.push({ branchName: listingTitle, leasePhp, materialPhp: 0 });
      }
    }

    // ── 5. Build PayMongo line_items ──
    const lineItems: any[] = [];
    let totalLeasePhp = 0;
    let totalMaterialPhp = 0;

    for (const item of branchItems) {
      if (item.leasePhp > 0) {
        lineItems.push({
          currency: "PHP",
          amount: Math.round(item.leasePhp * 100),
          name: `Lease — ${item.branchName}`,
          description: `Lease: ${activation.start_date || "N/A"} to ${activation.end_date || "N/A"}`,
          quantity: 1,
        });
        totalLeasePhp += item.leasePhp;
      }
      if (item.materialPhp > 0) {
        lineItems.push({
          currency: "PHP",
          amount: Math.round(item.materialPhp * 100),
          name: `Materials — ${item.branchName}`,
          description: `Print materials for ${item.branchName}`,
          quantity: 1,
        });
        totalMaterialPhp += item.materialPhp;
      }
    }

    const totalPhp = totalLeasePhp + totalMaterialPhp;
    const totalCentavos = Math.round(totalPhp * 100);

    if (lineItems.length === 0 || totalCentavos < 100) {
      throw new Error(`Computed total is too low (₱${totalPhp.toFixed(2)}). Please ensure lease rates and materials are configured.`);
    }

    console.log("[create-checkout] Breakdown:", {
      branches: branchItems.length,
      totalLeasePhp: totalLeasePhp.toFixed(2),
      totalMaterialPhp: totalMaterialPhp.toFixed(2),
      totalPhp: totalPhp.toFixed(2),
      lineItemCount: lineItems.length,
    });

    // ── 6. Dynamically fetch allowed payment methods from PayMongo ──
    const merchantMethods = await fetchAllowedPaymentMethods(paymongoSecretKey);

    let paymentMethodTypes: string[];
    if (merchantMethods.length > 0) {
      // Intersect merchant-allowed methods with Checkout-supported methods
      paymentMethodTypes = merchantMethods.filter((m) => ALL_CHECKOUT_METHODS.includes(m));
      if (paymentMethodTypes.length === 0) {
        // Merchant has methods but none match Checkout-supported — use merchant list as-is
        paymentMethodTypes = merchantMethods;
      }
    } else {
      // Fallback: use the user's known active methods
      paymentMethodTypes = ["qrph", "grab_pay", "paymaya", "dob"];
    }

    console.log("[create-checkout] Using payment_method_types:", paymentMethodTypes);

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
            total_php: totalPhp.toFixed(2),
            branch_count: branchItems.length.toString(),
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            company_name: companyName || "",
            listing_title: listingTitle,
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

    // ── 8. Update activation with canonical total (PHP) ──
    await supabase
      .from("activations")
      .update({
        status: "payment_pending",
        total_amount: totalPhp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activationId);

    console.log("[create-checkout] SUCCESS — Session:", sessionId, "Total PHP:", totalPhp.toFixed(2));

    // ── 9. Return canonical response ──
    return new Response(
      JSON.stringify({
        checkoutUrl,
        sessionId,
        leasePhp: Math.round(totalLeasePhp * 100) / 100,
        materialPhp: Math.round(totalMaterialPhp * 100) / 100,
        totalPhp: Math.round(totalPhp * 100) / 100,
        branchCount: branchItems.length,
        paymentMethods: paymentMethodTypes,
        lineItems: lineItems.map((li) => ({ name: li.name, amount: li.amount / 100, currency: li.currency })),
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
