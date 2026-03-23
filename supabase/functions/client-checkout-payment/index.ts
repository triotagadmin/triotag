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

    const { checkoutId, token, successUrl, cancelUrl } = await req.json();

    if (!checkoutId || !token) throw new Error("Missing checkoutId or token");

    // Fetch checkout by id AND token for security
    const { data: checkout, error: fetchErr } = await supabase
      .from("client_checkouts")
      .select("*")
      .eq("id", checkoutId)
      .eq("token", token)
      .single();

    if (fetchErr || !checkout) throw new Error("Checkout not found or invalid token");
    if (checkout.status === "paid") throw new Error("This checkout has already been paid");

    const grandTotal = checkout.grand_total || 0;
    if (grandTotal <= 0) throw new Error("Invalid checkout total");

    const amountCentavos = Math.round(grandTotal * 100);
    if (amountCentavos < 100) throw new Error("Minimum payment is ₱1.00");

    // Fetch allowed payment methods
    let paymentMethods: string[] = [];
    try {
      const capRes = await fetch("https://api.paymongo.com/v1/merchants/capabilities/payment_methods", {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${btoa(paymongoSecretKey + ":")}`,
        },
      });
      if (capRes.ok) {
        const capData = await capRes.json();
        paymentMethods = (capData.data || []).map((item: any) => item.attributes?.payment_method_type).filter(Boolean);
      }
    } catch (e) {
      console.error("Failed to fetch payment methods:", e);
    }

    if (paymentMethods.length === 0) {
      paymentMethods = ["qrph", "grab_pay", "paymaya", "card", "dob", "dob_ubp", "brankas_bdo", "brankas_landbank", "brankas_metrobank"];
    }

    const listingTitle = checkout.listing_title || "Ad Campaign";

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
              description: `Print Partner checkout for ${listingTitle}`,
              name: listingTitle,
              quantity: 1,
            },
          ],
          payment_method_types: paymentMethods,
          success_url: successUrl || `${supabaseUrl}/payment-success`,
          cancel_url: cancelUrl || supabaseUrl,
          description: `Client checkout: ${listingTitle}`,
          metadata: {
            type: "client_checkout",
            checkout_id: checkoutId,
            token: token,
          },
        },
      },
    };

    const paymongoRes = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${btoa(paymongoSecretKey + ":")}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    const paymongoData = await paymongoRes.json();

    if (!paymongoRes.ok) {
      console.error("PayMongo error:", paymongoData);
      throw new Error(paymongoData.errors?.[0]?.detail || "Failed to create checkout session");
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;
    const sessionId = paymongoData.data.id;

    // Update checkout record
    await supabase
      .from("client_checkouts")
      .update({
        paymongo_checkout_session_id: sessionId,
        status: "awaiting_client_payment",
      })
      .eq("id", checkoutId);

    return new Response(JSON.stringify({ checkoutUrl, sessionId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Client checkout payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
