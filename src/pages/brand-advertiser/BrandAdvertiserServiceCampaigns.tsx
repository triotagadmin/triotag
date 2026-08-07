import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Plus } from "lucide-react";
import { toast } from "sonner";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

export default function BrandAdvertiserServiceCampaigns() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("My Brand");
  const [totalBudget, setTotalBudget] = useState(0);
  const [rows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("brand_advertiser_profiles")
        .select("id, company_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        setCompanyName(profile.company_name || "My Brand");
        const { data: camps } = await supabase
          .from("brand_campaigns")
          .select("budget")
          .eq("brand_advertiser_id", profile.id);
        setTotalBudget((camps || []).reduce((s, c: any) => s + Number(c.budget || 0), 0));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Service Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">Manage the services you promote across your retail media campaigns.</p>
          </div>
          <Button onClick={() => toast.info("Service creation is coming soon")}>
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        </div>

        <Card className="bg-white border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked Campaign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-8">Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-14">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium mt-3">No services yet</p>
                      <p className="text-sm text-gray-500 mt-1">Add your first service to link it to a campaign.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="capitalize">{r.status}</TableCell>
                  <TableCell className="text-sm text-gray-600">{r.campaign_name || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
