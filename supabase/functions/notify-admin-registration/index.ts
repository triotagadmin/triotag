import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { create } from "https://deno.land/x/djwt@v3.0.0/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

// SECURITY: JWT_SECRET must be provided via environment variable - no fallbacks allowed
const JWT_SECRET = Deno.env.get("JWT_SECRET");
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Token operations cannot proceed without a secure secret.");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminRegistrationRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  userId: string;
  registrationType?: "admin" | "print_partner";
  companyName?: string;
  businessAddress?: string;
  capabilities?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AdminRegistrationRequest = await req.json();
    const { fullName, email, phoneNumber, userId, registrationType, companyName, businessAddress, capabilities } = body;
    const isPrintPartner = registrationType === "print_partner";

    console.log(`Sending ${isPrintPartner ? "print partner" : "admin"} registration notification for:`, email);

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: userId,
        purpose: "verification",
        fullName,
        email,
        registrationType: registrationType || "admin",
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      },
      key
    );

    const verificationUrl = `https://tinystickyads.com/admin/verify?token=${token}`;

    const subject = isPrintPartner
      ? `[TrioTag] New Print Partner Registration — ${fullName}${companyName ? ` (${companyName})` : ""}`
      : "New Admin Registration Pending Approval";

    const html = isPrintPartner
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="display:inline-block;background:#16a34a;color:#fff;padding:4px 10px;border-radius:4px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">PRINT PARTNER APPLICATION</div>
          <h2 style="color: #333; border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-top: 12px;">
            New Print Partner Registration
          </h2>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">Applicant</h3>
            <p><strong>Contact Person:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phoneNumber ? `<p><strong>Phone:</strong> ${phoneNumber}</p>` : ""}
            <h3 style="color:#16a34a;">Company</h3>
            ${companyName ? `<p><strong>Company Name:</strong> ${companyName}</p>` : ""}
            ${businessAddress ? `<p><strong>Business Address:</strong> ${businessAddress}</p>` : ""}
            ${capabilities && capabilities.length ? `<p><strong>Capabilities:</strong></p><ul>${capabilities.map((c) => `<li>${c}</li>`).join("")}</ul>` : ""}
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #856404;">
              <strong>Action Required:</strong> Click below to approve this print partner application.
            </p>
            <a href="${verificationUrl}"
               style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Approve Print Partner
            </a>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280;">
              Clicking Approve will grant this user access to the Print Partner dashboard at /print-partner/dashboard.
            </p>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              <strong>Security Note:</strong> This verification link will expire in 24 hours.
            </p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
            New Admin Registration
          </h2>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4F46E5;">Registration Details</h3>
            <p><strong>Full Name:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${phoneNumber ? `<p><strong>Phone:</strong> ${phoneNumber}</p>` : ''}
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #856404;">
              <strong>Action Required:</strong> Click the button below to approve this admin registration.
            </p>
            <a href="${verificationUrl}"
               style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Approve Admin Registration
            </a>
          </div>

          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">
              <strong>Security Note:</strong> This verification link will expire in 24 hours. The admin cannot log in until you approve their registration.
            </p>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated notification from TrioTag Admin System.
          </p>
        </div>
      `;

    const emailResponse = await resend.emails.send({
      from: "TrioTag <noreply@tinystickyads.com>",
      to: ["tinystickyads@gmail.com"],
      subject,
      html,
    });

    console.log("Admin notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in notify-admin-registration function:", error);
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
