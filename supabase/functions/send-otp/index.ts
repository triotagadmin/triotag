import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin.from("otp_verifications").upsert({
      email,
      code,
      expires_at: expiresAt,
      verified: false,
    }, { onConflict: "email" });

    const emailResponse = await resend.emails.send({
      from: "TrioTag <noreply@tinystickyads.com>",
      to: [email],
      subject: `Your TrioTag verification code: ${code}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
          <h2 style="color:#16a34a;margin:0 0 12px;">TrioTag Verification</h2>
          <p>Enter this 6-digit code to verify your email for your campaign submission:</p>
          <div style="background:#f5f5f5;padding:24px;border-radius:8px;text-align:center;margin:20px 0;">
            <p style="margin:0 0 8px;color:#666;font-size:12px;letter-spacing:1px;">YOUR VERIFICATION CODE</p>
            <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:8px;color:#16a34a;font-family:monospace;">${code}</p>
          </div>
          <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:12px;">TrioTag · Micro Advertising · www.triotag.com</p>
        </div>
      `,
    });

    console.log("[send-otp] Email sent:", emailResponse);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-otp] Error:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
