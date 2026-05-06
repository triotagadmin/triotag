import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";

const Inventory = () => {
  const pubId = useRetailerPublisher();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [filter, setFilter] = useState({ media: "all", status: "all", online: "all" });

  useEffect(() => {
    if (!pubId) return;
    supabase.from("ad_spaces").select("*").eq("publisher_id", pubId).then(({ data }) => setSpaces(data || []));
  }, [pubId]);

  const filtered = spaces.filter((s) =>
    (filter.media === "all" || (s.ad_format || "").toLowerCase() === filter.media) &&
    (filter.status === "all" || s.approval_status === filter.status)
  );

  return (
    <RetailerLayout title="My Inventory">
      <p className="text-sm text-zinc-600 mb-4">All your ad spaces with live performance and player status.</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={filter.media} onChange={(e) => setFilter({ ...filter, media: e.target.value })} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          <option value="all">All Media</option>
          <option value="ooh">OOH</option>
          <option value="dooh">DOOH</option>
          <option value="aooh">AOOH</option>
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <p className="text-sm text-zinc-600 mb-3">No ad spaces yet. Register your commercial space to start earning from brand advertisers.</p>
          <Link to="/venue/register"><button className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg">Register Ad Space</button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">{s.ad_format || "OOH"}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.approval_status === "approved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{s.approval_status}</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-gray-300" />
              </div>
              <h3 className="font-bold text-zinc-900 truncate">{s.title}</h3>
              <p className="text-xs text-zinc-500 truncate mb-3">{s.location}</p>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div><div className="text-xs text-zinc-500">Active</div><div className="font-bold text-green-600">0</div></div>
                <div><div className="text-xs text-zinc-500">Plays</div><div className="font-bold text-green-600">0</div></div>
                <div><div className="text-xs text-zinc-500">₱ Month</div><div className="font-bold text-green-600">0</div></div>
              </div>
              <div className="flex gap-1.5">
                <Link to={`/venue/${s.id}`} className="flex-1"><button className="w-full text-xs border border-green-500 text-green-600 hover:bg-green-50 font-semibold py-1.5 rounded-lg">View Details</button></Link>
                <Link to="/retailer/screen-monitor" className="flex-1"><button className="w-full text-xs bg-green-600 hover:bg-green-500 text-white font-semibold py-1.5 rounded-lg">Manage Player</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </RetailerLayout>
  );
};

export default Inventory;
