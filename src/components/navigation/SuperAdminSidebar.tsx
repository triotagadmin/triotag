import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, UsersRound, Layers, ClipboardList, Package, Megaphone,
  QrCode, Smartphone, BarChart3, Users, MessageSquare, Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarFrame, SidebarItem } from "./SidebarFrame";

/**
 * SUPER ADMIN / ADMIN navigation — owned exclusively by /admin/*.
 * Edit this file only to change Super Admin navigation.
 */
const buildAdminNav = (isSuperAdmin: boolean, pendingInventory: number): SidebarItem[] => {
  const nav: SidebarItem[] = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];
  if (isSuperAdmin) nav.push({ to: "/admin/agents", label: "Agent Center", icon: UsersRound });
  nav.push(
    { to: "/admin/verified-locations", label: "SSP (Supply)", icon: Layers },
    { to: "/admin/media-plans", label: "Media Request", icon: ClipboardList },
    { to: "/admin/total-inventory", label: "Total Inventory", icon: Package, badgeCount: pendingInventory },
    { to: "/admin/brand-campaigns", label: "Active Campaigns", icon: Megaphone },
    {
      to: "/admin/qr-codes", label: "All QR Codes", icon: QrCode, children: [
        { to: "/admin/mobile-qr", label: "Mobile QR", icon: Smartphone },
        { to: "/admin/qr-analytics", label: "QR Analytics", icon: BarChart3 },
        { to: "/admin/mobile-leads", label: "Mobile Leads", icon: Users },
      ],
    },
    { to: "/messages", label: "Messages", icon: MessageSquare },
    { to: "/notifications", label: "Notifications", icon: Bell },
  );
  return nav;
};

export default function SuperAdminSidebar() {
  const { pathname } = useLocation();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("tenant_members")
        .select("member_role, status")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!cancelled) setIsSuperAdmin(data?.member_role === "super_admin" && data?.status === "active");
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchPending = async () => {
      const { count } = await supabase
        .from("ad_spaces")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "pending");
      if (!cancelled) setPendingCount(count || 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [pathname]);

  return <SidebarFrame items={buildAdminNav(isSuperAdmin, pendingCount)} settingsPath="/admin/dashboard" />;
}
