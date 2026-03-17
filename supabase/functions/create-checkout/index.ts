import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── SERVER-SIDE PRICING (single source of truth) ──
const PRICE_PER_LOCATION_PER_WEEK_USD = 1;

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
  locations: number;
  weeks: number;
  material: string;
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
    console.log("[create-checkout] Request:", JSON.stringify({
      activationId: body.activationId,
      locations: body.locations,
      weeks: body.weeks,
      material: body.material,
    }));

    const {
      activationId, locations, weeks, material,
      paymentMethod, buyerName, buyerEmail, buyerPhone,
      companyName, billingAddress, billingCity, billingCountry, billingZip,
      successUrl, cancelUrl,
    } = body;

    // ── Validate inputs ──
    if (!activationId) throw new Error("activationId is required");
    if (!buyerName || !buyerEmail) throw new Error("buyerName and buyerEmail are required");
    if (!successUrl || !cancelUrl) throw new Error("successUrl and cancelUrl are required");
    if (!locations || locations < 1) throw new Error("locations must be >= 1");
    if (!weeks || weeks < 1) throw new Error("weeks must be >= 1");

    // ── SERVER-SIDE price calculation (NEVER trust frontend) ──
    const baseCostUsd = locations * weeks * PRICE_PER_LOCATION_PER_WEEK_USD;
    const materialUnitPrice = MATERIAL_PRICES_USD[material] || MATERIAL_PRICES_USD["vinyl_sticker"];
    const materialCostUsd = materialUnitPrice * locations; // material per location
    const totalUsd = baseCostUsd + materialCostUsd;
    const totalPhp = totalUsd * USD_TO_PHP;
    const amountCentavos = Math.round(totalPhp * 100);

    console.log("[create-checkout] Calculated:", {
      baseCostUsd,
      materialCostUsd,
      totalUsd,
      totalPhp,
      amountCentavos,
    });

    if (amountCentavos < 100) {
      throw new Error("Minimum payment amount is ₱1.00");
    }

    // ── Update activation with server-computed amount ──
    const { error: updateError } = await supabase
      .from("activations")
      .update({
        status: "payment_pending",
        total_amount: totalUsd,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activationId);

    if (updateError) {
      console.error("[create-checkout] Failed to update activation:", updateError);
    }

    // ── Map payment method ──
    const methodMap: Record<string, string[]> = {
      card: ["card"],
      gcash: ["gcash"],
      maya: ["paymaya"],
    };
    const paymentMethodTypes = methodMap[paymentMethod || "card"] || ["card", "gcash", "paymaya"];

    // ── Create PayMongo Checkout Session ──
    const checkoutPayload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount: amountCentavos,
              description: `Ad Space Booking: ${locations} location(s) × ${weeks} week(s) + ${material} materials`,
              name: "Ad Space Booking",
              quantity: 1,
            },
          ],
          payment_method_types: paymentMethodTypes,
          success_url: `${successUrl}?session_id={id}&activation_id=${activationId}`,
          cancel_url: cancelUrl,
          description: `Ad Space Activation — ${locations} locations, ${weeks} weeks`,
          billing: {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone || "",
          },
          metadata: {
            activation_id: activationId,
            locations: locations.toString(),
            weeks: weeks.toString(),
            material,
            total_usd: totalUsd.toString(),
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

    console.log("[create-checkout] SUCCESS — Session:", sessionId);

    return new Response(
      JSON.stringify({
        checkout_url: checkoutUrl,
        sessionId,
        total_usd: totalUsd,
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
