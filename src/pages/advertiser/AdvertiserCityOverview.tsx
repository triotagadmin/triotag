import { Link, useNavigate, useParams } from "react-router-dom";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Share2, Plus, Users, Building2, LayoutGrid, Clock,
  TrendingUp, Globe, ShoppingBag, Calendar, MapPin,
} from "lucide-react";
import { useEffect, useRef } from "react";
import {
  getCity, getAreasForCity, citySlug, areaSlug,
  MEDIA_TYPE_BREAKDOWN, VENUE_TYPE_BREAKDOWN,
} from "@/lib/inventoryAggregation";

export default function AdvertiserCityOverview() {
  const { city: citySlugParam = "" } = useParams();
  const navigate = useNavigate();
  const city = getCity(citySlugParam);
  const areas = city ? getAreasForCity(city.city) : [];
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    let map: any;
    (async () => {
      const L = await import("leaflet");

      if (cancelled || !mapRef.current) return;
      map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false }).setView([city.lat, city.lng], 11);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      L.circle([city.lat, city.lng], { radius: 6000, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.12, weight: 2 }).addTo(map);
      L.marker([city.lat, city.lng]).addTo(map);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [city]);

  if (!city) {
    return (
      <div className="p-10">
        City not found. <Link to="/advertiser/explore" className="text-green-600">Back</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white text-gray-900 font-sans">
      <AdvertiserSidebar />
      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-8 py-6 border-b border-gray-100">
          <Link to="/advertiser/explore" className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to World Map
          </Link>
          <div className="flex items-start justify-between mt-3 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-3xl">{city.flag}</span>
                {city.city}, {city.country}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Explore aggregated ad inventory and audience insights for {city.city}.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 rounded-lg">
                <Share2 className="w-4 h-4 mr-2" /> Share Location
              </Button>
              <Button onClick={() => navigate(`/advertiser/campaigns/create?city=${citySlug(city.city)}`)} className="bg-green-600 hover:bg-green-500 text-white rounded-lg">
                <Plus className="w-4 h-4 mr-2" /> Create Campaign
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { l: "Region", v: city.region },
              { l: "Country", v: city.country },
              { l: "Time Zone", v: city.timezone },
              { l: "Currency", v: city.currency },
            ].map((m) => (
              <div key={m.l} className="border border-gray-200 rounded-full px-4 py-2">
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">{m.l}</div>
                <div className="text-sm font-semibold text-gray-900">{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left 60% */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { Icon: Users, l: "Total Reach (Daily)", v: `${(city.reachDaily/1000).toFixed(0)}K`, h: "Estimated people reached daily" },
                { Icon: Building2, l: "Active Venues", v: city.activeVenues, h: "Venues with live inventory" },
                { Icon: LayoutGrid, l: "Ad Inventory", v: city.inventory, h: "Total available ad spaces" },
                { Icon: Clock, l: "Avg. Dwell Time", v: "25–40m", h: "Across all venue types" },
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
              <div className="space-y-4 mt-3">
                {MEDIA_TYPE_BREAKDOWN.map((m) => (
                  <div key={m.channel}>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-semibold text-gray-900">{m.label}</div>
                        <div className="text-xs text-gray-500">{m.desc}</div>
                      </div>
                      <div className={`font-bold ${m.channel === "OOH" ? "text-green-600" : m.channel === "DOOH" ? "text-blue-600" : "text-red-500"}`}>
                        {Math.round((city.inventory * m.pct) / 100)} Spaces
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="text-green-600 text-sm font-medium mt-4">View full breakdown →</button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">Inventory by Area</h3>
                  <p className="text-xs text-gray-500">Browse aggregated inventory by neighborhood</p>
                </div>
                <select className="border border-gray-200 rounded-lg text-sm px-3 py-1.5">
                  <option>Sort: Reach (High to Low)</option>
                </select>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {areas.map((a) => (
                  <div key={a.name} className="min-w-[260px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="relative h-32">
                      <img src={a.photo} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute top-2 right-2">
                        <span className={
                          a.traffic === "High"
                            ? "bg-green-600 text-white rounded-full px-3 py-1 text-[10px] font-bold"
                            : "bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-[10px] font-bold"
                        }>{a.traffic} Traffic</span>
                      </div>
                      <div className="absolute bottom-2 left-3 text-white">
                        <div className="font-bold">{a.name}</div>
                        <div className="text-[11px] opacity-90">{a.description}</div>
                      </div>
                    </div>
                    <div className="p-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div><div className="text-gray-500">Reach</div><div className="text-green-600 font-bold">{(a.reachDaily/1000).toFixed(0)}K</div></div>
                      <div><div className="text-gray-500">Venues</div><div className="text-green-600 font-bold">{a.activeVenues}</div></div>
                      <div><div className="text-gray-500">Inventory</div><div className="text-green-600 font-bold">{a.inventory}</div></div>
                    </div>
                    <div className="px-3 pb-3">
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/advertiser/explore/${citySlug(city.city)}/${areaSlug(a.name)}`)}
                        className="w-full border-green-600 text-green-600 hover:bg-green-50 rounded-lg h-9 text-sm"
                      >
                        View Area Details →
                      </Button>
                    </div>
                  </div>
                ))}
                {areas.length === 0 && (
                  <div className="text-sm text-gray-500 px-4 py-6">No area breakdown available for this city yet.</div>
                )}
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-5 flex items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[220px]">
                <h4 className="font-bold text-gray-900">Why advertise in {city.city}?</h4>
                <p className="text-sm text-gray-700 mt-1">A high-density market with diverse, brand-receptive audiences.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { Icon: TrendingUp, l: "High Foot Traffic" },
                  { Icon: Users, l: "Diverse Audience" },
                  { Icon: ShoppingBag, l: "Strong Purchasing Power" },
                  { Icon: Calendar, l: "Year-Round Activity" },
                ].map((b) => (
                  <div key={b.l} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-green-100 text-xs">
                    <b.Icon className="w-4 h-4 text-green-600" /> {b.l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 40% */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden border border-gray-100 h-[280px]">
              <div ref={mapRef} className="w-full h-full" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Inventory by Venue Type</h3>
                <button className="text-green-600 text-sm font-medium">View all</button>
              </div>
              <div className="space-y-3">
                {VENUE_TYPE_BREAKDOWN.map((v) => (
                  <div key={v.name}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{v.emoji}</span>
                        <span className="text-gray-900">{v.name}</span>
                      </div>
                      <div className="text-green-600 font-bold">{v.pct}% <span className="text-gray-400 font-normal text-xs">({v.spaces} Spaces)</span></div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-green-500" style={{ width: `${v.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
