import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Heart, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";
import { MarketplaceRow, firstImage, monthlyRate } from "./BrandAdvertiserDiscover";

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

  const images: string[] = (() => {
    const m = row?.media_urls;
    const arr = Array.isArray(m) ? m : m?.images || m?.urls || [];
    return (Array.isArray(arr) ? arr : []).map((x: any) => (typeof x === "string" ? x : x?.url)).filter(Boolean);
  })();

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
          <Button className="mt-4" onClick={() => navigate("/brand-advertiser/discover")}>Back to Discover</Button>
        </div>
      </div>
    );
  }

  const rate = monthlyRate(row);
  const specs: Record<string, any> = row.specifications && typeof row.specifications === "object" ? row.specifications : {};

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <Link to="/brand-advertiser/discover" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Discover
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="overflow-hidden bg-white border-gray-200">
              <div className="h-72 bg-gray-100">
                {firstImage(row.media_urls) ? (
                  <img src={firstImage(row.media_urls)!} alt={row.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><Layers className="w-8 h-8" /></div>
                )}
              </div>
              {images.length > 1 && (
                <div className="p-3 grid grid-cols-5 gap-2">
                  {images.slice(0, 10).map((src, i) => (
                    <img key={i} src={src} alt={`${row.title} ${i + 1}`} loading="lazy" className="h-16 w-full object-cover rounded" />
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 bg-white border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900">{row.title}</h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {row.location || "Location shared after request"}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {(row.media_types?.length ? row.media_types : [row.media_type]).map((t) => (
                  <Badge key={String(t)} variant="secondary">{String(t)}</Badge>
                ))}
                {row.contact_verified_at && <Badge className="bg-green-600">Verified location</Badge>}
              </div>
              {row.description && <p className="text-sm text-gray-700 mt-4 whitespace-pre-line">{row.description}</p>}
            </Card>

            {Object.keys(specs).length > 0 && (
              <Card className="p-5 bg-white border-gray-200">
                <h2 className="font-medium text-gray-900 mb-3">Specifications</h2>
                <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-gray-500 capitalize">{k.replace(/_/g, " ")}</dt>
                      <dd className="text-gray-900">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="p-5 bg-white border-gray-200">
              <p className="text-sm text-gray-500">Monthly rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rate > 0 ? `₱${rate.toLocaleString()}` : "On request"}
              </p>
              {Number(row.activation_fee) > 0 && (
                <p className="text-xs text-gray-500 mt-1">Activation fee ₱{Number(row.activation_fee).toLocaleString()}</p>
              )}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Ad units</span><span className="text-gray-900">{row.total_ad_units ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Availability</span><span className="text-gray-900 capitalize">{row.availability_status || "available"}</span></div>
                {row.media_owner_name && (
                  <div className="flex justify-between"><span className="text-gray-500">Media owner</span><span className="text-gray-900">{row.media_owner_name}</span></div>
                )}
              </div>
              <Button className="w-full mt-5" onClick={() => navigate("/brand-advertiser/campaigns")}>
                Request this inventory
              </Button>
              <Button variant="outline" className="w-full mt-2" onClick={toggleSaved}>
                <Heart className={`w-4 h-4 mr-2 ${saved ? "fill-red-500 text-red-500" : ""}`} />
                {saved ? "Saved" : "Save listing"}
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
