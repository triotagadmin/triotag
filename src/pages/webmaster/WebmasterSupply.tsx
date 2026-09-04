import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatform } from "./WebmasterLayout";
import { PageHeader, Panel, Stat, StatusBadge, Empty } from "./ui";
import type { Space } from "./platformData";

type Mode = "media-owners" | "locations" | "inventory" | "verification" | "pending";

const TITLES: Record<Mode, { title: string; subtitle: string }> = {
  "media-owners": { title: "All Media Owners", subtitle: "Media owner records behind every location, across all tenants." },
  locations: { title: "All Locations", subtitle: "Every venue onboarded by every agent, with full attribution." },
  inventory: { title: "All Inventory", subtitle: "Platform-wide OOH, DOOH and AOOH supply." },
  verification: { title: "Inventory Verification", subtitle: "Final TRIOTAG platform verification — Webmaster only." },
  pending: { title: "Pending Approvals", subtitle: "Supply waiting on platform-level review." },
};

export default function WebmasterSupply({ mode }: { mode: Mode }) {
  const { data, loading, reload } = usePlatform();
  const { tenants, members, spaces } = data;
  const [tenantFilter, setTenantFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const tenantName = (id: string | null) => tenants.find((t) => t.id === id)?.name ?? "Unassigned";
  const agentName = (id: string | null) =>
    members.find((m) => m.user_id === id)?.full_name || members.find((m) => m.user_id === id)?.email || (id ? `${id.slice(0, 8)}…` : "—");

  const filtered = useMemo(() => {
    let rows: Space[] = spaces;
    if (mode === "verification" || mode === "pending") {
      rows = rows.filter((s) => (s.platform_verification_status ?? "pending") === (mode === "pending" ? "pending" : s.platform_verification_status ?? "pending"));
      if (mode === "pending") rows = rows.filter((s) => (s.platform_verification_status ?? "pending") === "pending");
    }
    return rows
      .filter((s) => tenantFilter === "all" || s.tenant_id === tenantFilter)
      .filter((s) => agentFilter === "all" || s.agent_id === agentFilter)
      .filter((s) => formatFilter === "all" || (s.media_types ?? []).includes(formatFilter))
      .filter((s) => statusFilter === "all" || (s.platform_verification_status ?? "pending") === statusFilter)
      .filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return [s.title, s.location, s.media_owner_name].some((v) => (v ?? "").toLowerCase().includes(q));
      });
  }, [spaces, mode, tenantFilter, agentFilter, formatFilter, statusFilter, search]);

  const verify = async (id: string, decision: "approved" | "rejected" | "revision_required") => {
    const { error } = await supabase.rpc("webmaster_verify_inventory", {
      _ad_space_id: id, _decision: decision, _notes: notes[id] || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Inventory ${decision.replace("_", " ")}`);
    reload();
  };

  if (mode === "media-owners") {
    const owners = new Map<string, { name: string; email: string | null; phone: string | null; contact: string | null; spaces: Space[] }>();
    for (const s of spaces) {
      const key = (s.media_owner_name || "Unnamed media owner").trim();
      const entry = owners.get(key) ?? { name: key, email: s.media_owner_email, phone: s.media_owner_phone, contact: s.media_owner_contact_person, spaces: [] };
      entry.spaces.push(s);
      owners.set(key, entry);
    }
    const list = [...owners.values()].filter((o) => !search.trim() || o.name.toLowerCase().includes(search.toLowerCase()));
    return (
      <div>
        <PageHeader title={TITLES[mode].title} subtitle={TITLES[mode].subtitle} />
        <Input className="mb-4 max-w-sm" placeholder="Search media owners" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="space-y-3">
          {list.map((o) => (
            <Panel key={o.name}>
              <p className="font-medium">{o.name}</p>
              <p className="text-xs text-muted-foreground">
                {o.contact || "No contact person"} · {o.email || "no email"} · {o.phone || "no phone"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Locations: {o.spaces.length} · Tenants: {new Set(o.spaces.map((s) => tenantName(s.tenant_id))).size}
              </p>
            </Panel>
          ))}
          {!loading && list.length === 0 && <Empty>No media owner records yet.</Empty>}
        </div>
      </div>
    );
  }

  const totalUnits = filtered.reduce((sum, s) => sum + (Number(s.total_ad_units) || 0), 0);

  return (
    <div>
      <PageHeader title={TITLES[mode].title} subtitle={TITLES[mode].subtitle} />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Records" value={filtered.length} />
        <Stat label="Ad units" value={totalUnits} />
        <Stat label="Pending platform review" value={filtered.filter((s) => (s.platform_verification_status ?? "pending") === "pending").length} />
        <Stat label="Approved" value={filtered.filter((s) => s.platform_verification_status === "approved").length} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Input className="w-56" placeholder="Search location or owner" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tenant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tenants</SelectItem>
            {tenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.code} — {t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Agent" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {members.filter((m) => m.member_role === "agent").map((m) => (
              <SelectItem key={m.id} value={m.user_id}>{m.full_name || m.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Ad format" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All formats</SelectItem>
            <SelectItem value="OOH">OOH</SelectItem>
            <SelectItem value="DOOH">DOOH</SelectItem>
            <SelectItem value="AOOH">AOOH</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Inventory status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending verification</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="revision_required">Revision required</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <Panel key={s.id}>
            <div className="flex flex-wrap items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.location || "No address"}</p>
                <div className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>Tenant: <span className="text-foreground">{tenantName(s.tenant_id)}</span></span>
                  <span>Agent: <span className="text-foreground">{agentName(s.agent_id)}</span></span>
                  <span>Media owner: <span className="text-foreground">{s.media_owner_name || "—"}</span></span>
                  <span>Formats: <span className="text-foreground">{(s.media_types ?? []).join(", ") || s.category || "—"}</span></span>
                  <span>Units: <span className="text-foreground">{s.total_ad_units ?? 0}</span></span>
                  <span>Tenant review: <span className="text-foreground">{s.approval_status}</span></span>
                </div>
                {s.platform_review_notes && (
                  <p className="mt-2 text-xs text-amber-300/80">Platform note: {s.platform_review_notes}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={s.platform_verification_status ?? "pending"} />
                {(mode === "verification" || mode === "pending") && (
                  <div className="w-64 space-y-2">
                    <Textarea
                      placeholder="Review notes (optional)"
                      value={notes[s.id] ?? ""}
                      onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                      className="min-h-[60px] text-xs"
                    />
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" onClick={() => verify(s.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => verify(s.id, "revision_required")}>Revision</Button>
                      <Button size="sm" variant="outline" onClick={() => verify(s.id, "rejected")}>Reject</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        ))}
        {!loading && filtered.length === 0 && <Empty>Nothing matches these filters.</Empty>}
      </div>
    </div>
  );
}
