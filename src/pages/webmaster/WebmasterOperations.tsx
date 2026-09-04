import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, Stat, StatusBadge, Empty } from "./ui";
import { peso } from "./platformData";

type Mode = "campaigns" | "proposals" | "transactions" | "commissions" | "reports";

export default function WebmasterOperations({ mode }: { mode: Mode }) {
  const { data, loading } = usePlatform();
  const { proposals, transactions, tenants, spaces, members } = data;

  const settled = transactions.filter((t) => t.status === "paid" || !!t.paid_at);
  const revenue = settled.reduce((sum, t) => sum + (Number(t.grand_total) || 0), 0);

  if (mode === "campaigns" || mode === "proposals") {
    const isCampaigns = mode === "campaigns";
    const rows = isCampaigns ? proposals.filter((p) => !!p.paid_at || p.status === "approved") : proposals;
    return (
      <div>
        <PageHeader
          title={isCampaigns ? "Campaigns" : "Proposals"}
          subtitle={isCampaigns ? "Approved and running campaign activity across the platform." : "Every campaign request submitted to TRIOTAG."}
        />
        <div className="space-y-3">
          {rows.map((p) => (
            <Panel key={p.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{p.campaign_name || "Untitled campaign"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.campaign_pillar || p.campaign_type || "—"} · {p.requester_email || "no requester"} ·
                    {" "}{p.venue_count ?? 0} locations · {peso(p.estimated_price)} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            </Panel>
          ))}
          {!loading && rows.length === 0 && <Empty>Nothing here yet.</Empty>}
        </div>
      </div>
    );
  }

  if (mode === "transactions") {
    return (
      <div>
        <PageHeader title="Transactions" subtitle="Platform payment activity." />
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Transactions" value={transactions.length} />
          <Stat label="Settled" value={settled.length} />
          <Stat label="Platform revenue" value={peso(revenue)} />
          <Stat label="Average value" value={peso(settled.length ? revenue / settled.length : 0)} />
        </div>
        <div className="space-y-3">
          {transactions.map((t) => (
            <Panel key={t.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{t.client_company || t.client_name || "Client"}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.listing_title || "—"} · {peso(t.grand_total)} {t.currency ?? ""} · {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </Panel>
          ))}
          {!loading && transactions.length === 0 && <Empty>No transactions recorded yet.</Empty>}
        </div>
      </div>
    );
  }

  if (mode === "commissions") {
    return (
      <div>
        <PageHeader title="Commissions" subtitle="Tenant share of settled platform revenue." />
        <div className="space-y-3">
          {tenants.map((t) => {
            const tenantSpaces = spaces.filter((s) => s.tenant_id === t.id).length;
            const share = spaces.length ? tenantSpaces / spaces.length : 0;
            return (
              <Panel key={t.id}>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium">{t.code} · {t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Supply share: {(share * 100).toFixed(1)}% · Locations: {tenantSpaces}
                    </p>
                  </div>
                  <p className="text-green-300">{peso(revenue * share)}</p>
                </div>
              </Panel>
            );
          })}
          {!loading && tenants.length === 0 && <Empty>Commissions appear once tenants carry supply and settled revenue.</Empty>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Platform roll-up across tenants, supply and revenue." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Tenants" value={tenants.length} />
        <Stat label="Members" value={members.length} />
        <Stat label="Locations" value={spaces.length} />
        <Stat label="Ad units" value={spaces.reduce((s, x) => s + (Number(x.total_ad_units) || 0), 0)} />
        <Stat label="Proposals" value={proposals.length} />
        <Stat label="Transactions" value={transactions.length} />
        <Stat label="Revenue" value={peso(revenue)} />
        <Stat label="Approved supply" value={spaces.filter((s) => s.platform_verification_status === "approved").length} />
      </div>
      <Panel className="mt-4">
        <p className="mb-3 text-sm font-semibold">Per-tenant breakdown</p>
        <div className="space-y-2 text-sm">
          {tenants.map((t) => (
            <div key={t.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
              <span>{t.code} · {t.name}</span>
              <span className="text-xs text-muted-foreground">
                Agents {members.filter((m) => m.tenant_id === t.id && m.member_role === "agent").length} ·
                {" "}Locations {spaces.filter((s) => s.tenant_id === t.id).length} ·
                {" "}Units {spaces.filter((s) => s.tenant_id === t.id).reduce((sum, s) => sum + (Number(s.total_ad_units) || 0), 0)}
              </span>
            </div>
          ))}
          {!loading && tenants.length === 0 && <Empty>No tenants to report on yet.</Empty>}
        </div>
      </Panel>
    </div>
  );
}
