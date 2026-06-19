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
      radiusMeters, selections, estimatedPrice,
      preferredStartDate, notes, requesterEmail,
    } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const radiusKm = (radiusMeters / 1000).toFixed(2);
    const mapsLink = `https://www.openstreetmap.org/?mlat=${centerLat}&mlon=${centerLng}#map=14/${centerLat}/${centerLng}`;

    const selectionRows = Array.isArray(selections) && selections.length > 0
      ? selections.map((s: any) => {
          const lineTotal = (Number(s.price) || 0) * (Number(s.quantity) || 0);
          const specs = s.specs
            ? Object.entries(s.specs).map(([k, v]) => `<span style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:999px;padding:2px 8px;margin:2px 4px 0 0;font-size:11px;color:#4b5563;"><strong style="color:#111827;">${k}:</strong> ${v}</span>`).join("")
            : "";
          return `
            <tr><td colspan="2" style="padding:10px 0;border-top:1px solid #e5e7eb;">
              <div style="display:flex;justify-content:space-between;font-weight:600;color:#111827;">
                <span>${s.label ?? s.variantId} × ${s.quantity}</span>
                <span style="color:#16a34a;">₱${lineTotal.toLocaleString()}</span>
              </div>
              <div style="margin-top:4px;">${specs}</div>
            </td></tr>
          `;
        }).join("")
      : `<tr><td colspan="2" style="padding:10px 0;color:#6b7280;">No formats selected</td></tr>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;">
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e7eb;">
          <h2 style="color:#16a34a;margin:0 0 8px 0;">New Media Plan Request</h2>
          <p style="color:#6b7280;margin:0 0 20px 0;font-size:14px;">A new media plan has been submitted on TrioTag.</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:6px 0;color:#6b7280;">Campaign:</td><td style="padding:6px 0;font-weight:600;">${campaignName ?? "-"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Type:</td><td style="padding:6px 0;font-weight:600;">${campaignType ?? "-"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Requester:</td><td style="padding:6px 0;">${requesterEmail ?? "guest"}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Center:</td><td style="padding:6px 0;"><a href="${mapsLink}">${centerLat}, ${centerLng}</a></td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;">Radius:</td><td style="padding:6px 0;">${radiusKm} km</td></tr>
            ${preferredStartDate ? `<tr><td style="padding:6px 0;color:#6b7280;">Preferred start:</td><td style="padding:6px 0;">${preferredStartDate}</td></tr>` : ""}
          </table>

          <h3 style="margin:20px 0 0 0;font-size:14px;color:#111827;">Selected Formats</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px;">
            ${selectionRows}
          </table>

          <div style="margin-top:16px;padding:12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;display:flex;justify-content:space-between;font-size:15px;">
            <strong style="color:#111827;">Estimated Total</strong>
            <strong style="color:#16a34a;">₱${Number(estimatedPrice).toLocaleString()}</strong>
          </div>

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
