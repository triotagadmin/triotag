// Global brand configuration
// Change the brand name here to update it across the entire application.

export const BRAND_NAME = "TrioTag";
export const BRAND_TAGLINE = "Micro Advertising.";
export const BRAND_DESCRIPTION = `${BRAND_NAME} is a campaign management platform designed for printing companies to execute, manage, and scale print advertising campaigns across multiple locations.`;
export const BRAND_EMAIL = "tinystickyads@gmail.com";
export const BRAND_PHONE = "+639456640894";

// Display label mapping for user-facing role names
// Database role values remain unchanged (e.g. "advertiser")
export const ROLE_DISPLAY_LABELS: Record<string, string> = {
  advertiser: "Print Partner",
  publisher: "Agent",
  admin: "Admin",
  talent: "Talent",
};

export function getRoleDisplayLabel(role: string): string {
  return ROLE_DISPLAY_LABELS[role] || role;
}
