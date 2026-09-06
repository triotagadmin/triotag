import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Campaign statuses that occupy inventory for a given date range
const BLOCKING_STATUSES = [
  "approved",
  "booked",
  "payment_pending",
  "paid",
  "scheduled",
  "active",
  "live",
];

type Selection = { adSpaceId: string; quantity?: number; adFormat?: string | null };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const overlaps = (aS: string | null, aE: string | null, bS: string | null, bE: string | null) => {
  if (!aS || !aE || !bS || !bE) return true; // unknown dates -> assume conflict-safe overlap
  return new Date(aS) <= new Date(bE) && new Date(bS) <= new Date(aE);
};

const monthlyRate = (row: any): number => {
  const p = row.pricing || {};
  return Number(row.monthly_subscription_fee || p.monthly || p.monthly_rate || p.price || 0);
};

const rowMediaTypes = (row: any): string[] => {
  const arr = Array.isArray(row.media_types) && row.media_types.length ? row.media_types : [row.media_type];
  return arr.filter(Boolean).map((t: string) => String(t).toUpperCase());
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json();
    const mode: "check" | "submit" = body.mode === "submit" ? "submit" : "check";
    const selections: Selection[] = Array.isArray(body.selections) ? body.selections : [];
    const startDate: string | null = body.startDate || null;
    const endDate: string | null = body.endDate || null;
    const mediaTypes: string[] = (body.mediaTypes || []).map((t: string) => String(t).toUpperCase());
    const campaignId: string | null = body.campaignId || null;

    // Advertiser profile is resolved server-side; never trusted from the client
    const { data: profile } = await admin
      .from("brand_advertiser_profiles")
      .select("id, company_name, contact_email, approval_status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) return json({ error: "No brand advertiser profile" }, 403);

    if (!selections.length) return json({ error: "No inventory selected" }, 400);

    const ids = [...new Set(selections.map((s) => s.adSpaceId))];
    const { data: spaces, error: spaceErr } = await admin
      .from("ad_spaces")
      .select(
        "id,title,location,media_type,media_types,pricing,monthly_subscription_fee,total_ad_units,approval_status,availability_status,tenant_id,agent_id,publisher_id"
      )
      .in("id", ids);
    if (spaceErr) throw spaceErr;

    // Existing occupancy for the requested window
    const { data: existingTargets } = await admin
      .from("campaign_ad_space_targets")
      .select("ad_space_id, quantity, brand_campaigns!inner(status,start_date,end_date,id)")
      .in("ad_space_id", ids);

    const booked: Record<string, number> = {};
    for (const t of (existingTargets || []) as any[]) {
      const c = t.brand_campaigns;
      if (!c) continue;
      if (campaignId && c.id === campaignId) continue;
      if (!BLOCKING_STATUSES.includes(String(c.status || "").toLowerCase())) continue;
      if (!overlaps(startDate, endDate, c.start_date, c.end_date)) continue;
      booked[t.ad_space_id] = (booked[t.ad_space_id] || 0) + Number(t.quantity || 1);
    }

    const validated: any[] = [];
    const problems: { adSpaceId: string; title: string; reason: string }[] = [];

    for (const sel of selections) {
      const row = (spaces || []).find((s: any) => s.id === sel.adSpaceId);
      if (!row) {
        problems.push({ adSpaceId: sel.adSpaceId, title: "Unknown listing", reason: "This listing no longer exists." });
        continue;
      }
      const title = row.title || "Listing";
      if (row.approval_status !== "approved") {
        problems.push({ adSpaceId: row.id, title, reason: "Not approved for advertising." });
        continue;
      }
      if ((row.availability_status || "available") !== "available") {
        problems.push({ adSpaceId: row.id, title, reason: "Currently unavailable." });
        continue;
      }
      if (mediaTypes.length && !rowMediaTypes(row).some((t) => mediaTypes.includes(t))) {
        problems.push({ adSpaceId: row.id, title, reason: "Does not match the selected media type." });
        continue;
      }
      const capacity = Number(row.total_ad_units || 0) > 0 ? Number(row.total_ad_units) : null;
      const requested = Math.max(1, Number(sel.quantity || 1));
      const used = booked[row.id] || 0;
      if (capacity !== null && used + requested > capacity) {
        problems.push({
          adSpaceId: row.id,
          title,
          reason: `Only ${Math.max(0, capacity - used)} of ${capacity} unit(s) available for these dates.`,
        });
        continue;
      }
      const rate = monthlyRate(row);
      validated.push({
        ad_space_id: row.id,
        title,
        location: row.location,
        quantity: requested,
        ad_format: sel.adFormat || null,
        unit_rate: rate,
        line_total: rate * requested,
        tenant_id: row.tenant_id,
        agent_id: row.agent_id,
      });
    }

    const estimatedCost = validated.reduce((s, v) => s + Number(v.line_total || 0), 0);

    if (mode === "check") {
      return json({ ok: problems.length === 0, validated, problems, estimatedCost });
    }

    if (problems.length) {
      return json({ ok: false, problems, error: "Some selected inventory is unavailable for these dates." }, 409);
    }

    // ---- Persist the campaign (server-owned fields only) ----
    const payload: Record<string, unknown> = {
      brand_advertiser_id: profile.id,
      campaign_name: String(body.campaignName || "Untitled campaign").slice(0, 160),
      campaign_type: body.campaignType || null,
      media_types: mediaTypes,
      objective: body.objective || null,
      objective_notes: body.objectiveNotes ? String(body.objectiveNotes).slice(0, 2000) : null,
      start_date: startDate,
      end_date: endDate,
      budget: Number(body.budget || 0),
      estimated_cost: estimatedCost,
      audience: body.audience || {},
      creative_mode: body.creativeMode || null,
      creative_requirements: body.creativeRequirements || {},
      creative_set_id: body.creativeSetId || null,
      creative_format: body.creativeFormat || null,
      notes: body.notes ? String(body.notes).slice(0, 4000) : null,
      environments: mediaTypes,
      location_count: validated.length,
      status: "under_review",
      submitted_at: new Date().toISOString(),
      wizard_step: 12,
      draft_state: body.draftState || {},
      updated_at: new Date().toISOString(),
    };

    let campaign: any;
    if (campaignId) {
      const { data: owned } = await admin
        .from("brand_campaigns")
        .select("id")
        .eq("id", campaignId)
        .eq("brand_advertiser_id", profile.id)
        .maybeSingle();
      if (!owned) return json({ error: "Campaign not found" }, 404);
      const { data, error } = await admin
        .from("brand_campaigns")
        .update(payload)
        .eq("id", campaignId)
        .select("*")
        .single();
      if (error) throw error;
      campaign = data;
      await admin.from("campaign_ad_space_targets").delete().eq("campaign_id", campaignId);
    } else {
      const { data, error } = await admin.from("brand_campaigns").insert(payload).select("*").single();
      if (error) throw error;
      campaign = data;
    }

    const { error: targetErr } = await admin.from("campaign_ad_space_targets").insert(
      validated.map((v) => ({
        campaign_id: campaign.id,
        ad_space_id: v.ad_space_id,
        quantity: v.quantity,
        ad_format: v.ad_format,
        unit_rate: v.unit_rate,
      }))
    );
    if (targetErr) throw targetErr;

    // Changelog (best effort)
    await admin.from("brand_campaign_changelog").insert({
      brand_advertiser_id: profile.id,
      campaign_id: campaign.id,
      campaign_name: campaign.campaign_name,
      action: "submitted",
      description: `Campaign proposal requested for ${validated.length} location(s).`,
    }).then(() => {}, () => {});

    // Notify the tenants that own the selected inventory (best effort)
    try {
      const tenantIds = [...new Set(validated.map((v) => v.tenant_id).filter(Boolean))];
      const recipients = new Set<string>();
      if (tenantIds.length) {
        const { data: members } = await admin
          .from("tenant_members")
          .select("user_id, role, status, tenant_id")
          .in("tenant_id", tenantIds as string[]);
        (members || []).forEach((m: any) => {
          if (m.role === "super_admin" && (m.status ?? "active") === "active" && m.user_id) recipients.add(m.user_id);
        });
      }
      const agentIds = validated.map((v) => v.agent_id).filter(Boolean) as string[];
      agentIds.forEach((a) => recipients.add(a));
      if (recipients.size) {
        await admin.from("notifications").insert(
          [...recipients].map((uid) => ({
            user_id: uid,
            title: "New campaign proposal request",
            message: `${profile.company_name || "A brand advertiser"} requested a proposal (${campaign.campaign_ref}) covering ${validated.length} of your location(s).`,
            type: "campaign_request",
          }))
        );
      }
    } catch (e) {
      console.error("notify tenants failed", e);
    }

    return json({
      ok: true,
      campaignId: campaign.id,
      campaignRef: campaign.campaign_ref,
      estimatedCost,
    });
  } catch (err: any) {
    console.error("submit-brand-campaign error", err);
    return json({ error: err?.message || "Unexpected error" }, 500);
  }
});
