import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "tinystickyads@gmail.com";

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

// ── Send payment success email notification ──
async function sendPaymentSuccessEmail(details: {
  paymentType: string;
  orderId: string;
  listingTitle: string;
  customerName: string;
  customerEmail: string;
  totalPaid: string;
  paymentDate: string;
  paymentMethod?: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    console.warn("[webhook] RESEND_API_KEY not configured — skipping email notification");
    return;
  }

  const maskedEmail = details.customerEmail.replace(
    /^(.{2})(.*)(@.*)$/,
    (_, a, b, c) => a + "*".repeat(Math.min(b.length, 6)) + c
  );

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #16a34a;">✅ Payment Received — TrioTag</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px 0; color: #666;">Payment Type</td><td style="padding: 8px 0; font-weight: bold;">${details.paymentType}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Order / Activation ID</td><td style="padding: 8px 0; font-family: monospace;">${details.orderId}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Listing / Order</td><td style="padding: 8px 0;">${details.listingTitle}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0;">${details.customerName}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${maskedEmail}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Total Paid</td><td style="padding: 8px 0; font-weight: bold; color: #16a34a; font-size: 18px;">${details.totalPaid}</td></tr>
        <tr><td style="padding: 8px 0; color: #666;">Payment Date</td><td style="padding: 8px 0;">${details.paymentDate}</td></tr>
        ${details.paymentMethod ? `<tr><td style="padding: 8px 0; color: #666;">Payment Method</td><td style="padding: 8px 0;">${details.paymentMethod}</td></tr>` : ""}
      </table>
      <p style="color: #999; font-size: 12px;">This is an automated notification from TrioTag.</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "TrioTag <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `💰 Payment Received: ${details.paymentType} — ${details.orderId.slice(0, 8).toUpperCase()}`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[webhook] Email send failed:", res.status, errText);
    } else {
      await res.text();
      console.log("[webhook] Payment notification email sent to", ADMIN_EMAIL);
    }
  } catch (emailErr) {
    console.error("[webhook] Email send error:", emailErr);
  }
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

    // ── Use checkout_session.payment.paid as the single canonical success event ──
    if (eventType === "checkout_session.payment.paid") {
      const checkoutSessionId = eventData?.id;
      const metadata = eventData?.attributes?.metadata;
      const payments = eventData?.attributes?.payments || [];
      const paymentId = payments[0]?.id;
      const paymentMethodType = payments[0]?.attributes?.source?.type || "unknown";
      const now = new Date().toISOString();

      console.log("checkout_session.payment.paid — session:", checkoutSessionId, "metadata:", JSON.stringify(metadata));

      if (!checkoutSessionId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Activation Payment ──
      if (metadata?.type === "activation_payment") {
        const activationId = metadata?.activation_id;
        if (activationId) {
          const { error } = await supabase
            .from("activations")
            .update({ status: "completed", updated_at: now })
            .eq("id", activationId);

          if (error) {
            console.error(`Failed to update activation ${activationId}:`, error);
          } else {
            console.log(`Activation ${activationId} marked as completed`);

            // Notify publisher
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

            // Send email notification
            await sendPaymentSuccessEmail({
              paymentType: "Ad Space Activation",
              orderId: activationId,
              listingTitle: metadata?.listing_title || activation?.ad_spaces?.title || "Ad Space",
              customerName: metadata?.buyer_name || "N/A",
              customerEmail: metadata?.buyer_email || "N/A",
              totalPaid: `₱${parseFloat(metadata?.total_php || "0").toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
              paymentDate: now,
              paymentMethod: paymentMethodType,
            });
          }
        }
      }

      // ── Print Order Payment ──
      else if (metadata?.type === "print_order") {
        const orderId = metadata?.order_id;
        if (orderId) {
          const { error } = await supabase
            .from("advertiser_print_orders")
            .update({ payment_status: "paid", status: "pending", updated_at: now })
            .eq("id", orderId);

          if (error) {
            console.error(`Failed to update print order ${orderId}:`, error);
          } else {
            console.log(`Print order ${orderId} payment marked as paid`);

            // Send print order email
            try {
              const { data: order } = await supabase
                .from("advertiser_print_orders")
                .select("*")
                .eq("id", orderId)
                .single();

              if (order) {
                const emailUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/submit-print-order-email`;
                const emailRes = await fetch(emailUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
                  },
                  body: JSON.stringify({
                    ...(order.materials as any),
                    orderId,
                    paymentStatus: "paid",
                    totalCost: order.total_cost,
                  }),
                });
                await emailRes.text();
              }
            } catch (emailErr) {
              console.error("Failed to send print order email:", emailErr);
            }

            // Send payment notification email
            await sendPaymentSuccessEmail({
              paymentType: "Print Order",
              orderId,
              listingTitle: metadata?.listing_title || "Print Order",
              customerName: metadata?.buyer_name || "N/A",
              customerEmail: metadata?.buyer_email || "N/A",
              totalPaid: metadata?.total_php ? `₱${parseFloat(metadata.total_php).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "N/A",
              paymentDate: now,
              paymentMethod: paymentMethodType,
            });
          }
        }
      }

      // ── Listing Submission Payment ──
      else if (metadata?.type === "listing_submission") {
        const listingId = metadata?.listing_id;
        if (listingId) {
          await supabase.from("listing_submissions").update({ payment_status: "paid" }).eq("id", listingId);
          console.log("Listing submission marked paid:", listingId);

          await sendPaymentSuccessEmail({
            paymentType: "Listing Submission",
            orderId: listingId,
            listingTitle: metadata?.listing_title || "Listing Submission",
            customerName: metadata?.buyer_name || "N/A",
            customerEmail: metadata?.buyer_email || "N/A",
            totalPaid: metadata?.total_php ? `₱${parseFloat(metadata.total_php).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "N/A",
            paymentDate: now,
            paymentMethod: paymentMethodType,
          });
        }
      }

      // ── Venue Registration Payment ──
      else if (metadata?.type === "venue_registration") {
        console.log("Venue registration payment received:", metadata.venue_id);
        await sendPaymentSuccessEmail({
          paymentType: "Venue Registration",
          orderId: metadata?.venue_id || "N/A",
          listingTitle: "Venue Registration",
          customerName: metadata?.buyer_name || "N/A",
          customerEmail: metadata?.buyer_email || "N/A",
          totalPaid: metadata?.total_php ? `₱${parseFloat(metadata.total_php).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "N/A",
          paymentDate: now,
          paymentMethod: paymentMethodType,
        });
      }

      // ── Client Checkout Payment (Print Partner) ──
      else if (metadata?.type === "client_checkout") {
        const checkoutDbId = metadata?.checkout_id;
        if (checkoutDbId) {
          // Update checkout status to paid
          const { data: clientCheckout, error: ccErr } = await supabase
            .from("client_checkouts")
            .update({ status: "paid", paid_at: now, payment_method: paymentMethodType })
            .eq("id", checkoutDbId)
            .select("*")
            .single();

          if (ccErr) {
            console.error(`Failed to update client checkout ${checkoutDbId}:`, ccErr);
          } else {
            console.log(`Client checkout ${checkoutDbId} marked as paid`);

            // Update linked activation if exists
            if (clientCheckout?.activation_id) {
              await supabase
                .from("activations")
                .update({ status: "completed", updated_at: now })
                .eq("id", clientCheckout.activation_id);
            }

            // Notify the Print Partner
            if (clientCheckout?.print_partner_id) {
              await supabase.from("notifications").insert({
                user_id: clientCheckout.print_partner_id,
                title: "Client Payment Received!",
                message: `${clientCheckout.client_name} has paid ₱${(clientCheckout.grand_total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })} for "${clientCheckout.listing_title || "Campaign"}".`,
                type: "client_payment_received",
              });
            }

            // Send email notification
            await sendPaymentSuccessEmail({
              paymentType: "Client Checkout (Print Partner)",
              orderId: checkoutDbId,
              listingTitle: clientCheckout?.listing_title || "Client Checkout",
              customerName: clientCheckout?.client_name || "N/A",
              customerEmail: clientCheckout?.client_email || "N/A",
              totalPaid: `₱${(clientCheckout?.grand_total || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
              paymentDate: now,
              paymentMethod: paymentMethodType,
            });
          }
        }
      }
    }

    // ── payment.failed — handle failures ──
    if (eventType === "payment.failed") {
      const metadata = eventData?.attributes?.metadata;

      if (metadata?.type === "activation_payment" && metadata?.activation_id) {
        await supabase.from("activations")
          .update({ status: "payment_failed", updated_at: new Date().toISOString() })
          .eq("id", metadata.activation_id);
        console.log(`Activation ${metadata.activation_id} marked as payment_failed`);
      } else if (metadata?.type === "print_order" && metadata?.order_id) {
        await supabase.from("advertiser_print_orders")
          .update({ payment_status: "failed", status: "payment_failed", updated_at: new Date().toISOString() })
          .eq("id", metadata.order_id);
        console.log(`Print order ${metadata.order_id} marked as failed`);
      } else if (metadata?.type === "listing_submission" && metadata?.listing_id) {
        await supabase.from("listing_submissions").update({ payment_status: "failed" }).eq("id", metadata.listing_id);
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
