import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const page = (body: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>TrioTag Subscription</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;background:#0a0a0a;color:#fff;font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
  .card{background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;max-width:480px;text-align:center;}
  h1{color:#39FF14;margin:0 0 12px;font-size:24px;}
  p{color:#ccc;line-height:1.5;}
  a.btn{display:inline-block;margin-top:20px;background:#16a34a;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;}
</style></head><body><div class="card">${body}</div></body></html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(page("<h1>Invalid link</h1><p>No subscription token provided.</p>"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const { data, error } = await supabaseAdmin
    .from("campaign_subscriptions")
    .update({ subscribed: true })
    .eq("subscribe_token", token)
    .select("email, campaign_id")
    .single();

  if (error || !data) {
    return new Response(
      page("<h1>Invalid or expired link</h1><p>This subscription link has already been used or is invalid.</p>"),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response(
    page(`<h1>✓ Subscribed!</h1>
      <p>You are now subscribed to this campaign listing.</p>
      <p>Whenever someone submits a proposal on this campaign, you'll receive an email at <strong>${data.email}</strong>.</p>
      <a class="btn" href="https://triotag.com/campaigns">View Campaigns</a>`),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
});
