import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const body = await req.json();
    const { franchiseName, branches, currency, submittedBy, orderId } = body;

    const branchRows = (branches || []).map((b: any) => {
      const materials = (b.materials || [])
        .map((m: any) => `${m.materialLabel}: ${m.quantity} units`)
        .join("<br/>");
      const addr = b.shippingAddress || {};
      const address = [addr.recipient, addr.street, addr.city, addr.province, addr.postalCode]
        .filter(Boolean)
        .join(", ");
      return `
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; vertical-align: top;">
            <strong>${b.branchName}</strong>
          </td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; vertical-align: top;">
            ${address}
          </td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; vertical-align: top;">
            ${materials}
          </td>
        </tr>`;
    }).join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h1 style="color: #39ff14; border-bottom: 2px solid #39ff14; padding-bottom: 10px;">
          New Print Order Submission
        </h1>
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Franchise:</td>
            <td style="padding: 8px 0;">${franchiseName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Order ID:</td>
            <td style="padding: 8px 0;">${(orderId || "").slice(0, 8).toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Currency:</td>
            <td style="padding: 8px 0;">${currency}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
            <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
          </tr>
        </table>

        <h3>Branch-Level Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Branch</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Shipping Address</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Materials</th>
            </tr>
          </thead>
          <tbody>
            ${branchRows}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This order was submitted from TrioTag.</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "TrioTag <onboarding@resend.dev>",
      to: ["tinystickyads@gmail.com"],
      subject: `New Print Order: ${franchiseName} (${(orderId || "").slice(0, 8).toUpperCase()})`,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending print order email:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
