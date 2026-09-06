import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt } from "lucide-react";
import { format } from "date-fns";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";

export default function BrandAdvertiserTransactions() {
  const { profileId, companyName, totalBudget, loading: profileLoading } = useAdvertiserProfile();
  const [rows, setRows] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading) return;
    (async () => {
      if (!profileId) { setLoading(false); return; }
      const { data: camps } = await supabase
        .from("brand_campaigns")
        .select("id, campaign_name")
        .eq("brand_advertiser_id", profileId);
      const map: Record<string, string> = {};
      (camps || []).forEach((c) => { map[c.id] = c.campaign_name; });
      setCampaigns(map);

      if (!camps?.length) { setRows([]); setLoading(false); return; }
      const { data } = await supabase
        .from("campaign_spend_ledger")
        .select("*")
        .in("campaign_id", camps.map((c) => c.id))
        .order("created_at", { ascending: false })
        .limit(500);
      setRows(data || []);
      setLoading(false);
    })();
  }, [profileId, profileLoading]);

  const billed = rows.filter((r) => r.event_type === "billed").reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Transactions</h1>
        <p className="text-sm text-gray-500 mb-6">Spend recorded against your campaigns.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-xs text-gray-500">Total billed</p>
            <p className="text-xl font-semibold text-gray-900">₱{billed.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-xs text-gray-500">Committed budget</p>
            <p className="text-xl font-semibold text-gray-900">₱{Number(totalBudget).toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-xs text-gray-500">Entries</p>
            <p className="text-xl font-semibold text-gray-900">{rows.length}</p>
          </Card>
        </div>

        <Card className="bg-white border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-14">
                    <div className="flex flex-col items-center text-center">
                      <Receipt className="w-7 h-7 text-gray-400" />
                      <p className="text-gray-900 font-medium mt-3">No transactions yet</p>
                      <p className="text-sm text-gray-500 mt-1">Spend appears here once your campaigns start delivering.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-gray-700">{format(new Date(r.created_at), "d MMM yyyy HH:mm")}</TableCell>
                  <TableCell className="text-gray-900">{campaigns[r.campaign_id] || "—"}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{r.event_type}</Badge></TableCell>
                  <TableCell className="text-right text-gray-900">₱{Number(r.amount || 0).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
