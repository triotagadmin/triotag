import { Link } from "react-router-dom";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Stat, Panel, StatusBadge, Empty } from "./ui";
import { peso } from "./platformData";
import { Button } from "@/components/ui/button";

export default function WebmasterOverview() {
  const { data, loading } = usePlatform();
  const { tenants, members, spaces, proposals, transactions, logs } = data;

  const superAdmins = members.filter((m) => m.member_role === "super_admin");
  const agents = members.filter((m) => m.member_role === "agent");
  const mediaOwners = new Set(spaces.map((s) => (s.media_owner_name || "").trim()).filter(Boolean));
  const totalUnits = spaces.reduce((sum, s) => sum + (Number(s.total_ad_units) || 0), 0);
  const pendingVerification = spaces.filter(
    (s) => (s.platform_verification_status ?? "pending") === "pending",
  ).length;
  const activeCampaigns = proposals.filter((p) => (p.status ?? "") !== "cancelled" && (p.status ?? "") !== "rejected").length;
  const revenue = transactions
    .filter((t) => t.status === "paid" || !!t.paid_at)
    .reduce((sum, t) => sum + (Number(t.grand_total) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Command Center"
        subtitle="Live platform-wide state across every TRIOTAG tenant."
        actions={<Button asChild><Link to="/webmaster/tenants/new">+ Create Tenant</Link></Button>}
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total Tenants" value={tenants.length} />
        <Stat label="Active Tenants" value={tenants.filter((t) => t.status === "active").length} />
        <Stat label="Suspended Tenants" value={tenants.filter((t) => t.status === "suspended").length} />
        <Stat label="Super Admins" value={superAdmins.length} />
        <Stat label="Agents" value={agents.length} />
        <Stat label="Media Owners" value={mediaOwners.size} />
        <Stat label="Locations" value={spaces.length} />
        <Stat label="Total Inventory" value={totalUnits} hint="ad units across all tenants" />
        <Stat label="Pending Verification" value={pendingVerification} />
        <Stat label="Active Campaigns" value={activeCampaigns} />
        <Stat label="Transactions" value={transactions.length} />
        <Stat label="Platform Revenue" value={peso(revenue)} hint="settled payments" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <p className="mb-3 text-sm font-semibold">Tenants</p>
          <div className="space-y-2">
            {tenants.slice(0, 6).map((t) => (
              <Link key={t.id} to={`/webmaster/tenants/${t.id}`} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm hover:border-green-500/40">
                <span><span className="text-green-400">{t.code}</span> · {t.name}</span>
                <StatusBadge status={t.status} />
              </Link>
            ))}
            {!loading && tenants.length === 0 && <Empty>No tenants yet — create your first tenant to start onboarding agencies.</Empty>}
          </div>
        </Panel>

        <Panel>
          <p className="mb-3 text-sm font-semibold">Recent platform activity</p>
          <div className="space-y-2">
            {logs.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs">
                <span className="font-medium">{l.action}</span>
                <span className="text-muted-foreground">{l.actor_role ?? "—"}</span>
                <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
            {!loading && logs.length === 0 && <Empty>No recorded activity yet.</Empty>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
