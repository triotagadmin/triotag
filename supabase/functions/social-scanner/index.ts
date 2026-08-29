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

type TavilyResult = { title: string; url: string; content: string; score?: number };

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const tavilyKey = Deno.env.get("Tavily") ?? Deno.env.get("TAVILY_API_KEY");
    if (!tavilyKey) return json({ error: "Search provider is not configured" }, 500);

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
    const industry = String(body?.industry ?? "").trim().slice(0, 120);
    const location = String(body?.location ?? "").trim().slice(0, 160);
    const keywords = String(body?.keywords ?? "").trim().slice(0, 200);
    const criteria = String(body?.criteria ?? "").trim().slice(0, 300);

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

    // Three complementary passes: official pages, social profiles, and commerce signals.
    const [general, social, commerce] = await Promise.all([
      runTavily(`${query} official website online shop`, []),
      runTavily(query, ["facebook.com", "instagram.com", "tiktok.com", "linkedin.com"]),
      runTavily(`${query} shop products order online`, []),
    ]);

    const seen = new Set<string>();
    const merged = [...general, ...social, ...commerce].filter((r) => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    if (merged.length === 0) {
      return json({ error: "Discovery provider returned no results. Please try again." }, 502);
    }

    // Drop listicles / forum threads — they describe businesses but are not businesses.
    const LISTICLE =
      /^(top|best|\d+\s)|\b(top \d+|best \d+|guide to|list of|where to|things to|r\/|reddit|quora|blog|news|article)\b/i;
    const results = merged.filter((r) => !LISTICLE.test(r.title.trim()));

    const groups = buildGroups(results.length ? results : merged);

    const leads = groups
      .map((g) => {
        const blob = g.sources.map((s) => `${s.title} ${s.content}`).join(" ");
        const intel = analyze(g, blob);
        return {
          company_name: g.company_name,
          normalized_name: g.normalized_name,
          website_url: g.website_url,
          website_domain: g.website_domain,
          industry: industry || null,
          location: location || null,
          facebook_url: g.facebook_url,
          instagram_url: g.instagram_url,
          tiktok_url: g.tiktok_url,
          tiktok_shop_url: g.tiktok_shop_url,
          linkedin_url: g.linkedin_url,
          public_email: g.public_email,
          public_phone: g.public_phone,
          source_urls: g.sources.map((s) => s.url),
          ...intel,
        };
      })
      .sort((a, b) => b.lead_score - a.lead_score);

    return json({
      query,
      scanned_sources: results.length,
      leads,
      search: { industry, location, keywords, criteria },
    });
  } catch (err) {
    console.error("social-scanner error", err);
    return json({ error: "Unexpected error while scanning." }, 500);
  }
});
