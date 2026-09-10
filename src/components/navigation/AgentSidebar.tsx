import {
  LayoutDashboard, Package, Globe, ShieldCheck, Compass, Megaphone, MessageSquare, Bell,
} from "lucide-react";
import { SidebarFrame, SidebarItem } from "./SidebarFrame";

/** AGENT navigation — owned exclusively by agent accounts. */
const AGENT_NAV: SidebarItem[] = [
  { to: "/venue-publishers", label: "Dashboard", icon: LayoutDashboard },
  { to: "/publisher/active", label: "Active Inventory", icon: Package },
  { to: "/venue-inventory", label: "My Ad Spaces", icon: Globe },
  { to: "/agent/verified-venues", label: "Verified Venues", icon: ShieldCheck },
  { to: "/agent/discover-locations", label: "Discover Locations", icon: Compass },
  { to: "/publisher/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export default function AgentSidebar() {
  return <SidebarFrame items={AGENT_NAV} settingsPath="/publisher/settings" />;
}
