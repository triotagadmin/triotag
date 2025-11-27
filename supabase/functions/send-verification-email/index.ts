import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { create } from "https://deno.land/x/djwt@v3.0.0/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "RadXT9RTrMZvVsSccejHkrsIx3BDMLqRI10t1vKVH0U=";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  userId: string;
  userType: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId, userType }: VerificationEmailRequest = await req.json();

    console.log(`[Send Verification] Sending verification email to ${email} for user ${userId} (${userType})`);

    // Generate JWT token
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
        email: email,
        userType: userType,
        purpose: "email_verification",
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      key
    );

    const verificationUrl = `https://tinystickyads.com/verify?token=${token}`;

    const emailResponse = await resend.emails.send({
      from: "TinyStickyAds <noreply@tinystickyads.com>",
      to: [email],
      subject: "Verify your TinyStickyAds Account",
      html: `
        <h1>Welcome to TinyStickyAds!</h1>
        <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
        <p>Click the link below to verify your account:</p>
        <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Verify Email Address</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with TinyStickyAds, you can safely ignore this email.</p>
        <p>Best regards,<br>The TinyStickyAds Team</p>
      `,
    });

    console.log("[Send Verification] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, token, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[Send Verification Error]:", error);
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
