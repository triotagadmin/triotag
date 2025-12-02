import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CampaignSubmission {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  campaignName: string;
  category: string;
  adUnit: string;
  budget: string;
  targetAudience: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const submission: CampaignSubmission = await req.json();

    const emailHtml = `
      <h2>New Campaign Submission</h2>
      
      <h3>Company Information</h3>
      <ul>
        <li><strong>Company Name:</strong> ${submission.companyName}</li>
        <li><strong>Contact Name:</strong> ${submission.contactName}</li>
        <li><strong>Email:</strong> ${submission.email}</li>
        <li><strong>Phone:</strong> ${submission.phone}</li>
      </ul>
      
      <h3>Campaign Details</h3>
      <ul>
        <li><strong>Campaign Name:</strong> ${submission.campaignName}</li>
        <li><strong>Category:</strong> ${submission.category}</li>
        <li><strong>Ad Unit:</strong> ${submission.adUnit}</li>
        <li><strong>Budget:</strong> $${submission.budget}</li>
        <li><strong>Target Location:</strong> ${submission.location}</li>
        <li><strong>Target Audience:</strong> ${submission.targetAudience}</li>
        <li><strong>Start Date:</strong> ${submission.startDate}</li>
        <li><strong>End Date:</strong> ${submission.endDate}</li>
      </ul>
      
      <h3>Campaign Description</h3>
      <p>${submission.description}</p>
    `;

    const emailResponse = await resend.emails.send({
      from: "Tiny Sticky Ads <noreply@tinystickyads.com>",
      to: ["tinystickyads@gmail.com"],
      subject: `New Campaign Submission: ${submission.campaignName}`,
      html: emailHtml,
    });

    console.log("Campaign submission email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Campaign submitted successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-campaign function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
