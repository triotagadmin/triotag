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
import { Plus, Search } from "lucide-react";
import { format } from "date-fns";
import BrandAdvertiserTopBar from "@/components/brand-advertiser/BrandAdvertiserTopBar";

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
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreate = async () => {
    if (!profileId || !title.trim()) return;
    setSubmitting(true);
    try {
      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${profileId}/${Date.now()}.${ext}`;
        const bucket = fmt === "audio" ? "aooh-audio" : "ad-space-media";
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        fileUrl = pub.publicUrl;
      }
      const { error } = await supabase.from("brand_creative_sets" as any).insert({
        brand_advertiser_id: profileId,
        title: title.trim(),
        creative_format: fmt,
        creative_count: file ? 1 : 0,
        file_url: fileUrl,
      });
      if (error) throw error;
      toast({ title: "Creative set added" });
      setOpen(false); setTitle(""); setFile(null); setFmt("image");
      fetchData();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
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
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Creatives</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-8">No creative sets yet</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{String(s.id).slice(0, 8)}</TableCell>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={s.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">{s.creative_format}</Badge>
                  </TableCell>
                  <TableCell>{s.creative_count}</TableCell>
                  <TableCell className="text-sm text-gray-500">{s.updated_at ? format(new Date(s.updated_at), "MMM d, yyyy") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white text-gray-900">
          <DialogHeader><DialogTitle>Add Creative Set</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Launch Banners" />
            </div>
            <div className="space-y-1.5">
              <Label>Format *</Label>
              <Select value={fmt} onValueChange={(v: any) => setFmt(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image (OOH)</SelectItem>
                  <SelectItem value="video">Video (DOOH)</SelectItem>
                  <SelectItem value="audio">Audio (AOOH)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File (optional)</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !title.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
