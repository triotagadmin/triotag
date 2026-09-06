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
    const {
      campaignName,
      campaignType,
      campaignPillar,
      centerLat,
      centerLng,
      radiusMeters,
      selections,
      preferredStartDate,
      notes,
      requesterEmail,
    } = await req.json();


    const mapsLink = `https://www.google.com/maps?q=${centerLat},${centerLng}`;
    const radiusKm = (Number(radiusMeters) / 1000).toFixed(2);

    const selectionsRows = Array.isArray(selections) && selections.length > 0
      ? selections
          .map((s: any) => {
            return `
              <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">
                  <div style="font-weight:600;color:#111827;">${s.label ?? s.variantId}</div>
                  <div style="font-size:12px;color:#6b7280;">${s.category ?? ""}</div>
                </td>
                <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#111827;">${s.quantity}</td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="2" style="padding:12px;color:#6b7280;">No formats selected</td></tr>`;


    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f9fafb;color:#111827;">
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
          <h2 style="color:#16a34a;margin:0 0 4px 0;">New Campaign Request</h2>
          <p style="color:#6b7280;margin:0 0 20px 0;font-size:14px;">A new campaign request has been submitted on TrioTag.</p>

          <h3 style="font-size:14px;margin:16px 0 6px;color:#111827;">Campaign Details</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#6b7280;width:170px;">Campaign Name</td><td style="padding:4px 0;font-weight:600;">${campaignName ?? "-"}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Campaign Pillar</td><td style="padding:4px 0;">${campaignPillar ? String(campaignPillar).charAt(0).toUpperCase() + String(campaignPillar).slice(1) : "-"}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Type</td><td style="padding:4px 0;">${campaignType ?? "-"}</td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Preferred Start Date</td><td style="padding:4px 0;">${preferredStartDate ?? "-"}</td></tr>
          </table>

          <h3 style="font-size:14px;margin:20px 0 6px;color:#111827;">Location</h3>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:4px 0;color:#6b7280;width:170px;">Center</td><td style="padding:4px 0;"><a href="${mapsLink}" style="color:#16a34a;">${centerLat}, ${centerLng}</a></td></tr>
            <tr><td style="padding:4px 0;color:#6b7280;">Radius</td><td style="padding:4px 0;">${radiusMeters} m (${radiusKm} km)</td></tr>
          </table>

          <h3 style="font-size:14px;margin:20px 0 6px;color:#111827;">Selected Formats &amp; Quantities</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:8px 12px;text-align:left;color:#374151;">Format</th>
                <th style="padding:8px 12px;text-align:center;color:#374151;">Qty</th>
              </tr>
            </thead>
            <tbody>${selectionsRows}</tbody>
          </table>


          <h3 style="font-size:14px;margin:20px 0 6px;color:#111827;">Requester</h3>
          <p style="margin:0;font-size:14px;">
            <a href="mailto:${requesterEmail ?? ""}" style="color:#16a34a;">${requesterEmail ?? "-"}</a>
          </p>

          <h3 style="font-size:14px;margin:20px 0 6px;color:#111827;">Notes</h3>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px;white-space:pre-wrap;">
            ${notes ? String(notes).replace(/</g, "&lt;") : "None provided"}
          </div>

          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
            Submitted at: ${new Date().toLocaleString()}
          </div>
        </div>
      </div>
    `;

    const resp = await resend.emails.send({
      from: "TrioTag <noreply@triotag.com>",
      to: ["tinystickyads@gmail.com"],
      subject: `New Campaign Request — ${campaignName ?? "Untitled"}`,
      html,
    });

    console.log("Campaign request email sent:", resp);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-media-plan-request error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "unknown", success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
