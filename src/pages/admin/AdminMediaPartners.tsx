import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BadgeCheck, CheckCircle2, ExternalLink, Loader2, Search, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { fetchPartnerTaxonomy, partnerFileKind, type PartnerTaxonomy } from "@/lib/partnerTaxonomy";

type Partner = {
  id: string;
  user_id: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  website: string | null;
  partner_category: string | null;
  specializations: string[];
  capabilities: string[];
  company_description: string | null;
  service_coverage: string | null;
  coverage_regions: string[];
  coverage_provinces: string[];
  coverage_cities: string[];
  coverage_countries: string[];
  business_address: string | null;
  notable_clients: string | null;
  industries_served: string[];
  years_experience: number | null;
  availability: string[];
  certifications: unknown;
  verified: boolean | null;
  status: string;
  is_featured: boolean;
  created_at: string;
};

type PortfolioItem = {
  id: string;
  partner_id: string;
  item_type: string;
  platform: string | null;
  title: string | null;
  url: string | null;
  file_path: string | null;
  mime_type: string | null;
};

export default function AdminMediaPartners() {
  const [taxonomy, setTaxonomy] = useState<PartnerTaxonomy | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [specialization, setSpecialization] = useState("all");
  const [verification, setVerification] = useState("all");
  const [selected, setSelected] = useState<Partner | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [tax, { data, error }] = await Promise.all([
        fetchPartnerTaxonomy(),
        supabase.from("print_partner_profiles").select("*").order("created_at", { ascending: false }),
      ]);
      if (error) throw error;
      setTaxonomy(tax);
      setPartners((data ?? []) as unknown as Partner[]);
      const { data: portfolio } = await supabase
        .from("partner_portfolio_items")
        .select("id, partner_id, item_type, platform, title, url, file_path, mime_type")
        .order("sort_order");
      setItems((portfolio ?? []) as PortfolioItem[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const tagName = (slug: string) =>
    taxonomy?.specializations.find((s) => s.slug === slug)?.name ??
    taxonomy?.capabilities.find((s) => s.slug === slug)?.name ?? slug;
  const categoryName = (slug: string | null) =>
    taxonomy?.categories.find((c) => c.slug === slug)?.name ?? "Uncategorized";

  const specializationOptions = useMemo(() => {
    if (!taxonomy) return [];
    if (category === "all") return taxonomy.specializations;
    const cat = taxonomy.categories.find((c) => c.slug === category);
    return taxonomy.specializations.filter((s) => s.category_id === cat?.id);
  }, [taxonomy, category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return partners.filter((p) => {
      if (category !== "all" && p.partner_category !== category) return false;
      if (specialization !== "all" && !p.specializations?.includes(specialization)) return false;
      if (verification === "verified" && !p.verified) return false;
      if (verification === "pending" && p.verified) return false;
      if (!q) return true;
      const locations = [
        p.business_address ?? "",
        ...(p.coverage_regions ?? []),
        ...(p.coverage_provinces ?? []),
        ...(p.coverage_cities ?? []),
        ...(p.coverage_countries ?? []),
      ].join(" ");
      return [p.company_name, p.contact_person, p.contact_email, locations].join(" ").toLowerCase().includes(q);
    });
  }, [partners, search, category, specialization, verification]);

  const update = async (partner: Partner, patch: Record<string, unknown>, message: string) => {
    const { error } = await supabase.from("print_partner_profiles").update(patch as never).eq("id", partner.id);
    if (error) return toast.error(error.message);
    toast.success(message);
    setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, ...(patch as object) } as Partner : p)));
    setSelected((prev) => (prev && prev.id === partner.id ? ({ ...prev, ...(patch as object) } as Partner) : prev));
  };

  const openPartner = async (partner: Partner) => {
    setSelected(partner);
    const urls: Record<string, string> = {};
    for (const file of items.filter((i) => i.partner_id === partner.id && i.file_path)) {
      const { data } = await supabase.storage.from("partner-portfolio").createSignedUrl(file.file_path as string, 3600);
      if (data?.signedUrl) urls[file.id] = data.signedUrl;
    }
    setMediaUrls(urls);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar role="admin" />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">Media Partners</h1>
              <p className="text-sm text-muted-foreground">Review, verify and feature production, print and talent partners.</p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Filters</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search company, contact person or location" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={category} onValueChange={(v) => { setCategory(v); setSpecialization("all"); }}>
                <SelectTrigger className="md:w-[190px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {taxonomy?.categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger className="md:w-[200px]"><SelectValue placeholder="Specialization" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All specializations</SelectItem>
                  {specializationOptions.map((s) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={verification} onValueChange={setVerification}>
                <SelectTrigger className="md:w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-14 text-center text-muted-foreground">No partners match these filters.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <Card key={p.id} className="flex flex-col">
                  <CardContent className="p-5 space-y-3 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-semibold truncate">{p.company_name}</h2>
                          {p.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{categoryName(p.partner_category)}</p>
                      </div>
                      <Badge variant={p.verified ? "default" : "secondary"}>{p.verified ? "Verified" : "Pending"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.contact_person} · {p.contact_email}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(p.specializations ?? []).slice(0, 3).map((s) => <Badge key={s} variant="secondary" className="text-xs">{tagName(s)}</Badge>)}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Featured</span>
                      <Switch
                        checked={p.is_featured}
                        onCheckedChange={(v) => update(p, { is_featured: v }, v ? "Marked as featured" : "Removed from featured")}
                      />
                    </div>
                  </CardContent>
                  <div className="flex gap-2 p-4 pt-0">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openPartner(p)}>Review</Button>
                    {p.verified ? (
                      <Button variant="outline" size="sm" onClick={() => update(p, { verified: false }, "Verification revoked")}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => update(p, { verified: true, status: "active", approved_at: new Date().toISOString() }, "Partner approved")}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.company_name}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{categoryName(selected.partner_category)}</Badge>
                  <Badge variant={selected.verified ? "default" : "outline"}>{selected.verified ? "Verified" : "Pending review"}</Badge>
                  {selected.is_featured && <Badge className="gap-1"><Sparkles className="w-3 h-3" /> Featured</Badge>}
                </div>
                <p className="text-muted-foreground">{selected.company_description}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <p><span className="text-muted-foreground">Contact:</span> {selected.contact_person}{selected.contact_phone ? ` · ${selected.contact_phone}` : ""}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selected.contact_email}</p>
                  <p><span className="text-muted-foreground">Coverage:</span> {selected.service_coverage ?? "—"}</p>
                  <p><span className="text-muted-foreground">Experience:</span> {selected.years_experience ?? "—"} yrs</p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Areas:</span> {[...(selected.coverage_cities ?? []), ...(selected.coverage_provinces ?? []), ...(selected.coverage_regions ?? []), ...(selected.coverage_countries ?? [])].join(", ") || "—"}</p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Industries:</span> {(selected.industries_served ?? []).join(", ") || "—"}</p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Notable clients:</span> {selected.notable_clients || "—"}</p>
                  <p className="sm:col-span-2"><span className="text-muted-foreground">Availability:</span> {(selected.availability ?? []).join(", ") || "—"}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-1.5">Specializations</h3>
                  <div className="flex flex-wrap gap-1.5">{(selected.specializations ?? []).map((s) => <Badge key={s} variant="secondary">{tagName(s)}</Badge>)}</div>
                </div>
                {(selected.capabilities ?? []).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1.5">Capabilities</h3>
                    <div className="flex flex-wrap gap-1.5">{selected.capabilities.map((s) => <Badge key={s} variant="outline">{tagName(s)}</Badge>)}</div>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Portfolio</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {items.filter((i) => i.partner_id === selected.id).map((item) => {
                      const url = item.url ?? mediaUrls[item.id];
                      const kind = partnerFileKind(item.mime_type);
                      if (item.item_type === "file" && kind === "image" && url) {
                        return <img key={item.id} src={url} alt={item.title ?? "Portfolio sample"} className="rounded-md object-cover aspect-square w-full" loading="lazy" />;
                      }
                      if (item.item_type === "file" && kind === "video" && url) {
                        return <video key={item.id} src={url} controls className="rounded-md w-full aspect-square object-cover" />;
                      }
                      if (item.item_type === "file" && kind === "audio" && url) {
                        return <audio key={item.id} src={url} controls className="w-full sm:col-span-3" />;
                      }
                      return (
                        <a key={item.id} href={url ?? "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 border rounded-md p-3 hover:border-primary/50 text-xs">
                          <ExternalLink className="w-3.5 h-3.5" /> {item.title || item.platform || "View"}
                        </a>
                      );
                    })}
                    {items.filter((i) => i.partner_id === selected.id).length === 0 && (
                      <p className="text-muted-foreground text-xs">No portfolio items submitted.</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  {selected.verified ? (
                    <Button variant="outline" onClick={() => update(selected, { verified: false }, "Verification revoked")}>Revoke verification</Button>
                  ) : (
                    <Button onClick={() => update(selected, { verified: true, status: "active", approved_at: new Date().toISOString() }, "Partner approved")}>Approve & verify</Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => update(selected, { is_featured: !selected.is_featured }, selected.is_featured ? "Removed from featured" : "Marked as featured")}
                  >
                    {selected.is_featured ? "Unfeature" : "Feature partner"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
