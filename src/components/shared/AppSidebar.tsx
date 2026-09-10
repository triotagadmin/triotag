/**
 * DEPRECATED shell — kept only as a thin re-export.
 *
 * The old single mutable ROLE_SIDEBAR_ITEMS map lived here and caused
 * cross-account regressions. Each account type now owns an isolated sidebar
 * component in src/components/navigation/:
 *   - SuperAdminSidebar.tsx      (/admin/*)
 *   - AgentSidebar.tsx           (agent accounts)
 *   - BrandAdvertiserSidebar.tsx (/brand-advertiser/*)
 *   - PartnerSidebars.tsx        (print partner / talent / retailer)
 *   - Webmaster navigation lives inside src/pages/webmaster/WebmasterLayout.tsx
 *
 * Do not add navigation items here.
 */
export { AccountSidebarShell as AppSidebarShell } from "@/components/navigation/AccountSidebarShell";
export { default as SuperAdminSidebar } from "@/components/navigation/SuperAdminSidebar";
