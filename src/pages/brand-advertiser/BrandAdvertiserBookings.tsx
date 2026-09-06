import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";

export default function BrandAdvertiserBookings() {
  const { profileId, companyName, totalBudget, loading: profileLoading } = useAdvertiserProfile();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileLoading) return;
    (async () => {
      if (!profileId) { setLoading(false); return; }
      const { data: camps } = await supabase
        .from("brand_campaigns")
        .select("id, campaign_name, status, start_date, end_date")
        .eq("brand_advertiser_id", profileId);
      const campaigns = camps || [];
      if (!campaigns.length) { setRows([]); setLoading(false); return; }

      const { data: targets } = await supabase
        .from("campaign_ad_space_targets")
        .select("campaign_id, ad_space_id")
        .in("campaign_id", campaigns.map((c) => c.id));

      const spaceIds = [...new Set((targets || []).map((t: any) => t.ad_space_id))];
      let spaces: any[] = [];
      if (spaceIds.length) {
        const { data } = await (supabase as any)
          .from("marketplace_inventory")
          .select("id, title, location, media_type")
          .in("id", spaceIds);
        spaces = data || [];
      }

      setRows((targets || []).map((t: any) => ({
        ...t,
        campaign: campaigns.find((c) => c.id === t.campaign_id),
        space: spaces.find((s: any) => s.id === t.ad_space_id),
      })));
      setLoading(false);
    })();
  }, [profileId, profileLoading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Bookings</h1>
        <p className="text-sm text-gray-500 mb-6">Ad spaces booked through your campaigns.</p>

        <Card className="bg-white border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad space</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Flight dates</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-14">
                    <div className="flex flex-col items-center text-center">
                      <CalendarCheck className="w-7 h-7 text-gray-400" />
                      <p className="text-gray-900 font-medium mt-3">No bookings yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Book inventory from <Link to="/brand-advertiser/discover" className="underline">Discover Inventory</Link>.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.map((r, i) => (
                <TableRow key={`${r.campaign_id}-${r.ad_space_id}-${i}`}>
                  <TableCell className="font-medium text-gray-900">
                    {r.space ? (
                      <Link to={`/brand-advertiser/inventory/${r.ad_space_id}`} className="hover:underline">{r.space.title}</Link>
                    ) : "Listing unavailable"}
                  </TableCell>
                  <TableCell className="text-gray-700">{r.space?.location || "—"}</TableCell>
                  <TableCell className="text-gray-700">{r.campaign?.campaign_name || "—"}</TableCell>
                  <TableCell className="text-gray-700">
                    {r.campaign?.start_date ? format(new Date(r.campaign.start_date), "d MMM yyyy") : "—"}
                    {r.campaign?.end_date ? ` – ${format(new Date(r.campaign.end_date), "d MMM yyyy")}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {String(r.campaign?.status || "pending").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
