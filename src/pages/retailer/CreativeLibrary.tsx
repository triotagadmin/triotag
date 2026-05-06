import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RetailerLayout, useRetailerPublisher } from "@/components/retailer/RetailerLayout";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Search, Image as ImageIcon, Video, Music, Play, Rocket, X } from "lucide-react";
import { toast } from "sonner";

type CreativeType = "image" | "video" | "audio";

const CreativeLibrary = () => {
  const pubId = useRetailerPublisher();
  const [params] = useSearchParams();
  const [tab, setTab] = useState<CreativeType>("image");
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(params.get("upload") === "1");
  const [deployFor, setDeployFor] = useState<any | null>(null);

  const load = async () => {
    if (!pubId) return;
    const { data } = await supabase.from("retailer_creatives").select("*").eq("publisher_id", pubId).eq("status", "active").order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, [pubId]);

  const filtered = items.filter((i) => i.creative_type === tab && (!search || i.title.toLowerCase().includes(search.toLowerCase())));
  const counts = {
    image: items.filter((i) => i.creative_type === "image").length,
    video: items.filter((i) => i.creative_type === "video").length,
    audio: items.filter((i) => i.creative_type === "audio").length,
  };

  return (
    <RetailerLayout title="Creative Library">
      <p className="text-sm text-zinc-600 mb-4">Upload and manage your ad creatives. Deploy them to your screens and audio zones.</p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search creatives…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
        </div>
        <button onClick={() => setUploadOpen(true)} className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
          <Upload className="w-4 h-4" /> Upload Creative
        </button>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {(["image", "video", "audio"] as CreativeType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-green-500 text-green-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}
          >
            {t === "image" ? "Images" : t === "video" ? "Videos" : "Audio"} ({counts[t]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          {tab === "image" && <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          {tab === "video" && <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          {tab === "audio" && <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />}
          <p className="text-sm text-zinc-600 mb-3">No {tab}s yet. Upload your first {tab} creative.</p>
          <button onClick={() => setUploadOpen(true)} className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg">Upload {tab}</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="relative aspect-video bg-gray-950 group">
                {c.creative_type === "image" && c.file_url && <img src={c.file_url} alt={c.title} className="w-full h-full object-cover" />}
                {c.creative_type === "video" && (
                  <>
                    {c.thumbnail_url ? <img src={c.thumbnail_url} className="w-full h-full object-cover" alt="" /> : <div className="absolute inset-0 flex items-center justify-center"><Play className="w-10 h-10 text-white/60" /></div>}
                    <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">{c.duration_sec || 0}s</span>
                  </>
                )}
                {c.creative_type === "audio" && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Music className="w-6 h-6 text-green-400" />
                    <div className="flex items-end gap-0.5 h-8">
                      {[0.3, 0.7, 1, 0.5, 0.8].map((h, i) => (
                        <div key={i} className="w-1 bg-green-500 animate-pulse rounded" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button onClick={() => setDeployFor(c)} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-full" title="Deploy"><Rocket className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm font-semibold text-zinc-900 truncate">{c.title}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">{c.file_format}</span>
                  {c.width_px && <span className="text-[10px] text-zinc-500">{c.width_px}×{c.height_px}</span>}
                </div>
                <div className="text-[11px] mt-1.5">
                  {c.used_in_count > 0 ? <span className="text-green-600">Used in {c.used_in_count} schedule{c.used_in_count > 1 ? "s" : ""}</span> : <span className="text-zinc-400">Not deployed</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadOpen && <UploadModal onClose={() => { setUploadOpen(false); load(); }} pubId={pubId!} initialType={tab} />}
      {deployFor && <DeployPanel creative={deployFor} onClose={() => { setDeployFor(null); load(); }} pubId={pubId!} />}
    </RetailerLayout>
  );
};

const UploadModal = ({ onClose, pubId, initialType }: { onClose: () => void; pubId: string; initialType: CreativeType }) => {
  const [type, setType] = useState<CreativeType>(initialType);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ width?: number; height?: number; duration?: number }>({});

  const handleFile = (f: File) => {
    setFile(f);
    setTitle((t) => t || f.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    if (type === "image") {
      const img = new Image();
      img.onload = () => setMeta({ width: img.naturalWidth, height: img.naturalHeight });
      img.src = url;
    } else if (type === "video") {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => setMeta({ width: v.videoWidth, height: v.videoHeight, duration: Math.round(v.duration) });
      v.src = url;
    } else {
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.onloadedmetadata = () => setMeta({ duration: Math.round(a.duration) });
      a.src = url;
    }
  };

  const submit = async () => {
    if (!file) return toast.error("Select a file first");
    setUploading(true);
    try {
      const folder = type === "image" ? "images" : type === "video" ? "videos" : "audio";
      const path = `${pubId}/${folder}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("retailer-creatives").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("retailer-creatives").getPublicUrl(path);

      const aspect = meta.width && meta.height ? `${meta.width}:${meta.height}` : null;
      const { error: insErr } = await supabase.from("retailer_creatives").insert({
        publisher_id: pubId,
        title,
        description: description || null,
        creative_type: type,
        file_url: publicUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        file_format: file.name.split(".").pop()?.toLowerCase(),
        duration_sec: meta.duration || null,
        width_px: meta.width || null,
        height_px: meta.height || null,
        aspect_ratio: aspect,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      if (insErr) throw insErr;
      toast.success("Creative uploaded!");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const accept = type === "image" ? "image/jpeg,image/png,image/webp" : type === "video" ? "video/mp4,video/quicktime" : "audio/mpeg,audio/wav,audio/mp4";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold">Upload Creative</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          <div className="flex gap-2 mb-4">
            {(["image", "video", "audio"] as CreativeType[]).map((t) => (
              <button key={t} onClick={() => { setType(t); setFile(null); setPreviewUrl(null); }} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${type === t ? "bg-green-600 text-white" : "bg-gray-100 text-zinc-700"}`}>
                {t === "image" ? "Image" : t === "video" ? "Video" : "Audio"}
              </button>
            ))}
          </div>

          {!file ? (
            <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-green-400">
              <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-600 mb-1">Drag and drop your {type} here</p>
              <p className="text-xs text-zinc-400 mb-3">or click to browse</p>
              <input type="file" accept={accept} className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <span className="inline-block bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">Browse Files</span>
            </label>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-950 rounded-xl p-3">
                {type === "image" && previewUrl && <img src={previewUrl} alt="" className="w-full max-h-64 object-contain mx-auto" />}
                {type === "video" && previewUrl && <video src={previewUrl} controls className="w-full max-h-64" />}
                {type === "audio" && previewUrl && <audio src={previewUrl} controls className="w-full" />}
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma-separated)" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-1">
                <div><strong>Format:</strong> {file.name.split(".").pop()?.toUpperCase()}</div>
                {meta.width && <div><strong>Resolution:</strong> {meta.width}×{meta.height}</div>}
                {meta.duration && <div><strong>Duration:</strong> {meta.duration}s</div>}
                <div><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div className="flex gap-2">
                <button onClick={submit} disabled={uploading} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                  {uploading ? "Saving…" : "Save to Library"}
                </button>
                <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DeployPanel = ({ creative, onClose, pubId }: { creative: any; onClose: () => void; pubId: string }) => {
  const isAudio = creative.creative_type === "audio";
  const mediaType = isAudio ? "aooh" : "dooh";
  const [destinations, setDestinations] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState(creative.title);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [indef, setIndef] = useState(true);
  const [dayparts, setDayparts] = useState<string[]>(["morning", "afternoon", "evening", "late_night"]);
  const [priority, setPriority] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const table = isAudio ? "aooh_player_sessions" : "dooh_player_sessions";
      const { data: spaces } = await supabase.from("ad_spaces").select("id, title, location").eq("publisher_id", pubId);
      const ids = (spaces || []).map((s) => s.id);
      if (!ids.length) return setDestinations([]);
      const { data } = await supabase.from(table).select("id, ad_space_id, label").in("ad_space_id", ids);
      const enriched = (data || []).map((s: any) => ({ ...s, space: spaces!.find((sp: any) => sp.id === s.ad_space_id) }));
      setDestinations(enriched);
    })();
  }, [pubId, isAudio]);

  const toggleDP = (dp: string) => setDayparts((prev) => prev.includes(dp) ? prev.filter((d) => d !== dp) : [...prev, dp]);

  const deploy = async () => {
    if (selected.length === 0) return toast.error("Select at least one destination");
    setBusy(true);
    try {
      for (const sel of selected) {
        const dest = destinations.find((d) => d.id === sel);
        const { data, error } = await supabase.functions.invoke("deploy-creative", {
          body: {
            creative_id: creative.id,
            ad_space_id: dest.ad_space_id,
            media_type: mediaType,
            title,
            start_date: startDate,
            end_date: indef ? null : endDate || null,
            dayparts,
            priority,
          },
        });
        if (error || (data as any)?.error) throw new Error(error?.message || (data as any).error);
      }
      toast.success("Creative deployed successfully!");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-lg">Deploy Creative</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm font-semibold">{isAudio ? "Audio Zones" : "DOOH Screens"}</div>
          {destinations.length === 0 ? (
            <div className="text-xs text-zinc-500 bg-orange-50 border border-orange-200 rounded-lg p-3">No {isAudio ? "audio zones" : "screens"} yet. <a href="/retailer/screen-monitor" className="text-green-600 underline">Set up players</a>.</div>
          ) : destinations.map((d) => (
            <button key={d.id} onClick={() => setSelected((p) => p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id])} className={`w-full text-left p-3 rounded-lg border-2 ${selected.includes(d.id) ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <div className="text-sm font-semibold">{d.label || "Untitled"}</div>
              <div className="text-xs text-zinc-500">{d.space?.title}</div>
            </button>
          ))}

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="House Ad Title" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <div>
            <label className="text-xs text-zinc-500">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={indef} onChange={(e) => setIndef(e.target.checked)} /> Run indefinitely
          </label>
          {!indef && (
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          )}

          <div>
            <div className="text-xs text-zinc-500 mb-1">Dayparts</div>
            <div className="flex gap-1.5 flex-wrap">
              {[["morning", "Morning"], ["afternoon", "Afternoon"], ["evening", "Evening"], ["late_night", "Late Night"]].map(([key, lbl]) => (
                <button key={key} onClick={() => toggleDP(key)} className={`px-2.5 py-1 text-xs rounded-full font-semibold ${dayparts.includes(key) ? "bg-green-600 text-white" : "bg-gray-100 text-zinc-600"}`}>{lbl}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500">Priority</label>
            <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
              <option value={1}>Low</option>
              <option value={2}>Normal</option>
              <option value={3}>High</option>
            </select>
            <p className="text-[11px] text-zinc-500 mt-1">Paid brand campaigns always take priority over house ads.</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
            This creative will appear on your selected screens when no paid campaign is scheduled during the chosen dayparts.
          </div>

          <button onClick={deploy} disabled={busy} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-lg disabled:opacity-50">
            {busy ? "Deploying…" : "Deploy Now →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreativeLibrary;
