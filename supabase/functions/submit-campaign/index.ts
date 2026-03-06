import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CampaignSubmission {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  campaignName: string;
  adMaterials: string[];
  budget: string;
  targetLocations: string[];
  targetAudience: string;
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
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Company Name</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.companyName}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Contact Name</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.contactName}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.email}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.phone}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Industry</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.industry}</td></tr>
      </table>
      
      <h3>Campaign Details</h3>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Campaign Name</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.campaignName}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Ad Materials</td><td style="padding:6px 12px;border:1px solid #ddd;">${(submission.adMaterials || []).join(', ')}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Budget</td><td style="padding:6px 12px;border:1px solid #ddd;">$${submission.budget} USD</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Target Locations</td><td style="padding:6px 12px;border:1px solid #ddd;">${(submission.targetLocations || []).join(', ')}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Target Audience</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.targetAudience}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">Start Date</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.startDate}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;">End Date</td><td style="padding:6px 12px;border:1px solid #ddd;">${submission.endDate}</td></tr>
      </table>
      
      <h3>Campaign Description</h3>
      <p style="background:#f9f9f9;padding:12px;border-radius:4px;">${submission.description}</p>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tiny Sticky Ads <onboarding@resend.dev>",
        to: ["tinystickyads@gmail.com"],
        subject: `New Campaign Submission: ${submission.campaignName}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Campaign submission email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Campaign submitted successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in submit-campaign function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
