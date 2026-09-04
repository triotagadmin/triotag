import { supabase } from "@/integrations/supabase/client";

export type Tenant = {
  id: string; code: string; name: string; company_email: string | null;
  contact_name: string | null; contact_phone: string | null; notes: string | null;
  status: string; created_at: string;
};
export type Member = {
  id: string; user_id: string; tenant_id: string; member_role: string;
  status: string; full_name: string | null; email: string | null;
  created_at: string; updated_at: string;
};
export type Invitation = {
  id: string; tenant_id: string; email: string; full_name: string | null;
  invited_role: string; expires_at: string; accepted_at: string | null;
  revoked_at: string | null; created_at: string;
};
export type Space = {
  id: string; title: string; location: string | null; category: string | null;
  approval_status: string; platform_verification_status: string | null;
  platform_review_notes: string | null; platform_verified_at: string | null;
  tenant_id: string | null; agent_id: string | null; total_ad_units: number | null;
  media_types: string[] | null; media_owner_name: string | null;
  media_owner_contact_person: string | null; media_owner_email: string | null;
  media_owner_phone: string | null; contact_verified_at: string | null; created_at: string;
};
export type AuditRow = {
  id: string; action: string; actor_role: string | null; tenant_id: string | null;
  user_id: string | null; record_id: string | null; details: unknown; created_at: string;
};
export type Proposal = {
  id: string; campaign_name: string | null; campaign_type: string | null;
  campaign_pillar: string | null; status: string | null; estimated_price: number | null;
  venue_count: number | null; requester_email: string | null; paid_at: string | null; created_at: string;
};
export type Transaction = {
  id: string; client_name: string | null; client_company: string | null;
  listing_title: string | null; grand_total: number | null; currency: string | null;
  status: string | null; paid_at: string | null; created_at: string;
};

export type PlatformData = {
  tenants: Tenant[]; members: Member[]; invitations: Invitation[];
  spaces: Space[]; logs: AuditRow[]; proposals: Proposal[]; transactions: Transaction[];
};

export const SPACE_COLUMNS =
  "id,title,location,category,approval_status,platform_verification_status,platform_review_notes,platform_verified_at,tenant_id,agent_id,total_ad_units,media_types,media_owner_name,media_owner_contact_person,media_owner_email,media_owner_phone,contact_verified_at,created_at";

export async function loadPlatformData(): Promise<PlatformData> {
  const [t, m, i, s, l, p, c] = await Promise.all([
    supabase.from("tenants").select("*").order("created_at", { ascending: false }),
    supabase.from("tenant_members").select("*").order("created_at", { ascending: false }),
    supabase.from("tenant_invitations").select("*").order("created_at", { ascending: false }),
    supabase.from("ad_spaces").select(SPACE_COLUMNS).order("created_at", { ascending: false }).limit(1000),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("media_plan_requests")
      .select("id,campaign_name,campaign_type,campaign_pillar,status,estimated_price,venue_count,requester_email,paid_at,created_at")
      .order("created_at", { ascending: false }).limit(300),
    supabase.from("client_checkouts")
      .select("id,client_name,client_company,listing_title,grand_total,currency,status,paid_at,created_at")
      .order("created_at", { ascending: false }).limit(300),
  ]);

  return {
    tenants: (t.data as Tenant[]) ?? [],
    members: (m.data as Member[]) ?? [],
    invitations: (i.data as Invitation[]) ?? [],
    spaces: (s.data as unknown as Space[]) ?? [],
    logs: (l.data as AuditRow[]) ?? [],
    proposals: (p.data as Proposal[]) ?? [],
    transactions: (c.data as Transaction[]) ?? [],
  };
}

export const invitationState = (i: Invitation) => {
  if (i.accepted_at) return "active";
  if (i.revoked_at) return "cancelled";
  if (new Date(i.expires_at) < new Date()) return "expired";
  return "pending_verification";
};

export const peso = (n: number | null | undefined) =>
  `₱${Number(n ?? 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
