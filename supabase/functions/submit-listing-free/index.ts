import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ListingSubmission {
  locationName: string;
  address: string;
  spaceType: string;
  photoUrl?: string;
  size: string;
  notes?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const submission: ListingSubmission = await req.json();

    // Validate required fields
    if (!submission.locationName || !submission.address || !submission.spaceType ||
        !submission.size || !submission.submitterName || !submission.submitterEmail) {
      throw new Error("Missing required fields");
    }

    const sizeLabel = submission.size === "tiny" ? "Tiny (Business card to A5)" : "Small Format (A4 to A3)";

    const emailResponse = await resend.emails.send({
      from: "TrioTag <onboarding@resend.dev>",
      to: ["tinystickyads@gmail.com"],
      subject: `New Listing Submission: ${submission.locationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Ad Space Listing Submission
          </h1>

          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">Space Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 150px;">Location Name:</td>
                <td style="padding: 8px 0;">${submission.locationName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Address:</td>
                <td style="padding: 8px 0;">${submission.address}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Space Type:</td>
                <td style="padding: 8px 0;">${submission.spaceType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Size:</td>
                <td style="padding: 8px 0;">${sizeLabel}</td>
              </tr>
              ${submission.notes ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Notes:</td>
                <td style="padding: 8px 0;">${submission.notes}</td>
              </tr>` : ""}
              ${submission.photoUrl ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Photo:</td>
                <td style="padding: 8px 0;"><a href="${submission.photoUrl}" style="color: #2563eb;">View Photo</a></td>
              </tr>` : ""}
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 150px;">Name:</td>
                <td style="padding: 8px 0;">${submission.submitterName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${submission.submitterEmail}" style="color: #2563eb;">${submission.submitterEmail}</a></td>
              </tr>
              ${submission.submitterPhone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0;"><a href="tel:${submission.submitterPhone}" style="color: #2563eb;">${submission.submitterPhone}</a></td>
              </tr>` : ""}
            </table>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>Submitted at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Listing email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Listing submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in submit-listing-free:", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
