import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  orderId: string;
  advertiserId: string;
  advertiserEmail: string;
  advertiserName?: string;
  orderProductName: string;
  orderIdShort: string;
  totalPrice?: number;
  isInitial?: boolean; // true = first notification on approval, false = recurring reminder
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a cron invocation (no body) or a direct call
    const contentType = req.headers.get("content-type") || "";
    let isCron = false;

    if (!contentType.includes("application/json")) {
      isCron = true;
    }

    if (isCron) {
      // CRON MODE: Find all approved print orders with unpaid activations
      console.log("Running payment reminder cron job...");

      const { data: pendingOrders, error: fetchError } = await supabase
        .from("print_orders")
        .select("id, advertiser_id, product_name, total_price, activation_id, approved_at")
        .eq("order_status", "in_production");

      if (fetchError) {
        console.error("Error fetching pending orders:", fetchError);
        throw fetchError;
      }

      if (!pendingOrders || pendingOrders.length === 0) {
        console.log("No pending payment orders found.");
        return new Response(JSON.stringify({ success: true, reminders_sent: 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      let remindersSent = 0;

      for (const order of pendingOrders) {
        // Check if activation is still payment_pending
        if (order.activation_id) {
          const { data: activation } = await supabase
            .from("activations")
            .select("status")
            .eq("id", order.activation_id)
            .single();

          if (!activation || activation.status !== "payment_pending") {
            continue; // Skip if already paid or not in payment_pending
          }
        }

        // Check if we already sent a reminder in the last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentNotifications } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", order.advertiser_id)
          .eq("type", "payment_reminder")
          .gte("created_at", sevenDaysAgo)
          .limit(1);

        if (recentNotifications && recentNotifications.length > 0) {
          console.log(`Skipping order ${order.id} - reminder sent within 7 days`);
          continue;
        }

        // Get advertiser email
        const { data: advertiserProfile } = await supabase
          .from("advertiser_profiles")
          .select("contact_email, contact_name")
          .eq("user_id", order.advertiser_id)
          .single();

        if (!advertiserProfile) {
          console.error(`No advertiser profile for user ${order.advertiser_id}`);
          continue;
        }

        const orderIdShort = order.id.slice(0, 8).toUpperCase();
        const priceStr = order.total_price ? `₱${order.total_price.toLocaleString()}` : "pending";

        // Send reminder email
        try {
          await resend.emails.send({
            from: "TrioTag <noreply@tinystickyads.com>",
            to: [advertiserProfile.contact_email],
            subject: `Payment Reminder - Order #${orderIdShort}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">⏰ Payment Reminder</h2>
                <p style="color: #666; line-height: 1.6;">
                  Hello ${advertiserProfile.contact_name || "there"},
                </p>
                <p style="color: #666; line-height: 1.6;">
                  This is a friendly reminder that your ad order <strong>#${orderIdShort}</strong> for 
                  <strong>${order.product_name}</strong> has been approved and is awaiting payment.
                </p>
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p style="margin: 4px 0; color: #333;"><strong>Order:</strong> #${orderIdShort}</p>
                  <p style="margin: 4px 0; color: #333;"><strong>Product:</strong> ${order.product_name}</p>
                  <p style="margin: 4px 0; color: #333;"><strong>Amount:</strong> ${priceStr}</p>
                </div>
                <p style="color: #666; line-height: 1.6;">
                  Please log in to your dashboard to complete the payment and proceed with your campaign.
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                  This is an automated reminder from TrioTag platform.
                </p>
              </div>
            `,
          });
          console.log(`Reminder email sent to ${advertiserProfile.contact_email} for order ${orderIdShort}`);
        } catch (emailError) {
          console.error(`Failed to send email for order ${order.id}:`, emailError);
        }

        // Create in-app notification
        await supabase.from("notifications").insert({
          user_id: order.advertiser_id,
          title: "Payment Reminder",
          message: `Your ad order #${orderIdShort} for "${order.product_name}" is approved and awaiting payment (${priceStr}). Please complete payment to proceed.`,
          type: "payment_reminder",
        });

        remindersSent++;
      }

      console.log(`Payment reminders sent: ${remindersSent}`);
      return new Response(
        JSON.stringify({ success: true, reminders_sent: remindersSent }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // DIRECT CALL MODE: Send initial payment notification on approval
    const body: PaymentNotificationRequest = await req.json();
    const {
      orderId,
      advertiserId,
      advertiserEmail,
      advertiserName,
      orderProductName,
      orderIdShort,
      totalPrice,
    } = body;

    const priceStr = totalPrice ? `₱${totalPrice.toLocaleString()}` : "pending";

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "TrioTag <noreply@tinystickyads.com>",
      to: [advertiserEmail],
      subject: `Payment Required - Order #${orderIdShort} Approved! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">✅ Your Ad Order Has Been Approved!</h2>
          <p style="color: #666; line-height: 1.6;">
            Hello ${advertiserName || "there"},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Great news! Your ad order <strong>#${orderIdShort}</strong> for 
            <strong>${orderProductName}</strong> has been approved and is now in production.
          </p>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #333;"><strong>Order:</strong> #${orderIdShort}</p>
            <p style="margin: 4px 0; color: #333;"><strong>Product:</strong> ${orderProductName}</p>
            <p style="margin: 4px 0; color: #333;"><strong>Amount Due:</strong> ${priceStr}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Please log in to your advertiser dashboard to complete the payment and proceed with your campaign activation.
          </p>
          <p style="color: #e74c3c; font-weight: bold; line-height: 1.6;">
            ⚠️ Payment is required to proceed. You will receive reminders every 7 days until payment is completed.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This is an automated message from TinyStickyAds platform.
          </p>
        </div>
      `,
    });

    console.log("Payment notification email sent:", emailResponse);

    // Create in-app notification
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: advertiserId,
      title: "Payment Required - Order Approved",
      message: `Your ad order #${orderIdShort} for "${orderProductName}" has been approved! Amount due: ${priceStr}. Please complete payment to proceed with your campaign.`,
      type: "payment_required",
    });

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-payment-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
