import { useEffect, useMemo, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { BadgeCheck, ExternalLink, Globe, Loader2, Mail, MapPin, Phone, Search, Sparkles } from "lucide-react";
import { fetchPartnerTaxonomy, partnerFileKind, type PartnerTaxonomy } from "@/lib/partnerTaxonomy";
import { toast } from "sonner";

type Partner = {
  id: string;
  company_name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  partner_category: string | null;
  specializations: string[];
  capabilities: string[];
  company_description: string | null;
  service_coverage: string | null;
  coverage_regions: string[];
  coverage_provinces: string[];
  coverage_cities: string[];
  coverage_countries: string[];
  is_featured: boolean;
  verified: boolean | null;
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

const PARTNER_SELECT =
  "id, company_name, contact_person, contact_email, contact_phone, logo_url, website, social_links, partner_category, specializations, capabilities, company_description, service_coverage, coverage_regions, coverage_provinces, coverage_cities, coverage_countries, is_featured, verified";

export default function PartnerDirectory() {
  const [taxonomy, setTaxonomy] = useState<PartnerTaxonomy | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [specialization, setSpecialization] = useState("all");
  const [coverage, setCoverage] = useState("all");
  const [selected, setSelected] = useState<Partner | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [tax, { data, error }] = await Promise.all([
          fetchPartnerTaxonomy(),
          supabase
            .from("print_partner_profiles")
            .select(PARTNER_SELECT)
            .eq("verified", true)
            .eq("status", "active")
            .eq("is_blocked", false)
            .order("is_featured", { ascending: false })
            .order("company_name"),
        ]);
        if (error) throw error;
        setTaxonomy(tax);
        setPartners((data ?? []) as unknown as Partner[]);
        const ids = (data ?? []).map((p) => p.id);
        if (ids.length) {
          const { data: portfolio } = await supabase
            .from("partner_portfolio_items")
            .select("id, partner_id, item_type, platform, title, url, file_path, mime_type")
            .in("partner_id", ids)
            .order("sort_order");
          setItems((portfolio ?? []) as PortfolioItem[]);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load partners");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tagName = (slug: string) =>
    taxonomy?.specializations.find((s) => s.slug === slug)?.name ??
    taxonomy?.capabilities.find((s) => s.slug === slug)?.name ??
    slug;

  const categoryName = (slug: string | null) =>
    taxonomy?.categories.find((c) => c.slug === slug)?.name ?? "Partner";

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
      if (coverage !== "all" && p.service_coverage !== coverage) return false;
      if (!q) return true;
      const locations = [
        ...(p.coverage_regions ?? []),
        ...(p.coverage_provinces ?? []),
        ...(p.coverage_cities ?? []),
        ...(p.coverage_countries ?? []),
      ].join(" ");
      return [p.company_name, p.contact_person, locations, p.company_description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [partners, search, category, specialization, coverage]);

  const openPartner = async (partner: Partner) => {
    setSelected(partner);
    const files = items.filter((i) => i.partner_id === partner.id && i.file_path);
    const urls: Record<string, string> = {};
    for (const file of files) {
      const { data } = await supabase.storage
        .from("partner-portfolio")
        .createSignedUrl(file.file_path as string, 3600);
      if (data?.signedUrl) urls[file.id] = data.signedUrl;
    }
    setMediaUrls(urls);
  };

  const coverageAreas = (p: Partner) =>
    [...(p.coverage_cities ?? []), ...(p.coverage_provinces ?? []), ...(p.coverage_regions ?? []), ...(p.coverage_countries ?? [])];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-20">
        <section className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">Partner Directory</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">TrioTag Media Partners</h1>
            <p className="text-muted-foreground mt-4 text-lg">
              Browse verified production, print and talent partners powering campaigns across the network.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] mt-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search company, contact person or location"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={category} onValueChange={(v) => { setCategory(v); setSpecialization("all"); }}>
              <SelectTrigger className="md:w-[200px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {taxonomy?.categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={specialization} onValueChange={setSpecialization}>
              <SelectTrigger className="md:w-[210px]"><SelectValue placeholder="Specialization" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All specializations</SelectItem>
                {specializationOptions.map((s) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={coverage} onValueChange={setCoverage}>
              <SelectTrigger className="md:w-[170px]"><SelectValue placeholder="Coverage" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All coverage</SelectItem>
                {["Local", "Regional", "Nationwide", "International"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <Card className="mt-10">
              <CardContent className="py-16 text-center space-y-4">
                <p className="text-muted-foreground">No approved partners match your filters yet.</p>
                <Button asChild><Link to="/partners/register">Apply as a media partner</Link></Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-10">
              {filtered.map((p) => (
                <Card key={p.id} className="group hover:border-primary/50 transition-colors cursor-pointer" onClick={() => openPartner(p)}>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex items-center justify-center shrink-0">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={`${p.company_name} logo`} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="font-bold text-muted-foreground">{p.company_name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h2 className="font-semibold truncate">{p.company_name}</h2>
                          {p.verified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{categoryName(p.partner_category)}</p>
                      </div>
                    </div>

                    {p.is_featured && (
                      <Badge className="gap-1"><Sparkles className="w-3 h-3" /> Featured Partner</Badge>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-3">{p.company_description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {(p.specializations ?? []).slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{tagName(s)}</Badge>
                      ))}
                      {(p.specializations?.length ?? 0) > 4 && (
                        <Badge variant="outline" className="text-xs">+{p.specializations.length - 4}</Badge>
                      )}
                    </div>

                    {coverageAreas(p).length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {coverageAreas(p).slice(0, 3).join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.company_name}
                  {selected.verified && <BadgeCheck className="w-5 h-5 text-primary" />}
                  {selected.is_featured && <Badge className="gap-1"><Sparkles className="w-3 h-3" /> Featured</Badge>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <Badge variant="secondary">{categoryName(selected.partner_category)}</Badge>
                <p className="text-sm text-muted-foreground">{selected.company_description}</p>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Specializations</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.specializations ?? []).map((s) => <Badge key={s} variant="secondary">{tagName(s)}</Badge>)}
                  </div>
                </div>

                {(selected.capabilities ?? []).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Capabilities</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.capabilities.map((s) => <Badge key={s} variant="outline">{tagName(s)}</Badge>)}
                    </div>
                  </div>
                )}

                {coverageAreas(selected).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Coverage Areas</h3>
                    <p className="text-sm text-muted-foreground">{coverageAreas(selected).join(", ")}</p>
                  </div>
                )}

                {items.filter((i) => i.partner_id === selected.id).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Portfolio & Gallery</h3>
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
                          <a
                            key={item.id}
                            href={url ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm flex items-center gap-1.5 border rounded-md p-3 hover:border-primary/50"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> {item.title || item.platform || "View"}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 space-y-2 text-sm">
                  <h3 className="font-semibold">Contact</h3>
                  <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> {selected.contact_email}</p>
                  {selected.contact_phone && (
                    <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /> {selected.contact_phone}</p>
                  )}
                  {selected.website && (
                    <a href={selected.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                      <Globe className="w-4 h-4" /> {selected.website}
                    </a>
                  )}
                  <div className="flex flex-wrap gap-3 pt-1">
                    {Object.entries(selected.social_links ?? {}).filter(([, v]) => v).map(([k, v]) => (
                      <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline capitalize">{k}</a>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
