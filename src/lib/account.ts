import { supabase } from "@/integrations/supabase/client";

export type AccountRole =
  | "admin"
  | "agent"
  | "print_partner"
  | "talent"
  | "brand_advertiser"
  | "retailer";

export type ResolvedAccount = {
  userId: string | null;
  role: AccountRole | null;
  brandProfileId: string | null;
  needsManualReview: boolean;
};

const EMPTY: ResolvedAccount = { userId: null, role: null, brandProfileId: null, needsManualReview: false };

/**
 * Database-backed identity resolution.
 *
 * The authenticated Supabase user UUID is the ONLY identity anchor: no localStorage,
 * no email lookups, no frontend-generated ids. `resolve_my_account()` is a security
 * definer RPC scoped to auth.uid() that returns the persisted role and, when a role
 * row is missing for an existing account, restores it from the trusted profile
 * relationships (and safely re-links one unambiguous legacy brand profile by email).
 */
export async function resolveAccount(): Promise<ResolvedAccount> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data, error } = await (supabase as any).rpc("resolve_my_account");
  if (!error && Array.isArray(data) && data.length > 0) {
    const row = data[0] as { role: string | null; brand_profile_id: string | null; needs_manual_review: boolean };
    return {
      userId: user.id,
      role: (row.role as AccountRole) ?? null,
      brandProfileId: row.brand_profile_id ?? null,
      needsManualReview: !!row.needs_manual_review,
    };
  }
  if (error) console.error("resolve_my_account failed, falling back to user_roles", error);

  // Fallback: read the persisted role directly (still database-backed).
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .limit(1);
  return {
    userId: user.id,
    role: ((roleRows?.[0]?.role as AccountRole) ?? null),
    brandProfileId: null,
    needsManualReview: false,
  };
}

export const dashboardForRole = (role: AccountRole | null): string => {
  switch (role) {
    case "admin": return "/admin/dashboard";
    case "agent": return "/venue-publishers";
    case "print_partner": return "/print-partner/dashboard";
    case "talent": return "/talent-dashboard";
    case "brand_advertiser": return "/brand-advertiser/dashboard";
    case "retailer": return "/retailer-dashboard";
    default: return "/";
  }
};
