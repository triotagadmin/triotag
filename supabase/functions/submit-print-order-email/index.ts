import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Material pricing map (synced with src/lib/materialPricing.ts)
const MATERIAL_PRICES: Record<string, number> = {
  vinyl_sticker: 18,
  table_tent_card: 18,
  acrylic_table_tent: 32,
  coroplast_stand: 66,
  poster_frame: 18,
  wall_decal: 18,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { franchiseName, branches, currency, submittedBy, orderId, paymentStatus, totalCost } = body;

    const currencySymbol = (currency || "USD").toUpperCase() === "PHP" ? "₱" : "$";

    const branchRows = (branches || []).map((b: any) => {
      const materials = (b.materials || [])
        .map((m: any) => {
          const unitPrice = MATERIAL_PRICES[m.materialType] || 18;
          const lineTotal = unitPrice * m.quantity;
          return `${m.materialLabel}: ${m.quantity} units × ${currencySymbol}${unitPrice.toFixed(2)} = <strong>${currencySymbol}${lineTotal.toFixed(2)}</strong>`;
        })
        .join("<br/>");
      const addr = b.shippingAddress || {};
      const address = [addr.recipient, addr.street, addr.city, addr.province, addr.postalCode]
        .filter(Boolean)
        .join(", ");
      
      // Calculate branch subtotal
      const branchTotal = (b.materials || []).reduce((sum: number, m: any) => {
        const unitPrice = MATERIAL_PRICES[m.materialType] || 18;
        return sum + unitPrice * m.quantity;
      }, 0);

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
          <td style="padding: 10px; border: 1px solid #e5e7eb; vertical-align: top; text-align: right; font-weight: bold;">
            ${currencySymbol}${branchTotal.toFixed(2)}
          </td>
        </tr>`;
    }).join("");

    const displayTotal = totalCost
      ? `${currencySymbol}${Number(totalCost).toFixed(2)}`
      : "Calculated at checkout";

    const paymentBadge = paymentStatus === "paid"
      ? '<span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">✓ PAID</span>'
      : '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">⏳ PENDING</span>';

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
            <td style="padding: 8px 0;">${currency || "USD"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Payment Status:</td>
            <td style="padding: 8px 0;">${paymentBadge}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Total Cost:</td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #22c55e;">${displayTotal}</td>
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
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">Materials & Pricing</th>
              <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${branchRows}
          </tbody>
          <tfoot>
            <tr style="background: #f9fafb;">
              <td colspan="3" style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 15px;">
                TOTAL
              </td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; font-size: 16px; color: #22c55e;">
                ${displayTotal}
              </td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
          <p>This order was submitted from TrioTag.</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: "TrioTag <onboarding@resend.dev>",
      to: ["tinystickyads@gmail.com"],
      subject: `${paymentStatus === "paid" ? "💰 PAID" : "⏳ NEW"} Print Order: ${franchiseName} (${(orderId || "").slice(0, 8).toUpperCase()}) — ${displayTotal}`,
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
