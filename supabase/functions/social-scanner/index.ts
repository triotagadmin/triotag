import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string | null;
};

/** Where leads may be discovered. Keys are what the UI sends. */
const SOURCE_DOMAINS: Record<string, string[]> = {
  web: [],
  facebook: ["facebook.com"],
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  linkedin: ["linkedin.com"],
  reddit: ["reddit.com"],
  x: ["x.com", "twitter.com"],
  youtube: ["youtube.com"],
  marketplaces: ["shopee.ph", "lazada.com.ph", "carousell.ph"],
};

/** Freshness ceiling — never surface posts older than this. */
const MAX_AGE_DAYS = 60;


const SOCIAL_HOSTS: Record<string, RegExp> = {
  facebook_url: /(^|\.)(facebook\.com|fb\.com)$/i,
  instagram_url: /(^|\.)instagram\.com$/i,
  tiktok_url: /(^|\.)tiktok\.com$/i,
  linkedin_url: /(^|\.)linkedin\.com$/i,
};

const DIRECTORY_HOSTS =
  /(^|\.)(google\.[a-z.]+|maps\.google\.[a-z.]+|yelp\.[a-z.]+|tripadvisor\.[a-z.]+|foursquare\.com|wikipedia\.org|youtube\.com|twitter\.com|x\.com|pinterest\.[a-z.]+|shopee\.[a-z.]+|lazada\.[a-z.]+|carousell\.[a-z.]+|zomato\.com|grab\.com|medium\.com|reddit\.com|linktr\.ee)$/i;

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|corp|corporation|co|ltd|llc|ph|philippines|official|store|shop|page)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Derive a display company name from a result title. */
const SOCIAL_SKIP_SEGMENTS = /^(p|pages|posts|reel|reels|video|videos|watch|company|in|tag|explore|photo|share|profile|groups|events|story|stories|@)$/i;

/** facebook.com/purveyr/posts/123 -> "Purveyr"; tiktok.com/@brand -> "Brand" */
function handleFromSocialUrl(url: string): string | null {
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    for (const raw of segs) {
      const seg = decodeURIComponent(raw).replace(/^@/, "");
      if (!seg || SOCIAL_SKIP_SEGMENTS.test(seg) || /^\d+$/.test(seg) || seg.length < 3) continue;
      if (/\.(php|html)$/i.test(seg)) continue;
      return titleCase(seg.replace(/[._-]+/g, " ").replace(/\s{2,}/g, " ").trim());
    }
  } catch { /* ignore */ }
  return null;
}

function prettifyDomain(host: string): string {
  const base = host.split(".")[0];
  if (!base || base.length < 3) return "";
  return titleCase(base.replace(/[-_]+/g, " "));
}

function titleCase(s: string): string {
  return s.replace(/\b[a-z]/g, (c) => c.toUpperCase()).slice(0, 120);
}

function titleToCompany(title: string): string {
  return title
    .split(/[|\u2013\u2014•·]|(?: - )/)[0]
    .replace(/\((?:@[^)]+)\)/g, "")
    .replace(/\b(official|home|homepage|facebook|instagram|tiktok|linkedin)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 120);
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(\+63[\s-]?\d[\d\s-]{7,13}|\b0\d{3}[\s-]?\d{3}[\s-]?\d{4}\b|\+\d{1,3}[\s-]?\d[\d\s-]{6,13})/;

type Group = {
  company_name: string;
  normalized_name: string;
  website_url: string | null;
  website_domain: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  tiktok_shop_url: string | null;
  linkedin_url: string | null;
  public_email: string | null;
  public_phone: string | null;
  sources: TavilyResult[];
};

