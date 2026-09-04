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

const INVITE_TTL_HOURS = 168; // 7 days
const MAX_SENDS_PER_HOUR = 5;

const sha256 = async (value: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const newToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

const siteFrom = (raw: unknown) =>
  typeof raw === "string" && raw.startsWith("https://") ? raw.replace(/\/$/, "") : "https://triotag.com";

const inviteHtml = (opts: {
  name: string; tenantName: string; inviterName: string; link: string; expires: string; email: string;
}) => `
<div style="background:#0c0c0c;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #1f3d24;border-radius:14px;overflow:hidden;">
    <div style="padding:24px 28px;border-bottom:1px solid #1f3d24;">
      <span style="color:#39ff88;font-size:22px;font-weight:800;letter-spacing:1px;">TRIOTAG</span>
      <span style="color:#7b8b7f;font-size:12px;margin-left:8px;">AGENT ACCESS</span>
    </div>
    <div style="padding:28px;color:#e6f2e9;">
      <p style="font-size:16px;margin:0 0 16px;">Hello ${opts.name},</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
        You have been invited to join TRIOTAG as an Agent by ${opts.inviterName}.
      </p>
      <p style="font-size:18px;font-weight:700;color:#39ff88;margin:0 0 20px;">${opts.tenantName}</p>
      <p style="font-size:15px;line-height:1.6;margin:0 0 24px;color:#c8d6cc;">
        Your Agent account is ready for verification.
      </p>
      <p style="text-align:center;margin:0 0 20px;">
        <a href="${opts.link}" style="display:inline-block;background:#39ff88;color:#04150a;font-weight:700;text-decoration:none;padding:14px 26px;border-radius:10px;">
          VERIFY &amp; ACTIVATE ACCOUNT
        </a>
      </p>
      <p style="font-size:12px;color:#93a596;line-height:1.6;margin:0 0 16px;word-break:break-all;">
        If the button does not work, paste this link into your browser:<br/>${opts.link}
      </p>
      <p style="font-size:13px;color:#93a596;line-height:1.6;margin:0 0 8px;">
        This verification link is single-use and expires on ${opts.expires}.
      </p>
      <p style="font-size:13px;color:#93a596;line-height:1.6;margin:0;">
        It is bound to ${opts.email}. If you did not expect this invitation, ignore this email — no account will be created.
      </p>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #1f3d24;color:#6f7d72;font-size:11px;">
      TRIOTAG · triotag.com
    </div>
  </div>
</div>`;

Deno.serve(async (req) => {
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

    const { data: member } = await admin
      .from("tenant_members")
      .select("tenant_id, member_role, status, full_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!(member?.member_role === "super_admin" && member.status === "active")) {
      return json({ error: "Not authorized" }, 403);
    }
    const tenantId = member.tenant_id as string;

    const { data: tenant } = await admin.from("tenants").select("name, code").eq("id", tenantId).maybeSingle();
    const tenantName = tenant?.name ?? "your organization";

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    const audit = async (act: string, recordId: string | null, details: Record<string, unknown>) => {
      await admin.from("audit_logs").insert({
        user_id: user.id,
        tenant_id: tenantId,
        actor_role: "super_admin",
        action: act,
        record_id: recordId,
        details,
      });
    };

    // ---------- LIST ----------
    if (action === "list") {
      const [{ data: members }, { data: invites }] = await Promise.all([
        admin.from("tenant_members")
          .select("id, user_id, full_name, email, status, phone, position, created_at, last_login_at, removed_at")
          .eq("tenant_id", tenantId).eq("member_role", "agent")
          .order("created_at", { ascending: false }),
        admin.from("tenant_invitations")
          .select("id, email, first_name, last_name, full_name, phone, position, expires_at, accepted_at, revoked_at, created_at, last_sent_at, send_count")
          .eq("tenant_id", tenantId).eq("invited_role", "agent")
          .order("created_at", { ascending: false }),
      ]);

      // Enrich last login from auth admin API
      const enriched = await Promise.all((members ?? []).map(async (m: any) => {
        let lastLogin = m.last_login_at as string | null;
        try {
          const { data } = await admin.auth.admin.getUserById(m.user_id);
          lastLogin = data?.user?.last_sign_in_at ?? lastLogin;
        } catch (_) { /* non-fatal */ }
        return {
          kind: "member" as const,
          id: m.id,
          user_id: m.user_id,
          name: m.full_name || m.email,
          email: m.email,
          phone: m.phone,
          position: m.position,
          status: m.status === "active" ? "ACTIVE" : m.status === "suspended" ? "SUSPENDED" : "REMOVED",
          invited_at: m.created_at,
          last_login: lastLogin,
        };
      }));

      const acceptedEmails = new Set(enriched.map((a) => (a.email ?? "").toLowerCase()));
      const pending = (invites ?? [])
        .filter((i: any) => !i.accepted_at && !acceptedEmails.has((i.email ?? "").toLowerCase()))
        .map((i: any) => ({
          kind: "invitation" as const,
          id: i.id,
          user_id: null,
          name: [i.first_name, i.last_name].filter(Boolean).join(" ") || i.full_name || i.email,
          email: i.email,
          phone: i.phone,
          position: i.position,
          status: i.revoked_at
            ? "CANCELLED"
            : new Date(i.expires_at).getTime() < Date.now()
              ? "EXPIRED"
              : "PENDING VERIFICATION",
          invited_at: i.created_at,
          last_login: null,
          last_sent_at: i.last_sent_at,
          send_count: i.send_count,
        }));

      return json({ tenant: { id: tenantId, name: tenantName }, agents: [...enriched, ...pending] });
    }

    // ---------- CREATE ----------
    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const firstName = String(body.first_name ?? "").trim();
      const lastName = String(body.last_name ?? "").trim();
      const phone = body.phone ? String(body.phone).trim() : null;
      const position = body.position ? String(body.position).trim() : null;

      if (!emailValid(email)) return json({ error: "Please enter a valid email address." }, 400);
      if (!firstName) return json({ error: "First name is required." }, 400);

      const { data: existingMember } = await admin
        .from("tenant_members").select("id, status, tenant_id")
        .eq("email", email).maybeSingle();
      if (existingMember && existingMember.status !== "removed") {
        return json({ error: "An account already exists for this email address." }, 409);
      }

      const { data: existingInvite } = await admin
        .from("tenant_invitations")
        .select("id, accepted_at, revoked_at, expires_at")
        .eq("email", email).eq("tenant_id", tenantId).eq("invited_role", "agent")
        .is("accepted_at", null).is("revoked_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (existingInvite) {
        return json({ error: "A pending invitation already exists for this email. Use Resend Verification instead." }, 409);
      }

      // Rate limit: max 10 new agent invitations per tenant per hour
      const hourAgo = new Date(Date.now() - 3600_000).toISOString();
      const { count } = await admin
        .from("tenant_invitations").select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId).eq("invited_role", "agent").gte("created_at", hourAgo);
      if ((count ?? 0) >= 10) return json({ error: "Too many invitations created recently. Please try again later." }, 429);

      const token = newToken();
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 3600_000).toISOString();
      const fullName = [firstName, lastName].filter(Boolean).join(" ");

      const { data: inv, error: insertError } = await admin
        .from("tenant_invitations")
        .insert({
          tenant_id: tenantId,
          email,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName || null,
          phone,
          position,
          invited_role: "agent",
          token: crypto.randomUUID(), // legacy column stays unusable for agent invites
          token_hash: tokenHash,
          invited_by: user.id,
          expires_at: expiresAt,
          last_sent_at: new Date().toISOString(),
          send_count: 1,
        })
        .select("id")
        .single();
      if (insertError) return json({ error: insertError.message }, 400);

      await audit("AGENT_INVITED", inv.id, { email, tenant_id: tenantId });

      const link = `${siteFrom(body.site_url)}/verify/agent?token=${token}`;
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const { error: sendError } = await resend.emails.send({
        from: "TrioTag <noreply@triotag.com>",
        to: [email],
        subject: "Your TRIOTAG Agent Account Requires Verification",
        html: inviteHtml({
          name: fullName || email,
          tenantName,
          inviterName: member.full_name || member.email || tenantName,
          link,
          expires: new Date(expiresAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
          email,
        }),
      });
      if (sendError) {
        console.error("resend error", sendError);
        await audit("AGENT_VERIFICATION_FAILED", inv.id, { email, error: String(sendError) });
        return json({ error: "The invitation was created but the email could not be sent. Use Resend Verification to try again." }, 502);
      }

      await audit("AGENT_VERIFICATION_SENT", inv.id, { email });
      return json({ success: true, invitation_id: inv.id });
    }

    // ---------- RESEND ----------
    if (action === "resend") {
      const invitationId = String(body.invitation_id ?? "");
      const { data: inv } = await admin
        .from("tenant_invitations")
        .select("id, tenant_id, email, full_name, invited_role, accepted_at, revoked_at, send_count, last_sent_at")
        .eq("id", invitationId).maybeSingle();
      if (!inv || inv.tenant_id !== tenantId || inv.invited_role !== "agent") return json({ error: "Not authorized" }, 403);
      if (inv.accepted_at) return json({ error: "This agent is already verified." }, 400);
      if (inv.revoked_at) return json({ error: "This invitation was cancelled." }, 400);

      const hourAgo = Date.now() - 3600_000;
      const { data: recent } = await admin
        .from("tenant_invitations").select("send_count, last_sent_at").eq("id", inv.id).single();
      if (recent?.last_sent_at && new Date(recent.last_sent_at).getTime() > hourAgo && (recent.send_count ?? 0) >= MAX_SENDS_PER_HOUR) {
        return json({ error: "Too many verification emails sent recently. Please wait before retrying." }, 429);
      }

      const token = newToken();
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 3600_000).toISOString();

      // Issuing a new hash immediately invalidates the previous token.
      await admin.from("tenant_invitations").update({
        token_hash: tokenHash,
        expires_at: expiresAt,
        last_sent_at: new Date().toISOString(),
        send_count: (recent?.send_count ?? 0) + 1,
      }).eq("id", inv.id);

      const link = `${siteFrom(body.site_url)}/verify/agent?token=${token}`;
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      const { error: sendError } = await resend.emails.send({
        from: "TrioTag <noreply@triotag.com>",
        to: [inv.email],
        subject: "Your TRIOTAG Agent Account Requires Verification",
        html: inviteHtml({
          name: inv.full_name || inv.email,
          tenantName,
          inviterName: member.full_name || member.email || tenantName,
          link,
          expires: new Date(expiresAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }),
          email: inv.email,
        }),
      });
      if (sendError) {
        console.error("resend error", sendError);
        await audit("AGENT_VERIFICATION_FAILED", inv.id, { email: inv.email, error: String(sendError) });
        return json({ error: "Verification email could not be sent. The agent stays pending — please retry." }, 502);
      }

      await audit("AGENT_VERIFICATION_RESENT", inv.id, { email: inv.email });
      return json({ success: true });
    }

    // ---------- STATUS CHANGES ----------
    if (action === "suspend" || action === "reactivate" || action === "remove") {
      const memberId = String(body.member_id ?? "");
      const { data: target } = await admin
        .from("tenant_members").select("id, tenant_id, member_role, email, user_id")
        .eq("id", memberId).maybeSingle();
      if (!target || target.tenant_id !== tenantId || target.member_role !== "agent") {
        return json({ error: "Not authorized" }, 403);
      }

      const status = action === "suspend" ? "suspended" : action === "remove" ? "removed" : "active";
      const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      patch.removed_at = action === "remove" ? new Date().toISOString() : null;

      const { error } = await admin.from("tenant_members").update(patch).eq("id", target.id);
      if (error) return json({ error: error.message }, 400);

      const act = action === "suspend" ? "AGENT_SUSPENDED" : action === "remove" ? "AGENT_REMOVED" : "AGENT_REACTIVATED";
      await audit(act, target.id, { email: target.email, user_id: target.user_id });
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("agent-manage failed", e);
    return json({ error: "Agent action could not be completed." }, 500);
  }
});
