import { supabase } from "@/integrations/supabase/client";

export type PartnerCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type PartnerTag = {
  id: string;
  category_id: string | null;
  kind: string;
  slug: string;
  name: string;
  sort_order: number;
};

export type PartnerTaxonomy = {
  categories: PartnerCategory[];
  specializations: PartnerTag[];
  capabilities: PartnerTag[];
};

/**
 * Taxonomy is stored in the database so new categories / specializations can be
 * added by admins without any code change.
 */
export async function fetchPartnerTaxonomy(): Promise<PartnerTaxonomy> {
  const [{ data: categories, error: catErr }, { data: tags, error: tagErr }] = await Promise.all([
    supabase
      .from("partner_categories")
      .select("id, slug, name, description, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("partner_specializations")
      .select("id, category_id, kind, slug, name, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (catErr) throw catErr;
  if (tagErr) throw tagErr;

  const all = (tags ?? []) as PartnerTag[];
  return {
    categories: (categories ?? []) as PartnerCategory[],
    specializations: all.filter((t) => t.kind === "specialization"),
    capabilities: all.filter((t) => t.kind === "capability"),
  };
}

export const SERVICE_COVERAGE_OPTIONS = ["Local", "Regional", "Nationwide", "International"];

export const TEAM_SIZE_OPTIONS = ["1-5", "6-20", "21-50", "51-200", "200+"];

export const AVAILABILITY_OPTIONS = [
  "Available for Immediate Projects",
  "Project-based",
  "Full-time",
  "Retainer",
  "Seasonal",
];

export const PORTFOLIO_PLATFORMS = [
  "Website",
  "YouTube",
  "Vimeo",
  "Behance",
  "Instagram",
  "TikTok",
  "Facebook",
  "Google Drive",
  "Dropbox",
  "Custom URL",
];

export const CERTIFICATION_TYPES = [
  "Drone License",
  "Business Permits",
  "Professional Certifications",
  "Industry Memberships",
];

export const SOCIAL_PLATFORMS = ["facebook", "instagram", "linkedin", "tiktok", "youtube", "x"] as const;

export const PARTNER_MEDIA_ACCEPT =
  "image/*,application/pdf,video/mp4,video/quicktime,audio/mpeg,audio/wav,audio/mp4";

export function partnerFileKind(mime: string | null | undefined) {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return "file";
}
