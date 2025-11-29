import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ListingSubmission {
  publisherType: "venue" | "digital" | "agent";
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  location: string;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const submission: ListingSubmission = await req.json();

    console.log("Received listing submission:", {
      publisherType: submission.publisherType,
      businessName: submission.businessName,
      contactEmail: submission.contactEmail,
    });

    // Validate required fields
    if (!submission.publisherType || !submission.businessName || !submission.contactName || 
        !submission.contactEmail || !submission.contactPhone || !submission.location || 
        !submission.description) {
      throw new Error("Missing required fields");
    }

    const publisherTypeLabels = {
      venue: "Venue",
      digital: "Digital Media",
      agent: "Agent Services",
    };

    const publisherTypeLabel = publisherTypeLabels[submission.publisherType] || submission.publisherType;

    // Send email to tinystickyads@gmail.com
    const emailResponse = await resend.emails.send({
      from: "Tiny Sticky Ads <noreply@tinystickyads.com>",
      to: ["tinystickyads@gmail.com"],
      subject: `New ${publisherTypeLabel} Listing Submission`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Listing Submission
          </h1>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">Publisher Type</h2>
            <p style="font-size: 18px; font-weight: bold; color: #2563eb; margin: 0;">
              ${publisherTypeLabel}
            </p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">Business Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 150px;">Business Name:</td>
                <td style="padding: 8px 0;">${submission.businessName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                <td style="padding: 8px 0;">${submission.location}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 150px;">Contact Name:</td>
                <td style="padding: 8px 0;">${submission.contactName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;">
                  <a href="mailto:${submission.contactEmail}" style="color: #2563eb;">
                    ${submission.contactEmail}
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0;">
                  <a href="tel:${submission.contactPhone}" style="color: #2563eb;">
                    ${submission.contactPhone}
                  </a>
                </td>
              </tr>
            </table>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #1f2937;">Description</h3>
            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
              <p style="margin: 0; white-space: pre-wrap;">${submission.description}</p>
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
            <p>This submission was received from the Tiny Sticky Ads listing form.</p>
            <p>Submitted at: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Listing submitted successfully" 
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-listing function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to submit listing",
        success: false 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
