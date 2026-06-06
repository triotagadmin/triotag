import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "otp-verification",
        recipientEmail: email,
        idempotencyKey: `otp-${email}-${Date.now()}`,
        templateData: { code },
      },
    });

    if (error) {
      console.error("[send-otp] send-transactional-email error:", error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message || "Failed to send email." }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log("[send-otp] enqueued:", data);
    const expiresAt = Date.now() + 10 * 60 * 1000;
    return new Response(JSON.stringify({ ok: true, code, expiresAt }), {
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
