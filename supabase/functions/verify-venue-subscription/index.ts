import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const APP_URL = "https://triotag.com";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return Response.redirect(`${APP_URL}/verify?subscription_verified=failed`, 302);

  const { data: sub } = await admin
    .from("venue_subscriptions")
    .select("id, email_verified, subscription_status, verification_expiry")
    .eq("verification_token", token)
    .maybeSingle();

  if (!sub) return Response.redirect(`${APP_URL}/verify?subscription_verified=failed`, 302);

  if (sub.email_verified && sub.subscription_status === "active") {
    return Response.redirect(`${APP_URL}/verify?subscription_verified=already`, 302);
  }

  if (new Date(sub.verification_expiry) < new Date()) {
    await admin.from("venue_subscriptions").update({ subscription_status: "expired" }).eq("id", sub.id);
    return Response.redirect(`${APP_URL}/verify?subscription_verified=failed`, 302);
  }

  const now = new Date().toISOString();
  await admin.from("venue_subscriptions").update({
    email_verified: true,
    verified_at: now,
    subscription_status: "active",
  }).eq("id", sub.id);

  return Response.redirect(`${APP_URL}/verify?subscription_verified=success`, 302);
});
