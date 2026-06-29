// SETUP REQUIRED:
// Register this webhook URL in PayMongo Dashboard → Developers → Webhooks:
// URL: https://jungfmgsxbayxzptvpky.supabase.co/functions/v1/media-plan-payment-webhook
// Events to listen for: checkout_session.payment.paid
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("[media-plan-payment-webhook] RESEND_API_KEY missing, skipping email");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "TrioTag <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[media-plan-payment-webhook] Resend error:", await res.text());
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const eventType = body?.data?.attributes?.type;
    const checkoutId = body?.data?.attributes?.data?.attributes?.id || body?.data?.attributes?.data?.id;

    console.log("[media-plan-payment-webhook] Event:", eventType, "Checkout ID:", checkoutId);

    if (eventType !== "checkout_session.payment.paid") {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: planRequest } = await supabaseAdmin
      .from("media_plan_requests")
      .select("*")
      .eq("paymongo_checkout_id", checkoutId)
      .single();

    if (!planRequest) {
      console.warn("[media-plan-payment-webhook] No matching request for checkout:", checkoutId);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await supabaseAdmin
      .from("media_plan_requests")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", planRequest.id);

    console.log("[media-plan-payment-webhook] Payment confirmed for:", planRequest.campaign_name);

    const amount = Number(planRequest.estimated_price).toLocaleString();

    if (planRequest.requester_email) {
      await sendEmail(
        planRequest.requester_email,
        `Payment Confirmed — ${planRequest.campaign_name}`,
        `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
            <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
              <h2 style="color:#16a34a;margin:0 0 8px 0;">Payment Confirmed! ✓</h2>
              <p>Your media plan payment has been received. Our team will begin activating your campaign within 24 hours.</p>
              <div style="margin-top:16px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
                <p style="margin:4px 0;"><strong>Campaign:</strong> ${planRequest.campaign_name}</p>
                <p style="margin:4px 0;"><strong>Type:</strong> ${planRequest.campaign_type}</p>
                <p style="margin:4px 0;"><strong>Amount Paid:</strong> ₱${amount}</p>
                <p style="margin:4px 0;"><strong>Start Date:</strong> ${planRequest.preferred_start_date || "TBD"}</p>
              </div>
              <p style="margin-top:16px;color:#6b7280;font-size:13px;">Our team will contact you within 24 hours to confirm the activation timeline. Thank you for choosing TrioTag!</p>
              <p style="margin-top:16px;color:#9ca3af;font-size:12px;">TrioTag · Retail Advertising · triotag.com</p>
            </div>
          </div>
        `
      );
    }

    await sendEmail(
      "tinystickyads@gmail.com",
      `[PAID] Media Plan Ready to Activate — ${planRequest.campaign_name}`,
      `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
          <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
            <h2 style="color:#16a34a;margin:0 0 8px 0;">✓ Media Plan Payment Received</h2>
            <p>A media plan has been paid and is ready to activate.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;">
              <tr><td style="padding:6px 0;color:#6b7280;">Campaign</td><td style="padding:6px 0;font-weight:600;">${planRequest.campaign_name}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Type</td><td style="padding:6px 0;">${planRequest.campaign_type}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Amount</td><td style="padding:6px 0;color:#16a34a;font-weight:600;">₱${amount}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Start Date</td><td style="padding:6px 0;">${planRequest.preferred_start_date || "TBD"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Requester Email</td><td style="padding:6px 0;">${planRequest.requester_email || "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Radius</td><td style="padding:6px 0;">${planRequest.radius_meters}m</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Request ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px;">${planRequest.id}</td></tr>
            </table>
            <p style="margin-top:16px;color:#6b7280;font-size:13px;">Log in to the admin dashboard to confirm activation and contact the advertiser.</p>
          </div>
        </div>
      `
    );

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("[media-plan-payment-webhook] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
