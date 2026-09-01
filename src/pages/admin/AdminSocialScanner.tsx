import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SocialScannerMap, type ScannerMapMarker } from "@/components/admin/SocialScannerMap";
import {
  Radar, Loader2, Globe, Mail, Phone, ExternalLink, Save, Check, MapPin, ShieldCheck,
  Facebook, Instagram, Linkedin, Music2, ShoppingBag, Sparkles, TrendingUp, Target, CircleDot,
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
  formatted_address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  location_status: "verified" | "predicted" | "unknown";
  location_confidence: number | null;
  location_evidence_url: string | null;
  is_philippines: boolean | null;
  ph_evidence: string[];
  distance_km: number | null;
  within_radius: boolean | null;
};


const levelStyles: Record<string, string> = {
  high: "bg-green-500/15 text-green-300 border-green-500/40",
  medium: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  low: "bg-slate-500/20 text-slate-200 border-slate-400/40",
};

const INDUSTRIES = [
  "Fashion & Apparel", "Food & Beverage", "Beauty & Skincare", "Health & Wellness",
  "Home & Living", "Electronics & Gadgets", "Automotive", "Real Estate",
  "Education", "Travel & Hospitality", "Professional Services", "Retail & Convenience",
];

const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50];

const Field = ({
  label, hint, value, onChange, placeholder, list,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  placeholder: string; list?: string;
}) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-300">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      list={list}
      className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:border-green-500/60"
    />
    {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
  </div>
);

const SocialChip = ({ href, icon: Icon, label }: { href: string | null; icon: any; label: string }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-300 hover:bg-green-500/20"
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </a>
  ) : null;

const LocationBadge = ({ lead }: { lead: Lead }) => {
  if (lead.location_status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-green-500/40 bg-green-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-300">
        <ShieldCheck className="h-3 w-3" /> Verified location
      </span>
    );
  }
  if (lead.location_status === "predicted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
        <CircleDot className="h-3 w-3" /> Predicted location
        {lead.location_confidence != null && <span className="font-semibold">· {lead.location_confidence}%</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-300">
      Location unknown
    </span>
  );
};

