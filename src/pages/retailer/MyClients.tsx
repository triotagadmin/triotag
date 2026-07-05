import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisherContext } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, UserPlus, Info, Users, MailWarning, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

interface ClientRow {
  id: string;
  business_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  verification_status: string | null;
  user_id: string | null;
  ad_space_count: number;
}

const schema = z.object({
  business_name: z.string().trim().min(1, "Business name is required").max(100),
  contact_email: z.string().trim().email("Invalid email").max(255),
  contact_phone: z.string().trim().max(30).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

const emptyForm = { business_name: "", contact_email: "", contact_phone: "", location: "", description: "" };

const MyClients = () => {
  const { selectClient } = useRetailerPublisherContext();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: profiles } = await supabase
      .from("publisher_profiles")
      .select("id, business_name, contact_email, contact_phone, verification_status, user_id")
      .eq("managed_by_agent_id", session.user.id)
      .order("business_name", { ascending: true });

    const ids = (profiles || []).map((p: any) => p.id);
    let counts: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: spaces } = await supabase.from("ad_spaces").select("publisher_id").in("publisher_id", ids);
      (spaces || []).forEach((s: any) => { counts[s.publisher_id] = (counts[s.publisher_id] || 0) + 1; });
    }

    setRows((profiles || []).map((p: any) => ({ ...p, ad_space_count: counts[p.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      parsed.error.errors.forEach((e) => { fe[e.path[0] as string] = e.message; });
      setErrors(fe);
      return;
    }
    setErrors({});
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    const { data: inserted, error } = await supabase
      .from("publisher_profiles")
      .insert({
        managed_by_agent_id: session.user.id,
        user_id: null,
        publisher_type: "venue" as any,
        verification_status: "pending" as any,
        business_name: form.business_name.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone?.trim() || null,
        location: form.location?.trim() || null,
        description: form.description?.trim() || null,
        verified: false,
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Client added");
    setOpen(false);
    setForm(emptyForm);
    if (inserted?.id) selectClient(inserted.id);
    load();
  };

  const statusBadge = (s: string | null) => {
    const map: Record<string, string> = {
      verified: "bg-green-100 text-green-700 border-green-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      rejected: "bg-red-100 text-red-700 border-red-200",
    };
    const cls = map[s || ""] || "bg-gray-100 text-gray-700 border-gray-200";
    return <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{s || "unknown"}</span>;
  };

  return (
    <RetailerLayout title="My Clients">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" /> My Clients
            </h2>
            <p className="text-sm text-zinc-500">Retailer accounts you manage on behalf of.</p>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-500 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add New Client
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-zinc-500">Loading clients…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 mb-3">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1">No clients yet</h3>
              <p className="text-sm text-zinc-500 mb-4">Add your first retailer client to start managing their inventory.</p>
              <Button onClick={() => setOpen(true)} className="bg-green-600 hover:bg-green-500 text-white">
                <Plus className="w-4 h-4 mr-1.5" /> Add New Client
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Ad Spaces</th>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-zinc-900">{r.business_name || "—"}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        <div>{r.contact_email || "—"}</div>
                        {r.contact_phone && <div className="text-xs text-zinc-500">{r.contact_phone}</div>}
                      </td>
                      <td className="px-4 py-3">{statusBadge(r.verification_status)}</td>
                      <td className="px-4 py-3 text-zinc-700 font-medium">{r.ad_space_count}</td>
                      <td className="px-4 py-3">
                        {r.user_id ? (
                          <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Self-registered
                          </Badge>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 cursor-help">
                                  <MailWarning className="w-3 h-3" /> Agent-managed
                                  <Info className="w-3 h-3 opacity-70" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                This client hasn't created their own login yet — they're fully managed by you.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { selectClient(r.id); toast.success(`Switched to ${r.business_name || "client"}`); }}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a managed retailer profile. The client can later sign up and claim this profile using the contact email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="business_name">Business Name *</Label>
              <Input id="business_name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              {errors.business_name && <p className="text-xs text-destructive mt-1">{errors.business_name}</p>}
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email *</Label>
              <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
              {errors.contact_email && <p className="text-xs text-destructive mt-1">{errors.contact_email}</p>}
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input id="contact_phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white">
              {saving ? "Creating…" : "Create Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RetailerLayout>
  );
};

export default MyClients;
