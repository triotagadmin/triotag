import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BRAND_NAME } from "@/lib/brand";
import { Navigation } from "@/components/Navigation";
import {
  LayoutDashboard, Users, Megaphone, Briefcase, DollarSign, FileText,
  Bell, Settings, Plus, Link2, TrendingUp, Package, Truck, CheckCircle2,
  Clock, Printer, Menu, X
} from "lucide-react";
import { PrintPartnerClientsContent } from "@/components/print-partner/PrintPartnerClientsContent";
import { PrintPartnerPricingContent } from "@/components/print-partner/PrintPartnerPricingContent";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/print-partner/dashboard" },
  { label: "Clients", icon: Users, path: "/print-partner/clients" },
  { label: "Campaigns", icon: Megaphone, path: "/print-partner/campaigns" },
  { label: "Jobs", icon: Briefcase, path: "/print-partner/jobs" },
  { label: "Pricing", icon: DollarSign, path: "/print-partner/pricing" },
  { label: "Revenue", icon: TrendingUp, path: "/print-partner/revenue" },
  { label: "Files", icon: FileText, path: "/print-partner/files" },
  { label: "Settings", icon: Settings, path: "/print-partner/settings" },
];

const PrintPartnerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeCampaigns: 0,
    pendingPayments: 0,
    inProduction: 0,
    readyForDispatch: 0,
    completedJobs: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id).single();
      if (!roles || roles.role !== "print_partner") { navigate("/dashboard"); return; }

      setUser(session.user);

      // Fetch profile
      const { data: pp } = await supabase
        .from("print_partner_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setProfile(pp);

      if (pp) {
        // Fetch stats
        const [clients, campaigns, jobs] = await Promise.all([
          supabase.from("print_partner_clients").select("id", { count: "exact", head: true }).eq("partner_id", pp.id),
          supabase.from("print_partner_campaigns").select("id, status, payment_status", { count: "exact" }).eq("partner_id", pp.id),
          supabase.from("print_partner_jobs").select("id, status, payment_status, total_value").eq("partner_id", pp.id),
        ]);

        const campaignData = campaigns.data || [];
        const jobData = jobs.data || [];

        setStats({
          totalClients: clients.count || 0,
          activeCampaigns: campaignData.filter((c: any) => !["draft", "completed", "cancelled"].includes(c.status)).length,
          pendingPayments: campaignData.filter((c: any) => c.payment_status === "unpaid").length,
          inProduction: jobData.filter((j: any) => j.status === "in_production").length,
          readyForDispatch: jobData.filter((j: any) => j.status === "ready_for_dispatch").length,
          completedJobs: jobData.filter((j: any) => j.status === "completed").length,
          totalRevenue: jobData.filter((j: any) => j.payment_status === "paid").reduce((s: number, j: any) => s + (j.total_value || 0), 0),
        });
      }

      setLoading(false);
    };
    init();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  // If no profile exists, show onboarding prompt
  if (!profile) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Navigation />
        <div className="container mx-auto px-6 py-20 text-center">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Printer className="h-6 w-6 text-primary" />
                Welcome to Print Partner
              </CardTitle>
              <CardDescription>
                We couldn't find your profile. Please try logging out and signing up again, or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")}>Back to Login</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-muted/30">
      <Navigation />
      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-64px)] glass border-r border-[rgba(255,255,255,0.08)]">
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">Print Partner</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{profile?.company_name || user?.email}</p>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  currentPath === item.path
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile sidebar toggle */}
        <button
          className="lg:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}>
            <aside className="w-64 h-full glass border-r border-[rgba(255,255,255,0.08)]" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-2">
                  <Printer className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm">Print Partner</span>
                </div>
              </div>
              <nav className="p-2 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      currentPath === item.path
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          {currentPath === "/print-partner/clients" ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Clients</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage your franchise listings and branch locations</p>
              </div>
              <PrintPartnerClientsContent userId={user!.id} partnerId={profile.id} />
            </>
          ) : currentPath === "/print-partner/pricing" ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Pricing</h1>
                <p className="text-muted-foreground text-sm mt-1">Set custom material pricing for your print services</p>
              </div>
              <PrintPartnerPricingContent partnerId={profile.id} />
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground text-sm mt-1">Welcome back, {profile?.contact_person || "Partner"}</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                {[
                  { label: "Active Clients", value: stats.totalClients, icon: Users, color: "text-blue-400" },
                  { label: "Active Campaigns", value: stats.activeCampaigns, icon: Megaphone, color: "text-purple-400" },
                  { label: "Pending Payments", value: stats.pendingPayments, icon: Clock, color: "text-yellow-400" },
                  { label: "In Production", value: stats.inProduction, icon: Package, color: "text-orange-400" },
                  { label: "Ready to Dispatch", value: stats.readyForDispatch, icon: Truck, color: "text-cyan-400" },
                  { label: "Completed Jobs", value: stats.completedJobs, icon: CheckCircle2, color: "text-primary" },
                  { label: "Total Revenue", value: `₱${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400" },
                ].map((stat) => (
                  <Card key={stat.label} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-xs text-muted-foreground">{stat.label}</span>
                      </div>
                      <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick actions */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/print-partner/clients")}>
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Add Client</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/print-partner/campaigns")}>
                    <Megaphone className="h-5 w-5" />
                    <span className="text-xs">New Campaign</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/print-partner/campaigns")}>
                    <Link2 className="h-5 w-5" />
                    <span className="text-xs">Checkout Link</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" onClick={() => navigate("/print-partner/jobs")}>
                    <Briefcase className="h-5 w-5" />
                    <span className="text-xs">View Jobs</span>
                  </Button>
                </div>
              </div>

              {/* Recent activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Your latest actions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No recent activity yet. Start by adding a client or creating a campaign.</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PrintPartnerDashboard;