function buildGroups(results: TavilyResult[]): Group[] {
  const groups = new Map<string, Group>();

  for (const r of results) {
    const host = hostOf(r.url);
    if (!host) continue;
    const isSocial = Object.values(SOCIAL_HOSTS).some((re) => re.test(host));
    const isDirectory = DIRECTORY_HOSTS.test(host);

    // For social/website URLs the handle or domain identifies the business far more
    // reliably than the page title (which is often post copy).
    let company = "";
    if (isSocial) {
      const handle = handleFromSocialUrl(r.url);
      if (handle) company = handle;
    } else if (!isDirectory) {
      company = prettifyDomain(host);
    }
    if (!company) company = titleToCompany(r.title);
    if (!company || company.length < 2) continue;
    const key = normalizeName(company);
    if (!key) continue;

    let g = groups.get(key);
    if (!g) {
      g = {
        company_name: company,
        normalized_name: key,
        website_url: null,
        website_domain: null,
        facebook_url: null,
        instagram_url: null,
        tiktok_url: null,
        tiktok_shop_url: null,
        linkedin_url: null,
        public_email: null,
        public_phone: null,
        sources: [],
      };
      groups.set(key, g);
    }

    g.sources.push(r);

    if (isSocial) {
      for (const [field, re] of Object.entries(SOCIAL_HOSTS)) {
        if (re.test(host) && !(g as any)[field]) (g as any)[field] = r.url;
      }
      if (/tiktok\.com/i.test(host) && /\/shop|shop\.tiktok|product/i.test(r.url + " " + r.content)) {
        g.tiktok_shop_url = g.tiktok_shop_url ?? r.url;
      }
    } else if (!isDirectory && !g.website_url) {
      g.website_url = r.url;
      g.website_domain = host;
    }

    const email = (r.content || "").match(EMAIL_RE)?.[0] ?? null;
    if (email && !g.public_email && !/example\.|sentry|wixpress/i.test(email)) g.public_email = email.toLowerCase();
    const phone = (r.content || "").match(PHONE_RE)?.[0] ?? null;
    if (phone && !g.public_phone) g.public_phone = phone.trim();
  }

  return [...groups.values()].filter((g) => g.sources.length > 0);
}

type Evidence = { label: string; source_url: string };

/* ------------------------------------------------------------------ *
 * LOCATION INTELLIGENCE
 * Evidence-first: a real discovered address is geocoded and marked
 * VERIFIED. Otherwise a city/area mentioned in sources is geocoded and
 * clearly marked PREDICTED with a confidence score. Nothing invented.
 * ------------------------------------------------------------------ */

const PH_CITIES = [
  "Makati","Taguig","Bonifacio Global City","BGC","Quezon City","Manila","Pasig","Mandaluyong","Parañaque",
  "Paranaque","Pasay","Marikina","Muntinlupa","Las Piñas","Las Pinas","Caloocan","Valenzuela","San Juan",
  "Alabang","Ortigas","Cebu City","Mandaue","Lapu-Lapu","Davao City","Iloilo City","Bacolod","Cagayan de Oro",
  "Baguio","Angeles City","Clark","Pampanga","Bulacan","Cavite","Laguna","Batangas","Rizal","Antipolo",
  "Tagaytay","Zamboanga City","General Santos","Naga City","Legazpi","Dumaguete","Tacloban","Butuan",
  "Puerto Princesa","Subic","Olongapo","Santa Rosa","Biñan","Binan","Dasmariñas","Dasmarinas","Imus","Bacoor",
];

const STREET_RE =
  /((?:\d{1,5}[A-Za-z]?\s|Unit\s|Suite\s|Blk\.?\s|Block\s|G\/F\s|\d(?:st|nd|rd|th)\s(?:Floor|Flr)\s)[^.\n;|]{6,90}?(?:St\.?|Street|Ave\.?|Avenue|Rd\.?|Road|Blvd\.?|Boulevard|Drive|Dr\.?|Highway|Hwy|Bldg\.?|Building|Tower|Mall|Plaza|Center|Centre|Complex|Village|Barangay|Brgy\.?)[^.\n;|]{0,60})/i;

type LocationIntel = {
  formatted_address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  location_status: "verified" | "predicted" | "unknown";
  location_confidence: number | null;
  location_evidence_url: string | null;
  is_philippines: boolean | null;
  ph_evidence: string[];
};

const geoCache = new Map<string, { lat: number; lng: number; formatted: string; precise: boolean } | null>();

async function geocode(query: string, apiKey: string | null) {
  const key = query.toLowerCase().trim();
  if (!apiKey || !key) return null;
  if (geoCache.has(key)) return geoCache.get(key)!;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const first = Array.isArray(data?.results) ? data.results[0] : null;
    if (!first?.geometry?.location) {
      geoCache.set(key, null);
      return null;
    }
    const out = {
      lat: Number(first.geometry.location.lat),
      lng: Number(first.geometry.location.lng),
      formatted: String(first.formatted_address ?? query),
      precise: ["ROOFTOP", "RANGE_INTERPOLATED", "GEOMETRIC_CENTER"].includes(
        String(first.geometry.location_type ?? ""),
      ),
    };
    geoCache.set(key, out);
    return out;
  } catch (e) {
    console.error("geocode failed", e);
    geoCache.set(key, null);
    return null;
  }
}

