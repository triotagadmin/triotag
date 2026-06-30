import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_CONTENT: Record<string, { subject: string; headline: string; body: string; color: string }> = {
  approved: {
    subject: "Your Campaign Has Been Approved",
    headline: "Campaign Approved! 🎉",
    body: "Great news — your media plan campaign has been reviewed and approved by the TrioTag team. We are now preparing your ad materials and will contact you shortly to confirm your activation timeline.",
    color: "#2563eb",
  },
  activated: {
    subject: "Your Campaign Is Now Live",
    headline: "Your Campaign Is Live! 🚀",
    body: "Your media plan campaign has been activated and is now live across your selected ad spaces. You will receive a proof-of-run report once the campaign period is complete.",
    color: "#16a34a",
  },
  rejected: {
    subject: "Update on Your Campaign Request",
    headline: "Campaign Status Update",
    body: "We were unable to proceed with your current media plan request. This may be due to availability constraints or coverage issues in your selected area. Please contact our team at hello@triotag.com for assistance or to submit a revised request.",
    color: "#dc2626",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { newStatus, requesterEmail, campaignName } = await req.json();
    if (!requesterEmail || !STATUS_CONTENT[newStatus]) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = STATUS_CONTENT[newStatus];

    await resend.emails.send({
      from: "TrioTag <noreply@triotag.com>",
      to: [requesterEmail],
      subject: `${content.subject} — ${campaignName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
          <h2 style="color:${content.color};margin:0 0 12px;">${content.headline}</h2>
          <p style="font-size:15px;line-height:1.5;">${content.body}</p>
          <div style="margin:20px 0;padding:14px 16px;background:#f6f6f6;border-radius:8px;">
            <p style="margin:0;font-size:13px;"><strong>Campaign:</strong> ${campaignName || "—"}</p>
            <p style="margin:6px 0 0;font-size:13px;"><strong>Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
          </div>
          <p style="font-size:13px;color:#555;">Questions? Reply to this email or contact us at <a href="mailto:hello@triotag.com" style="color:#16a34a;">hello@triotag.com</a></p>
          <p style="font-size:11px;color:#999;margin-top:24px;">TrioTag · Retail Advertising · triotag.com</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[notify-media-plan-status]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
