import { useState } from "react";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, Stat, StatusBadge, Empty } from "./ui";
import { Input } from "@/components/ui/input";

type Mode = "users" | "roles" | "audit" | "settings";

const PERMISSIONS = [
  { role: "Webmaster", tenant: "None (global)", can: "Full platform control: tenants, super admins, agents, all supply, final inventory verification, audit, settings." },
  { role: "Super Admin", tenant: "Exactly one tenant", can: "Manage their own tenant: invite agents, review their tenant's locations and inventory, submit supply for TRIOTAG verification." },
  { role: "Agent", tenant: "Inherited from their tenant", can: "Onboard locations and inventory for their own tenant only. Cannot change their tenant or role." },
];

export default function WebmasterSystem({ mode }: { mode: Mode }) {
  const { data, loading } = usePlatform();
  const { members, tenants, logs, spaces } = data;
  const [search, setSearch] = useState("");
  const tenantName = (id: string | null) => tenants.find((t) => t.id === id)?.name ?? "—";

  if (mode === "users") {
    const rows = members.filter((m) =>
      !search.trim() || `${m.full_name ?? ""} ${m.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <PageHeader title="User Management" subtitle="All tenant-scoped platform accounts." />
        <Input className="mb-4 max-w-sm" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-3">
          {rows.map((m) => (
            <Panel key={m.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{m.full_name || m.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.email} · {m.member_role.replace("_", " ")} · {tenantName(m.tenant_id)}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            </Panel>
          ))}
          {!loading && rows.length === 0 && <Empty>No accounts found.</Empty>}
        </div>
      </div>
    );
  }

  if (mode === "roles") {
    return (
      <div>
        <PageHeader title="Roles & Permissions" subtitle="Roles and tenant scoping are assigned server-side only." />
        <div className="space-y-3">
          {PERMISSIONS.map((p) => (
            <Panel key={p.role}>
              <p className="font-medium text-green-300">{p.role}</p>
              <p className="text-xs text-muted-foreground">Tenant scope: {p.tenant}</p>
              <p className="mt-2 text-sm">{p.can}</p>
            </Panel>
          ))}
          <Panel>
            <p className="text-sm text-muted-foreground">
              Nobody can promote themselves. Roles and tenant assignment are written only by verified server-side actions
              and enforced again by database access rules on every request.
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  if (mode === "audit") {
    const rows = logs.filter((l) => !search.trim() || l.action.toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <PageHeader title="Audit Logs" subtitle="Every privileged action, with actor, role, tenant and timestamp." />
        <Input className="mb-4 max-w-sm" placeholder="Filter by action" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-2">
          {rows.map((l) => (
            <Panel key={l.id}>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-medium text-sm">{l.action}</span>
                <span className="text-muted-foreground">{l.actor_role ?? "—"}</span>
                <span className="text-muted-foreground">{tenantName(l.tenant_id)}</span>
                <span className="text-muted-foreground">target {l.record_id ? `${l.record_id.slice(0, 8)}…` : "—"}</span>
                <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            </Panel>
          ))}
          {!loading && rows.length === 0 && <Empty>No activity recorded yet.</Empty>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Platform Settings" subtitle="Global configuration and platform state." />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Tenants" value={tenants.length} />
        <Stat label="Accounts" value={members.length} />
        <Stat label="Locations" value={spaces.length} />
        <Stat label="Audit entries" value={logs.length} />
      </div>
      <div className="space-y-3">
        <Panel>
          <p className="text-sm font-semibold">Invitations</p>
          <p className="text-xs text-muted-foreground">Single-use links, bound to the invited email address, expiring after 7 days.</p>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Verification email</p>
          <p className="text-xs text-muted-foreground">Sent from noreply@triotag.com through the secure server-side mailer. Keys never reach the browser.</p>
        </Panel>
        <Panel>
          <p className="text-sm font-semibold">Inventory verification chain</p>
          <p className="text-xs text-muted-foreground">Agent submits → tenant Super Admin reviews → TRIOTAG Webmaster gives the final platform decision.</p>
        </Panel>
      </div>
    </div>
  );
}
