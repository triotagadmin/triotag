// Global brand configuration
// Change the brand name here to update it across the entire application.

export const BRAND_NAME = "Triotag";
export const BRAND_TAGLINE = "Micro Advertising.";
export const BRAND_DESCRIPTION = `${BRAND_NAME} connects brands with curated ad spaces to promote products, services, and events effectively. Our platform makes it easy to distribute campaigns across real-world locations where people naturally gather.`;
export const BRAND_EMAIL = "tinystickyads@gmail.com";
export const BRAND_PHONE = "+639456640894";

// Role display names mapping
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  advertiser: "Brand Advertiser",
  print_partner: "Print Partner",
  publisher: "Agent",
  admin: "Admin",
  talent: "Talent",
};

export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}
