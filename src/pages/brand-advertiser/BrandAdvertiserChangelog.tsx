import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

export default function BrandAdvertiserChangelog() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("My Brand");
  const [totalBudget, setTotalBudget] = useState(0);
  const [entries, setEntries] = useState<any[]>([]);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("brand_advertiser_profiles")
        .select("id, company_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!profile) { setLoading(false); return; }
      setCompanyName(profile.company_name || "My Brand");
      const { data: camps } = await supabase
        .from("brand_campaigns")
        .select("id, campaign_name, created_at, updated_at, status, budget")
        .eq("brand_advertiser_id", profile.id)
        .order("updated_at", { ascending: false });
      setTotalBudget((camps || []).reduce((s, c) => s + Number(c.budget || 0), 0));
      // Derive lightweight changelog entries from campaign created/updated timestamps.
      const derived: any[] = [];
      (camps || []).forEach((c) => {
        derived.push({
          id: `${c.id}-create`,
          changed_by: "You",
          campaign_id: c.id,
          campaign_name: c.campaign_name,
          action: "created",
          description: `Campaign created with status "${c.status}"`,
          created_at: c.created_at,
        });
        if (c.updated_at && c.updated_at !== c.created_at) {
          derived.push({
            id: `${c.id}-update`,
            changed_by: "You",
            campaign_id: c.id,
            campaign_name: c.campaign_name,
            action: "updated",
            description: `Campaign updated`,
            created_at: c.updated_at,
          });
        }
      });
      derived.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setEntries(derived);
      setLoading(false);
    })();
  }, []);

  const filtered = entries.filter((e) => {
    if (campaignFilter && !(e.campaign_name || "").toLowerCase().includes(campaignFilter.toLowerCase())) return false;
    if (typeFilter !== "all" && e.action !== typeFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Changelog</h1>

        <Card className="p-4 mb-4 bg-white border border-gray-200">
          <div className="flex flex-wrap gap-3">
            <Input placeholder="Filter by campaign..." value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="w-64" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No changes recorded yet</TableCell></TableRow>
              ) : filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-xs">{String(e.id).slice(0, 8)}</TableCell>
                  <TableCell>{e.changed_by}</TableCell>
                  <TableCell className="font-medium">{e.campaign_name}</TableCell>
                  <TableCell className="capitalize">{e.action}</TableCell>
                  <TableCell className="text-sm text-gray-600">{e.description}</TableCell>
                  <TableCell className="text-sm text-gray-500">{e.created_at ? format(new Date(e.created_at), "MMM d, yyyy HH:mm") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
