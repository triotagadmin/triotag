import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, X, Eye, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

const MAX_FILES = 20;
const MAX_BYTES = 3 * 1024 * 1024;
const BUCKET = "ad-space-media";

export default function BrandAdvertiserCreatives() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("My Brand");
  const [totalBudget, setTotalBudget] = useState(0);
  const [sets, setSets] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fmt, setFmt] = useState<"image" | "video" | "audio">("image");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [viewSet, setViewSet] = useState<any | null>(null);
  const [viewFiles, setViewFiles] = useState<any[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteSet, setDeleteSet] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openView = async (s: any) => {
    setViewSet(s);
    setViewLoading(true);
    const { data } = await supabase
      .from("brand_creative_set_files" as any)
      .select("*")
      .eq("creative_set_id", s.id)
      .order("sort_order", { ascending: true });
    setViewFiles((data as any[]) || []);
    setViewLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteSet) return;
    setDeleting(true);
    try {
      const { data: fileRows } = await supabase
        .from("brand_creative_set_files" as any)
        .select("file_url")
        .eq("creative_set_id", deleteSet.id);
      const paths: string[] = ((fileRows as any[]) || [])
        .map((r) => {
          const marker = `/${BUCKET}/`;
          const idx = (r.file_url as string).indexOf(marker);
          return idx >= 0 ? (r.file_url as string).slice(idx + marker.length) : null;
        })
        .filter((p): p is string => !!p);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
      await supabase.from("brand_creative_set_files" as any).delete().eq("creative_set_id", deleteSet.id);
      const { error: delErr } = await supabase.from("brand_creative_sets" as any).delete().eq("id", deleteSet.id);
      if (delErr) throw delErr;
      toast({ title: "Folder deleted", description: `"${deleteSet.title}" was removed.` });
      setDeleteSet(null);
      fetchData();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const { data: profile } = await supabase
      .from("brand_advertiser_profiles")
      .select("id, company_name")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!profile) { setLoading(false); return; }
    setProfileId(profile.id);
    setCompanyName(profile.company_name || "My Brand");

    const [{ data: camps }, { data: setRows }] = await Promise.all([
      supabase.from("brand_campaigns").select("budget").eq("brand_advertiser_id", profile.id),
      supabase.from("brand_creative_sets" as any).select("*").eq("brand_advertiser_id", profile.id).order("created_at", { ascending: false }),
    ]);
    setTotalBudget((camps || []).reduce((s: number, c: any) => s + Number(c.budget || 0), 0));
    setSets(setRows || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setTitle(""); setFmt("image"); setFiles([]); setFileError(null); setProgress(null);
  };

  const handleFileSelect = (selected: FileList | null) => {
    setFileError(null);
    if (!selected || selected.length === 0) { setFiles([]); return; }
    const arr = Array.from(selected);
    if (arr.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} photos per folder. You selected ${arr.length}.`);
      setFiles([]);
      return;
    }
    const oversized = arr.filter((f) => f.size > MAX_BYTES);
    if (oversized.length > 0) {
      const msgs = oversized.map((f) => `${f.name} is ${(f.size / 1024 / 1024).toFixed(2)}MB — maximum is 3MB per photo.`);
      setFileError(msgs.join(" "));
      setFiles([]);
      return;
    }
    setFiles(arr);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    if (files.length === 0) {
      setFileError("Please select at least 1 photo.");
      return;
    }
    setSubmitting(true);
    setProgress({ done: 0, total: files.length });
    try {
      // Re-fetch profile fresh to avoid stale state / session race
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setFileError("Your session has expired. Please refresh and log in again.");
        setSubmitting(false);
        setProgress(null);
        return;
      }
      const { data: freshProfile, error: profileErr } = await supabase
        .from("brand_advertiser_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profileErr || !freshProfile) {
        setFileError("Could not verify your brand profile. Please refresh the page and try again.");
        setSubmitting(false);
        setProgress(null);
        return;
      }
      const advertiserId = freshProfile.id;



      // 1. Create the set row
      const { data: setRow, error: setErr } = await supabase
        .from("brand_creative_sets" as any)
        .insert({
          brand_advertiser_id: advertiserId,
          title: title.trim(),
          creative_format: fmt,
          creative_count: 0,
        })
        .select("id")
        .single();
      if (setErr) throw setErr;
      const setId = (setRow as any).id as string;

      // 2. Upload files and insert rows
      const fileRows: { creative_set_id: string; file_url: string; file_name: string; file_size_bytes: number; sort_order: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${session.user.id}/${advertiserId}/${setId}/${i}-${safeName}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, f, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        fileRows.push({
          creative_set_id: setId,
          file_url: pub.publicUrl,
          file_name: f.name,
          file_size_bytes: f.size,
          sort_order: i,
        });
        setProgress({ done: i + 1, total: files.length });
      }

      const { error: filesErr } = await supabase
        .from("brand_creative_set_files" as any)
        .insert(fileRows);
      if (filesErr) throw filesErr;

      // 3. Update set with primary file + count
      await supabase
        .from("brand_creative_sets" as any)
        .update({ file_url: fileRows[0].file_url, creative_count: fileRows.length })
        .eq("id", setId);

      toast({ title: "Creative folder saved", description: `${fileRows.length} photo${fileRows.length === 1 ? "" : "s"} uploaded.` });
      setOpen(false);
      resetForm();
      fetchData();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  };

  const filtered = sets.filter((s) => (s.title || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50">
      <BrandAdvertiserTopBar companyName={companyName} totalBudget={totalBudget} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Creative Sets</h1>
          <Button onClick={() => setOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add creative set
          </Button>
        </div>

        <Card className="bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 h-9" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black">ID</TableHead>
                <TableHead className="text-black">Folder Name</TableHead>
                <TableHead className="text-black">Status</TableHead>
                <TableHead className="text-black">Format</TableHead>
                <TableHead className="text-black">Photos</TableHead>
                <TableHead className="text-black">Last Updated</TableHead>
                <TableHead className="text-black text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-black py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-black py-8">No creative sets yet</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs text-black">{String(s.id).slice(0, 8)}</TableCell>
                  <TableCell className="font-medium text-black">{s.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.status === "active" ? "bg-green-100 text-black border-green-200" : "bg-gray-100 text-black border-gray-200"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-black border-blue-200 capitalize">{s.creative_format}</Badge>
                  </TableCell>
                  <TableCell className="text-black">{s.creative_count ?? 0} photo{(s.creative_count ?? 0) === 1 ? "" : "s"}</TableCell>
                  <TableCell className="text-sm text-black">{s.updated_at ? format(new Date(s.updated_at), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openView(s)} className="text-black hover:bg-gray-100">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteSet(s)} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="bg-white text-black">
          <DialogHeader><DialogTitle className="text-black">Add Creative Folder</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-black">Folder Name *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Launch Banners" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-black">Format *</Label>
              <Select value={fmt} onValueChange={(v: any) => setFmt(v)}>
                <SelectTrigger className="text-black"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image (OOH)</SelectItem>
                  <SelectItem value="video">Video (DOOH)</SelectItem>
                  <SelectItem value="audio">Audio (AOOH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-black">Photos * (max {MAX_FILES}, up to 3MB each)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                className="file:bg-gray-300 file:text-black file:border-0 file:rounded file:px-3 file:py-1 file:cursor-pointer"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              {fileError && (
                <p className="text-sm text-red-600">{fileError}</p>
              )}
              {files.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                  <p className="text-xs text-black mb-1">{files.length} file{files.length === 1 ? "" : "s"} selected</p>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-black">
                      <span className="truncate">{f.name} <span className="text-gray-500">({(f.size / 1024 / 1024).toFixed(2)}MB)</span></span>
                      <button type="button" onClick={() => removeFile(i)} className="text-gray-500 hover:text-red-600 ml-2" disabled={submitting}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {progress && (
              <p className="text-sm text-blue-700">Uploading {progress.done} of {progress.total}...</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting} className="text-black">Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !title.trim() || files.length === 0 || !!fileError}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
