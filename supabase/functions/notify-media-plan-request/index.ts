import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      campaignName, campaignType, centerLat, centerLng,
      radiusMeters, venueCount, estimatedPrice,
      preferredStartDate, notes, requesterEmail, budgetConfirmation,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const radiusKm = (radiusMeters / 1000).toFixed(2);
    const mapsLink = `https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=14/${centerLat}/${centerLng}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
          <h2 style="color:#16a34a;margin:0 0 8px 0;">New Media Plan Request</h2>
          <p style="color:#6b7280;margin:0 0 20px 0;font-size:14px;">A new radius-based media plan has been submitted on TrioTag.</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#6b7280;">Campaign:</td><td style="padding:6px 0;font-weight:600;">${campaignName ?? "-"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Type:</td><td style="padding:6px 0;font-weight:600;">${campaignType ?? "-"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Requester:</td><td style="padding:6px 0;">${requesterEmail ?? "guest"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Center:</td><td style="padding:6px 0;"><a href="${mapsLink}">${centerLat}, ${centerLng}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Radius:</td><td style="padding:6px 0;">${radiusKm} km</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Venues in radius:</td><td style="padding:6px 0;font-weight:600;">${venueCount}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Estimated price:</td><td style="padding:6px 0;font-weight:700;color:#16a34a;">₱${Number(estimatedPrice).toLocaleString()}</td></tr>
            ${budgetConfirmation ? `<tr><td style="padding:6px 0;color:#6b7280;">Budget confirmed:</td><td style="padding:6px 0;">₱${Number(budgetConfirmation).toLocaleString()}</td></tr>` : ""}
            ${preferredStartDate ? `<tr><td style="padding:6px 0;color:#6b7280;">Preferred start:</td><td style="padding:6px 0;">${preferredStartDate}</td></tr>` : ""}
          </table>

          ${notes ? `<div style="margin-top:16px;padding:12px;background:#f3f4f6;border-radius:8px;font-size:13px;"><strong>Notes:</strong><br/>${notes}</div>` : ""}
        </div>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "TrioTag <onboarding@resend.dev>",
        to: ["tinystickyads@gmail.com"],
        subject: `[Media Plan Request] ${campaignName ?? "Untitled"} — ₱${Number(estimatedPrice).toLocaleString()}`,
        html,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Resend error ${resp.status}: ${t}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error("notify-media-plan-request error", err);
    return new Response(JSON.stringify({ error: err?.message || "unknown" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
