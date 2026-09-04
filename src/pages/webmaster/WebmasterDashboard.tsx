import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Copy, LogOut, Users, MapPin, ScrollText } from "lucide-react";

type Tenant = {
  id: string; code: string; name: string; company_email: string | null;
  contact_name: string | null; contact_phone: string | null; status: string; created_at: string;
};
type Member = {
  id: string; user_id: string; tenant_id: string; member_role: string;
  status: string; full_name: string | null; email: string | null; created_at: string;
};
type Invitation = {
  id: string; tenant_id: string; email: string; invited_role: string;
  token: string; expires_at: string; accepted_at: string | null; revoked_at: string | null;
};
type Space = {
  id: string; title: string; location: string | null; approval_status: string;
  tenant_id: string | null; agent_id: string | null; total_ad_units: number | null;
  media_owner_name: string | null; created_at: string;
};
type AuditRow = {
  id: string; action: string; actor_role: string | null; tenant_id: string | null;
  details: unknown; created_at: string;
};

export default function WebmasterDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [tenantForm, setTenantForm] = useState({ name: "", company_email: "", contact_name: "", contact_phone: "", notes: "" });
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "super_admin", tenant_id: "" });
  const [tenantOpen, setTenantOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [t, m, i, s, l] = await Promise.all([
      supabase.from("tenants").select("*").order("created_at", { ascending: false }),
      supabase.from("tenant_members").select("*").order("created_at", { ascending: false }),
      supabase.from("tenant_invitations").select("*").order("created_at", { ascending: false }),
      supabase.from("ad_spaces").select("id,title,location,approval_status,tenant_id,agent_id,total_ad_units,media_owner_name,created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setTenants((t.data as Tenant[]) ?? []);
    setMembers((m.data as Member[]) ?? []);
    setInvites((i.data as Invitation[]) ?? []);
    setSpaces((s.data as Space[]) ?? []);
    setLogs((l.data as AuditRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const tenantName = (id: string | null) => tenants.find((t) => t.id === id)?.name ?? "—";

  const createTenant = async () => {
    if (!tenantForm.name.trim()) { toast.error("Tenant name is required"); return; }
    const { error } = await supabase.rpc("create_tenant", {
      _name: tenantForm.name,
      _company_email: tenantForm.company_email || null,
      _contact_name: tenantForm.contact_name || null,
      _contact_phone: tenantForm.contact_phone || null,
      _notes: tenantForm.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Tenant created");
    setTenantForm({ name: "", company_email: "", contact_name: "", contact_phone: "", notes: "" });
    setTenantOpen(false);
    load();
  };

  const sendInvite = async () => {
    if (!inviteForm.email.trim() || !inviteForm.tenant_id) { toast.error("Email and tenant are required"); return; }
    const { data, error } = await supabase.rpc("invite_member", {
      _email: inviteForm.email,
      _role: inviteForm.role,
      _tenant_id: inviteForm.tenant_id,
      _full_name: inviteForm.full_name || null,
    });
    if (error) { toast.error(error.message); return; }
    const token = (data as { token: string }[] | null)?.[0]?.token;
    if (token) copyLink(token);
    toast.success("Invitation created — link copied");
    setInviteForm({ email: "", full_name: "", role: "super_admin", tenant_id: "" });
    setInviteOpen(false);
    load();
  };

  const copyLink = (token: string) => {
    navigator.clipboard?.writeText(`${window.location.origin}/invite/${token}`);
    toast.success("Invitation link copied");
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate("/webmaster", { replace: true }); };

  const superAdmins = members.filter((m) => m.member_role === "super_admin");
  const agents = members.filter((m) => m.member_role === "agent");

  const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
    <Card className="border-green-500/20 bg-black/40">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-foreground p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Webmaster Command Center</h1>
          <p className="text-sm text-muted-foreground">Global platform control across every tenant.</p>
        </div>
        <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign out</Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={<Building2 className="w-5 h-5" />} label="Tenants" value={tenants.length} />
        <Stat icon={<Users className="w-5 h-5" />} label="Super Admins" value={superAdmins.length} />
        <Stat icon={<Users className="w-5 h-5" />} label="Agents" value={agents.length} />
        <Stat icon={<MapPin className="w-5 h-5" />} label="Locations" value={spaces.length} />
      </div>

      <Tabs defaultValue="tenants">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="super_admins">Super Admins</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="invites">Invitations</TabsTrigger>
          <TabsTrigger value="inventory">Locations &amp; Inventory</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-3">
          <div className="flex gap-2">
            <Dialog open={tenantOpen} onOpenChange={setTenantOpen}>
              <DialogTrigger asChild><Button>Create tenant</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create tenant</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Company name</Label><Input value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} /></div>
                  <div><Label>Company email</Label><Input value={tenantForm.company_email} onChange={(e) => setTenantForm({ ...tenantForm, company_email: e.target.value })} /></div>
                  <div><Label>Contact person</Label><Input value={tenantForm.contact_name} onChange={(e) => setTenantForm({ ...tenantForm, contact_name: e.target.value })} /></div>
                  <div><Label>Contact phone</Label><Input value={tenantForm.contact_phone} onChange={(e) => setTenantForm({ ...tenantForm, contact_phone: e.target.value })} /></div>
                  <div><Label>Notes</Label><Textarea value={tenantForm.notes} onChange={(e) => setTenantForm({ ...tenantForm, notes: e.target.value })} /></div>
                  <Button className="w-full" onClick={createTenant}>Create tenant</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild><Button variant="outline">Invite member</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite Super Admin or Agent</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Tenant</Label>
                    <Select value={inviteForm.tenant_id} onValueChange={(v) => setInviteForm({ ...inviteForm, tenant_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                      <SelectContent>
                        {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.code} — {t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={inviteForm.role} onValueChange={(v) => setInviteForm({ ...inviteForm, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Full name</Label><Input value={inviteForm.full_name} onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} /></div>
                  <Button className="w-full" onClick={sendInvite}>Create invitation</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {tenants.map((t) => {
            const sa = superAdmins.find((m) => m.tenant_id === t.id);
            const count = agents.filter((m) => m.tenant_id === t.id).length;
            return (
              <Card key={t.id} className="border-green-500/20 bg-black/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Badge variant="outline">{t.code}</Badge>{t.name}
                  </CardTitle>
                  <CardDescription>{t.company_email || "No company email"} · {t.contact_name || "No contact"}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Super Admin: {sa?.email ?? "not assigned"} · Agents: {count} ·
                  {" "}Inventory: {spaces.filter((s) => s.tenant_id === t.id).length}
                </CardContent>
              </Card>
            );
          })}
          {!loading && tenants.length === 0 && <p className="text-sm text-muted-foreground">No tenants yet.</p>}
        </TabsContent>

        <TabsContent value="people" className="space-y-2">
          {members.map((m) => (
            <Card key={m.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{m.full_name || m.email}</p>
                  <p className="text-muted-foreground">{m.email} · {tenantName(m.tenant_id)}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{m.member_role === "super_admin" ? "Super Admin" : "Agent"}</Badge>
                  <Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && members.length === 0 && <p className="text-sm text-muted-foreground">No tenant members yet.</p>}
        </TabsContent>

        <TabsContent value="invites" className="space-y-2">
          {invites.map((i) => (
            <Card key={i.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{i.email}</p>
                  <p className="text-muted-foreground">
                    {i.invited_role === "super_admin" ? "Super Admin" : "Agent"} · {tenantName(i.tenant_id)} ·
                    {" "}expires {new Date(i.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={i.accepted_at ? "default" : "secondary"}>{i.accepted_at ? "accepted" : "pending"}</Badge>
                  {!i.accepted_at && (
                    <Button size="sm" variant="outline" onClick={() => copyLink(i.token)}>
                      <Copy className="w-3 h-3 mr-1" />Copy link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && invites.length === 0 && <p className="text-sm text-muted-foreground">No invitations yet.</p>}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-2">
          {spaces.map((s) => (
            <Card key={s.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-muted-foreground">
                    {s.location || "No address"} · Media owner: {s.media_owner_name || "—"} ·
                    {" "}Units: {s.total_ad_units ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tenant: {s.tenant_id ? tenantName(s.tenant_id) : "unassigned"} · Onboarded by: {s.agent_id ? s.agent_id.slice(0, 8) : "—"}
                  </p>
                </div>
                <Badge variant="outline">{s.approval_status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="audit" className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-3 text-sm flex items-center gap-3">
                <ScrollText className="w-4 h-4 text-green-400 shrink-0" />
                <span className="font-medium">{l.action}</span>
                <span className="text-muted-foreground">{l.actor_role ?? "—"} · {tenantName(l.tenant_id)}</span>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
          {!loading && logs.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
