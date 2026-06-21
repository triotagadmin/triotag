import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { create } from "https://deno.land/x/djwt@v3.0.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const JWT_SECRET = Deno.env.get("JWT_SECRET");
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.");
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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
    console.log(`[send-verification-email] START email=${email} userId=${userId} userType=${userType}`);

    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error("[send-verification-email] MISSING RESEND_API_KEY secret");
      return new Response(JSON.stringify({ error: "Email service not configured (missing RESEND_API_KEY)." }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check suppression list before attempting to send
    try {
      const { data: suppressed } = await supabaseAdmin
        .from("suppressed_emails")
        .select("email, reason")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (suppressed) {
        console.error(`[send-verification-email] BLOCKED — ${email} is suppressed. Reason: ${suppressed.reason}`);
        return new Response(JSON.stringify({
          error: `This email address cannot receive emails right now (${suppressed.reason || "previously bounced or unsubscribed"}). Please use a different email or contact support.`,
        }), {
          status: 422,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    } catch (suppressionCheckErr) {
      console.warn("[send-verification-email] Suppression check failed (non-fatal):", suppressionCheckErr);
    }

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
        email,
        userType,
        purpose: "email_verification",
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      },
      key
    );

    const verificationUrl = `https://tinystickyads.com/verify?token=${token}`;

    console.log(`[send-verification-email] Calling Resend API for ${email}...`);

    const emailResponse = await resend.emails.send({
      from: "TrioTag <noreply@tinystickyads.com>",
      to: [email],
      subject: "Verify your TrioTag Account",
      html: `
        <h1>Welcome to TrioTag!</h1>
        <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
        <p>Click the link below to verify your account:</p>
        <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; display: inline-block; border-radius: 4px;">Verify Email Address</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with TrioTag, you can safely ignore this email.</p>
        <p>Best regards,<br>The TrioTag Team</p>
      `,
    });

    // Resend SDK can return 200 with an error inside the body — check explicitly.
    if ((emailResponse as any).error) {
      const err = (emailResponse as any).error;
      console.error("[send-verification-email] Resend API returned an error:", JSON.stringify(err));
      return new Response(JSON.stringify({
        error: `Resend failed to send: ${err.message || JSON.stringify(err)}`,
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[send-verification-email] SUCCESS — Resend response:", JSON.stringify(emailResponse));

    return new Response(
      JSON.stringify({ success: true, token, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-verification-email] FATAL ERROR:", error?.message, error?.stack);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error sending verification email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
