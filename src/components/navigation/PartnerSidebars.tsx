import {
  LayoutDashboard, Globe, Megaphone, BarChart3, MessageSquare, Bell, Package,
} from "lucide-react";
import { SidebarFrame, SidebarItem } from "./SidebarFrame";

/** PRINT PARTNER navigation — isolated. */
const PRINT_PARTNER_NAV: SidebarItem[] = [
  { to: "/print-partner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/print-partner/clients", label: "My Clients", icon: Globe },
  { to: "/print-partner/jobs", label: "Venue Listings", icon: Megaphone },
  { to: "/print-partner/revenue", label: "Earnings", icon: BarChart3 },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function PrintPartnerSidebar() {
  return <SidebarFrame items={PRINT_PARTNER_NAV} settingsPath="/print-partner/settings" />;
}

/** TALENT navigation — isolated. */
const TALENT_NAV: SidebarItem[] = [
  { to: "/talent-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/talent/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function TalentSidebar() {
  return <SidebarFrame items={TALENT_NAV} settingsPath="/talent-profile" />;
}

/** RETAILER (legacy) navigation — isolated. */
const RETAILER_NAV: SidebarItem[] = [
  { to: "/retailer-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/publisher/active", label: "Active Inventory", icon: Package },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export function RetailerSidebar() {
  return <SidebarFrame items={RETAILER_NAV} settingsPath="/advertiser-settings" />;
}
