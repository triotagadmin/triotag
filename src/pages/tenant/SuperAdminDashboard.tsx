import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, LogOut, MapPin, Users, ScrollText } from "lucide-react";

type Tenant = { id: string; code: string; name: string; company_email: string | null };
type Member = { id: string; user_id: string; member_role: string; status: string; full_name: string | null; email: string | null };
type Invitation = { id: string; email: string; invited_role: string; token: string; expires_at: string; accepted_at: string | null };
type Space = {
  id: string; title: string; location: string | null; approval_status: string;
  agent_id: string | null; total_ad_units: number | null; media_owner_name: string | null; created_at: string;
};
type AuditRow = { id: string; action: string; actor_role: string | null; created_at: string };

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [agents, setAgents] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [form, setForm] = useState({ full_name: "", email: "" });
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [t, m, i, s, l] = await Promise.all([
      supabase.from("tenants").select("id,code,name,company_email").limit(1).maybeSingle(),
      supabase.from("tenant_members").select("id,user_id,member_role,status,full_name,email").order("created_at", { ascending: false }),
      supabase.from("tenant_invitations").select("id,email,invited_role,token,expires_at,accepted_at").order("created_at", { ascending: false }),
      supabase.from("ad_spaces").select("id,title,location,approval_status,agent_id,total_ad_units,media_owner_name,created_at").order("created_at", { ascending: false }),
      supabase.from("audit_logs").select("id,action,actor_role,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    setTenant((t.data as Tenant) ?? null);
    setAgents(((m.data as Member[]) ?? []).filter((x) => x.member_role === "agent"));
    setInvites((i.data as Invitation[]) ?? []);
    setSpaces((s.data as Space[]) ?? []);
    setLogs((l.data as AuditRow[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const inviteAgent = async () => {
    if (!form.email.trim()) { toast.error("Email is required"); return; }
    const { data, error } = await supabase.rpc("invite_member", {
      _email: form.email, _role: "agent", _tenant_id: null, _full_name: form.full_name || null,
    });
    if (error) { toast.error(error.message); return; }
    const token = (data as { token: string }[] | null)?.[0]?.token;
    if (token) navigator.clipboard?.writeText(`${window.location.origin}/invite/${token}`);
    toast.success("Agent invitation created — link copied");
    setForm({ full_name: "", email: "" });
    setOpen(false);
    load();
  };

  const toggleAgent = async (a: Member) => {
    const next = a.status === "active" ? "disabled" : "active";
    const { error } = await supabase.from("tenant_members").update({ status: next }).eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Agent ${next === "active" ? "reactivated" : "disabled"}`);
    load();
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate("/auth", { replace: true }); };
  const pending = spaces.filter((s) => s.approval_status === "pending");

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-foreground p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tenant?.name ?? "Tenant"} Command Center</h1>
          <p className="text-sm text-muted-foreground">Tenant {tenant?.code ?? "—"} · your agents, locations and inventory only.</p>
        </div>
        <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sign out</Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Users className="w-5 h-5" />, label: "Agents", value: agents.length },
          { icon: <MapPin className="w-5 h-5" />, label: "Locations", value: spaces.length },
          { icon: <MapPin className="w-5 h-5" />, label: "Pending review", value: pending.length },
          { icon: <Users className="w-5 h-5" />, label: "Media owners", value: new Set(spaces.map((s) => s.media_owner_name).filter(Boolean)).size },
        ].map((s) => (
          <Card key={s.label} className="border-green-500/20 bg-black/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="agents">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="invites">Invitations</TabsTrigger>
          <TabsTrigger value="inventory">Locations &amp; Inventory</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="audit">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-3">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Invite agent</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite agent</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Agent name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Agent email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <p className="text-xs text-muted-foreground">The agent joins your tenant automatically — they never choose it.</p>
                <Button className="w-full" onClick={inviteAgent}>Send invitation</Button>
              </div>
            </DialogContent>
          </Dialog>

          {agents.map((a) => (
            <Card key={a.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{a.full_name || a.email}</p>
                  <p className="text-muted-foreground">{a.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => toggleAgent(a)}>
                    {a.status === "active" ? "Disable" : "Reactivate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {agents.length === 0 && <p className="text-sm text-muted-foreground">No agents yet.</p>}
        </TabsContent>

        <TabsContent value="invites" className="space-y-2">
          {invites.map((i) => (
            <Card key={i.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{i.email}</p>
                  <p className="text-muted-foreground">expires {new Date(i.expires_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={i.accepted_at ? "default" : "secondary"}>{i.accepted_at ? "accepted" : "pending"}</Badge>
                  {!i.accepted_at && (
                    <Button size="sm" variant="outline" onClick={() => {
                      navigator.clipboard?.writeText(`${window.location.origin}/invite/${i.token}`);
                      toast.success("Invitation link copied");
                    }}><Copy className="w-3 h-3 mr-1" />Copy link</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {invites.length === 0 && <p className="text-sm text-muted-foreground">No invitations yet.</p>}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-2">
          {spaces.map((s) => (
            <Card key={s.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-muted-foreground">{s.location || "No address"} · Media owner: {s.media_owner_name || "—"} · Units: {s.total_ad_units ?? 0}</p>
                </div>
                <Badge variant="outline">{s.approval_status}</Badge>
              </CardContent>
            </Card>
          ))}
          {spaces.length === 0 && <p className="text-sm text-muted-foreground">No tenant inventory yet.</p>}
        </TabsContent>

        <TabsContent value="pending" className="space-y-2">
          <Card className="border-green-500/20 bg-black/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Awaiting TrioTag platform verification</CardTitle>
              <CardDescription>Review your agents' submissions before platform verification.</CardDescription>
            </CardHeader>
          </Card>
          {pending.map((s) => (
            <Card key={s.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-4 text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground">{s.location || "No address"} · submitted {new Date(s.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
          {pending.length === 0 && <p className="text-sm text-muted-foreground">Nothing pending.</p>}
        </TabsContent>

        <TabsContent value="audit" className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id} className="border-green-500/20 bg-black/40">
              <CardContent className="p-3 text-sm flex items-center gap-3">
                <ScrollText className="w-4 h-4 text-green-400 shrink-0" />
                <span className="font-medium">{l.action}</span>
                <span className="text-muted-foreground">{l.actor_role ?? "—"}</span>
                <span className="ml-auto text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </CardContent>
            </Card>
          ))}
          {logs.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded yet.</p>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
