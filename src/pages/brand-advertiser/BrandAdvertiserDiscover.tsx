import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Layers, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";
import { useAdvertiserProfile } from "@/hooks/useAdvertiserProfile";

const MEDIA_TYPES = ["OOH", "DOOH", "AOOH"] as const;

export type MarketplaceRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  media_urls: any;
  specifications: any;
  pricing: any;
  media_type: string;
  media_types: string[] | null;
  total_ad_units: number | null;
  monthly_subscription_fee: number | null;
  activation_fee: number | null;
  media_owner_name: string | null;
  availability_status: string | null;
  contact_verified_at: string | null;
  tenant_id: string | null;
  agent_id: string | null;
  publisher_id: string | null;
  created_at: string;
};

export const firstImage = (media: any): string | null => {
  const arr = Array.isArray(media) ? media : media?.images || media?.urls;
  if (Array.isArray(arr) && arr.length) return typeof arr[0] === "string" ? arr[0] : arr[0]?.url || null;
  return null;
};

export const monthlyRate = (row: MarketplaceRow): number => {
  const p = row.pricing || {};
  return Number(row.monthly_subscription_fee || p.monthly || p.monthly_rate || p.price || 0);
};

export default function BrandAdvertiserDiscover() {
  const { companyName, totalBudget } = useAdvertiserProfile();
  const [rows, setRows] = useState<MarketplaceRow[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("marketplace_inventory")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) toast.error("Could not load the inventory marketplace");
      setRows((data as MarketplaceRow[]) || []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: savedRows } = await (supabase as any)
          .from("advertiser_saved_inventory")
          .select("ad_space_id")
          .eq("user_id", session.user.id);
        const map: Record<string, boolean> = {};
        (savedRows || []).forEach((r: any) => { map[r.ad_space_id] = true; });
        setSaved(map);
      }
      setLoading(false);
    })();
  }, []);

  const toggleSaved = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    if (saved[id]) {
      await (supabase as any).from("advertiser_saved_inventory").delete()
        .eq("user_id", session.user.id).eq("ad_space_id", id);
      setSaved((p) => ({ ...p, [id]: false }));
    } else {
      const { error } = await (supabase as any).from("advertiser_saved_inventory")
        .insert({ user_id: session.user.id, ad_space_id: id });
      if (error) { toast.error("Could not save this listing"); return; }
      setSaved((p) => ({ ...p, [id]: true }));
      toast.success("Saved to your inventory list");
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const cap = Number(maxPrice) || 0;
    return rows.filter((r) => {
      if (needle) {
        const hay = `${r.title} ${r.location || ""} ${r.description || ""} ${r.media_owner_name || ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (types.length) {
        const rowTypes = (r.media_types?.length ? r.media_types : [r.media_type]).map(String);
        if (!rowTypes.some((t) => types.includes(t))) return false;
      }
      if (cap > 0 && monthlyRate(r) > cap) return false;
      return true;
    });
  }, [rows, q, types, maxPrice]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { OOH: 0, DOOH: 0, AOOH: 0 };
    rows.forEach((r) => {
      (r.media_types?.length ? r.media_types : [r.media_type]).forEach((t) => {
        if (c[t as string] !== undefined) c[t as string] += 1;
      });
    });
    return c;
  }, [rows]);

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Discover Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every approved, available ad space across the TrioTag supply network.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 bg-white border-gray-200">
            <p className="text-xs text-gray-500">Available listings</p>
            <p className="text-xl font-semibold text-gray-900">{rows.length}</p>
          </Card>
          {MEDIA_TYPES.map((t) => (
            <Card key={t} className="p-4 bg-white border-gray-200">
              <p className="text-xs text-gray-500">{t}</p>
              <p className="text-xl font-semibold text-gray-900">{counts[t]}</p>
            </Card>
          ))}
        </div>

        <Card className="p-4 bg-white border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, city, venue or media owner"
                className="pl-9 bg-white text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              {MEDIA_TYPES.map((t) => {
                const active = types.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => setTypes((p) => (active ? p.filter((x) => x !== t) : [...p, t]))}
                    className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                      active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <Input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Max ₱ / month"
              className="md:w-44 bg-white text-gray-900"
            />
          </div>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading inventory...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-14 text-center bg-white border-gray-200">
            <Layers className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-gray-900 font-medium mt-3">No matching inventory</p>
            <p className="text-sm text-gray-500 mt-1">Try widening your filters.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const img = firstImage(r.media_urls);
              const rate = monthlyRate(r);
              return (
                <Card key={r.id} className="overflow-hidden bg-white border-gray-200 flex flex-col">
                  <Link to={`/brand-advertiser/inventory/${r.id}`} className="block">
                    <div className="h-40 bg-gray-100">
                      {img ? (
                        <img src={img} alt={r.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Layers className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/brand-advertiser/inventory/${r.id}`}
                        className="font-medium text-gray-900 hover:underline line-clamp-1"
                      >
                        {r.title}
                      </Link>
                      <button onClick={() => toggleSaved(r.id)} aria-label="Save listing">
                        <Heart className={`w-4 h-4 ${saved[r.id] ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 line-clamp-1">
                      <MapPin className="w-3 h-3" /> {r.location || "Location on request"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {(r.media_types?.length ? r.media_types : [r.media_type]).map((t) => (
                        <Badge key={String(t)} variant="secondary">{String(t)}</Badge>
                      ))}
                      {r.contact_verified_at && <Badge className="bg-green-600">Verified</Badge>}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-900 font-semibold">
                        {rate > 0 ? `₱${rate.toLocaleString()}/mo` : "Rate on request"}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/brand-advertiser/inventory/${r.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
