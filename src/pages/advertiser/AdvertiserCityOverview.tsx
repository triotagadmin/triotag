import { Link, useNavigate, useParams } from "react-router-dom";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Share2, Plus, Users, Building2, LayoutGrid, Clock, MapPin,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchApprovedSpaces, aggregateMediaTypes, citySlug, findCityBySlug,
  CITY_COORDS, type ApprovedAdSpaceLite,
} from "@/lib/inventoryAggregation";

export default function AdvertiserCityOverview() {
  const { city: citySlugParam = "" } = useParams();
  const navigate = useNavigate();
  const cityName = findCityBySlug(citySlugParam);
  const meta = cityName ? CITY_COORDS[cityName] : undefined;
  const mapRef = useRef<HTMLDivElement>(null);

  const [spaces, setSpaces] = useState<ApprovedAdSpaceLite[] | null>(null);
  useEffect(() => { fetchApprovedSpaces().then(setSpaces); }, []);

  const citySpaces = useMemo(
    () => cityName && spaces ? spaces.filter((s) => (s.location ?? "").toLowerCase().includes(cityName.toLowerCase())) : [],
    [spaces, cityName]
  );
  const media = useMemo(() => aggregateMediaTypes(citySpaces), [citySpaces]);
  const activeVenues = useMemo(() => new Set(citySpaces.map((s) => s.publisher_id)).size, [citySpaces]);
  const inventory = citySpaces.length;

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;
    let map: any;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current) return;
      map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false }).setView([meta.lat, meta.lng], 11);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      L.circle([meta.lat, meta.lng], { radius: 6000, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.12, weight: 2 }).addTo(map);
      L.marker([meta.lat, meta.lng]).addTo(map);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [meta]);

  if (!cityName || !meta) {
    return (
      <div className="min-h-screen bg-white">
        <Navigation />
        <div className="p-10">
          City not found. <Link to="/advertiser/explore" className="text-green-600">Back</Link>
        </div>
      </div>
    );
  }

  const isLoading = spaces === null;
  const isEmpty = !isLoading && inventory === 0;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      <div className="flex">
        <AdvertiserSidebar />
        <main className="flex-1 min-w-0">
          <div className="px-6 lg:px-8 py-6 border-b border-gray-100">
            <Link to="/advertiser/explore" className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to World Map
            </Link>
            <div className="flex items-start justify-between mt-3 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">{meta.flag}</span>
                  {cityName}, {meta.country}
                </h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Aggregated ad inventory for {cityName}.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 rounded-lg">
                  <Share2 className="w-4 h-4 mr-2" /> Share Location
                </Button>
                <Button onClick={() => navigate(`/advertiser/campaigns/create?city=${citySlug(cityName)}`)} className="bg-green-600 hover:bg-green-500 text-white rounded-lg">
                  <Plus className="w-4 h-4 mr-2" /> Create Campaign
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                { l: "Region", v: meta.region ?? "—" },
                { l: "Country", v: meta.country },
                { l: "Time Zone", v: meta.timezone ?? "—" },
                { l: "Currency", v: meta.currency ?? "—" },
              ].map((m) => (
                <div key={m.l} className="border border-gray-200 rounded-full px-4 py-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">{m.l}</div>
                  <div className="text-sm font-semibold text-gray-900">{m.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { Icon: Users, l: "Total Reach (Daily)", v: "—", h: "Not available yet" },
                  { Icon: Building2, l: "Active Venues", v: isLoading ? "—" : activeVenues, h: "Venues with live inventory" },
                  { Icon: LayoutGrid, l: "Ad Inventory", v: isLoading ? "—" : inventory, h: "Approved ad spaces" },
                  { Icon: Clock, l: "Avg. Dwell Time", v: "—", h: "Not available yet" },
                ].map((s) => (
                  <div key={s.l} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <s.Icon className="w-5 h-5 text-green-600" />
                    <div className="text-2xl font-bold text-gray-900 mt-2">{s.v}</div>
                    <div className="text-xs font-medium text-gray-700">{s.l}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{s.h}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900">Inventory by Media Type</h3>
                {isEmpty ? (
                  <div className="text-sm text-gray-500 py-6 text-center">No inventory available in this city yet.</div>
                ) : (
                  <div className="space-y-4 mt-3">
                    {media.map((m) => {
                      const pct = inventory ? Math.round((m.count / inventory) * 100) : 0;
                      const color = m.channel === "OOH" ? "bg-green-600" : m.channel === "DOOH" ? "bg-blue-500" : "bg-red-500";
                      return (
                        <div key={m.channel}>
                          <div className="flex items-center justify-between text-sm">
                            <div>
                              <div className="font-semibold text-gray-900">{m.channel}</div>
                            </div>
                            <div className="font-bold text-gray-900">{m.count} Spaces</div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                            <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900">Inventory by Area</h3>
                <div className="text-sm text-gray-500 py-6 text-center">
                  No area-level breakdown available yet.
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl overflow-hidden border border-gray-100 h-[280px]">
                <div ref={mapRef} className="w-full h-full" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">Top Venue Types</h3>
                <div className="text-sm text-gray-500 py-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Venue category data not available yet.
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
