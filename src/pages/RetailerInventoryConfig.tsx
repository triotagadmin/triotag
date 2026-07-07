import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Package, Monitor, Volume2, Plus, X } from "lucide-react";

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

// Common ad format presets per channel
const FORMAT_PRESETS: Record<"OOH" | "DOOH" | "AOOH", string[]> = {
  OOH: ["Floor Sticker", "Shelf Signage", "Table Tent", "Entrance Banner", "Window Cling", "Wall Poster"],
  DOOH: ["LED Screen", "LCD Display", "Digital Menu Board", "Video Wall", "Interactive Kiosk"],
  AOOH: ["In-Store Audio", "Radio Spot", "PA Announcement", "Ambient Music Ad"],
};

type Units = { OOH: number; DOOH: number; AOOH: number };

const RetailerInventoryConfig = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [space, setSpace] = useState<any>(null);
  const [units, setUnits] = useState<Units>({ OOH: 0, DOOH: 0, AOOH: 0 });
  const [formats, setFormats] = useState<string[]>([]);
  const [newFormat, setNewFormat] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=/retailer-dashboard", { replace: true }); return; }
      if (!spaceId) { navigate("/retailer-dashboard", { replace: true }); return; }

      const { data: pub } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!pub) { navigate("/retailer-dashboard", { replace: true }); return; }

      const { data: sp, error } = await supabase
        .from("ad_spaces")
        .select("id, title, location, media_type, specifications, publisher_id")
        .eq("id", spaceId)
        .eq("publisher_id", pub.id)
        .maybeSingle();
      if (error || !sp) { toast.error("Ad space not found"); navigate("/retailer-dashboard", { replace: true }); return; }

      setSpace(sp);
      const specs = (sp.specifications && typeof sp.specifications === "object") ? (sp.specifications as any) : {};
      const u = specs.units || {};
      setUnits({
        OOH: Number(u.OOH || 0),
        DOOH: Number(u.DOOH || 0),
        AOOH: Number(u.AOOH || 0),
      });
      setFormats(Array.isArray(specs.ad_formats) ? specs.ad_formats : []);
      setLoading(false);
    })();
  }, [spaceId, navigate]);

  const toggleFormat = (f: string) => {
    setFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };
  const addCustomFormat = () => {
    const v = newFormat.trim();
    if (!v) return;
    if (!formats.includes(v)) setFormats([...formats, v]);
    setNewFormat("");
  };
  const removeFormat = (f: string) => setFormats(formats.filter((x) => x !== f));

  const save = async () => {
    if (!space) return;
    setSaving(true);
    const existing = (space.specifications && typeof space.specifications === "object") ? space.specifications : {};
    const nextSpecs = { ...existing, units, ad_formats: formats };
    const { error } = await supabase.from("ad_spaces").update({ specifications: nextSpecs }).eq("id", space.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Inventory configuration saved");
    setSpace({ ...space, specifications: nextSpecs });
    navigate("/retailer-dashboard");
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navigation /><PageLoader /></div>;

  const totalUnits = units.OOH + units.DOOH + units.AOOH;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-4xl">
        <Link to="/retailer-dashboard" className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-1">Configure Inventory</h1>
        <p className="text-sm text-zinc-600 mb-1">{space.title}</p>
        <p className="text-xs text-zinc-500 mb-6">{space.location}</p>

        {/* Unit counts */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Ad Units</h2>
              <p className="text-xs text-zinc-500">How many physical/digital units this inventory has per channel.</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Total</div>
              <div className="text-2xl font-bold text-green-600">{totalUnits}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: "OOH" as const, label: "OOH Units", sub: "Static print placements", Icon: Package, color: "text-purple-600 bg-purple-50" },
              { key: "DOOH" as const, label: "DOOH Units", sub: "Digital screens", Icon: Monitor, color: "text-cyan-600 bg-cyan-50" },
              { key: "AOOH" as const, label: "AOOH Units", sub: "Audio placements", Icon: Volume2, color: "text-green-600 bg-green-50" },
            ].map(({ key, label, sub, Icon, color }) => (
              <div key={key} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">{label}</div>
                    <div className="text-[11px] text-zinc-500">{sub}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUnits((u) => ({ ...u, [key]: Math.max(0, u[key] - 1) }))}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-zinc-600 hover:bg-gray-50"
                  >−</button>
                  <input
                    type="number"
                    min={0}
                    value={units[key]}
                    onChange={(e) => setUnits((u) => ({ ...u, [key]: Math.max(0, Number(e.target.value) || 0) }))}
                    className="flex-1 text-center px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setUnits((u) => ({ ...u, [key]: u[key] + 1 }))}
                    className="w-8 h-8 rounded-lg border border-gray-200 text-zinc-600 hover:bg-gray-50"
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad formats */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Ad Formats</h2>
          <p className="text-xs text-zinc-500 mb-4">Select the ad formats supported by this inventory. Advertisers filter and target using these.</p>

          {(["OOH", "DOOH", "AOOH"] as const).map((channel) => (
            <div key={channel} className="mb-4 last:mb-0">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold mb-2">{channel} formats</div>
              <div className="flex flex-wrap gap-2">
                {FORMAT_PRESETS[channel].map((f) => {
                  const active = formats.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFormat(f)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-zinc-700 border-gray-200 hover:border-green-400"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {formats.some((f) => !Object.values(FORMAT_PRESETS).flat().includes(f)) && (
            <div className="mb-4">
              <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Custom formats</div>
              <div className="flex flex-wrap gap-2">
                {formats.filter((f) => !Object.values(FORMAT_PRESETS).flat().includes(f)).map((f) => (
                  <span key={f} className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-600 text-white">
                    {f}
                    <button onClick={() => removeFormat(f)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input
              value={newFormat}
              onChange={(e) => setNewFormat(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomFormat(); } }}
              placeholder="Add a custom format (e.g. Receipt Ad)"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
            <button
              type="button"
              onClick={addCustomFormat}
              className="inline-flex items-center gap-1 bg-white border border-green-500 text-green-600 hover:bg-green-50 text-sm font-semibold px-3 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Link to="/retailer-dashboard">
            <button className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900">Cancel</button>
          </Link>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetailerInventoryConfig;
