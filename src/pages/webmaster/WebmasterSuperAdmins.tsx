import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, StatusBadge, Empty } from "./ui";
import { invitationState } from "./platformData";

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  tenant_id: z.string().uuid("Select a tenant"),
});

export default function WebmasterSuperAdmins() {
  const { data, loading, reload } = usePlatform();
  const { tenants, members, invitations } = data;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", tenant_id: "" });

  const tenantName = (id: string | null) => tenants.find((t) => t.id === id)?.name ?? "—";
  const superAdmins = members.filter((m) => m.member_role === "super_admin");
  const pendingInvites = invitations.filter((i) => i.invited_role === "super_admin" && !i.accepted_at);

  const sendMail = async (invitationId: string) => {
    const { error } = await supabase.functions.invoke("send-tenant-invitation", {
      body: { invitation_id: invitationId, site_url: window.location.origin },
    });
    if (error) { toast.error("Super Admin invitation could not be sent."); return false; }
    return true;
  };

  const create = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Please check the form");
      return;
    }
    setBusy(true);
    const { data: inv, error } = await supabase.rpc("invite_member", {
      _email: form.email, _role: "super_admin", _tenant_id: form.tenant_id, _full_name: form.full_name,
    });
    if (error) { setBusy(false); toast.error(error.message); return; }
    const invitationId = (inv as { invitation_id: string }[] | null)?.[0]?.invitation_id;
    const sent = invitationId ? await sendMail(invitationId) : false;
    setBusy(false);
    if (sent) toast.success("Verification email sent");
    setForm({ full_name: "", email: "", tenant_id: "" });
    setOpen(false);
    reload();
  };

  const resend = async (id: string) => {
    const { error } = await supabase.rpc("webmaster_reissue_invitation", { _invitation_id: id });
    if (error) { toast.error(error.message); return; }
    if (await sendMail(id)) toast.success("Verification email resent");
    reload();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.rpc("webmaster_cancel_invitation", { _invitation_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Invitation cancelled");
    reload();
  };

  const setMemberStatus = async (id: string, status: "active" | "disabled") => {
    const { error } = await supabase.rpc("webmaster_set_member_status", { _member_id: id, _status: status });
    if (error) { toast.error(error.message); return; }
    toast.success(status === "active" ? "Account reactivated" : "Account disabled");
    reload();
  };

  return (
    <div>
      <PageHeader
        title="Super Admins"
        subtitle="One Super Admin command center per tenant."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>+ Create Super Admin</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Super Admin</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Super Admin name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Super Admin email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div>
                  <Label>Tenant / advertising company</Label>
                  <Select value={form.tenant_id} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select tenant" /></SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.code} — {t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  No password is set here. A single-use verification email activates the account and locks it to the selected tenant.
                </p>
                <Button className="w-full" disabled={busy} onClick={create}>{busy ? "Sending…" : "Send verification email"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-3">
        {pendingInvites.map((i) => (
          <Panel key={i.id}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{i.full_name || i.email}</p>
                <p className="text-xs text-muted-foreground">
                  {i.email} · {tenantName(i.tenant_id)} · invited {new Date(i.created_at).toLocaleDateString()} ·
                  {" "}expires {new Date(i.expires_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={invitationState(i)} />
                <Button size="sm" variant="outline" onClick={() => resend(i.id)}>Resend Verification</Button>
                <Button size="sm" variant="outline" onClick={() => cancel(i.id)}>Cancel Invitation</Button>
              </div>
            </div>
          </Panel>
        ))}

        {superAdmins.map((m) => {
          const agentCount = members.filter((x) => x.tenant_id === m.tenant_id && x.member_role === "agent").length;
          return (
            <Panel key={m.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{m.full_name || m.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.email} · {tenantName(m.tenant_id)} · verified {new Date(m.created_at).toLocaleDateString()} ·
                    {" "}last update {new Date(m.updated_at).toLocaleDateString()} · Agents: {agentCount}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={m.status} />
                  {m.status === "active"
                    ? <Button size="sm" variant="outline" onClick={() => setMemberStatus(m.id, "disabled")}>Disable</Button>
                    : <Button size="sm" onClick={() => setMemberStatus(m.id, "active")}>Reactivate</Button>}
                </div>
              </div>
            </Panel>
          );
        })}

        {!loading && superAdmins.length === 0 && pendingInvites.length === 0 && (
          <Empty>No Super Admins yet — create one and they'll activate through the emailed verification link.</Empty>
        )}
      </div>
    </div>
  );
}
