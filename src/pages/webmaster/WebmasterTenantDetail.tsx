import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, Stat, StatusBadge, Empty } from "./ui";
import { peso } from "./platformData";

export default function WebmasterTenantDetail() {
  const { tenantId = "" } = useParams();
  const { data, loading, reload } = usePlatform();
  const tenant = data.tenants.find((t) => t.id === tenantId);
  const members = data.members.filter((m) => m.tenant_id === tenantId);
  const spaces = data.spaces.filter((s) => s.tenant_id === tenantId);
  const logs = data.logs.filter((l) => l.tenant_id === tenantId);
  const superAdmin = members.find((m) => m.member_role === "super_admin");
  const agents = members.filter((m) => m.member_role === "agent");
  const owners = [...new Set(spaces.map((s) => (s.media_owner_name || "").trim()).filter(Boolean))];
  const [edit, setEdit] = useState({ company_email: "", contact_name: "", contact_phone: "" });
  const [editing, setEditing] = useState(false);

  if (!tenant) {
    return (
      <div>
        <PageHeader title="Tenant" />
        {!loading && <Empty>This tenant no longer exists. <Link className="text-green-400" to="/webmaster/tenants">Back to tenants</Link></Empty>}
      </div>
    );
  }

  const startEdit = () => {
    setEdit({
      company_email: tenant.company_email ?? "",
      contact_name: tenant.contact_name ?? "",
      contact_phone: tenant.contact_phone ?? "",
    });
    setEditing(true);
  };

  const save = async () => {
    const { error } = await supabase.from("tenants").update(edit).eq("id", tenant.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Tenant updated");
    setEditing(false);
    reload();
  };

  const setStatus = async (status: "active" | "suspended") => {
    const { error } = await supabase.rpc("webmaster_set_tenant_status", { _tenant_id: tenant.id, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "Tenant reactivated" : "Tenant suspended");
    reload();
  };

  const units = spaces.reduce((sum, s) => sum + (Number(s.total_ad_units) || 0), 0);

  return (
    <div>
      <PageHeader
        scope={`TENANT ${tenant.code}`}
        title={tenant.name}
        subtitle={`${tenant.company_email || "No company email"} · created ${new Date(tenant.created_at).toLocaleDateString()}`}
        actions={
          <>
            <StatusBadge status={tenant.status} />
            <Button size="sm" variant="outline" onClick={startEdit}>Edit</Button>
            {tenant.status === "active"
              ? <Button size="sm" variant="outline" onClick={() => setStatus("suspended")}>Suspend</Button>
              : <Button size="sm" onClick={() => setStatus("active")}>Reactivate</Button>}
          </>
        }
      />

      {editing && (
        <Panel className="mb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Company email</Label><Input value={edit.company_email} onChange={(e) => setEdit({ ...edit, company_email: e.target.value })} /></div>
            <div><Label>Contact name</Label><Input value={edit.contact_name} onChange={(e) => setEdit({ ...edit, contact_name: e.target.value })} /></div>
            <div><Label>Contact phone</Label><Input value={edit.contact_phone} onChange={(e) => setEdit({ ...edit, contact_phone: e.target.value })} /></div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={save}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </Panel>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Agents" value={agents.length} />
        <Stat label="Media owners" value={owners.length} />
        <Stat label="Locations" value={spaces.length} />
        <Stat label="Ad units" value={units} />
      </div>

      <Tabs defaultValue="team">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="owners">Media Owners</TabsTrigger>
          <TabsTrigger value="locations">Locations & Inventory</TabsTrigger>
          <TabsTrigger value="operations">Campaigns & Transactions</TabsTrigger>
          <TabsTrigger value="activity">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-2">
          <Panel>
            <p className="text-sm font-semibold">Super Admin</p>
            <p className="text-xs text-muted-foreground">{superAdmin ? `${superAdmin.full_name || superAdmin.email} · ${superAdmin.email} · ${superAdmin.status}` : "Not assigned yet"}</p>
          </Panel>
          {agents.map((a) => (
            <Panel key={a.id}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{a.full_name || a.email} <span className="text-xs text-muted-foreground">· {a.email}</span></span>
                <StatusBadge status={a.status} />
              </div>
            </Panel>
          ))}
          {agents.length === 0 && <Empty>No agents in this tenant yet — its Super Admin invites them.</Empty>}
        </TabsContent>

        <TabsContent value="owners" className="space-y-2">
          {owners.map((o) => (
            <Panel key={o}>
              <p className="text-sm">{o}</p>
              <p className="text-xs text-muted-foreground">{spaces.filter((s) => s.media_owner_name === o).length} locations</p>
            </Panel>
          ))}
          {owners.length === 0 && <Empty>No media owner records for this tenant.</Empty>}
        </TabsContent>

        <TabsContent value="locations" className="space-y-2">
          {spaces.map((s) => (
            <Panel key={s.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.location || "No address"} · {(s.media_types ?? []).join(", ") || s.category || "—"} · {s.total_ad_units ?? 0} units
                  </p>
                </div>
                <StatusBadge status={s.platform_verification_status ?? "pending"} />
              </div>
            </Panel>
          ))}
          {spaces.length === 0 && <Empty>No locations onboarded by this tenant yet.</Empty>}
        </TabsContent>

        <TabsContent value="operations" className="space-y-2">
          {data.proposals.slice(0, 20).map((p) => (
            <Panel key={p.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{p.campaign_name || "Untitled campaign"} <span className="text-xs text-muted-foreground">· {peso(p.estimated_price)}</span></span>
                <StatusBadge status={p.status} />
              </div>
            </Panel>
          ))}
          {data.proposals.length === 0 && <Empty>No campaign activity yet.</Empty>}
        </TabsContent>

        <TabsContent value="activity" className="space-y-2">
          {logs.map((l) => (
            <Panel key={l.id}>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-sm font-medium">{l.action}</span>
                <span className="text-muted-foreground">{l.actor_role ?? "—"}</span>
                <span className="ml-auto text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            </Panel>
          ))}
          {logs.length === 0 && <Empty>No recorded activity for this tenant.</Empty>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
