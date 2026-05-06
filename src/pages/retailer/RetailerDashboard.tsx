import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  screensOnline: number; screensTotal: number;
  audioOnline: number; audioTotal: number;
  occupancy: { paid: number; house: number; empty: number };
  playsToday: { dooh: number; aooh: number };
  revenueMonth: number;
  creatives: { images: number; videos: number; audio: number; total: number };
}

const Card = ({ children, className = "" }: any) => (
  <div className={`bg-white border border-gray-100 rounded-2xl p-5 shadow-sm ${className}`}>{children}</div>
);

const StatCard = ({ label, value, sub, color = "text-green-600", dot }: any) => (
  <Card>
    <div className="flex items-center gap-2">
      {dot && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span>}
      <div className="text-xs text-zinc-500 font-medium">{label}</div>
    </div>
    <div className={`text-2xl md:text-3xl font-bold mt-1 ${color}`}>{value}</div>
    {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
  </Card>
);

const RetailerDashboard = () => {
  const pubId = useRetailerPublisher();
  const [stats, setStats] = useState<Stats | null>(null);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!pubId) return;
    (async () => {
      const { data: spaceRows } = await supabase.from("ad_spaces").select("id, title, location, ad_format").eq("publisher_id", pubId);
      const ids = (spaceRows || []).map((s) => s.id);
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const [dSes, aSes, dPlays, aPlays, creatives, pendBook] = await Promise.all([
        ids.length ? supabase.from("dooh_player_sessions").select("id, ad_space_id, is_online").in("ad_space_id", ids) : Promise.resolve({ data: [] as any }),
        ids.length ? supabase.from("aooh_player_sessions").select("id, ad_space_id, is_online").in("ad_space_id", ids) : Promise.resolve({ data: [] as any }),
        ids.length ? supabase.from("dooh_play_logs").select("id", { count: "exact", head: true }).in("ad_space_id", ids).gte("played_at", today.toISOString()) : Promise.resolve({ count: 0 } as any),
        ids.length ? supabase.from("aooh_play_logs").select("id", { count: "exact", head: true }).in("ad_space_id", ids).gte("played_at", today.toISOString()) : Promise.resolve({ count: 0 } as any),
        supabase.from("retailer_creatives").select("creative_type").eq("publisher_id", pubId).eq("status", "active"),
        ids.length ? supabase.from("activations").select("id, ad_space_id, status, created_at, total_amount, activation_type").in("ad_space_id", ids).eq("status", "pending_publisher_approval" as any).order("created_at", { ascending: false }).limit(3) : Promise.resolve({ data: [] as any }),
      ]);

      const dArr = (dSes as any).data || []; const aArr = (aSes as any).data || [];
      const cArr = creatives.data || [];
      const occupied = (dArr.filter((s: any) => s.is_online).length + aArr.filter((s: any) => s.is_online).length);
      const total = Math.max(dArr.length + aArr.length, 1);

      setStats({
        screensOnline: dArr.filter((s: any) => s.is_online).length,
        screensTotal: dArr.length,
        audioOnline: aArr.filter((s: any) => s.is_online).length,
        audioTotal: aArr.length,
        occupancy: { paid: 0, house: Math.round((occupied / total) * 100), empty: Math.round(((total - occupied) / total) * 100) },
        playsToday: { dooh: (dPlays as any).count || 0, aooh: (aPlays as any).count || 0 },
        revenueMonth: 0,
        creatives: {
          images: cArr.filter((c) => c.creative_type === "image").length,
          videos: cArr.filter((c) => c.creative_type === "video").length,
          audio: cArr.filter((c) => c.creative_type === "audio").length,
          total: cArr.length,
        },
      });
      setSpaces(spaceRows || []);
      setBookings((pendBook as any).data || []);
    })();
  }, [pubId]);

  if (!stats) return <RetailerLayout title="Overview"><div className="text-sm text-zinc-500">Loading…</div></RetailerLayout>;

  return (
    <RetailerLayout title="Overview">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Screens Online" value={stats.screensOnline} sub={`${stats.screensTotal} screens total`} dot={stats.screensOnline > 0} />
        <StatCard label="Audio Zones Online" value={stats.audioOnline} sub={`${stats.audioTotal} zones total`} dot={stats.audioOnline > 0} />
        <StatCard label="Occupancy Rate" value={`${stats.occupancy.paid + stats.occupancy.house}%`} sub={
          <div className="flex h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-green-500" style={{ width: `${stats.occupancy.paid}%` }} />
            <div className="bg-blue-500" style={{ width: `${stats.occupancy.house}%` }} />
            <div className="bg-gray-300" style={{ width: `${stats.occupancy.empty}%` }} />
          </div>
        } />
        <StatCard label="Plays Today" value={stats.playsToday.dooh + stats.playsToday.aooh} sub={`${stats.playsToday.dooh} screen plays, ${stats.playsToday.aooh} audio plays`} />
        <StatCard label="This Month Revenue" value={`₱${stats.revenueMonth.toLocaleString()}`} />
        <StatCard label="Creative Library" value={stats.creatives.total} sub={`${stats.creatives.images} images, ${stats.creatives.videos} videos, ${stats.creatives.audio} audio`} />
      </div>

      {/* Inventory Health */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-zinc-900">Inventory Health</h2>
          <Link to="/retailer/inventory" className="text-sm text-green-600 hover:underline">View All →</Link>
        </div>
        {spaces.length === 0 ? (
          <Card><div className="text-sm text-zinc-500 text-center py-6">No ad spaces yet. Register your commercial space to start earning.</div></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {spaces.slice(0, 8).map((s) => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">{s.ad_format || "OOH"}</span>
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                </div>
                <div className="text-sm font-semibold text-zinc-900 truncate">{s.title}</div>
                <div className="text-xs text-zinc-500 truncate">{s.location}</div>
                <div className="mt-2 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Empty Slot</div>
                <Link to={`/retailer/inventory`} className="block mt-2 text-xs text-green-600 hover:underline">Manage →</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* This Week */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-zinc-900">This Week</h2>
          <Link to="/retailer/campaign-calendar" className="text-sm text-green-600 hover:underline">Full Calendar →</Link>
        </div>
        <Card>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(); d.setDate(d.getDate() + i);
              const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
              return (
                <div key={i} className={`p-2 rounded-lg border ${i === 0 ? "bg-green-50 border-green-200" : "border-gray-100"}`}>
                  <div className="text-[10px] text-zinc-500 font-semibold">{dayLabel}</div>
                  <div className="text-lg font-bold text-zinc-900">{d.getDate()}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Empty</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Bookings + Activity */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-zinc-900">Recent Booking Requests</h3>
            <Link to="/retailer/booking-requests" className="text-sm text-green-600 hover:underline">View All →</Link>
          </div>
          {bookings.length === 0 ? (
            <div className="text-sm text-zinc-500 text-center py-4">No pending requests.</div>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="border border-orange-200 bg-orange-50/30 rounded-lg p-3">
                  <div className="text-xs font-semibold text-zinc-900">A brand advertiser</div>
                  <div className="text-xs text-zinc-500">₱{Number(b.total_amount || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-bold text-zinc-900 mb-3">Recent Activity</h3>
          <div className="text-sm text-zinc-500 text-center py-4">Your activity feed will appear here.</div>
        </Card>
      </div>
    </RetailerLayout>
  );
};

export default RetailerDashboard;
