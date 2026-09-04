import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, StatusBadge, Empty } from "./ui";

export default function WebmasterTenants() {
  const { data, loading, reload } = usePlatform();
  const { tenants, members, spaces, proposals } = data;

  const setStatus = async (id: string, status: "active" | "suspended") => {
    const { error } = await supabase.rpc("webmaster_set_tenant_status", { _tenant_id: id, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "Tenant reactivated" : "Tenant suspended");
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Tenants"
        subtitle="Every advertising company operating on TRIOTAG."
        actions={<Button asChild><Link to="/webmaster/tenants/new">+ Create Tenant</Link></Button>}
      />
      <div className="space-y-3">
        {tenants.map((t) => {
          const sa = members.find((m) => m.tenant_id === t.id && m.member_role === "super_admin");
          const agentCount = members.filter((m) => m.tenant_id === t.id && m.member_role === "agent").length;
          const locations = spaces.filter((s) => s.tenant_id === t.id);
          const units = locations.reduce((sum, s) => sum + (Number(s.total_ad_units) || 0), 0);
          return (
            <Panel key={t.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    <span className="text-green-400">{t.code}</span> · {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.company_email || "No company email"} · Contact: {t.contact_name || "—"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Super Admin: {sa?.email ?? "not assigned"} · Agents: {agentCount} · Locations: {locations.length} ·
                    {" "}Inventory: {units} units · Campaigns: {proposals.length > 0 ? "—" : 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Created {new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={t.status} />
                  <Button size="sm" variant="outline" asChild><Link to={`/webmaster/tenants/${t.id}`}>View</Link></Button>
                  {t.status === "active"
                    ? <Button size="sm" variant="outline" onClick={() => setStatus(t.id, "suspended")}>Suspend</Button>
                    : <Button size="sm" onClick={() => setStatus(t.id, "active")}>Reactivate</Button>}
                </div>
              </div>
            </Panel>
          );
        })}
        {!loading && tenants.length === 0 && <Empty>No tenants yet.</Empty>}
      </div>
    </div>
  );
}
