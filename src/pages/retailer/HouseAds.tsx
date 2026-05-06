import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HouseAds = () => {
  const pubId = useRetailerPublisher();
  const [tab, setTab] = useState<"active" | "paused" | "ended">("active");
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!pubId) return;
    const { data } = await supabase.from("house_ad_schedules").select("*, retailer_creatives(title, thumbnail_url, file_url, creative_type), ad_spaces(title)").eq("publisher_id", pubId).order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, [pubId]);

  const filtered = items.filter((i) => i.status === tab);
  const counts = { active: items.filter((i) => i.status === "active").length, paused: items.filter((i) => i.status === "paused").length, ended: items.filter((i) => i.status === "ended").length };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "active" ? "paused" : "active";
    await supabase.from("house_ad_schedules").update({ status: next }).eq("id", id);
    toast.success(`Schedule ${next}`);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Remove this house ad from schedule?")) return;
    await supabase.from("house_ad_schedules").update({ status: "ended" }).eq("id", id);
    load();
  };

  return (
    <RetailerLayout title="House Ads">
      <p className="text-sm text-zinc-600 mb-4">Manage your own promotional content filling empty ad slots across your screens and audio zones.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[["Active House Ads", counts.active], ["Screens Covered", new Set(items.filter((i) => i.media_type === "dooh" && i.status === "active").map((i) => i.ad_space_id)).size], ["Zones Covered", new Set(items.filter((i) => i.media_type === "aooh" && i.status === "active").map((i) => i.ad_space_id)).size], ["Plays Today", items.reduce((s, i) => s + (i.play_count || 0), 0)]].map(([l, v]) => (
          <div key={l as string} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="text-xs text-zinc-500">{l}</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{v as number}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(["active", "paused", "ended"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold border-b-2 ${tab === t ? "border-green-500 text-green-600" : "border-transparent text-zinc-500"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-zinc-500">
            <tr>
              <th className="text-left p-3">Creative</th>
              <th className="text-left p-3">Destination</th>
              <th className="text-left p-3">Schedule</th>
              <th className="text-left p-3">Plays</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-zinc-500">No {tab} house ads.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="p-3"><div className="font-semibold">{s.retailer_creatives?.title || s.title}</div></td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.media_type === "dooh" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>{s.media_type.toUpperCase()}</span>
                  <div className="text-xs text-zinc-500 mt-1">{s.ad_spaces?.title}</div>
                </td>
                <td className="p-3 text-xs">{s.start_date} → {s.end_date || "Indefinite"}</td>
                <td className="p-3 text-green-600 font-semibold">{s.play_count || 0}</td>
                <td className="p-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "paused" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}`}>{s.status}</span></td>
                <td className="p-3">
                  {s.status !== "ended" && <button onClick={() => toggleStatus(s.id, s.status)} className="text-xs text-green-600 hover:underline mr-2">{s.status === "active" ? "Pause" : "Resume"}</button>}
                  <button onClick={() => remove(s.id)} className="text-xs text-red-600 hover:underline">Undeploy</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RetailerLayout>
  );
};

export default HouseAds;
