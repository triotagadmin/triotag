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
      companyName,
      contactPerson,
      contactEmail,
      contactPhone,
      website,
      servicesInterested,
      monthlyBudget,
      targetAreas,
      preferredStartDate,
      additionalNotes,
    } = await req.json();

    if (
      !companyName ||
      !contactPerson ||
      !contactEmail ||
      !Array.isArray(servicesInterested) ||
      servicesInterested.length === 0
    ) {
      return new Response(
        JSON.stringify({
          error:
            "companyName, contactPerson, contactEmail, and at least one selected service are required",
          success: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const servicesList = (servicesInterested as string[])
      .map((s) => `<li style="margin: 4px 0;">${s}</li>`)
      .join("");

    const emailResponse = await resend.emails.send({
      from: "TrioTag <noreply@triotag.com>",
      to: ["tinystickyads@gmail.com"],
      subject: `New Google Ads Booking Request — ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
            New Google Ads Booking Request
          </h1>

          <h3 style="color: #1f2937; margin-top: 24px;">Company &amp; Contact</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Company:</td><td style="padding: 6px 0;">${companyName}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Contact Person:</td><td style="padding: 6px 0;">${contactPerson}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td style="padding: 6px 0;"><a href="mailto:${contactEmail}" style="color: #16a34a;">${contactEmail}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Phone:</td><td style="padding: 6px 0;">${contactPhone || "—"}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Website:</td><td style="padding: 6px 0;">${website || "—"}</td></tr>
          </table>

          <h3 style="color: #1f2937; margin-top: 24px;">Services Interested</h3>
          <ul style="padding-left: 20px; color: #111827;">${servicesList}</ul>

          <h3 style="color: #1f2937; margin-top: 24px;">Campaign Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Monthly Budget:</td><td style="padding: 6px 0;">${monthlyBudget || "—"}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Target Areas:</td><td style="padding: 6px 0;">${targetAreas || "—"}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Preferred Start:</td><td style="padding: 6px 0;">${preferredStartDate || "—"}</td></tr>
          </table>

          <h3 style="color: #1f2937; margin-top: 24px;">Additional Notes</h3>
          <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #16a34a; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap;">${additionalNotes || "None provided"}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>Submitted at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Google Ads booking email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error sending Google Ads booking email:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});
