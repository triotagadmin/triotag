import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceKey);

    // 1. Authenticate the caller from the JWT — never trust body-supplied identity.
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    if (!token) return json({ error: "Not authenticated" }, 401);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const caller = userData?.user;
    if (userErr || !caller) return json({ error: "Not authenticated" }, 401);

    // 2. Only the global Webmaster may proceed.
    const { data: wm } = await admin
      .from("webmasters")
      .select("user_id")
      .eq("user_id", caller.id)
      .maybeSingle();
    if (!wm) {
      await admin.from("audit_logs").insert({
        user_id: caller.id,
        actor_role: "unauthorized",
        action: "BRAND_ADVERTISER_REVIEW_DENIED",
        details: { attempted_by: caller.email },
      });
      return json({ error: "Only the global Webmaster can review brand accounts" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const profileId: string | undefined = body?.profileId;
    const decision: string | undefined = body?.decision;
    const reason: string | null = typeof body?.reason === "string" && body.reason.trim()
      ? body.reason.trim().slice(0, 1000)
      : null;

    if (!profileId || !["approved", "rejected", "suspended"].includes(String(decision))) {
      return json({ error: "Invalid request" }, 400);
    }

    // 3. Request must exist.
    const { data: profile } = await admin
      .from("brand_advertiser_profiles")
      .select("id, user_id, company_name, contact_name, contact_email, approval_status")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return json({ error: "Request not found" }, 404);

    const current = profile.approval_status || "pending";
    // 4. Approve/reject only apply to pending requests; suspend only to approved ones.
    if ((decision === "approved" || decision === "rejected") && current !== "pending") {
      return json({ error: `Request is already ${current}` }, 409);
    }
    if (decision === "suspended" && current !== "approved") {
      return json({ error: "Only approved accounts can be suspended" }, 409);
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { approval_status: decision };
    if (decision === "approved") {
      patch.approved_by = caller.id;
      patch.approved_at = now;
      patch.rejection_reason = null;
    } else {
      patch.rejected_by = caller.id;
      patch.rejected_at = now;
      patch.rejection_reason = reason;
    }

    const { error: updErr } = await admin
      .from("brand_advertiser_profiles")
      .update(patch)
      .eq("id", profile.id);
    if (updErr) {
      console.error("update failed", updErr);
      return json({ error: "Could not update the account" }, 500);
    }

    const actionMap: Record<string, string> = {
      approved: "BRAND_ADVERTISER_APPROVED",
      rejected: "BRAND_ADVERTISER_REJECTED",
      suspended: "BRAND_ADVERTISER_SUSPENDED",
    };
    await admin.from("audit_logs").insert({
      user_id: caller.id,
      actor_role: "webmaster",
      action: actionMap[decision!],
      record_id: profile.id,
      details: {
        brand_user_id: profile.user_id,
        company_name: profile.company_name,
        contact_email: profile.contact_email,
        previous_status: current,
        new_status: decision,
        reason,
      },
    });

    // 5. Notify the applicant.
    let emailed = false;
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && profile.contact_email) {
      try {
        const resend = new Resend(resendKey);
        const brand = profile.company_name || "your brand";
        const html = decision === "approved"
          ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;color:#111827;">
              <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
                <h1 style="color:#16a34a;font-size:20px;margin:0 0 8px;">TRIOTAG</h1>
                <h2 style="font-size:18px;margin:0 0 12px;">Your Brand Advertiser account has been approved</h2>
                <p style="font-size:14px;line-height:1.6;">Hi ${profile.contact_name || "there"},</p>
                <p style="font-size:14px;line-height:1.6;">The account for <strong>${brand}</strong> has been approved. You can now sign in and start discovering retail media inventory and launching campaigns.</p>
                <p style="margin:24px 0;"><a href="https://triotag.com/auth" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;">Log in to TRIOTAG</a></p>
                <p style="font-size:12px;color:#6b7280;">TRIOTAG — Retail Media Marketplace</p>
              </div>
            </div>`
          : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;color:#111827;">
              <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
                <h1 style="color:#16a34a;font-size:20px;margin:0 0 8px;">TRIOTAG</h1>
                <h2 style="font-size:18px;margin:0 0 12px;">Update on your Brand Advertiser account</h2>
                <p style="font-size:14px;line-height:1.6;">Hi ${profile.contact_name || "there"},</p>
                <p style="font-size:14px;line-height:1.6;">The registration request for <strong>${brand}</strong> was ${decision === "suspended" ? "suspended" : "not approved"}.</p>
                ${reason ? `<p style="font-size:14px;line-height:1.6;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;"><strong>Reason:</strong> ${reason}</p>` : ""}
                <p style="font-size:14px;line-height:1.6;">If you believe this is a mistake, reply to this email and our team will take another look.</p>
                <p style="font-size:12px;color:#6b7280;">TRIOTAG — Retail Media Marketplace</p>
              </div>
            </div>`;
        const subject = decision === "approved"
          ? "Your TRIOTAG Brand Advertiser Account Has Been Approved"
          : decision === "suspended"
            ? "Your TRIOTAG Brand Advertiser Account Has Been Suspended"
            : "Update on Your TRIOTAG Brand Advertiser Registration";
        const sent = await resend.emails.send({
          from: "TRIOTAG <noreply@triotag.com>",
          to: [profile.contact_email],
          subject,
          html,
        });
        emailed = !sent.error;
        if (sent.error) console.error("resend error", sent.error);
      } catch (e) {
        console.error("email failed", e);
      }
    }

    return json({ success: true, status: decision, emailed });
  } catch (e) {
    console.error("webmaster-brand-account-review", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
