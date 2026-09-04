import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, StatusBadge, Empty } from "./ui";

export default function WebmasterAgents() {
  const { data, loading, reload } = usePlatform();
  const { tenants, members, spaces } = data;
  const [tenantFilter, setTenantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");

  const tenantName = (id: string | null) => tenants.find((t) => t.id === id)?.name ?? "—";
  const superAdmins = members.filter((m) => m.member_role === "super_admin");
  const superAdminOf = (tenantId: string) => superAdmins.find((m) => m.tenant_id === tenantId);

  const agents = members
    .filter((m) => m.member_role === "agent")
    .filter((m) => tenantFilter === "all" || m.tenant_id === tenantFilter)
    .filter((m) => statusFilter === "all" || m.status === statusFilter)
    .filter((m) => adminFilter === "all" || superAdminOf(m.tenant_id)?.id === adminFilter);

  const setStatus = async (id: string, status: "active" | "disabled") => {
    const { error } = await supabase.rpc("webmaster_set_member_status", { _member_id: id, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "Agent reactivated" : "Agent disabled");
    reload();
  };

  return (
    <div>
      <PageHeader title="Agent Accounts" subtitle="Every agent across every tenant. Agents can never change their own tenant." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Tenant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.code} — {t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={adminFilter} onValueChange={setAdminFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Super Admin" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Super Admins</SelectItem>
            {superAdmins.map((m) => <SelectItem key={m.id} value={m.id}>{m.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {agents.map((m) => {
          const owned = spaces.filter((s) => s.agent_id === m.user_id);
          const units = owned.reduce((sum, s) => sum + (Number(s.total_ad_units) || 0), 0);
          return (
            <Panel key={m.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{m.full_name || m.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.email} · {tenantName(m.tenant_id)} · Super Admin: {superAdminOf(m.tenant_id)?.email ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Locations: {owned.length} · Inventory: {units} units · Last activity {new Date(m.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "active"
                    ? <Button size="sm" variant="outline" onClick={() => setStatus(m.id, "disabled")}>Disable</Button>
                    : <Button size="sm" onClick={() => setStatus(m.id, "active")}>Reactivate</Button>}
                </div>
              </div>
            </Panel>
          );
        })}
        {!loading && agents.length === 0 && <Empty>No agents match these filters. Agents are invited by their tenant's Super Admin.</Empty>}
      </div>
    </div>
  );
}
