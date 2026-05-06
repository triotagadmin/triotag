import { useEffect, useState } from "react";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, ExternalLink, Plus, X } from "lucide-react";

const ScreenMonitor = () => {
  const pubId = useRetailerPublisher();
  const [doohSes, setDoohSes] = useState<any[]>([]);
  const [aoohSes, setAoohSes] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [addType, setAddType] = useState<"dooh" | "aooh" | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newSpace, setNewSpace] = useState("");

  const load = async () => {
    if (!pubId) return;
    const { data: sp } = await supabase.from("ad_spaces").select("id, title").eq("publisher_id", pubId);
    setSpaces(sp || []);
    const ids = (sp || []).map((s) => s.id);
    if (!ids.length) return;
    const [d, a] = await Promise.all([
      supabase.from("dooh_player_sessions").select("*").in("ad_space_id", ids),
      supabase.from("aooh_player_sessions").select("*").in("ad_space_id", ids),
    ]);
    setDoohSes(d.data || []);
    setAoohSes(a.data || []);
  };
  useEffect(() => { load(); }, [pubId]);

  // Realtime
  useEffect(() => {
    if (!pubId) return;
    const ch = supabase.channel("retailer-screens")
      .on("postgres_changes", { event: "*", schema: "public", table: "dooh_player_sessions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "aooh_player_sessions" }, () => load())
      .subscribe();
    const interval = setInterval(load, 30000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
  }, [pubId]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Token copied!"); };

  const createSession = async () => {
    if (!newSpace || !newLabel || !addType || !pubId) return;
    const table = addType === "dooh" ? "dooh_player_sessions" : "aooh_player_sessions";
    const { data, error } = await supabase.from(table).insert({ ad_space_id: newSpace, venue_id: pubId, label: newLabel }).select("access_token").single();
    if (error) return toast.error(error.message);
    setNewToken(data!.access_token);
    load();
  };

  const Section = ({ title, color, sessions, type }: { title: string; color: string; sessions: any[]; type: "dooh" | "aooh" }) => (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden mb-4">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className={`font-bold ${color}`}>{title} ({sessions.filter((s) => s.is_online).length}/{sessions.length} online)</h3>
        <button onClick={() => { setAddType(type); setNewToken(null); setNewLabel(""); setNewSpace(""); }} className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-zinc-500">
            <tr><th className="text-left p-3">Label</th><th className="text-left p-3">Status</th><th className="text-left p-3">Last Active</th><th className="text-left p-3">Actions</th></tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-zinc-500 text-xs">No {type === "dooh" ? "screens" : "audio zones"} yet.</td></tr> :
              sessions.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="p-3 font-semibold">{s.label || "Untitled"}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full ${s.is_online ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
                      {s.is_online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-zinc-500">{s.last_active_at ? new Date(s.last_active_at).toLocaleString() : "Never"}</td>
                  <td className="p-3">
                    <button onClick={() => copy(s.access_token)} className="text-xs text-green-600 hover:underline mr-3 inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy Token</button>
                    <a href={type === "dooh" ? "/player/screen" : "/player/audio"} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Open Player</a>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <RetailerLayout title="Screen Monitor">
      <p className="text-sm text-zinc-600 mb-4">Live status of all your DOOH screens and AOOH audio zones.</p>
      <Section title="DOOH Screens" color="text-blue-600" sessions={doohSes} type="dooh" />
      <Section title="AOOH Audio Zones" color="text-red-600" sessions={aoohSes} type="aooh" />

      {addType && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Add {addType === "dooh" ? "Screen" : "Audio Zone"}</h3>
              <button onClick={() => setAddType(null)}><X className="w-5 h-5" /></button>
            </div>
            {newToken ? (
              <div>
                <p className="text-sm font-semibold mb-2 text-green-700">Access token created</p>
                <div className="bg-gray-50 p-3 rounded-lg text-xs break-all font-mono">{newToken}</div>
                <p className="text-xs text-orange-700 mt-2">⚠️ Save this token — it will not be shown again.</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => copy(newToken)} className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 rounded-lg">Copy Token</button>
                  <button onClick={() => setAddType(null)} className="px-4 py-2 text-sm">Done</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <select value={newSpace} onChange={(e) => setNewSpace(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  <option value="">Select ad space…</option>
                  {spaces.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. 'Main Lobby')" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                <button onClick={createSession} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg">Create</button>
              </div>
            )}
          </div>
        </div>
      )}
    </RetailerLayout>
  );
};

export default ScreenMonitor;
