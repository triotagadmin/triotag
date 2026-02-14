import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const signature = req.headers.get("paymongo-signature");
    const body = await req.text();
    
    console.log("Webhook received with signature:", signature);
    console.log("Webhook body:", body);

    // Parse the webhook payload
    const payload = JSON.parse(body);
    const eventType = payload.data?.attributes?.type;
    const eventData = payload.data?.attributes?.data;

    console.log("Event type:", eventType);
    console.log("Event data:", JSON.stringify(eventData));

    // Handle checkout session payment success
    if (eventType === "checkout_session.payment.paid") {
      const checkoutSessionId = eventData?.id;
      const metadata = eventData?.attributes?.metadata;
      const paymentId = eventData?.attributes?.payments?.[0]?.id;

      console.log("Processing payment success for session:", checkoutSessionId);
      console.log("Metadata:", JSON.stringify(metadata));

      if (!checkoutSessionId) {
        console.error("No checkout session ID in webhook");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if this is a listing submission payment
      if (metadata?.type === "listing_submission") {
        const listingId = metadata.listing_id;
        console.log("Processing listing payment for:", listingId);

        const { error: listingUpdateError } = await supabase
          .from("listing_submissions")
          .update({ payment_status: "paid" })
          .eq("id", listingId);

        if (listingUpdateError) {
          console.error("Failed to update listing payment:", listingUpdateError);
        } else {
          console.log("Listing payment marked as paid:", listingId);
        }
      } else {
        // Update the ticket sale record
        const { data: saleData, error: updateError } = await supabase
          .from("ticket_sales")
          .update({
            payment_status: "paid",
            paymongo_payment_id: paymentId,
            qr_code: `QR-${checkoutSessionId.substring(0, 8).toUpperCase()}`,
          })
          .eq("paymongo_checkout_session_id", checkoutSessionId)
          .select()
          .single();

        if (updateError) {
          console.error("Failed to update ticket sale:", updateError);
        } else {
          console.log("Updated ticket sale:", saleData);

          if (saleData) {
            const { data: ticketData } = await supabase
              .from("tickets")
              .select("quantity_sold")
              .eq("id", saleData.ticket_id)
              .single();

            if (ticketData) {
              await supabase
                .from("tickets")
                .update({ quantity_sold: ticketData.quantity_sold + saleData.quantity })
                .eq("id", saleData.ticket_id);
            }

            console.log("Updated ticket quantity sold");
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
