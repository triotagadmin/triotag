import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!paymongoSecretKey) throw new Error("PAYMONGO_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      orderId,
      totalCost,
      currency,
      franchiseName,
      userId,
      successUrl,
      cancelUrl,
    } = body;

    if (!orderId || !totalCost || totalCost <= 0) {
      throw new Error("Invalid order data");
    }

    // Minimum 100 centavos for PHP, 50 cents for USD
    const isPhp = (currency || "USD").toUpperCase() === "PHP";
    const amountInCentavos = Math.round(totalCost * 100);
    const minAmount = isPhp ? 100 : 50;

    if (amountInCentavos < minAmount) {
      throw new Error(`Minimum payment is ${isPhp ? "₱1.00" : "$0.50"}`);
    }

    const checkoutPayload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: (currency || "USD").toUpperCase() === "PHP" ? "PHP" : "USD",
              amount: amountInCentavos,
              description: `Print materials order for ${franchiseName}`,
              name: `Print Order - ${franchiseName}`,
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "card"],
          success_url: `${successUrl}?session_id={id}`,
          cancel_url: cancelUrl,
          description: `Print materials for ${franchiseName}`,
          metadata: {
            type: "print_order",
            order_id: orderId,
            user_id: userId,
          },
        },
      },
    };

    const paymongoResponse = await fetch(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${btoa(paymongoSecretKey + ":")}`,
        },
        body: JSON.stringify(checkoutPayload),
      }
    );

    const paymongoData = await paymongoResponse.json();

    if (!paymongoResponse.ok) {
      console.error("PayMongo error:", paymongoData);
      throw new Error(
        paymongoData.errors?.[0]?.detail || "Failed to create checkout session"
      );
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;
    const sessionId = paymongoData.data.id;

    // Update the order record with checkout session ID and total cost
    const { error: updateError } = await supabase
      .from("advertiser_print_orders")
      .update({
        paymongo_checkout_session_id: sessionId,
        payment_status: "pending",
        total_cost: totalCost,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order with session ID:", updateError);
    }

    return new Response(
      JSON.stringify({ checkoutUrl, sessionId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Print order checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
