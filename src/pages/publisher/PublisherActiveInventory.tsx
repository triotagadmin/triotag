import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Search, Package, Monitor, Volume2, Eye } from "lucide-react";

type Channel = "OOH" | "DOOH" | "AOOH";
type Filter = "All" | Channel;

const FORMAT_BADGE: Record<Channel, string> = {
  OOH: "bg-purple-100 text-purple-700 border-purple-200",
  DOOH: "bg-cyan-100 text-cyan-700 border-cyan-200",
  AOOH: "bg-green-100 text-green-700 border-green-200",
};

function FormatIcon({ type }: { type: string }) {
  if (type === "DOOH") return <Monitor className="w-3.5 h-3.5" />;
  if (type === "AOOH") return <Volume2 className="w-3.5 h-3.5" />;
  return <Package className="w-3.5 h-3.5" />;
}

export default function PublisherActiveInventory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase.rpc("get_active_inventory_all" as any);

      const unique = ((data as any[]) || [])
        .sort((a: any, b: any) => {
          const ad = a.approved_at || a.created_at;
          const bd = b.approved_at || b.created_at;
          return new Date(bd).getTime() - new Date(ad).getTime();
        });

      setSpaces(unique);
      setLoading(false);
    })();
  }, [navigate]);


  // Group rows that represent the same listing (same title+location) so a
  // listing registered with multiple formats shows all its format badges.
  const groupedSpaces = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of spaces) {
      const key = `${(s.title || "").trim().toLowerCase()}|${(s.location || "").trim().toLowerCase()}`;
      const existing = map.get(key);
      const mt = s.media_type as Channel;
      if (!existing) {
        map.set(key, { ...s, media_types: mt ? [mt] : [], rows: [s] });
      } else {
        if (mt && !existing.media_types.includes(mt)) existing.media_types.push(mt);
        existing.rows.push(s);
        // Keep the earliest approval date as "live since"
        const ea = existing.approved_at ? new Date(existing.approved_at).getTime() : Infinity;
        const sa = s.approved_at ? new Date(s.approved_at).getTime() : Infinity;
        if (sa < ea) existing.approved_at = s.approved_at;
      }
    }
    return Array.from(map.values());
  }, [spaces]);

  const counts = useMemo(() => ({
    total: groupedSpaces.length,
    OOH: groupedSpaces.filter((s) => s.media_types.includes("OOH")).length,
    DOOH: groupedSpaces.filter((s) => s.media_types.includes("DOOH")).length,
    AOOH: groupedSpaces.filter((s) => s.media_types.includes("AOOH")).length,
  }), [groupedSpaces]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return groupedSpaces.filter((s) => {
      if (activeFilter !== "All" && !s.media_types.includes(activeFilter)) return false;
      if (!term) return true;
      return (
        (s.title || "").toLowerCase().includes(term) ||
        (s.location || "").toLowerCase().includes(term)
      );
    });
  }, [groupedSpaces, searchTerm, activeFilter]);

  const mediaUrls: string[] = Array.isArray(selectedSpace?.media_urls)
    ? selectedSpace.media_urls
    : [];
  const specsEntries: [string, any][] = selectedSpace?.specifications && typeof selectedSpace.specifications === "object"
    ? Object.entries(selectedSpace.specifications)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Active Inventory</h1>
          <p className="text-gray-500 mt-1">Your currently live and available ad spaces</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Active", value: counts.total, color: "text-gray-900" },
            { label: "OOH Active", value: counts.OOH, color: "text-purple-600" },
            { label: "DOOH Active", value: counts.DOOH, color: "text-cyan-600" },
            { label: "AOOH Active", value: counts.AOOH, color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or location..."
              className="pl-9 bg-white border-gray-200"
            />
          </div>
          <div className="flex gap-2">
            {(["All", "OOH", "DOOH", "AOOH"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  activeFilter === f
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No active inventory found</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              {activeFilter !== "All" || searchTerm
                ? "No spaces match your current filter."
                : "You don't have any approved and available ad spaces right now."}
            </p>
            <Button onClick={() => navigate("/venue-inventory")} className="bg-green-600 hover:bg-green-700">
              Manage My Spaces
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((space) => (
              <div
                key={space.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSpace(space)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedSpace(space); } }}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-green-400 hover:shadow-md transition-all flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{space.title}</h3>
                    {space.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{space.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                    {(space.media_types as Channel[]).map((mt) => (
                      <Badge key={mt} variant="outline" className={`inline-flex items-center gap-1 ${FORMAT_BADGE[mt] || ""}`}>
                        <FormatIcon type={mt} />
                        {mt}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="relative inline-flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
                  </span>
                  <span className="text-xs font-medium text-green-700">Live & Available</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {space.monthly_subscription_fee != null && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">Monthly</div>
                      <div className="text-sm font-semibold text-gray-900">
                        ₱{Number(space.monthly_subscription_fee).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {space.activation_fee != null && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">Activation</div>
                      <div className="text-sm font-semibold text-gray-900">
                        ₱{Number(space.activation_fee).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {space.approved_at && (
                  <div className="text-xs text-gray-500 mb-3">
                    Live since{" "}
                    {new Date(space.approved_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                )}

                <div className="mt-auto">
                  <Button
                    variant="outline"
                    className="w-full border-gray-200 hover:border-green-400 hover:text-green-700"
                    onClick={() => setSelectedSpace(space)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedSpace} onOpenChange={(o) => !o && setSelectedSpace(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedSpace && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-3">
                  <DialogTitle className="text-xl">{selectedSpace.title}</DialogTitle>
                  <div className="flex gap-2">
                  <div className="flex flex-wrap gap-2">
                    {((selectedSpace.media_types as Channel[]) || [selectedSpace.media_type]).filter(Boolean).map((mt: Channel) => (
                      <Badge key={mt} variant="outline" className={`inline-flex items-center gap-1 ${FORMAT_BADGE[mt] || ""}`}>
                        <FormatIcon type={mt} />
                        {mt}
                      </Badge>
                    ))}
                    <Badge className="bg-green-100 text-green-700 border-green-200">Live</Badge>
                  </div>
                </div>
              </DialogHeader>

              {selectedSpace.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {selectedSpace.location}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {selectedSpace.monthly_subscription_fee != null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Monthly Fee</div>
                    <div className="text-lg font-bold">₱{Number(selectedSpace.monthly_subscription_fee).toLocaleString()}</div>
                  </div>
                )}
                {selectedSpace.activation_fee != null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Activation Fee</div>
                    <div className="text-lg font-bold">₱{Number(selectedSpace.activation_fee).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {specsEntries.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Specifications</h4>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {specsEntries.map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 px-3 py-2 text-sm">
                        <span className="text-gray-500 capitalize">{k.replace(/_/g, " ")}</span>
                        <span className="text-gray-900 text-right truncate">
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mediaUrls.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Media</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {mediaUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Media ${i + 1}`}
                        className="w-full h-24 object-cover rounded-md border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedSpace.approved_at && (
                <div className="text-xs text-gray-500">
                  Live since{" "}
                  {new Date(selectedSpace.approved_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedSpace(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
