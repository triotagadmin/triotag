import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdvertiserSidebar } from "@/components/advertiser/AdvertiserSidebar";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Bell, X, Users, Building2, LayoutGrid, ChevronLeft, ChevronRight,
  Globe, Layers, ShieldCheck, BadgeCheck, SlidersHorizontal, MapPin, Plus,
  Map as MapIcon, MapOff,
} from "lucide-react";
import {
  fetchApprovedSpaces, aggregateByCity, aggregateMediaTypes,
  citySlug, type CityMarker, type ApprovedAdSpaceLite,
} from "@/lib/inventoryAggregation";
import { CampaignWizard } from "@/components/advertiser/CampaignWizard";

export default function AdvertiserExplore() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<ApprovedAdSpaceLite[] | null>(null);
  const [selected, setSelected] = useState<CityMarker | null>(null);
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => { fetchApprovedSpaces().then(setSpaces); }, []);

  const cities = useMemo(() => spaces ? aggregateByCity(spaces) : [], [spaces]);

  // Init Leaflet map
  useEffect(() => {
    if (!mapVisible) return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [20, 30], zoom: 2, minZoom: 2,
        worldCopyJump: true, zoomControl: true, scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap, © CARTO", maxZoom: 19,
      }).addTo(map);
    })();
    return () => {
      cancelled = true;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [mapVisible]);

  // Render bubbles when cities update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || cities.length === 0) return;
    (async () => {
      const L = await import("leaflet");
      const layer = L.layerGroup().addTo(map);
      cities.forEach((c) => {
        const size = Math.max(34, Math.min(70, 28 + Math.sqrt(c.inventory) * 6));
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
        L.marker([c.lat, c.lng], { icon }).addTo(layer).on("click", () => setSelected(c));
      });
      // Fit to bubbles if any
      if (cities.length > 0) {
        const bounds = L.latLngBounds(cities.map((c) => [c.lat, c.lng] as [number, number]));
        map.fitBounds(bounds.pad(0.3), { maxZoom: 6 });
      }
      return () => { layer.remove(); };
    })();
  }, [cities]);

  const filtered = cities.filter((c) =>
    !search || c.city.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase())
  );

  const selectedSpaces = useMemo(
    () => selected && spaces ? spaces.filter((s) => (s.location ?? "").toLowerCase().includes(selected.city.toLowerCase())) : [],
    [selected, spaces]
  );
  const selectedMedia = useMemo(() => aggregateMediaTypes(selectedSpaces), [selectedSpaces]);

  const isLoading = spaces === null;
  const isEmpty = !isLoading && cities.length === 0;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <Navigation />
      <div className="flex">
        <AdvertiserSidebar />

        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <header className="px-6 lg:px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-[#111827]">Explore Ad Inventory by Location</h1>
                <p className="text-gray-500 mt-1 text-sm">
                  Discover live ad opportunities in cities where we have approved inventory.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setWizardOpen(true)} className="h-10 bg-green-600 hover:bg-green-500 text-white rounded-lg">
                  <Plus className="w-4 h-4 mr-1" /> Create Campaign
                </Button>
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
              </div>
            </div>

            {/* Filters (UI only) */}
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
                </SelectContent>
              </Select>
              <button className="h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 inline-flex items-center gap-2 hover:bg-gray-50">
                <SlidersHorizontal className="w-4 h-4" /> More Filters
              </button>
              <button
                onClick={() => setMapVisible((p) => !p)}
                className={`h-10 px-4 rounded-lg border text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                  mapVisible
                    ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100"
                    : "border-gray-200 text-gray-700 hover:border-green-500 hover:text-green-600"
                }`}
              >
                {mapVisible ? <MapOff className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
                {mapVisible ? "Hide Map" : "Show Map"}
              </button>
              <button className="h-10 ml-auto text-green-600 hover:text-green-700 text-sm font-medium" onClick={() => setSearch("")}>
                Reset Filters
              </button>
            </div>
          </header>

          {/* Map + side panel */}
          {mapVisible && (
            <section className="relative flex transition-all duration-300 ease-in-out">
              <div className="flex-1 min-h-[520px] bg-[#f0faf0] relative">
                <div ref={mapRef} className="w-full h-[520px]" />
                {isEmpty && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-2xl px-6 py-5 text-center shadow-md max-w-sm">
                      <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="font-bold text-gray-900">No inventory yet</div>
                      <div className="text-sm text-gray-500 mt-1">Inventory is being onboarded. Check back soon.</div>
                    </div>
                  </div>
                )}
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
                    <div className="text-green-700 font-bold text-base">—</div>
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
                  {selectedMedia.map((m) => (
                    <div key={m.channel} className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${m.channel === "OOH" ? "bg-green-600" : m.channel === "DOOH" ? "bg-blue-500" : "bg-red-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{m.channel}</div>
                      </div>
                      <div className="text-green-600 font-bold text-sm">{m.count}</div>
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
            {isEmpty ? (
              <div className="text-sm text-gray-500 py-6 text-center border border-dashed border-gray-200 rounded-xl">
                Inventory is being onboarded. Check back soon.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {filtered.map((c) => {
                  const isActive = selected?.city === c.city;
                  return (
                    <button
                      key={c.city}
                      onClick={() => setSelected(c)}
                      className={
                        "min-w-[220px] text-left rounded-xl p-4 transition-all bg-white " +
                        (isActive ? "border-2 border-green-500 bg-green-50" : "border border-gray-200 hover:border-green-300")
                      }
                    >
                      <div className="text-2xl">{c.flag}</div>
                      <div className="mt-1 font-bold text-gray-900">{c.city}</div>
                      <div className="text-xs text-gray-500 mb-3">{c.country}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Reach/day</span><span className="text-green-600 font-bold">—</span></div>
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
            )}
          </section>

          {/* Trust bar */}
          <section className="bg-green-50 border-t border-green-100 px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { Icon: Globe, t: "Global Coverage", d: "Reach your audience wherever our partners operate" },
                { Icon: Layers, t: "Multi-Format Inventory", d: "OOH, DOOH, and AOOH inventory available" },
                { Icon: BadgeCheck, t: "Verified Listings", d: "All inventory is reviewed before going live" },
                { Icon: ShieldCheck, t: "Brand-Safe Locations", d: "All venues are pre-vetted to ensure quality" },
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
      <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
