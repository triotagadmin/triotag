import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckoutRequest {
  activationId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  companyName?: string;
  billingAddress?: string;
  billingCity?: string;
  billingCountry?: string;
  billingZip?: string;
  paymentMethod?: string;
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
      console.error("PAYMONGO_SECRET_KEY is not set");
      throw new Error("Payment gateway not configured. Please contact support.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    console.log("[activation-checkout] Request received:", JSON.stringify({
      activationId: body.activationId,
      paymentMethod: body.paymentMethod,
      buyerEmail: body.buyerEmail,
    }));

    const {
      activationId, buyerName, buyerEmail, buyerPhone,
      companyName, billingAddress, billingCity, billingCountry, billingZip,
      paymentMethod, successUrl, cancelUrl,
    } = body;

    if (!activationId) throw new Error("activationId is required");
    if (!buyerName || !buyerEmail) throw new Error("buyerName and buyerEmail are required");
    if (!successUrl || !cancelUrl) throw new Error("successUrl and cancelUrl are required");

    // Fetch activation with ad space details
    const { data: activation, error: activationError } = await supabase
      .from("activations")
      .select(`*, ad_spaces (title, specifications, pricing)`)
      .eq("id", activationId)
      .single();

    if (activationError || !activation) {
      console.error("[activation-checkout] Activation not found:", activationError);
      throw new Error("Activation not found");
    }

    console.log("[activation-checkout] Activation found:", {
      id: activation.id,
      status: activation.status,
      total_amount: activation.total_amount,
      start_date: activation.start_date,
      end_date: activation.end_date,
    });

    // Calculate booking amount
    let bookingAmount = activation.total_amount || activation.estimated_publisher_payout || 0;
    if (bookingAmount <= 0 && activation.start_date && activation.end_date) {
      const startDate = new Date(activation.start_date);
      const endDate = new Date(activation.end_date);
      const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const diffWeeks = Math.ceil(diffDays / 7);
      const adSpace = activation.ad_spaces;
      const adUnits = adSpace?.specifications?.ad_units || adSpace?.pricing?.ad_units || [];
      const selectedAdUnit = adUnits[0];
      const weeklyRate = selectedAdUnit?.pricePerWeek || adSpace?.pricing?.weekly || 0;
      const monthlyRate = selectedAdUnit?.pricePerMonth || adSpace?.pricing?.monthly || 0;
      if (diffWeeks >= 4 && monthlyRate > 0) {
        const fullMonths = Math.floor(diffWeeks / 4);
        const remainingWeeks = diffWeeks % 4;
        bookingAmount = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
      } else {
        bookingAmount = diffWeeks * weeklyRate;
      }
      console.log("[activation-checkout] Calculated booking amount from dates:", { diffWeeks, weeklyRate, monthlyRate, bookingAmount });
    }

    // Add print order total if exists
    let printOrderTotal = 0;
    if (activation.print_order_id) {
      const { data: printOrder } = await supabase
        .from("print_orders")
        .select("total_price")
        .eq("id", activation.print_order_id)
        .single();
      if (printOrder?.total_price) printOrderTotal = printOrder.total_price;
      console.log("[activation-checkout] Print order total:", printOrderTotal);
    }

    const totalAmount = bookingAmount + printOrderTotal;
    if (totalAmount <= 0) {
      console.error("[activation-checkout] Invalid amount:", { bookingAmount, printOrderTotal, totalAmount });
      throw new Error("Invalid booking amount. Please ensure dates and pricing are configured.");
    }

    const currency = activation.ad_spaces?.specifications?.lease_currency
      || activation.ad_spaces?.specifications?.currency || "PHP";
    const listingTitle = activation.ad_spaces?.title || "Ad Space Booking";
    const amountInCentavos = Math.round(totalAmount * 100);

    // Ensure minimum amount (PayMongo requires at least 100 centavos = ₱1.00)
    if (amountInCentavos < 100) {
      throw new Error("Minimum payment amount is ₱1.00");
    }

    // Map payment method to PayMongo types
    const methodMap: Record<string, string[]> = {
      card: ["card"],
      gcash: ["gcash"],
      maya: ["paymaya"],
    };
    const paymentMethodTypes = methodMap[paymentMethod || "card"] || ["card", "gcash", "paymaya"];

    console.log("[activation-checkout] Creating PayMongo checkout:", {
      totalAmount,
      currency,
      amountInCentavos,
      paymentMethodTypes,
      listingTitle,
    });

    const checkoutPayload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: currency.toUpperCase(),
              amount: amountInCentavos,
              description: `Booking: ${activation.start_date || "N/A"} to ${activation.end_date || "N/A"}`,
              name: listingTitle,
              quantity: 1,
            },
          ],
          payment_method_types: paymentMethodTypes,
          success_url: `${successUrl}?session_id={id}&activation_id=${activationId}`,
          cancel_url: cancelUrl,
          description: `Ad Space Activation - ${listingTitle}`,
          billing: {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone || "",
          },
          metadata: {
            activation_id: activationId,
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            buyer_phone: buyerPhone || "",
            company_name: companyName || "",
            billing_address: billingAddress || "",
            billing_city: billingCity || "",
            billing_country: billingCountry || "",
            billing_zip: billingZip || "",
            payment_method: paymentMethod || "card",
            type: "activation_payment",
          },
        },
      },
    };

    console.log("[activation-checkout] PayMongo request payload:", JSON.stringify(checkoutPayload));

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
    console.log("[activation-checkout] PayMongo response status:", paymongoResponse.status);
    console.log("[activation-checkout] PayMongo response body:", JSON.stringify(paymongoData));

    if (!paymongoResponse.ok) {
      const errorDetail = paymongoData.errors?.[0]?.detail 
        || paymongoData.errors?.[0]?.message 
        || `PayMongo API error (HTTP ${paymongoResponse.status})`;
      const errorCode = paymongoData.errors?.[0]?.code || "unknown";
      console.error("[activation-checkout] PayMongo API error:", {
        status: paymongoResponse.status,
        errors: paymongoData.errors,
        errorDetail,
        errorCode,
      });
      throw new Error(`Payment gateway error: ${errorDetail}`);
    }

    const checkoutUrl = paymongoData.data?.attributes?.checkout_url;
    const sessionId = paymongoData.data?.id;

    if (!checkoutUrl || !sessionId) {
      console.error("[activation-checkout] Missing checkout URL or session ID in response:", paymongoData);
      throw new Error("Payment gateway returned an invalid response");
    }

    // Update activation with payment session info
    const { error: updateError } = await supabase
      .from("activations")
      .update({
        status: "payment_pending",
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activationId);

    if (updateError) {
      console.error("[activation-checkout] Failed to update activation:", updateError);
      // Don't throw — checkout was created successfully
    }

    console.log("[activation-checkout] SUCCESS — Session:", sessionId, "URL:", checkoutUrl);

    return new Response(
      JSON.stringify({ checkoutUrl, sessionId, amount: totalAmount, currency }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[activation-checkout] ERROR:", error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: "CHECKOUT_FAILED",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