function detectPhilippines(g: Group, blob: string) {
  const ev: string[] = [];
  if (g.public_phone && /^\+?63|^09|^\(0\d{2}\)/.test(g.public_phone.replace(/[\s-]/g, ""))) {
    ev.push(`Philippine phone number (${g.public_phone})`);
  }
  if (g.website_domain && /\.ph$/i.test(g.website_domain)) ev.push(`.ph domain (${g.website_domain})`);
  if (/\bphilippines\b|\bmanila\b|\bpinoy\b/i.test(blob)) ev.push("Philippines referenced in discovered sources");
  const city = PH_CITIES.find((c) => new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(blob));
  if (city) ev.push(`Philippine city referenced: ${city}`);
  if (/₱|\bPHP\b/.test(blob)) ev.push("Prices listed in Philippine pesos");
  return { is_philippines: ev.length > 0 ? ev.length >= 1 : null, ph_evidence: ev, city: city ?? null };
}

async function resolveLocation(
  g: Group,
  blob: string,
  apiKey: string | null,
  fallback: { label: string; lat: number; lng: number } | null,
): Promise<LocationIntel> {
  const ph = detectPhilippines(g, blob);
  const base: LocationIntel = {
    formatted_address: null,
    latitude: null,
    longitude: null,
    location_label: null,
    location_status: "unknown",
    location_confidence: null,
    location_evidence_url: null,
    is_philippines: ph.is_philippines,
    ph_evidence: ph.ph_evidence,
  };

  // 1) An explicit street address in a discovered source -> VERIFIED
  for (const s of g.sources) {
    const text = `${s.title} ${s.content}`;
    const m = text.match(STREET_RE);
    if (!m) continue;
    const candidate = m[1].replace(/\s{2,}/g, " ").trim();
    const withCity = ph.city && !new RegExp(ph.city, "i").test(candidate)
      ? `${candidate}, ${ph.city}, Philippines`
      : candidate;
    const hit = await geocode(withCity, apiKey);
    if (hit && hit.precise) {
      return {
        ...base,
        formatted_address: hit.formatted,
        latitude: hit.lat,
        longitude: hit.lng,
        location_label: hit.formatted,
        location_status: "verified",
        location_confidence: null,
        location_evidence_url: s.url,
      };
    }
  }

  // 2) A city / area referenced in sources -> PREDICTED at city centre
  if (ph.city) {
    const hit = await geocode(`${ph.city}, Philippines`, apiKey);
    if (hit) {
      let confidence = 55;
      if (g.public_phone && /^\+?63|^09/.test(g.public_phone.replace(/[\s-]/g, ""))) confidence += 15;
      if (g.website_domain && /\.ph$/i.test(g.website_domain)) confidence += 10;
      const mentions = g.sources.filter((s) => new RegExp(ph.city!, "i").test(`${s.title} ${s.content}`));
      confidence += Math.min(20, mentions.length * 7);
      return {
        ...base,
        latitude: hit.lat,
        longitude: hit.lng,
        location_label: `${ph.city}, Philippines`,
        location_status: "predicted",
        location_confidence: Math.min(95, confidence),
        location_evidence_url: mentions[0]?.url ?? g.sources[0]?.url ?? null,
      };
    }
  }

  // 3) Nothing business-specific: fall back to the searched area, low confidence
  if (fallback) {
    return {
      ...base,
      latitude: fallback.lat,
      longitude: fallback.lng,
      location_label: fallback.label,
      location_status: "predicted",
      location_confidence: 30,
      location_evidence_url: g.sources[0]?.url ?? null,
    };
  }

  return base;
}

/**
 * Deterministic, evidence-based TrioTag Lead Score (0-100).
 * Every point added is backed by a source URL shown in the UI.
 */
