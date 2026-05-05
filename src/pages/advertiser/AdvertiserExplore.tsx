import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Bell, X, Users, Building2, LayoutGrid, ChevronLeft, ChevronRight,
  Globe, Layers, ShieldCheck, BadgeCheck, SlidersHorizontal,
} from "lucide-react";
import {
  SEED_CITIES, fetchLiveCityCounts, citySlug, type CityMarker,
  MEDIA_TYPE_BREAKDOWN, VENUE_TYPE_BREAKDOWN,
} from "@/lib/inventoryAggregation";

export default function AdvertiserExplore() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CityMarker[]>(SEED_CITIES);
  const [selected, setSelected] = useState<CityMarker | null>(null);
  const [search, setSearch] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetchLiveCityCounts().then((counts) => {
      if (Object.keys(counts).length === 0) return;
      setCities((prev) =>
        prev.map((c) => (counts[c.city] ? { ...c, inventory: c.inventory + counts[c.city] } : c))
      );
    });
  }, []);

  // Init Leaflet map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");

      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [20, 30],
        zoom: 2,
        minZoom: 2,
        worldCopyJump: true,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO",
        maxZoom: 19,
      }).addTo(map);

      cities.forEach((c) => {
        const size = Math.max(34, Math.min(70, 28 + Math.sqrt(c.inventory) * 2));
        const html = `
          <div style="
            width:${size}px;height:${size}px;border-radius:9999px;
            background:#16a34a;color:#fff;font-weight:700;
            display:flex;align-items:center;justify-content:center;
            font-size:${Math.max(11, size * 0.32)}px;
            box-shadow:0 0 0 4px rgba(22,163,74,0.18), 0 6px 18px rgba(22,163,74,0.45);
            border:2px solid #fff;cursor:pointer;
          ">${c.inventory}</div>`;
        const icon = L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
        L.marker([c.lat, c.lng], { icon })
          .addTo(map)
          .on("click", () => setSelected(c));
      });
    })();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities.length]);

  const filtered = cities.filter((c) =>
    !search || c.city.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-white text-gray-900 font-sans">
      <AdvertiserSidebar />

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="px-6 lg:px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[#111827]">Explore Ad Inventory by Location</h1>
              <p className="text-gray-500 mt-1 text-sm">
                Discover high-impact ad opportunities in key locations around the world.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for a location..."
                  className="pl-9 w-72 h-10 bg-white border-gray-200 text-gray-900 rounded-lg"
                />
              </div>
              <button className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Bell className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center">A</div>
                <div className="text-sm">
                  <div className="font-bold text-gray-900 leading-tight">Brand Advertiser</div>
                  <div className="text-gray-500 text-xs">Advertiser</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <Select defaultValue="all">
              <SelectTrigger className="w-40 h-10 bg-white border-gray-200 rounded-lg"><SelectValue placeholder="Media Type" /></SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="all">Media Type: All</SelectItem>
                <SelectItem value="ooh">OOH</SelectItem>
                <SelectItem value="dooh">DOOH</SelectItem>
                <SelectItem value="aooh">AOOH</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-44 h-10 bg-white border-gray-200 rounded-lg"><SelectValue placeholder="Venue Type" /></SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="all">Venue Type: All</SelectItem>
                <SelectItem value="cafes">Cafés & Coffee Shops</SelectItem>
                <SelectItem value="retail">Retail Stores</SelectItem>
                <SelectItem value="hotels">Hotels</SelectItem>
                <SelectItem value="gyms">Gyms & Fitness</SelectItem>
                <SelectItem value="cowork">Coworking Spaces</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40 h-10 bg-white border-gray-200 rounded-lg"><SelectValue placeholder="Audience" /></SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="all">Audience: All</SelectItem>
                <SelectItem value="prof">Professionals</SelectItem>
                <SelectItem value="stud">Students</SelectItem>
                <SelectItem value="tour">Tourists</SelectItem>
                <SelectItem value="res">Residents</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="any">
              <SelectTrigger className="w-44 h-10 bg-white border-gray-200 rounded-lg"><SelectValue placeholder="Reach (Daily)" /></SelectTrigger>
              <SelectContent className="z-[1000]">
                <SelectItem value="any">Reach: Any</SelectItem>
                <SelectItem value="10k">10K+</SelectItem>
                <SelectItem value="50k">50K+</SelectItem>
                <SelectItem value="100k">100K+</SelectItem>
                <SelectItem value="500k">500K+</SelectItem>
              </SelectContent>
            </Select>
            <button className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 inline-flex items-center gap-2 hover:bg-gray-50">
              <SlidersHorizontal className="w-4 h-4" /> More Filters
            </button>
            <button className="h-10 ml-auto text-green-600 hover:text-green-700 text-sm font-medium">
              Reset Filters
            </button>
          </div>
        </header>

        {/* Map + side panel */}
        <section className="relative flex">
          <div className="flex-1 min-h-[520px] bg-[#f0faf0]">
            <div ref={mapRef} className="w-full h-[520px]" />
          </div>

          {selected && (
            <aside className="w-[340px] bg-white border-l border-gray-100 p-5 overflow-y-auto max-h-[520px]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selected.flag}</span>
                    <h2 className="text-xl font-bold text-gray-900">{selected.city}</h2>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">{selected.region} · {selected.country}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-green-50 rounded-xl p-3">
                  <Users className="w-4 h-4 text-green-600 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Reach/day</div>
                  <div className="text-green-700 font-bold text-base">{(selected.reachDaily/1000).toFixed(0)}K</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <Building2 className="w-4 h-4 text-green-600 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Active Venues</div>
                  <div className="text-green-700 font-bold text-base">{selected.activeVenues}</div>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <LayoutGrid className="w-4 h-4 text-green-600 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">Inventory</div>
                  <div className="text-green-700 font-bold text-base">{selected.inventory}</div>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mt-5 mb-2 text-sm">Inventory by Media Type</h3>
              <div className="space-y-2">
                {MEDIA_TYPE_BREAKDOWN.map((m) => (
                  <div key={m.channel} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{m.label}</div>
                      <div className="text-xs text-gray-500 truncate">{m.desc}</div>
                    </div>
                    <div className="text-green-600 font-bold text-sm">{Math.round((selected.inventory * m.pct)/100)}</div>
                  </div>
                ))}
              </div>

              <h3 className="font-bold text-gray-900 mt-5 mb-2 text-sm">Top Venue Types</h3>
              <div className="space-y-2.5">
                {VENUE_TYPE_BREAKDOWN.map((v) => (
                  <div key={v.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-700">{v.emoji} {v.name}</span>
                      <span className="text-green-600 font-semibold">{v.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-green-500" style={{ width: `${v.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => navigate(`/advertiser/explore/${citySlug(selected.city)}`)}
                className="w-full mt-5 bg-green-600 hover:bg-green-500 text-white rounded-lg"
              >
                View Inventory in {selected.city} →
              </Button>
            </aside>
          )}
        </section>

        {/* City strip */}
        <section className="px-6 lg:px-8 py-6 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-gray-900">Explore Cities</h3>
            <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 ml-auto">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {filtered.map((c) => {
              const isActive = selected?.city === c.city;
              return (
                <button
                  key={c.city}
                  onClick={() => setSelected(c)}
                  className={
                    "min-w-[220px] text-left rounded-xl p-4 transition-all bg-white " +
                    (isActive
                      ? "border-2 border-green-500 bg-green-50"
                      : "border border-gray-200 hover:border-green-300")
                  }
                >
                  <div className="text-2xl">{c.flag}</div>
                  <div className="mt-1 font-bold text-gray-900">{c.city}</div>
                  <div className="text-xs text-gray-500 mb-3">{c.country}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Reach/day</span><span className="text-green-600 font-bold">{(c.reachDaily/1000).toFixed(0)}K</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Active Venues</span><span className="text-green-600 font-bold">{c.activeVenues}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Ad Inventory</span><span className="text-green-600 font-bold">{c.inventory}</span></div>
                  </div>
                  <Link
                    to={`/advertiser/explore/${citySlug(c.city)}`}
                    className="block mt-3 text-green-600 font-medium text-sm hover:text-green-700"
                  >
                    View Location →
                  </Link>
                </button>
              );
            })}
          </div>
        </section>

        {/* Trust bar */}
        <section className="bg-green-50 border-t border-green-100 px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { Icon: Globe, t: "Global Coverage", d: "Reach your audience in 60+ countries and 500+ cities worldwide" },
              { Icon: Layers, t: "Multi-Format Inventory", d: "OOH, DOOH, and AOOH inventory available in every major location" },
              { Icon: BadgeCheck, t: "Verified Reach Data", d: "All reach estimates are data-driven and regularly updated" },
              { Icon: ShieldCheck, t: "Brand-Safe Locations", d: "All venues are pre-vetted to ensure quality and brand safety" },
            ].map((b) => (
              <div key={b.t} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-green-100 flex items-center justify-center shrink-0">
                  <b.Icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{b.t}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{b.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
