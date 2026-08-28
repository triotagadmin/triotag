import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Radar, Loader2, Globe, Mail, Phone, ExternalLink, Save, Check,
  Facebook, Instagram, Linkedin, Music2, ShoppingBag, Sparkles, TrendingUp,
} from "lucide-react";

type Evidence = { label: string; source_url: string };

type Lead = {
  company_name: string;
  normalized_name: string;
  website_url: string | null;
  website_domain: string | null;
  industry: string | null;
  location: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  tiktok_shop_url: string | null;
  linkedin_url: string | null;
  public_email: string | null;
  public_phone: string | null;
  lead_score: number;
  opportunity_level: string;
  lead_reasons: string[];
  recommended_services: string[];
  evidence: Evidence[];
  source_urls: string[];
};

const levelStyles: Record<string, string> = {
  high: "bg-green-500/15 text-green-400 border-green-500/40",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  low: "bg-slate-500/15 text-slate-300 border-slate-500/40",
};

const Field = ({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-green-500/60"
    />
  </div>
);

const SocialChip = ({ href, icon: Icon, label }: { href: string | null; icon: any; label: string }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-300 hover:bg-green-500/20"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  ) : null;

export default function AdminSocialScanner() {
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [keywords, setKeywords] = useState("");
  const [criteria, setCriteria] = useState("");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scanned, setScanned] = useState<number | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savedCount, setSavedCount] = useState(0);

  const loadSavedCount = async () => {
    const { count } = await supabase
      .from("social_scanner_leads")
      .select("id", { count: "exact", head: true });
    setSavedCount(count ?? 0);
  };

  useEffect(() => { loadSavedCount(); }, []);

  const runScan = async () => {
    if (!industry.trim() && !keywords.trim()) {
      toast.error("Enter an industry or some keywords first.");
      return;
    }
    setLoading(true);
    setLeads([]);
    setScanned(null);
    const { data, error } = await supabase.functions.invoke("social-scanner", {
      body: { industry, location, keywords, criteria },
    });
    setLoading(false);
    if (error) {
      toast.error("Scan failed. Please try again.");
      return;
    }
    if ((data as any)?.error) {
      toast.error((data as any).error);
      return;
    }
    setLeads(((data as any)?.leads ?? []) as Lead[]);
    setScanned((data as any)?.scanned_sources ?? 0);
    if (!((data as any)?.leads ?? []).length) toast.info("No businesses could be extracted from these sources.");
  };

  const saveLead = async (lead: Lead) => {
    setSavingKey(lead.normalized_name);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingKey(null); toast.error("Session expired."); return; }
    const { error } = await supabase.from("social_scanner_leads").insert({
      created_by: user.id,
      company_name: lead.company_name,
      normalized_name: lead.normalized_name,
      website_url: lead.website_url,
      website_domain: lead.website_domain,
      industry: lead.industry,
      location: lead.location,
      facebook_url: lead.facebook_url,
      instagram_url: lead.instagram_url,
      tiktok_url: lead.tiktok_url,
      tiktok_shop_url: lead.tiktok_shop_url,
      linkedin_url: lead.linkedin_url,
      public_email: lead.public_email,
      public_phone: lead.public_phone,
      lead_score: lead.lead_score,
      opportunity_level: lead.opportunity_level,
      lead_reasons: lead.lead_reasons,
      recommended_services: lead.recommended_services,
      evidence: lead.evidence,
      source_urls: lead.source_urls,
      search_industry: industry || null,
      search_location: location || null,
      search_keywords: keywords || null,
      search_criteria: criteria || null,
    });
    setSavingKey(null);
    if (error) {
      if ((error as any).code === "23505") {
        setSavedKeys((p) => new Set(p).add(lead.normalized_name));
        toast.info("This lead is already saved.");
      } else {
        toast.error("Could not save this lead.");
      }
      return;
    }
    setSavedKeys((p) => new Set(p).add(lead.normalized_name));
    setSavedCount((c) => c + 1);
    toast.success(`${lead.company_name} saved to leads.`);
  };

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white md:text-3xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-600/20 text-green-400">
                <Radar className="h-5 w-5" />
              </span>
              Social Scanner
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Discover businesses across the web and social platforms, score them as TrioTag prospects,
              and keep the evidence behind every finding.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
            <div className="text-2xl font-bold text-green-400">{savedCount}</div>
            <div className="text-[11px] uppercase tracking-wide text-gray-400">Saved leads</div>
          </div>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Industry" value={industry} onChange={setIndustry} placeholder="Fashion" />
            <Field label="Location" value={location} onChange={setLocation} placeholder="Makati, Philippines" />
            <Field label="Keywords" value={keywords} onChange={setKeywords} placeholder="boutique, streetwear brand" />
            <Field label="Business Criteria" value={criteria} onChange={setCriteria} placeholder="Businesses selling products online" />
          </div>
          <button
            onClick={runScan}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Scanning…" : "Scan"}
          </button>
          {scanned !== null && !loading && (
            <p className="mt-3 text-xs text-gray-400">
              {scanned} sources analyzed · {leads.length} businesses extracted
            </p>
          )}
        </section>

        <div className="mt-6 space-y-4">
          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-gray-400">
              Searching the web and social platforms…
            </div>
          )}

          {!loading && leads.map((lead) => {
            const saved = savedKeys.has(lead.normalized_name);
            return (
              <article key={lead.normalized_name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-white">{lead.company_name}</h2>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {[lead.industry, lead.location].filter(Boolean).join(" · ") || "Location not stated in sources"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SocialChip href={lead.facebook_url} icon={Facebook} label="Facebook" />
                      <SocialChip href={lead.instagram_url} icon={Instagram} label="Instagram" />
                      <SocialChip href={lead.tiktok_url} icon={Music2} label="TikTok" />
                      <SocialChip href={lead.tiktok_shop_url} icon={ShoppingBag} label="TikTok Shop" />
                      <SocialChip href={lead.linkedin_url} icon={Linkedin} label="LinkedIn" />
                      {lead.website_url ? (
                        <a
                          href={lead.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-medium text-gray-200 hover:bg-white/10"
                        >
                          <Globe className="h-3.5 w-3.5" /> {lead.website_domain}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-300">
                          <Globe className="h-3.5 w-3.5" /> No website found
                        </span>
                      )}
                    </div>
                    {(lead.public_email || lead.public_phone) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-300">
                        {lead.public_email && (
                          <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" />{lead.public_email}</span>
                        )}
                        {lead.public_phone && (
                          <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />{lead.public_phone}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-3xl font-black leading-none text-green-400">{lead.lead_score}</div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400">Lead score</div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase ${levelStyles[lead.opportunity_level] ?? levelStyles.low}`}>
                      {lead.opportunity_level}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-300">
                      <TrendingUp className="h-3.5 w-3.5 text-green-400" /> Why this is a lead
                    </h3>
                    <ul className="space-y-1.5 text-sm text-gray-200">
                      {lead.lead_reasons.length ? lead.lead_reasons.map((r, i) => (
                        <li key={i} className="flex gap-2"><span className="text-green-400">•</span><span>{r}</span></li>
                      )) : <li className="text-gray-400">No strong signals found in the discovered sources.</li>}
                    </ul>

                    <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-gray-300">
                      Recommended TrioTag services
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {lead.recommended_services.map((s) => (
                        <span key={s} className="rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-300">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-300">Evidence</h3>
                    <ul className="space-y-1.5 text-sm">
                      {lead.evidence.map((e, i) => (
                        <li key={i} className="flex flex-wrap items-center gap-2 text-gray-200">
                          <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
                          <span>{e.label}</span>
                          {e.source_url && (
                            <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-green-400 underline underline-offset-2">
                              View Source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => saveLead(lead)}
                    disabled={saved || savingKey === lead.normalized_name}
                    className="inline-flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-500/20 disabled:opacity-60"
                  >
                    {savingKey === lead.normalized_name
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {saved ? "Saved" : "Save Lead"}
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && scanned !== null && leads.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-gray-400">
              No businesses could be extracted from the discovered sources. Try different keywords or a broader location.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