function analyze(g: Group, blob: string) {
  const evidence: Evidence[] = [];
  const reasons: string[] = [];
  const services = new Set<string>();
  let score = 0;

  const src = (u: string | null) => u ?? g.sources[0]?.url ?? "";
  const text = blob.toLowerCase();

  if (!g.website_url) {
    score += 35;
    reasons.push("No dedicated website found in the discovered sources — the business relies on third-party pages.");
    evidence.push({ label: "No dedicated website found in discovered sources", source_url: src(null) });
    services.add("eCommerce Development");
    services.add("SEO Microsite");
  } else {
    score += 5;
    evidence.push({ label: `Website found: ${g.website_domain}`, source_url: g.website_url });
  }

  const socials = [g.facebook_url, g.instagram_url, g.tiktok_url, g.linkedin_url].filter(Boolean) as string[];
  if (socials.length >= 2) {
    score += 15;
    reasons.push(`Active on ${socials.length} social platforms — an audience already exists to monetize.`);
  } else if (socials.length === 1) {
    score += 8;
    reasons.push("Single social channel found — social presence is thin and expandable.");
  }
  if (g.facebook_url) evidence.push({ label: "Facebook presence", source_url: g.facebook_url });
  if (g.instagram_url) evidence.push({ label: "Instagram presence", source_url: g.instagram_url });
  if (g.linkedin_url) evidence.push({ label: "LinkedIn presence", source_url: g.linkedin_url });

  if (g.tiktok_url) {
    score += 10;
    evidence.push({ label: "Active TikTok account", source_url: g.tiktok_url });
  }
  if (g.tiktok_shop_url) {
    score += 15;
    reasons.push("TikTok Shop signals detected — proven social-commerce seller.");
    evidence.push({ label: "Active TikTok Shop", source_url: g.tiktok_shop_url });
    services.add("Paid Advertising");
  }

  const commerceSource = g.sources.find((s) =>
    /add to cart|shop now|checkout|buy now|our products|price|₱|shopee|lazada|online store/i.test(s.content || ""),
  );
  if (commerceSource) {
    score += 12;
    reasons.push("Online selling signals found (product listings / checkout language).");
    evidence.push({ label: "Multiple products / online selling discovered", source_url: commerceSource.url });
    services.add("Paid Advertising");
    if (!g.website_url) services.add("eCommerce Development");
  }

  const adSource = g.sources.find((s) => /sponsored|ad library|promo|campaign|discount|sale ends/i.test(s.content || ""));
  if (adSource) {
    score += 8;
    reasons.push("Advertising / promotional activity detected in public sources.");
    evidence.push({ label: "Advertising activity signals", source_url: adSource.url });
    services.add("Paid Advertising");
    services.add("Programmatic Advertising");
  }

  const retailSource = g.sources.find((s) =>
    /branch|store hours|open daily|located at|address|mall|showroom|walk-in/i.test(s.content || ""),
  );
  if (retailSource) {
    score += 10;
    reasons.push("Physical retail footprint referenced — reachable with in-store and outdoor media.");
    evidence.push({ label: "Physical retail presence referenced", source_url: retailSource.url });
    services.add("Retail Media");
    services.add("OOH / DOOH");
  }

  if (g.website_url && !/blog|articles|guide|collections|category/i.test(text)) {
    score += 5;
    reasons.push("Little indexed content beyond the homepage — organic search opportunity.");
    services.add("SEO Microsite");
  }

  if (g.public_email || g.public_phone) {
    score += 5;
    reasons.push("Public contact details available — directly reachable for outreach.");
  }

  score = Math.max(0, Math.min(100, score));
  const opportunity_level = score >= 70 ? "high" : score >= 45 ? "medium" : "low";

  if (services.size === 0) services.add("SEO Microsite");

  return {
    lead_score: score,
    opportunity_level,
    lead_reasons: reasons,
    recommended_services: [...services],
    evidence,
  };
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const tavilyKey = Deno.env.get("Tavily") ?? Deno.env.get("TAVILY_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Invalid or expired session" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));

    const googleKey =
      Deno.env.get("GOOGLE_PLACES_API_KEY") ?? Deno.env.get("GOOGLEPLACESAPIKEY") ?? null;

    // Lightweight geocode mode — used to place the search centre + radius circle
    // on the map before a scan is run.
    if (body?.mode === "geocode") {
      const q = String(body?.location ?? "").trim().slice(0, 160);
      if (!q) return json({ center: null });
      const hit = await geocode(q, googleKey);
      return json({ center: hit ? { lat: hit.lat, lng: hit.lng, label: hit.formatted } : null });
    }

    if (!tavilyKey) return json({ error: "Search provider is not configured" }, 500);

    const industry = String(body?.industry ?? "").trim().slice(0, 120);
    const location = String(body?.location ?? "").trim().slice(0, 160);
    const keywords = String(body?.keywords ?? "").trim().slice(0, 200);
    const criteria = String(body?.criteria ?? "").trim().slice(0, 300);
    const radiusKm = Number(body?.radius_km) > 0 ? Number(body.radius_km) : null;
    const wantsStream = body?.stream === true;

    if (!industry && !keywords) {
      return json({ error: "Provide at least an industry or keywords to scan." }, 400);
    }

    const query = [industry, keywords, criteria, location ? `in ${location}` : ""]
      .filter(Boolean)
      .join(" ")
      .slice(0, 380);

    const runTavily = async (q: string, includeDomains: string[]) => {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tavilyKey}` },
        body: JSON.stringify({
          query: q.slice(0, 380),
          search_depth: "advanced",
          max_results: 15,
          include_answer: false,
          ...(includeDomains.length ? { include_domains: includeDomains } : {}),
        }),
      });
      if (!res.ok) {
        console.error("Tavily request failed", res.status);
        return [] as TavilyResult[];
      }
      const data = await res.json();
      return Array.isArray(data?.results)
        ? data.results.map((r: any) => ({
            title: String(r.title ?? ""),
            url: String(r.url ?? ""),
            content: String(r.content ?? ""),
            score: r.score,
          })) as TavilyResult[]
        : [];
    };

    /** Runs the whole scan, emitting each lead as soon as it is resolved. */
    const runScan = async (emit: (event: string, payload: unknown) => Promise<void> | void) => {
      // Geographic context for the map: geocode the searched area once.
      let center: { lat: number; lng: number; label: string } | null = null;
      if (typeof body?.lat === "number" && typeof body?.lng === "number") {
        center = { lat: body.lat, lng: body.lng, label: location || "Searched area" };
      } else if (location) {
        const hit = await geocode(location, googleKey);
        if (hit) center = { lat: hit.lat, lng: hit.lng, label: hit.formatted };
      }
      await emit("center", { center, radius_km: radiusKm });

      const areaHint = center?.label ?? location;
      const geoQuery = radiusKm && areaHint ? `${query} near ${areaHint}` : query;

      const [general, social, commerce] = await Promise.all([
        runTavily(`${geoQuery} official website online shop`, []),
        runTavily(geoQuery, ["facebook.com", "instagram.com", "tiktok.com", "linkedin.com"]),
        runTavily(`${geoQuery} shop products order online address branch`, []),
      ]);

      const seen = new Set<string>();
      const merged = [...general, ...social, ...commerce].filter((r) => {
        if (!r.url || seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });

      if (merged.length === 0) {
        await emit("error", { error: "Discovery provider returned no results. Please try again." });
        return;
      }

      const LISTICLE =
        /^(top|best|\d+\s)|\b(top \d+|best \d+|guide to|list of|where to|things to|r\/|reddit|quora|blog|news|article)\b/i;
      const results = merged.filter((r) => !LISTICLE.test(r.title.trim()));

      const groups = buildGroups(results.length ? results : merged);
      const fallback = center ? { label: center.label, lat: center.lat, lng: center.lng } : null;

      const scored = groups
        .map((g) => ({ g, blob: g.sources.map((s) => `${s.title} ${s.content}`).join(" ") }))
        .map((x) => ({ ...x, intel: analyze(x.g, x.blob) }))
        .sort((a, b) => b.intel.lead_score - a.intel.lead_score)
        .slice(0, 24);

      await emit("progress", { scanned_sources: results.length, total_candidates: scored.length });

      const leads: any[] = [];
      for (const { g, blob, intel } of scored) {
        const loc = await resolveLocation(g, blob, googleKey, fallback);
        let distance_km: number | null = null;
        let within_radius: boolean | null = null;
        if (center && loc.latitude != null && loc.longitude != null) {
          distance_km = Number(
            haversineKm(center, { lat: loc.latitude, lng: loc.longitude }).toFixed(2),
          );
          within_radius = radiusKm ? distance_km <= radiusKm : null;
        }
        const lead = {
          company_name: g.company_name,
          normalized_name: g.normalized_name,
          website_url: g.website_url,
          website_domain: g.website_domain,
          industry: industry || null,
          location: loc.location_label || location || null,
          facebook_url: g.facebook_url,
          instagram_url: g.instagram_url,
          tiktok_url: g.tiktok_url,
          tiktok_shop_url: g.tiktok_shop_url,
          linkedin_url: g.linkedin_url,
          public_email: g.public_email,
          public_phone: g.public_phone,
          source_urls: g.sources.map((s) => s.url),
          ...intel,
          ...loc,
          distance_km,
          within_radius,
        };
        leads.push(lead);
        await emit("lead", lead);
      }

      await emit("done", {
        query,
        scanned_sources: results.length,
        center,
        radius_km: radiusKm,
        leads,
        search: { industry, location, keywords, criteria },
      });
      return { center, results, leads };
    };

    if (wantsStream) {
      const stream = new ReadableStream({
        async start(controller) {
          const enc = new TextEncoder();
          const emit = (event: string, payload: unknown) => {
            controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
          };
          try {
            await runScan(emit);
          } catch (err) {
            console.error("social-scanner stream error", err);
            emit("error", { error: "Unexpected error while scanning." });
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    let final: any = null;
    await runScan((event, payload) => {
      if (event === "done") final = payload;
      if (event === "error") final = payload;
    });
    if (!final) return json({ error: "Scan produced no output." }, 502);
    return json(final, (final as any).error ? 502 : 200);
  } catch (err) {
    console.error("social-scanner error", err);
    return json({ error: "Unexpected error while scanning." }, 500);
  }
});

