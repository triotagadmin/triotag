import {
  LayoutDashboard, Compass, Package, Heart, Megaphone, FileText, CalendarCheck,
  Receipt, BarChart3, Bell, Wrench, CalendarDays,
} from "lucide-react";
import { SidebarFrame, SidebarItem } from "./SidebarFrame";

/**
 * BRAND ADVERTISER navigation — owned exclusively by /brand-advertiser/*.
 * Edit this file only to change Brand Advertiser navigation. No other account
 * type reads this configuration.
 */
const BRAND_ADVERTISER_NAV: SidebarItem[] = [
  { to: "/brand-advertiser/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/brand-advertiser/discover", label: "Discover Inventory", icon: Compass },
  { to: "/brand-advertiser/inventory", label: "Ad Inventory", icon: Package },
  { to: "/brand-advertiser/saved", label: "Saved Inventory", icon: Heart },
  { to: "/brand-advertiser/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/brand-advertiser/proposals", label: "Proposals", icon: FileText },
  { to: "/brand-advertiser/bookings", label: "Bookings", icon: CalendarCheck },
  { to: "/brand-advertiser/transactions", label: "Transactions", icon: Receipt },
  { to: "/brand-advertiser/reports", label: "Campaign Reports", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

const PILLAR_ITEM: Record<string, SidebarItem> = {
  product: { to: "/brand-advertiser/products", label: "Product Campaigns", icon: Package },
  service: { to: "/brand-advertiser/services", label: "Service Campaigns", icon: Wrench },
  event: { to: "/brand-advertiser/events", label: "Event Campaigns", icon: CalendarDays },
};

export default function BrandAdvertiserSidebar({ campaignPillar }: { campaignPillar?: string | null }) {
  const pillar = campaignPillar ? PILLAR_ITEM[campaignPillar] : undefined;
  const items = pillar ? [...BRAND_ADVERTISER_NAV, pillar] : BRAND_ADVERTISER_NAV;
  return <SidebarFrame items={items} settingsPath="/brand-advertiser/settings" />;
}
