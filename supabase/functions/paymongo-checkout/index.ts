import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  ticketId: string;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!paymongoSecretKey) {
      throw new Error("PAYMONGO_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: CheckoutRequest = await req.json();
    console.log("Checkout request:", body);

    const { ticketId, quantity, buyerName, buyerEmail, buyerPhone, successUrl, cancelUrl } = body;

    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error("Ticket not found:", ticketError);
      throw new Error("Ticket not found");
    }

    const available = ticket.quantity_available - ticket.quantity_sold;
    if (quantity > available) {
      throw new Error(`Only ${available} tickets available`);
    }

    const unitPrice = Math.round(ticket.price * 100); // Convert to centavos
    const totalAmount = unitPrice * quantity;

    // Generate a unique serial number for this sale
    const serialNumber = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create PayMongo checkout session
    const checkoutPayload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: ticket.currency || "PHP",
              amount: unitPrice,
              description: `${ticket.title} - ${new Date(ticket.event_date).toLocaleDateString()}`,
              name: ticket.title,
              quantity: quantity,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "card"],
          success_url: `${successUrl}?session_id={id}`,
          cancel_url: cancelUrl,
          description: `Ticket purchase for ${ticket.title}`,
          metadata: {
            ticket_id: ticketId,
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            buyer_phone: buyerPhone || "",
            quantity: quantity.toString(),
            serial_number: serialNumber,
          },
        },
      },
    };

    console.log("Creating PayMongo checkout session:", JSON.stringify(checkoutPayload));

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
    console.log("PayMongo response:", JSON.stringify(paymongoData));

    if (!paymongoResponse.ok) {
      console.error("PayMongo error:", paymongoData);
      throw new Error(paymongoData.errors?.[0]?.detail || "Failed to create checkout session");
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;
    const sessionId = paymongoData.data.id;

    // Create a pending ticket sale record
    const { error: saleError } = await supabase.from("ticket_sales").insert({
      ticket_id: ticketId,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      quantity: quantity,
      unit_price: ticket.price,
      total_amount: ticket.price * quantity,
      currency: ticket.currency || "PHP",
      paymongo_checkout_session_id: sessionId,
      payment_status: "pending",
      serial_number: serialNumber,
    });

    if (saleError) {
      console.error("Failed to create ticket sale record:", saleError);
      // Don't throw - the checkout can still proceed
    }

    return new Response(
      JSON.stringify({
        checkoutUrl,
        sessionId,
        serialNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
