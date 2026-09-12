import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Heart, Layers, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";
import { MarketplaceRow, monthlyRate, venueTypeOf } from "./marketplace";

export default function BrandAdvertiserInventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companyName, totalBudget } = useAdvertiserProfile();
  const [row, setRow] = useState<MarketplaceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("marketplace_inventory")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      setRow((data as MarketplaceRow) || null);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && id) {
        const { data: s } = await (supabase as any)
          .from("advertiser_saved_inventory")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("ad_space_id", id)
          .maybeSingle();
        setSaved(!!s);
      }
      setLoading(false);
    })();
  }, [id]);

  const toggleSaved = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user || !id) return;
    if (saved) {
      await (supabase as any).from("advertiser_saved_inventory").delete()
        .eq("user_id", session.user.id).eq("ad_space_id", id);
      setSaved(false);
    } else {
      const { error } = await (supabase as any).from("advertiser_saved_inventory")
        .insert({ user_id: session.user.id, ad_space_id: id });
      if (error) { toast.error("Could not save this listing"); return; }
      setSaved(true);
      toast.success("Saved to your inventory list");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading listing...
      </div>
    );
  }

  if (!row) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-900 font-medium">This listing isn't available</p>
          <p className="text-sm text-gray-500 mt-1">It may no longer be approved or available for advertising.</p>
          <Button className="mt-4" onClick={() => navigate("/brand-advertiser/inventory")}>Back to Ad Inventory</Button>
        </div>
      </div>
    );
  }

  const rate = monthlyRate(row);
  const venueType = venueTypeOf(row);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-3xl mx-auto px-6 py-6">
        <Link to="/brand-advertiser/inventory" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Ad Inventory
        </Link>

        <Card className="p-6 bg-white border-gray-200">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              {venueType ? <Store className="w-6 h-6 text-gray-400" /> : <Layers className="w-6 h-6 text-gray-400" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {venueType || "Ad Location"}
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 shrink-0" /> {row.location || "Location shared after request"}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {(row.media_types?.length ? row.media_types : [row.media_type]).filter(Boolean).map((t) => (
                  <Badge key={String(t)} variant="secondary">{String(t)}</Badge>
                ))}
                {row.contact_verified_at && <Badge className="bg-green-600">Verified location</Badge>}
              </div>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between sm:block">
              <span className="text-gray-500">Ad units</span>
              <span className="text-gray-900 sm:block sm:font-medium">{row.total_ad_units ?? 0}</span>
            </div>
            <div className="flex justify-between sm:block">
              <span className="text-gray-500">Availability</span>
              <span className="text-gray-900 capitalize sm:block sm:font-medium">{row.availability_status || "available"}</span>
            </div>
            <div className="flex justify-between sm:block">
              <span className="text-gray-500">Monthly rate</span>
              <span className="text-gray-900 sm:block sm:font-medium">
                {rate > 0 ? `₱${rate.toLocaleString()}/mo` : "On request"}
              </span>
            </div>
            {Number(row.activation_fee) > 0 && (
              <div className="flex justify-between sm:block">
                <span className="text-gray-500">Activation fee</span>
                <span className="text-gray-900 sm:block sm:font-medium">₱{Number(row.activation_fee).toLocaleString()}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-5">
            Listing name, photos, and media owner details are shared after your campaign request is approved.
          </p>

          <div className="mt-5 space-y-2">
            <Button className="w-full" onClick={() => navigate("/brand-advertiser/campaigns")}>
              Request this inventory
            </Button>
            <Button variant="outline" className="w-full" onClick={toggleSaved}>
              <Heart className={`w-4 h-4 mr-2 ${saved ? "fill-red-500 text-red-500" : ""}`} />
              {saved ? "Saved" : "Save listing"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
