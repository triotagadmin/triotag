import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Search, Image as ImageIcon, Video, Music, Play, ArrowLeft, X, Archive, Pencil } from "lucide-react";

type CreativeType = "image" | "video" | "audio";

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
  </div>
);

const RetailerCreatives = () => {
  const navigate = useNavigate();
  const [pubId, setPubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<CreativeType>("image");
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth?redirect=/retailer-dashboard/creatives", { replace: true }); return; }
      const { data: pub } = await supabase.from("publisher_profiles").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!pub) { navigate("/retailer-dashboard", { replace: true }); return; }
      setPubId(pub.id);
      setLoading(false);
    })();
  }, [navigate]);

  const load = async () => {
    if (!pubId) return;
    const { data } = await supabase.from("retailer_creatives").select("*").eq("publisher_id", pubId).eq("status", "active").order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [pubId]);

  const filtered = items.filter((i) => i.creative_type === tab && (!search || (i.title || "").toLowerCase().includes(search.toLowerCase())));
  const counts = {
    image: items.filter((i) => i.creative_type === "image").length,
    video: items.filter((i) => i.creative_type === "video").length,
    audio: items.filter((i) => i.creative_type === "audio").length,
  };

  const archive = async (id: string) => {
    if (!confirm("Archive this creative?")) return;
    const { error } = await supabase.from("retailer_creatives").update({ status: "archived" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Creative archived");
    load();
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navigation /><PageLoader /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-6xl">
        <Link to="/retailer-dashboard" className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-1">Creative Library</h1>
        <p className="text-sm text-zinc-600 mb-4">Upload and manage your ad creatives.</p>

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
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === t ? "border-green-500 text-green-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>
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
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-green-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button onClick={() => setEditItem(c)} className="bg-white text-zinc-900 p-2 rounded-full" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => archive(c.id)} className="bg-red-600 text-white p-2 rounded-full" title="Archive"><Archive className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-sm font-semibold text-zinc-900 truncate">{c.title}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 uppercase">{c.file_format}</span>
                    {c.width_px && <span className="text-[10px] text-zinc-500">{c.width_px}×{c.height_px}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploadOpen && pubId && <UploadModal onClose={() => { setUploadOpen(false); load(); }} pubId={pubId} initialType={tab} />}
      {editItem && <EditModal item={editItem} onClose={() => { setEditItem(null); load(); }} />}
    </div>
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

const EditModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const [title, setTitle] = useState(item.title || "");
  const [description, setDescription] = useState(item.description || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("retailer_creatives").update({ title, description: description || null }).eq("id", item.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold">Edit Creative</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          <button onClick={save} disabled={saving} className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
};

export default RetailerCreatives;
