import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  normalizePhNumber,
  signChallenge,
  verifyChallenge,
  hmacHex,
} from "../_shared/mobile-qr.ts";

const OTP_TTL_MS = 5 * 60 * 1000;

/**
 * Modular OTP delivery. Swap this single function to plug in a real SMS
 * provider (Semaphore, Twilio, Movider…) without touching the flow.
 */
async function deliverOtp(to: string, code: string): Promise<string> {
  // No SMS provider configured yet — the code is logged for staging use only.
  console.log(`[otp:mock] delivering code to ${to.slice(0, 6)}****`);
  return "mock";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const secret = Deno.env.get("JWT_SECRET");
    if (!secret) return json({ error: "Verification unavailable" }, 500);

    const body = await req.json();
    const action = body?.action;
    const qrRef = String(body?.qr_ref || "");
    const sessionId = String(body?.session_id || "").slice(0, 64);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: qr } = await supabase
      .from("qr_codes")
      .select("id, campaign_id, advertiser_id, qr_type, status, privacy_policy_version, terms_version, destination_url")
      .eq("qr_ref", qrRef)
      .eq("qr_type", "MOBILE_QR")
      .maybeSingle();

    if (!qr || qr.status !== "active") return json({ error: "This offer is no longer available" }, 404);

    const track = (event_type: string) =>
      supabase.from("mobile_qr_events").insert({
        qr_id: qr.id,
        campaign_id: qr.campaign_id,
        event_type,
        session_id: sessionId || null,
        user_agent: (req.headers.get("user-agent") || "").slice(0, 300),
      });

    if (action === "send") {
      const mobile = normalizePhNumber(String(body?.mobile_number || ""));
      if (!mobile) return json({ error: "Enter a valid Philippine mobile number" }, 400);

      // Rate limit: max 3 OTP requests per session in 10 minutes
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      if (sessionId) {
        const { count } = await supabase
          .from("mobile_qr_events")
          .select("id", { count: "exact", head: true })
          .eq("qr_id", qr.id)
          .eq("session_id", sessionId)
          .eq("event_type", "otp_sent")
          .gte("created_at", since);
        if ((count ?? 0) >= 3) {
          return json({ error: "Too many verification attempts. Please try again later." }, 429);
        }
      }

      await track("form_submit");

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const provider = await deliverOtp(mobile, code);
      const challenge = await signChallenge(secret, {
        m: mobile,
        q: qrRef,
        h: await hmacHex(secret, `${mobile}:${code}`),
        p: provider,
        exp: Date.now() + OTP_TTL_MS,
      });

      await track("otp_sent");
      return json({ ok: true, challenge, provider, dev_code: provider === "mock" ? code : undefined });
    }

    if (action === "verify") {
      const code = String(body?.code || "").trim();
      const payload = await verifyChallenge(secret, String(body?.challenge || ""));
      if (!payload) return json({ error: "Verification expired. Please request a new code." }, 400);
      if (payload.q !== qrRef) return json({ error: "Invalid verification request" }, 400);

      const mobile = String(payload.m);
      const expected = await hmacHex(secret, `${mobile}:${code}`);
      if (expected !== payload.h) return json({ error: "Incorrect code. Please try again." }, 400);

      await track("otp_verified");

      const consent = body?.consent_marketing === true;
      const now = new Date().toISOString();

      const { data: existing } = await supabase
        .from("mobile_qr_leads")
        .select("id")
        .eq("qr_id", qr.id)
        .eq("mobile_number", mobile)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("mobile_qr_leads")
          .update({
            last_seen_at: now,
            mobile_verified: true,
            verified_at: now,
            consent_marketing: consent,
            consent_timestamp: consent ? now : null,
            session_id: sessionId || null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("mobile_qr_leads").insert({
          qr_id: qr.id,
          campaign_id: qr.campaign_id,
          advertiser_id: qr.advertiser_id,
          mobile_number: mobile,
          mobile_verified: true,
          verified_at: now,
          otp_provider: String(payload.p || "mock"),
          consent_marketing: consent,
          consent_timestamp: consent ? now : null,
          privacy_policy_version: qr.privacy_policy_version,
          terms_version: qr.terms_version,
          session_id: sessionId || null,
        });
        await track("lead_created");
      }

      return json({ ok: true, verified: true, offer_url: qr.destination_url });
    }

    if (action === "redeem") {
      await track("offer_redeemed");
      const mobile = normalizePhNumber(String(body?.mobile_number || ""));
      if (mobile) {
        await supabase
          .from("mobile_qr_leads")
          .update({ offer_redeemed_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
          .eq("qr_id", qr.id)
          .eq("mobile_number", mobile);
      }
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("mobile-qr-otp error", e);
    return json({ error: "Something went wrong" }, 500);
  }
});
