import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(url, service);

    // Authorization: webmaster, or the super admin of the invitation's tenant
    const { data: wm } = await admin.from("webmasters").select("user_id").eq("user_id", user.id).maybeSingle();
    const { data: member } = await admin
      .from("tenant_members")
      .select("tenant_id, member_role, status")
      .eq("user_id", user.id)
      .maybeSingle();

    const body = await req.json().catch(() => ({}));
    const invitationId = typeof body.invitation_id === "string" ? body.invitation_id : "";
    if (!invitationId) return json({ error: "invitation_id is required" }, 400);

    const { data: inv } = await admin
      .from("tenant_invitations")
      .select("id, tenant_id, email, full_name, invited_role, token, expires_at, accepted_at, revoked_at")
      .eq("id", invitationId)
      .maybeSingle();
    if (!inv) return json({ error: "Invitation not found" }, 404);

    const isWebmaster = !!wm;
    const isTenantSuperAdmin =
      member?.member_role === "super_admin" && member?.status === "active" && member?.tenant_id === inv.tenant_id;
    if (!isWebmaster && !isTenantSuperAdmin) return json({ error: "Not authorized" }, 403);
    if (inv.accepted_at) return json({ error: "This invitation was already accepted" }, 400);
    if (inv.revoked_at) return json({ error: "This invitation was cancelled" }, 400);

    const { data: tenant } = await admin.from("tenants").select("name, code").eq("id", inv.tenant_id).maybeSingle();

    const siteUrl = (typeof body.site_url === "string" && body.site_url.startsWith("https://"))
      ? body.site_url.replace(/\/$/, "")
      : "https://triotag.com";
    const link = `${siteUrl}/invite/${inv.token}`;
    const roleLabel = inv.invited_role === "super_admin" ? "Super Admin" : "Agent";
    const name = inv.full_name || inv.email;
    const expires = new Date(inv.expires_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { error: sendError } = await resend.emails.send({
      from: "TrioTag <noreply@triotag.com>",
      to: [inv.email],
      subject: `Your TRIOTAG ${roleLabel} Account Requires Verification`,
      html: `
<div style="background:#0c0c0c;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #1f3d24;border-radius:14px;overflow:hidden;">
    <div style="padding:24px 28px;border-bottom:1px solid #1f3d24;">
      <span style="color:#39ff88;font-size:22px;font-weight:800;letter-spacing:1px;">TRIOTAG</span>
      <span style="color:#7b8b7f;font-size:12px;margin-left:8px;">PLATFORM ACCESS</span>
    </div>
    <div style="padding:28px;color:#e6f2e9;">
      <p style="font-size:16px;margin:0 0 16px;">Hello ${name},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
        You have been invited to become a TRIOTAG ${roleLabel} for:
      </p>
      <p style="font-size:18px;font-weight:700;color:#39ff88;margin:0 0 20px;">
        ${tenant?.name ?? "your organization"}${tenant?.code ? ` (${tenant.code})` : ""}
      </p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#c8d6cc;">
        Please verify your email address and activate your TRIOTAG ${roleLabel} account.
      </p>
      <p style="text-align:center;margin:0 0 24px;">
        <a href="${link}" style="display:inline-block;background:#39ff88;color:#04150a;font-weight:700;text-decoration:none;padding:14px 26px;border-radius:10px;">
          VERIFY &amp; ACTIVATE ACCOUNT
        </a>
      </p>
      <p style="font-size:13px;color:#93a596;line-height:1.6;margin:0 0 8px;">
        This verification link is single-use and expires on ${expires}.
      </p>
      <p style="font-size:13px;color:#93a596;line-height:1.6;margin:0;">
        Security notice: this link is bound to ${inv.email}. If you did not expect this invitation, ignore this email — no account will be created.
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1f3d24;color:#6f7d72;font-size:11px;">
      TRIOTAG · triotag.com
    </div>
  </div>
</div>`,
    });

    if (sendError) {
      console.error("resend error", sendError);
      return json({ error: "Super Admin invitation could not be sent." }, 502);
    }

    return json({ success: true });
  } catch (e) {
    console.error("send-tenant-invitation failed", e);
    return json({ error: "Super Admin invitation could not be sent." }, 500);
  }
});
