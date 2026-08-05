import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

// Rough reach estimate per environment per campaign (placeholder logic until
// real audience-modelling data is wired up via mediaPlanPricing helpers).
const ENV_REACH: Record<string, number> = { OOH: 15000, DOOH: 25000, AOOH: 8000 };

function estimateReach(envs: string[] = []) {
  return envs.reduce((s, e) => s + (ENV_REACH[e] || 5000), 0);
}

function BrandAdvertiserAudiences() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("My Brand");
  const [totalBudget, setTotalBudget] = useState(0);
  const [campaigns, setCampaigns] = useState<any[]>([]);

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
        .select("*")
        .eq("brand_advertiser_id", profile.id);
      setCampaigns(camps || []);
      setTotalBudget((camps || []).reduce((s, c) => s + Number(c.budget || 0), 0));
      setLoading(false);
    })();
  }, []);

  const totalReach = useMemo(
    () => campaigns.filter((c) => c.status === "active").reduce((s, c) => s + estimateReach(c.environments), 0),
    [campaigns]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Audiences Summary</h1>

        <Card className="p-6 bg-white border border-gray-200 mb-6">
          <div className="text-sm text-gray-500">Total Reach</div>
          <div className="text-4xl font-bold text-blue-600 mt-1">{totalReach.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">Estimated across active campaigns</div>
        </Card>

        <Tabs defaultValue="campaign">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="campaign">Campaign Audiences</TabsTrigger>
            <TabsTrigger value="saved">Saved Audiences</TabsTrigger>
          </TabsList>
          <TabsContent value="campaign">
            <Card className="bg-white border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Size (est.)</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">Loading...</TableCell></TableRow>
                  ) : campaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">No campaign audiences yet</TableCell></TableRow>
                  ) : campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.campaign_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(c.environments || []).join(", ")} · {c.target_age_min}-{c.target_age_max} · {c.target_gender}
                      </TableCell>
                      <TableCell>{(c.countries || []).join(", ") || "Philippines"}</TableCell>
                      <TableCell>{estimateReach(c.environments).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-gray-500">{c.created_at ? format(new Date(c.created_at), "MMM d, yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
          <TabsContent value="saved">
            <Card className="p-12 bg-white border border-gray-200 text-center text-gray-500">
              No saved audiences yet
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import BrandApprovalGate from "@/components/brand-advertiser/BrandApprovalGate";

export default function BrandAdvertiserAudiencesGated() {
  return (
    <BrandApprovalGate>
      <BrandAdvertiserAudiences />
    </BrandApprovalGate>
  );
}
