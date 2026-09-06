import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardList } from "lucide-react";
import { format } from "date-fns";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";

export default function BrandAdvertiserProposals() {
  const { companyName, totalBudget } = useAdvertiserProfile();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const { data } = await supabase
        .from("media_plan_requests")
        .select("*")
        .eq("advertiser_id", session.user.id)
        .order("created_at", { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Proposals</h1>
        <p className="text-sm text-gray-500 mb-6">Media requests you sent to the TrioTag team.</p>

        <Card className="bg-white border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14">
                    <div className="flex flex-col items-center text-center">
                      <ClipboardList className="w-7 h-7 text-gray-400" />
                      <p className="text-gray-900 font-medium mt-3">No proposals yet</p>
                      <p className="text-sm text-gray-500 mt-1">Requests you submit will appear here with their review status.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-gray-900">{r.campaign_name}</TableCell>
                  <TableCell className="capitalize text-gray-700">{r.campaign_pillar || r.campaign_type}</TableCell>
                  <TableCell className="text-gray-700">
                    {r.preferred_start_date ? format(new Date(r.preferred_start_date), "d MMM yyyy") : "—"}
                    {r.preferred_end_date ? ` – ${format(new Date(r.preferred_end_date), "d MMM yyyy")}` : ""}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {Number(r.ooh_units || 0) + Number(r.dooh_units || 0) + Number(r.aooh_units || 0)}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{String(r.status).replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell className="text-gray-500 text-sm">{format(new Date(r.created_at), "d MMM yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