export default function AdminSocialScanner() {
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("Makati, Philippines");
  const [keywords, setKeywords] = useState("");
  const [criteria, setCriteria] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [scanned, setScanned] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savedCount, setSavedCount] = useState(0);
  const [onlyInRadius, setOnlyInRadius] = useState(true);
  const [centerLabel, setCenterLabel] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const loadSavedCount = async () => {
    const { count } = await supabase
      .from("social_scanner_leads")
      .select("id", { count: "exact", head: true });
    setSavedCount(count ?? 0);
  };

  useEffect(() => { loadSavedCount(); }, []);

  /** Place the search centre + radius boundary on the map before scanning. */
  const locateCenter = async () => {
    if (!location.trim()) return;
    setLocating(true);
    const { data, error } = await supabase.functions.invoke("social-scanner", {
      body: { mode: "geocode", location },
    });
    setLocating(false);
    if (error || !(data as any)?.center) {
      toast.error("Could not locate that area on the map.");
      return;
    }
    const c = (data as any).center;
    setCenter({ lat: c.lat, lng: c.lng });
    setCenterLabel(c.label ?? location);
  };

  const visibleLeads = useMemo(
    () => (onlyInRadius && center ? leads.filter((l) => l.within_radius !== false) : leads),
    [leads, onlyInRadius, center],
  );

  const markers: ScannerMapMarker[] = useMemo(
    () =>
      visibleLeads
        .filter((l) => l.latitude != null && l.longitude != null)
        .map((l) => ({
          id: l.normalized_name,
          lat: l.latitude as number,
          lng: l.longitude as number,
          name: l.company_name,
          verified: l.location_status === "verified",
          score: l.lead_score,
        })),
    [visibleLeads],
  );

  /** Streams the scan so businesses appear progressively as they are resolved. */
  const runScan = async () => {
    if (!industry.trim() && !keywords.trim()) {
      toast.error("Enter an industry or some keywords first.");
      return;
    }
    setLoading(true);
    setLeads([]);
    setScanned(null);
    setSelectedId(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("no-session");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/social-scanner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            industry, location, keywords, criteria,
            radius_km: radiusKm, stream: true,
            ...(center ? { lat: center.lat, lng: center.lng } : {}),
          }),
        },
      );

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        console.error("social-scanner failed", res.status, detail);
        toast.error("Scan failed. Please try again.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const evLine = chunk.split("\n").find((l) => l.startsWith("event: "));
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!evLine || !dataLine) continue;
          const event = evLine.slice(7).trim();
          let payload: any;
          try { payload = JSON.parse(dataLine.slice(6)); } catch { continue; }

          if (event === "center" && payload.center) {
            setCenter({ lat: payload.center.lat, lng: payload.center.lng });
            setCenterLabel(payload.center.label ?? location);
          } else if (event === "progress") {
            setScanned(payload.scanned_sources ?? 0);
          } else if (event === "lead") {
            setLeads((prev) => [...prev, payload as Lead]);
          } else if (event === "error") {
            toast.error(payload.error ?? "Scan failed.");
          } else if (event === "done") {
            setScanned(payload.scanned_sources ?? 0);
            if (!payload.leads?.length) toast.info("No businesses could be extracted from these sources.");
          }
        }
      }
    } catch (e) {
      console.error("social-scanner stream error", e);
      toast.error("Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
      formatted_address: lead.formatted_address,
      latitude: lead.latitude,
      longitude: lead.longitude,
      location_status: lead.location_status,
      location_confidence: lead.location_confidence,
      location_evidence_url: lead.location_evidence_url,
      is_philippines: lead.is_philippines,
      ph_evidence: lead.ph_evidence ?? [],
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

  const verifiedCount = leads.filter((l) => l.location_status === "verified").length;
  const mappedCount = markers.length;

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white md:text-3xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-600/20 text-green-400">
                <Radar className="h-5 w-5" />
              </span>
              Social Scanner
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">
              Discover businesses and identify sales opportunities — mapped by the strongest location evidence found.
            </p>
          </div>
          <div className="flex gap-3">
            {[
              { v: leads.length, l: "Prospects" },
              { v: verifiedCount, l: "Verified" },
              { v: savedCount, l: "Saved leads" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center">
                <div className="text-2xl font-bold text-green-400">{s.v}</div>
                <div className="text-[11px] uppercase tracking-wide text-gray-300">{s.l}</div>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
          {/* MAP */}
          <div className="h-[45vh] min-h-[320px] lg:sticky lg:top-4 lg:h-[calc(100vh-9rem)]">
            <SocialScannerMap
              center={center}
              radiusMeters={radiusKm * 1000}
              markers={markers}
              selectedId={selectedId}
              loading={loading}
              onSelect={setSelectedId}
            />
          </div>

          {/* SEARCH + RESULTS */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-400">
                <Target className="h-4 w-4" /> Prospecting search
              </div>
              <datalist id="scanner-industries">
                {INDUSTRIES.map((i) => <option key={i} value={i} />)}
              </datalist>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Industry" value={industry} onChange={setIndustry}
                  placeholder="Fashion & Apparel" list="scanner-industries" />
                <Field label="Location" value={location} onChange={setLocation}
                  placeholder="Makati, Philippines" hint="Map centers on this area" />
                <Field label="Keywords" value={keywords} onChange={setKeywords}
                  placeholder="boutique, streetwear brand" />
                <Field label="Business criteria" value={criteria} onChange={setCriteria}
                  placeholder="Sells products online" />
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-300">Search radius</label>
                  <span className="text-sm font-bold text-green-400">{radiusKm} km</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadiusKm(r)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        radiusKm === r
                          ? "border-green-500 bg-green-500/20 text-green-300"
                          : "border-white/15 bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {r} km
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={runScan}
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-green-400 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Scanning…" : "Scan for businesses"}
              </button>
              {scanned !== null && !loading && (
                <p className="mt-3 text-xs text-gray-300">
                  {scanned} sources analyzed · {leads.length} businesses · {mappedCount} placed on map
                </p>
              )}
            </section>

            <div className="space-y-3 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
              {loading && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-gray-300">
                  Searching the web and social platforms…
                </div>
              )}

              {!loading && leads.map((lead) => {
                const saved = savedKeys.has(lead.normalized_name);
                const active = selectedId === lead.normalized_name;
                return (
                  <article
                    key={lead.normalized_name}
                    onClick={() => setSelectedId(lead.normalized_name)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      active ? "border-green-500/60 bg-green-500/[0.07]" : "border-white/10 bg-white/[0.04] hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-white">{lead.company_name}</h2>
                        <p className="mt-0.5 text-xs text-gray-300">
                          {lead.industry || "Industry not stated"}
                        </p>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-200">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" />
                          <span>{lead.formatted_address || lead.location || "Location not determined"}</span>
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <LocationBadge lead={lead} />
                          {lead.is_philippines && (
                            <span className="rounded-md border border-blue-400/40 bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-200">
                              PH-based
                            </span>
                          )}
                          {lead.location_evidence_url && (
                            <a
                              href={lead.location_evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] text-green-400 underline underline-offset-2"
                            >
                              View source <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-2xl font-black leading-none text-green-400">{lead.lead_score}</div>
                        <div className="text-[10px] uppercase tracking-wide text-gray-300">/ 100</div>
                        <span className={`mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${levelStyles[lead.opportunity_level] ?? levelStyles.low}`}>
                          {lead.opportunity_level}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {lead.website_url ? (
                        <a
                          href={lead.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-medium text-gray-100 hover:bg-white/10"
                        >
                          <Globe className="h-3.5 w-3.5" /> {lead.website_domain}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/15 px-2 py-1 text-[11px] font-semibold text-red-200">
                          <Globe className="h-3.5 w-3.5" /> Website opportunity
                        </span>
                      )}
                      <SocialChip href={lead.facebook_url} icon={Facebook} label="Facebook" />
                      <SocialChip href={lead.instagram_url} icon={Instagram} label="Instagram" />
                      <SocialChip href={lead.tiktok_url} icon={Music2} label="TikTok" />
                      <SocialChip href={lead.tiktok_shop_url} icon={ShoppingBag} label="TikTok Shop" />
                      <SocialChip href={lead.linkedin_url} icon={Linkedin} label="LinkedIn" />
                    </div>

                    {(lead.public_email || lead.public_phone) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-200">
                        {lead.public_email && (
                          <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" />{lead.public_email}</span>
                        )}
                        {lead.public_phone && (
                          <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />{lead.public_phone}</span>
                        )}
                      </div>
                    )}

                    {active && (
                      <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                        <div>
                          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-200">
                            <TrendingUp className="h-3.5 w-3.5 text-green-400" /> Why this is a lead
                          </h3>
                          <ul className="space-y-1.5 text-sm text-gray-100">
                            {lead.lead_reasons.length ? lead.lead_reasons.map((r, i) => (
                              <li key={i} className="flex gap-2"><span className="text-green-400">•</span><span>{r}</span></li>
                            )) : <li className="text-gray-400">No strong signals found in the discovered sources.</li>}
                          </ul>
                        </div>

                        <div>
                          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-200">Recommended TrioTag services</h3>
                          <div className="flex flex-wrap gap-2">
                            {lead.recommended_services.map((s) => (
                              <span key={s} className="rounded-md border border-green-500/30 bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-300">{s}</span>
                            ))}
                          </div>
                        </div>

                        {!!lead.ph_evidence?.length && (
                          <div>
                            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-200">Philippines signals</h3>
                            <ul className="space-y-1 text-xs text-gray-200">
                              {lead.ph_evidence.map((e, i) => <li key={i}>• {e}</li>)}
                            </ul>
                          </div>
                        )}

                        <div>
                          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-200">Evidence</h3>
                          <ul className="space-y-1.5 text-sm">
                            {lead.evidence.map((e, i) => (
                              <li key={i} className="flex flex-wrap items-center gap-2 text-gray-100">
                                <Check className="h-3.5 w-3.5 shrink-0 text-green-400" />
                                <span>{e.label}</span>
                                {e.source_url && (
                                  <a href={e.source_url} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()} className="inline-flex items-center gap-1 text-[11px] text-green-400 underline underline-offset-2">
                                    View Source <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); saveLead(lead); }}
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-sm text-gray-300">
                  No businesses could be extracted from the discovered sources. Try different keywords or a broader location.
                </div>
              )}

              {!loading && scanned === null && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-gray-300">
                  Set an industry, location and radius, then run a scan to place discovered businesses on the map.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
