import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Layers, Loader2, Store } from "lucide-react";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";
import { MarketplaceRow, monthlyRate, venueTypeOf } from "./marketplace";

export default function BrandAdvertiserSaved() {
  const { companyName, totalBudget } = useAdvertiserProfile();
  const [rows, setRows] = useState<MarketplaceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data: savedRows } = await (supabase as any)
      .from("advertiser_saved_inventory")
      .select("ad_space_id")
      .eq("user_id", session.user.id);
    const ids = (savedRows || []).map((r: any) => r.ad_space_id);
    if (!ids.length) { setRows([]); setLoading(false); return; }
    const { data } = await (supabase as any)
      .from("marketplace_inventory")
      .select("*")
      .in("id", ids);
    setRows((data as MarketplaceRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await (supabase as any).from("advertiser_saved_inventory").delete()
      .eq("user_id", session.user.id).eq("ad_space_id", id);
    setRows((p) => p.filter((r) => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Saved Inventory</h1>
        <p className="text-sm text-gray-500 mb-6">Listings you shortlisted from the marketplace.</p>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...
          </div>
        ) : rows.length === 0 ? (
          <Card className="p-14 text-center bg-white border-gray-200">
            <Heart className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-900 font-medium mt-3">Nothing saved yet</p>
            <p className="text-sm text-gray-500 mt-1">Save listings from your campaign wizard to compare them later.</p>
            <Button asChild className="mt-4"><Link to="/brand-advertiser/inventory">Browse Ad Inventory</Link></Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r) => (
              <Card key={r.id} className="overflow-hidden bg-white border-gray-200">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      {venueTypeOf(r) ? <Store className="w-5 h-5 text-gray-400" /> : <Layers className="w-5 h-5 text-gray-400" />}
                    </div>
                    <Link to={`/brand-advertiser/inventory/${r.id}`} className="font-medium text-gray-900 hover:underline line-clamp-1 capitalize">
                      {venueTypeOf(r) || "Ad Location"}
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 line-clamp-1">
                    <MapPin className="w-3 h-3" /> {r.location || "Location on request"}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(r.media_types?.length ? r.media_types : [r.media_type]).filter(Boolean).map((t) => (
                      <Badge key={String(t)} variant="secondary">{String(t)}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {monthlyRate(r) > 0 ? `₱${monthlyRate(r).toLocaleString()}/mo` : "On request"}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => remove(r.id)}>Remove</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
