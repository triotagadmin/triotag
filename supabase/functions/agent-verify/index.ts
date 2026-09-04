import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const sha256 = async (value: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const token = String(body.token ?? "");
    const mode = String(body.mode ?? "verify"); // "preview" | "verify"
    if (!token || token.length < 32) return json({ error: "This verification link is invalid." }, 400);

    const tokenHash = await sha256(token);
    const { data: inv } = await admin
      .from("tenant_invitations")
      .select("id, tenant_id, email, full_name, first_name, last_name, phone, position, invited_role, expires_at, accepted_at, revoked_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!inv) return json({ error: "This verification link is invalid or has already been used." }, 400);
    if (inv.invited_role !== "agent") return json({ error: "This verification link is invalid." }, 400);
    if (inv.accepted_at) return json({ error: "This invitation has already been used." }, 400);
    if (inv.revoked_at) return json({ error: "This invitation was cancelled." }, 400);
    if (new Date(inv.expires_at).getTime() < Date.now()) {
      return json({ error: "This verification link has expired. Ask your Super Admin to resend it." }, 400);
    }

    const { data: tenant } = await admin.from("tenants").select("name").eq("id", inv.tenant_id).maybeSingle();

    if (mode === "preview") {
      return json({
        email: inv.email,
        name: inv.full_name || inv.email,
        tenant_name: tenant?.name ?? "TrioTag",
        expires_at: inv.expires_at,
      });
    }

    // --- activation requires the invited person to be signed in ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Please sign in to activate your account." }, 401);
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Please sign in to activate your account." }, 401);

    if ((user.email ?? "").toLowerCase() !== inv.email.toLowerCase()) {
      return json({ error: `This invitation is for ${inv.email}. Please sign in with that email address.` }, 403);
    }

    // Role and tenant come exclusively from the invitation record.
    const { data: existing } = await admin
      .from("tenant_members").select("id").eq("user_id", user.id).maybeSingle();

    if (existing) {
      await admin.from("tenant_members").update({
        tenant_id: inv.tenant_id,
        member_role: "agent",
        status: "active",
        removed_at: null,
        full_name: inv.full_name || user.email,
        email: inv.email,
        phone: inv.phone,
        position: inv.position,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await admin.from("tenant_members").insert({
        user_id: user.id,
        tenant_id: inv.tenant_id,
        member_role: "agent",
        status: "active",
        full_name: inv.full_name || user.email,
        email: inv.email,
        phone: inv.phone,
        position: inv.position,
        last_login_at: new Date().toISOString(),
      });
    }

    await admin.from("user_roles").upsert({ user_id: user.id, role: "agent" }, { onConflict: "user_id" });

    await admin.from("tenant_invitations").update({
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
      token_hash: null,
    }).eq("id", inv.id);

    await admin.from("audit_logs").insert([
      {
        user_id: user.id, tenant_id: inv.tenant_id, actor_role: "agent",
        action: "AGENT_EMAIL_VERIFIED", record_id: inv.id, details: { email: inv.email },
      },
      {
        user_id: user.id, tenant_id: inv.tenant_id, actor_role: "agent",
        action: "AGENT_ACTIVATED", record_id: inv.id, details: { email: inv.email },
      },
    ]);

    return json({ success: true, redirect: "/venue-publishers" });
  } catch (e) {
    console.error("agent-verify failed", e);
    return json({ error: "Verification could not be completed." }, 500);
  }
});
