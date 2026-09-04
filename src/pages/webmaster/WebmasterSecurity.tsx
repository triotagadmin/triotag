import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, Stat, Empty } from "./ui";
import { invitationState } from "./platformData";

type Mode = "overview" | "auth-activity" | "access-logs";

export default function WebmasterSecurity({ mode }: { mode: Mode }) {
  const { data, loading } = usePlatform();
  const { members, invitations, logs, tenants } = data;
  const tenantName = (id: string | null) => tenants.find((t) => t.id === id)?.name ?? "—";

  if (mode === "overview") {
    return (
      <div>
        <PageHeader title="Security Overview" subtitle="Platform access posture at a glance." />
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Active accounts" value={members.filter((m) => m.status === "active").length} />
          <Stat label="Disabled accounts" value={members.filter((m) => m.status !== "active").length} />
          <Stat label="Open invitations" value={invitations.filter((i) => invitationState(i) === "pending_verification").length} />
          <Stat label="Expired invitations" value={invitations.filter((i) => invitationState(i) === "expired").length} />
        </div>
        <div className="space-y-3">
          <Panel>
            <p className="text-sm font-semibold">Webmaster access</p>
            <p className="text-xs text-muted-foreground">Locked to a single authorized account. No public registration path exists for this role.</p>
          </Panel>
          <Panel>
            <p className="text-sm font-semibold">Tenant isolation</p>
            <p className="text-xs text-muted-foreground">
              Every tenant record is filtered by the signed-in account's tenant at the database level, so a direct link or API call
              from another tenant is rejected before any data is returned.
            </p>
          </Panel>
          <Panel>
            <p className="text-sm font-semibold">Self-escalation blocked</p>
            <p className="text-xs text-muted-foreground">Accounts cannot set their own role or tenant; both are written only by verified server-side actions.</p>
          </Panel>
        </div>
      </div>
    );
  }

  if (mode === "auth-activity") {
    const rows = logs.filter((l) => /invitation|webmaster|super_admin|agent|role/.test(l.action));
    return (
      <div>
        <PageHeader title="Authentication Activity" subtitle="Invitations, activations and account state changes." />
        <div className="space-y-2">
          {rows.map((l) => (
            <Panel key={l.id}>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-sm font-medium">{l.action}</span>
                <span className="text-muted-foreground">{l.actor_role ?? "—"} · {tenantName(l.tenant_id)}</span>
                <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            </Panel>
          ))}
          {!loading && rows.length === 0 && <Empty>No authentication activity yet.</Empty>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Access Logs" subtitle="Full privileged-action trail across the platform." />
      <div className="space-y-2">
        {logs.map((l) => (
          <Panel key={l.id}>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-sm font-medium">{l.action}</span>
              <span className="text-muted-foreground">actor {l.user_id ? `${l.user_id.slice(0, 8)}…` : "—"} ({l.actor_role ?? "—"})</span>
              <span className="text-muted-foreground">{tenantName(l.tenant_id)}</span>
              <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
            </div>
          </Panel>
        ))}
        {!loading && logs.length === 0 && <Empty>No access events recorded yet.</Empty>}
      </div>
    </div>
  );
}
