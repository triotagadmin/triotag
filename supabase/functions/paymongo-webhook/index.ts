import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyWebhookSignature(body: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader || !secret) {
    console.warn("Missing signature header or webhook secret");
    return false;
  }
  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key && value) parts[key.trim()] = value.trim();
  }
  const timestamp = parts["t"];
  const testSig = parts["te"];
  const liveSig = parts["li"];
  if (!timestamp) { console.error("No timestamp in signature header"); return false; }

  const signedPayload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const computedSig = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");

  const isValid = computedSig === liveSig || computedSig === testSig;
  if (!isValid) console.error("Signature mismatch. Computed:", computedSig, "Live:", liveSig, "Test:", testSig);
  return isValid;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const webhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");
    const signatureHeader = req.headers.get("paymongo-signature");
    const body = await req.text();

    console.log("Webhook received, event signature present:", !!signatureHeader);

    if (webhookSecret) {
      const isValid = await verifyWebhookSignature(body, signatureHeader, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature — rejecting request");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("Webhook signature verified successfully");
    } else {
      console.warn("PAYMONGO_WEBHOOK_SECRET not configured — skipping signature verification");
    }

    const payload = JSON.parse(body);
    const eventType = payload.data?.attributes?.type;
    const eventData = payload.data?.attributes?.data;

    console.log("Event type:", eventType);

    // Helper to handle activation payment updates
    async function handleActivationPayment(metadata: Record<string, string>, paymentId: string | null, status: "paid" | "failed") {
      const activationId = metadata?.activation_id;
      if (!activationId) return false;

      const newStatus = status === "paid" ? "completed" : "payment_failed";
      const { error } = await supabase
        .from("activations")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activationId);

      if (error) {
        console.error(`Failed to update activation ${activationId}:`, error);
        return false;
      }

      console.log(`Activation ${activationId} marked as ${newStatus}`);

      // On successful payment, notify publisher
      if (status === "paid") {
        const { data: activation } = await supabase
          .from("activations")
          .select(`*, ad_spaces (title, publisher_id)`)
          .eq("id", activationId)
          .single();

        if (activation?.publisher_id) {
          const { data: pub } = await supabase
            .from("publisher_profiles")
            .select("user_id")
            .eq("id", activation.publisher_id)
            .single();

          if (pub?.user_id) {
            await supabase.from("notifications").insert({
              user_id: pub.user_id,
              title: "Booking Confirmed & Paid!",
              message: `Payment received for "${activation.ad_spaces?.title}". Booking confirmed from ${activation.start_date} to ${activation.end_date}.`,
              type: "payment_received",
            });
          }
        }
      }
      return true;
    }

    // Helper to handle print order payment updates
    async function handlePrintOrderPayment(metadata: Record<string, string>, status: "paid" | "failed") {
      const orderId = metadata?.order_id;
      if (!orderId) return false;

      const newPaymentStatus = status === "paid" ? "paid" : "failed";
      const { error } = await supabase
        .from("advertiser_print_orders")
        .update({
          payment_status: newPaymentStatus,
          status: status === "paid" ? "pending" : "payment_failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        console.error(`Failed to update print order ${orderId}:`, error);
        return false;
      }

      console.log(`Print order ${orderId} payment marked as ${newPaymentStatus}`);

      // On successful payment, send the order email
      if (status === "paid") {
        try {
          const { data: order } = await supabase
            .from("advertiser_print_orders")
            .select("*")
            .eq("id", orderId)
            .single();

          if (order) {
            const orderMaterials = order.materials as any;
            // Invoke the email function with the stored order data
            const emailUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/submit-print-order-email`;
            await fetch(emailUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
              },
              body: JSON.stringify({
                ...orderMaterials,
                orderId: orderId,
                paymentStatus: "paid",
                totalCost: order.total_cost,
              }),
            });
          }
        } catch (emailErr) {
          console.error("Failed to send print order email:", emailErr);
        }
      }
      return true;
    }

    // ── payment.paid ──
    if (eventType === "payment.paid") {
      const paymentId = eventData?.id;
      const metadata = eventData?.attributes?.metadata;
      const checkoutSessionId = eventData?.attributes?.source?.id;

      console.log("payment.paid — paymentId:", paymentId, "metadata:", JSON.stringify(metadata));

      if (metadata?.type === "activation_payment") {
        await handleActivationPayment(metadata, paymentId, "paid");
      } else if (metadata?.type === "print_order") {
        await handlePrintOrderPayment(metadata, "paid");
      } else if (metadata?.type === "listing_submission") {
        await supabase.from("listing_submissions").update({ payment_status: "paid" }).eq("id", metadata.listing_id);
        console.log("Listing submission marked paid:", metadata.listing_id);
      } else if (checkoutSessionId) {
        const { data: saleData } = await supabase
          .from("ticket_sales")
          .update({
            payment_status: "paid",
            paymongo_payment_id: paymentId,
            qr_code: `QR-${(checkoutSessionId as string).substring(0, 8).toUpperCase()}`,
          })
          .eq("paymongo_checkout_session_id", checkoutSessionId)
          .select()
          .single();

        if (saleData) {
          const { data: ticketData } = await supabase.from("tickets").select("quantity_sold").eq("id", saleData.ticket_id).single();
          if (ticketData) {
            await supabase.from("tickets").update({ quantity_sold: ticketData.quantity_sold + saleData.quantity }).eq("id", saleData.ticket_id);
          }
          console.log("Ticket sale updated via payment.paid");
        }
      }
    }

    // ── payment.failed ──
    if (eventType === "payment.failed") {
      const paymentId = eventData?.id;
      const metadata = eventData?.attributes?.metadata;
      const checkoutSessionId = eventData?.attributes?.source?.id;

      console.log("payment.failed — paymentId:", paymentId);

      if (metadata?.type === "activation_payment") {
        await handleActivationPayment(metadata, paymentId, "failed");
      } else if (metadata?.type === "print_order") {
        await handlePrintOrderPayment(metadata, "failed");
      } else if (metadata?.type === "listing_submission") {
        await supabase.from("listing_submissions").update({ payment_status: "failed" }).eq("id", metadata.listing_id);
      } else if (checkoutSessionId) {
        await supabase.from("ticket_sales").update({ payment_status: "failed" }).eq("paymongo_checkout_session_id", checkoutSessionId);
      }
    }

    // ── checkout_session.payment.paid ──
    if (eventType === "checkout_session.payment.paid") {
      const checkoutSessionId = eventData?.id;
      const metadata = eventData?.attributes?.metadata;
      const paymentId = eventData?.attributes?.payments?.[0]?.id;

      console.log("checkout_session.payment.paid — session:", checkoutSessionId);

      if (!checkoutSessionId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (metadata?.type === "activation_payment") {
        await handleActivationPayment(metadata, paymentId, "paid");
      } else if (metadata?.type === "print_order") {
        await handlePrintOrderPayment(metadata, "paid");
      } else if (metadata?.type === "listing_submission") {
        await supabase.from("listing_submissions").update({ payment_status: "paid" }).eq("id", metadata.listing_id);
      } else if (metadata?.type === "venue_registration") {
        console.log("Venue registration payment received:", metadata.venue_id);
      } else {
        const { data: saleData, error: updateError } = await supabase
          .from("ticket_sales")
          .update({
            payment_status: "paid",
            paymongo_payment_id: paymentId,
            qr_code: `QR-${(checkoutSessionId as string).substring(0, 8).toUpperCase()}`,
          })
          .eq("paymongo_checkout_session_id", checkoutSessionId)
          .select()
          .single();

        if (updateError) {
          console.error("Failed to update ticket sale:", updateError);
        } else if (saleData) {
          const { data: ticketData } = await supabase.from("tickets").select("quantity_sold").eq("id", saleData.ticket_id).single();
          if (ticketData) {
            await supabase.from("tickets").update({ quantity_sold: ticketData.quantity_sold + saleData.quantity }).eq("id", saleData.ticket_id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
