import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel } from "./ui";

const schema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(120),
  company_email: z.string().trim().email("Enter a valid company email").max(255).or(z.literal("")),
  contact_phone: z.string().trim().max(40),
  contact_name: z.string().trim().max(120),
  admin_name: z.string().trim().max(120),
  admin_email: z.string().trim().email("Enter a valid Super Admin email").max(255).or(z.literal("")),
  status: z.enum(["active", "suspended"]),
});

export default function WebmasterTenantNew() {
  const navigate = useNavigate();
  const { reload } = usePlatform();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "", company_email: "", contact_phone: "", contact_name: "",
    admin_name: "", admin_email: "", status: "active" as "active" | "suspended", notes: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] ?? "Please check the form");
      return;
    }
    setBusy(true);
    try {
      const { data: tenantId, error } = await supabase.rpc("create_tenant", {
        _name: form.name,
        _company_email: form.company_email || null,
        _contact_name: form.contact_name || null,
        _contact_phone: form.contact_phone || null,
        _notes: form.notes || null,
      });
      if (error) throw error;

      if (form.status === "suspended" && tenantId) {
        await supabase.rpc("webmaster_set_tenant_status", { _tenant_id: tenantId as string, _status: "suspended" });
      }

      if (form.admin_email) {
        const { data: inv, error: invErr } = await supabase.rpc("invite_member", {
          _email: form.admin_email,
          _role: "super_admin",
          _tenant_id: tenantId as string,
          _full_name: form.admin_name || null,
        });
        if (invErr) {
          toast.error(`Tenant created, but the Super Admin invitation failed: ${invErr.message}`);
        } else {
          const invitationId = (inv as { invitation_id: string }[] | null)?.[0]?.invitation_id;
          const { error: mailErr } = await supabase.functions.invoke("send-tenant-invitation", {
            body: { invitation_id: invitationId, site_url: window.location.origin },
          });
          if (mailErr) toast.error("Super Admin invitation could not be sent. Resend it from Super Admins.");
          else toast.success("Tenant created and verification email sent");
        }
      } else {
        toast.success("Tenant created");
      }

      await reload();
      navigate(tenantId ? `/webmaster/tenants/${tenantId}` : "/webmaster/tenants");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the tenant");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Create Tenant" subtitle="Register an advertising company and invite its Super Admin." />
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Company / Agency name</Label>
            <Input value={form.name} onChange={set("name")} placeholder="ABC Advertising" />
          </div>
          <div><Label>Company email</Label><Input value={form.company_email} onChange={set("company_email")} placeholder="hello@abc.com" /></div>
          <div><Label>Company phone</Label><Input value={form.contact_phone} onChange={set("contact_phone")} placeholder="+63…" /></div>
          <div><Label>Contact name</Label><Input value={form.contact_name} onChange={set("contact_name")} /></div>
          <div>
            <Label>Tenant status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "suspended" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Super Admin name</Label><Input value={form.admin_name} onChange={set("admin_name")} /></div>
          <div><Label>Super Admin email</Label><Input type="email" value={form.admin_email} onChange={set("admin_email")} placeholder="admin@abc.com" /></div>
          <div className="sm:col-span-2"><Label>Internal notes</Label><Textarea value={form.notes} onChange={set("notes")} /></div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No password is ever set here. The Super Admin receives a single-use verification email and activates their own account.
        </p>
        <Button className="mt-4" disabled={busy} onClick={submit}>
          {busy ? "Creating…" : "Create tenant & send invitation"}
        </Button>
      </Panel>
    </div>
  );
}
