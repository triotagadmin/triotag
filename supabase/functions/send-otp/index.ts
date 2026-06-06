import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin
      .from("otp_verifications")
      .upsert(
        { email, code, expires_at: expiresAt, verified: false },
        { onConflict: "email" }
      );
    if (dbError) throw dbError;

    await resend.emails.send({
      from: "TrioTag <noreply@triotag.com>",
      to: [email],
      subject: `Your TrioTag verification code: ${code}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111;padding:24px;">
          <h2 style="color:#16a34a;margin:0 0 12px;">TrioTag Verification</h2>
          <p>Enter this code to verify your email for your campaign submission:</p>
          <div style="background:#f5f5f5;padding:24px;border-radius:8px;text-align:center;margin:20px 0;">
            <p style="margin:0 0 8px;color:#666;font-size:12px;letter-spacing:1px;">VERIFICATION CODE</p>
            <p style="margin:0;font-size:36px;font-weight:bold;letter-spacing:8px;color:#16a34a;font-family:monospace;">${code}</p>
          </div>
          <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#999;font-size:12px;">TrioTag · www.triotag.com</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-otp error", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
