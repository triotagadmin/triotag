import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserCheck, MailWarning, UserX, Search, Plus, RefreshCw, Loader2 } from "lucide-react";

type Agent = {
  kind: "member" | "invitation";
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  position: string | null;
  status: "ACTIVE" | "SUSPENDED" | "REMOVED" | "PENDING VERIFICATION" | "EXPIRED" | "CANCELLED";
  invited_at: string;
  last_login: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-400 border-green-500/40",
  "PENDING VERIFICATION": "bg-amber-500/15 text-amber-400 border-amber-500/40",
  SUSPENDED: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  REMOVED: "bg-red-500/15 text-red-400 border-red-500/40",
  EXPIRED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/40",
  CANCELLED: "bg-zinc-500/15 text-zinc-400 border-zinc-500/40",
};

const fmt = (v: string | null) => (v ? new Date(v).toLocaleString() : "—");

export default function AdminAgentCenter() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tenantName, setTenantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Agent | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Agent | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", position: "" });

  const call = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("agent-manage", {
      body: { ...payload, site_url: window.location.origin.startsWith("https://") ? window.location.origin : undefined },
    });
    if (error) {
      let message = error.message;
      try {
        const ctx = (error as any).context;
        if (ctx?.json) message = (await ctx.json())?.error ?? message;
        else if (ctx && typeof ctx.text === "function") {
          const parsed = JSON.parse(await ctx.text());
          message = parsed?.error ?? message;
        }
      } catch { /* keep default */ }
      throw new Error(message);
    }
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call({ action: "list" });
      setAgents(data.agents ?? []);
      setTenantName(data.tenant?.name ?? "");
      setDenied(false);
    } catch (e: any) {
      if (/authoriz/i.test(e.message)) setDenied(true);
      else toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total: agents.length,
    active: agents.filter((a) => a.status === "ACTIVE").length,
    pending: agents.filter((a) => a.status === "PENDING VERIFICATION").length,
    inactive: agents.filter((a) => ["SUSPENDED", "REMOVED", "EXPIRED", "CANCELLED"].includes(a.status)).length,
  }), [agents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents.filter((a) => {
      const matchesQ = !q || a.name.toLowerCase().includes(q) || (a.email ?? "").toLowerCase().includes(q);
      const matchesS = statusFilter === "all" || a.status === statusFilter;
      return matchesQ && matchesS;
    });
  }, [agents, search, statusFilter]);

  const createAgent = async () => {
    setCreating(true);
    try {
      await call({ action: "create", ...form });
      toast.success("Verification email sent successfully.");
      setCreateOpen(false);
      setForm({ first_name: "", last_name: "", email: "", phone: "", position: "" });
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const act = async (agent: Agent, action: string, successMessage: string) => {
    setBusyId(agent.id);
    try {
      await call(
        action === "resend"
          ? { action, invitation_id: agent.id }
          : { action, member_id: agent.id },
      );
      toast.success(successMessage);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  if (denied) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] text-foreground flex items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Agent Center is available to Super Admins only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-foreground p-4 md:p-8 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Agent Center</h1>
          <p className="text-sm text-muted-foreground">
            Manage your advertising agents, invitations, access, and account status.
          </p>
          {tenantName && <p className="text-xs text-green-400/80 mt-1">{tenantName}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Agent</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: <Users className="w-5 h-5" />, label: "Total Agents", value: stats.total },
          { icon: <UserCheck className="w-5 h-5" />, label: "Active Agents", value: stats.active },
          { icon: <MailWarning className="w-5 h-5" />, label: "Pending Verification", value: stats.pending },
          { icon: <UserX className="w-5 h-5" />, label: "Suspended / Inactive", value: stats.inactive },
        ].map((s) => (
          <Card key={s.label} className="border-green-500/20 bg-black/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400">
                {s.icon}
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search agents by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING VERIFICATION">Pending verification</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="REMOVED">Removed</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-green-500/20 bg-black/40">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-green-500/10">
                <th className="p-3">Agent Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Account Status</th>
                <th className="p-3">Date Invited</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={`${a.kind}-${a.id}`} className="border-b border-green-500/5">
                  <td className="p-3 font-medium">{a.name}</td>
                  <td className="p-3 text-muted-foreground">{a.email}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={STATUS_STYLES[a.status]}>{a.status}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{fmt(a.invited_at)}</td>
                  <td className="p-3 text-muted-foreground">{fmt(a.last_login)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setViewing(a)}>View</Button>
                      {a.status === "PENDING VERIFICATION" && (
                        <Button size="sm" variant="outline" disabled={busyId === a.id}
                          onClick={() => act(a, "resend", "Verification email sent successfully.")}>
                          {busyId === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Resend Verification"}
                        </Button>
                      )}
                      {a.kind === "member" && a.status === "ACTIVE" && (
                        <Button size="sm" variant="outline" disabled={busyId === a.id}
                          onClick={() => act(a, "suspend", "Agent suspended.")}>Suspend</Button>
                      )}
                      {a.kind === "member" && (a.status === "SUSPENDED" || a.status === "REMOVED") && (
                        <Button size="sm" variant="outline" disabled={busyId === a.id}
                          onClick={() => act(a, "reactivate", "Agent reactivated.")}>Reactivate</Button>
                      )}
                      {a.kind === "member" && a.status !== "REMOVED" && (
                        <Button size="sm" variant="destructive" onClick={() => setConfirmRemove(a)}>Remove</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No agents found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading agents…</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
            <DialogDescription>
              The agent is added to your organization automatically and stays inactive until they verify their email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>First Name</Label><Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
              <div><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div><Label>Email Address</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone (optional)</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Position (optional)</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={createAgent} disabled={creating} className="w-full">
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending invitation…</> : "Send verification email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Email: </span>{viewing?.email}</p>
            <p><span className="text-muted-foreground">Status: </span>{viewing?.status}</p>
            <p><span className="text-muted-foreground">Phone: </span>{viewing?.phone || "—"}</p>
            <p><span className="text-muted-foreground">Position: </span>{viewing?.position || "—"}</p>
            <p><span className="text-muted-foreground">Date invited: </span>{fmt(viewing?.invited_at ?? null)}</p>
            <p><span className="text-muted-foreground">Last login: </span>{fmt(viewing?.last_login ?? null)}</p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmRemove} onOpenChange={(o) => !o && setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this Agent?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the Agent's access to your TrioTag tenant. Their locations, inventory, campaigns and
              history are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmRemove) act(confirmRemove, "remove", "Agent removed."); setConfirmRemove(null); }}>
              Remove Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
