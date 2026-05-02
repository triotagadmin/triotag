import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Share2, Plus, ShieldCheck, Briefcase, GraduationCap, Plane, Home,
} from "lucide-react";
import {
  getArea, citySlug, areaSlug, MEDIA_TYPE_BREAKDOWN, VENUE_TYPE_BREAKDOWN,
} from "@/lib/inventoryAggregation";

const TABS = ["Overview", "Inventory Breakdown", "Audience Insights", "Traffic & Footfall", "Venue Types", "Media Examples"];

const DAYPARTS = [
  { l: "Weekdays 12PM–2PM", v: 162 },
  { l: "Weekdays 6PM–8PM", v: 148 },
  { l: "Weekdays 8AM–10AM", v: 112 },
  { l: "Weekends 12PM–2PM", v: 98 },
  { l: "Weekends 6PM–8PM", v: 76 },
];
const TOP_VENUE_REACH = [
  { l: "Cafés / Coffee Shops", reach: "180K+", pct: 40 },
  { l: "Retail Stores", reach: "115K+", pct: 26 },
  { l: "Gyms & Fitness", reach: "72K+", pct: 16 },
  { l: "Hotels", reach: "54K+", pct: 12 },
  { l: "Coworking Spaces", reach: "29K+", pct: 6 },
];
const FORMATS = [
  { l: "Table Tent", channel: "OOH Print", spaces: 96, photo: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80" },
  { l: "Digital Screen", channel: "DOOH Screens", spaces: 78, photo: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80" },
  { l: "Poster / Wall", channel: "OOH Print", spaces: 72, photo: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&q=80" },
  { l: "Audio Ad Slot", channel: "AOOH Audio", spaces: 44, photo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" },
];
const DEMOG = [
  { Icon: Briefcase, l: "Professionals", pct: 58 },
  { Icon: GraduationCap, l: "Students", pct: 17 },
  { Icon: Plane, l: "Tourists", pct: 15 },
  { Icon: Home, l: "Residents", pct: 10 },
];

export default function AdvertiserAreaDetails() {
  const { city: citySlugParam = "", area: areaSlugParam = "" } = useParams();
  const navigate = useNavigate();
  const data = getArea(citySlugParam, areaSlugParam);
  const [tab, setTab] = useState("Overview");
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    let map: any;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapRef.current) return;
      map = L.map(mapRef.current, { zoomControl: false, scrollWheelZoom: false }).setView([data.city.lat, data.city.lng], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(map);
      L.circle([data.city.lat, data.city.lng], { radius: 1500, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.18, weight: 2 }).addTo(map);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [data]);

  if (!data) {
    return <div className="p-10">Area not found. <Link to="/advertiser/explore" className="text-green-600">Back</Link></div>;
  }
  const { city, area } = data;

  return (
    <div className="min-h-screen flex bg-white text-gray-900 font-sans">
      <AdvertiserSidebar />
      <main className="flex-1 min-w-0">
        <div className="px-6 lg:px-8 py-6 border-b border-gray-100">
          <Link to={`/advertiser/explore/${citySlug(city.city)}`} className="text-green-600 text-sm font-medium inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to {city.city} Overview
          </Link>
          <div className="flex items-start justify-between mt-3 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{area.name}</h1>
                <span className={
                  area.traffic === "High"
                    ? "bg-green-600 text-white rounded-full px-3 py-1 text-xs font-bold"
                    : "bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs font-bold"
                }>{area.traffic} Traffic</span>
              </div>
              <p className="text-gray-500 mt-1 text-sm">
                {city.country} · {city.region} · {city.city} · {area.name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 rounded-lg">
                <Share2 className="w-4 h-4 mr-2" /> Share Area
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/advertiser/campaigns/create?city=${citySlug(city.city)}&area=${areaSlug(area.name)}`)}
                className="border-green-600 text-green-600 hover:bg-green-50 rounded-lg"
              >
                <Plus className="w-4 h-4 mr-2" /> Create Campaign
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
            {[
              { l: "Total Reach (Daily)", v: `${(area.reachDaily/1000).toFixed(0)}K`, h: "Estimated daily" },
              { l: "Active Venues", v: area.activeVenues, h: "With live inventory" },
              { l: "Ad Inventory", v: area.inventory, h: "Available ad spaces" },
              { l: "Avg. Dwell Time", v: "25–40m", h: "Across venues" },
              { l: "Foot Traffic Density", v: "Very High", h: "Weekdays 8AM–8PM" },
            ].map((s) => (
              <div key={s.l} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{s.v}</div>
                <div className="text-xs font-medium text-gray-700 mt-1">{s.l}</div>
                <div className="text-[11px] text-gray-500">{s.h}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-6 border-b border-gray-100 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "pb-3 text-sm whitespace-nowrap " +
                  (tab === t ? "text-green-600 font-bold border-b-2 border-green-600" : "text-gray-500 hover:text-gray-800")
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Inventory by Media Type</h4>
                <div className="space-y-3">
                  {MEDIA_TYPE_BREAKDOWN.map((m) => (
                    <div key={m.channel}>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700">{m.label}</span>
                        <span className="font-bold text-gray-900">{Math.round((area.inventory * m.pct)/100)} ({m.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className={`h-full ${m.color}`} style={{ width: `${m.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t flex justify-between text-xs"><span className="text-gray-500">Total</span><span className="font-bold text-green-600">{area.inventory}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Inventory by Venue Type</h4>
                <div className="space-y-3">
                  {VENUE_TYPE_BREAKDOWN.map((v) => (
                    <div key={v.name}>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-700">{v.name}</span>
                        <span className="font-bold text-gray-900">{v.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${v.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm">Top Performing Dayparts</h4>
                <div className="space-y-2 text-xs">
                  {DAYPARTS.map((d) => (
                    <div key={d.l} className="flex justify-between">
                      <span className="text-gray-700">{d.l}</span>
                      <span className="text-green-600 font-bold">{d.v}K</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                {area.name} consistently ranks among the top areas in {city.city} for sustained foot traffic
                and brand-safe placements. Ideal for awareness and consideration campaigns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-900 text-sm">Top Venue Types by Reach</h4>
                  <button className="text-green-600 text-xs font-medium">View all</button>
                </div>
                <table className="w-full text-xs">
                  <thead className="text-gray-500">
                    <tr><th className="text-left py-2">Venue Type</th><th className="text-right">Est. Reach</th><th className="text-right">% of Total</th></tr>
                  </thead>
                  <tbody>
                    {TOP_VENUE_REACH.map((r) => (
                      <tr key={r.l} className="border-t border-gray-100">
                        <td className="py-2 text-gray-800">{r.l}</td>
                        <td className="text-right text-gray-900 font-medium">{r.reach}</td>
                        <td className="text-right text-green-600 font-bold">{r.pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-gray-900 text-sm">Popular Ad Formats</h4>
                  <button className="text-green-600 text-xs font-medium">View all</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {FORMATS.map((f) => (
                    <div key={f.l} className="rounded-xl overflow-hidden border border-gray-100">
                      <img src={f.photo} alt="" className="w-full h-20 object-cover" />
                      <div className="p-2">
                        <div className="text-xs font-bold text-gray-900">{f.l}</div>
                        <div className="text-[10px] text-green-600 font-medium">{f.channel}</div>
                        <div className="text-[10px] text-gray-500">{f.spaces} Spaces</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-green-600 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="text-white">
                <div className="font-bold text-lg">🎯 Ready to launch your campaign in {area.name}?</div>
                <div className="text-white/80 text-sm">Reach the right people in the right place at the right time.</div>
              </div>
              <Button
                onClick={() => navigate(`/advertiser/campaigns/create?city=${citySlug(city.city)}&area=${areaSlug(area.name)}`)}
                className="bg-white text-green-700 hover:bg-gray-100 rounded-lg font-bold"
              >
                Create Campaign in This Area →
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl overflow-hidden border border-gray-100 h-[260px]">
              <div ref={mapRef} className="w-full h-full" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-3">Area Summary</h4>
              <dl className="space-y-2 text-sm">
                <Row l="Location"><span>{area.name}, {city.city}</span></Row>
                <Row l="Coverage (km²)"><span>~6 km²</span></Row>
                <Row l="Population (Daytime)"><span>~520,000</span></Row>
                <Row l="Key Landmarks">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {["Ayala Triangle", "Makati Ave", "BGC Link", "Robinsons Place"].map((t) => (
                      <span key={t} className="bg-green-50 border border-green-100 text-green-700 rounded-full px-2 py-0.5 text-[10px] font-medium">{t}</span>
                    ))}
                  </div>
                </Row>
                <Row l="Best For">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {["Brand Awareness", "Retail", "F&B", "Events"].map((t) => (
                      <span key={t} className="bg-green-50 border border-green-100 text-green-700 rounded-full px-2 py-0.5 text-[10px] font-medium">{t}</span>
                    ))}
                  </div>
                </Row>
                <Row l="Traffic Type"><span>Pedestrian + Vehicular</span></Row>
              </dl>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-900">Reach by Demographic</h4>
                <button className="text-green-600 text-xs font-medium">View full report</button>
              </div>
              <div className="space-y-3">
                {DEMOG.map((d) => (
                  <div key={d.l}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-gray-700"><d.Icon className="w-4 h-4 text-green-600" /> {d.l}</span>
                      <span className="text-green-600 font-bold">{d.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${d.pct}%` }} />
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

function Row({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <dt className="text-gray-500">{l}</dt>
      <dd className="text-gray-900 text-right">{children}</dd>
    </div>
  );
}
