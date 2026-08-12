/**
 * TrioTag social-preview Worker (Cloudflare)
 * ------------------------------------------
 * Purpose: serve crawler-visible, article-specific Open Graph / Twitter /
 * JSON-LD metadata for https://triotag.com/insights/:id and /venue/:id,
 * while every human visitor keeps getting the normal React SPA untouched.
 *
 * Deploy (no DNS change needed — triotag.com is already proxied by Cloudflare):
 *   1. Cloudflare dashboard -> Workers & Pages -> Create Worker -> paste this file.
 *   2. Deploy, then Worker -> Settings -> Triggers -> Add routes:
 *        triotag.com/insights/*
 *        triotag.com/venue/*
 *        www.triotag.com/insights/*
 *        www.triotag.com/venue/*
 *   3. Done. Nothing else changes: DNS, origin, SPA routing all stay as-is.
 *
 * How it works: bot user-agents are reverse-proxied (no redirect, same URL)
 * to the Supabase edge functions blog-og-meta / venue-og-meta, which render
 * a small HTML document containing only metadata. Everyone else passes
 * straight through to the Lovable origin.
 */

const OG_BASE = "https://jungfmgsxbayxzptvpky.supabase.co/functions/v1";

const BOT_RE =
  /facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Pinterest|redditbot|Applebot|SkypeUriPreview|vkShare|embedly|Iframely|DuckDuckBot|Baiduspider|YandexBot|Google-InspectionTool/i;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";

    if (!BOT_RE.test(ua)) return fetch(request);

    const blog = url.pathname.match(/^\/insights\/([^/?#]+)\/?$/);
    const venue = url.pathname.match(/^\/venue\/([^/?#]+)\/?$/);

    let target = null;
    if (blog && UUID_RE.test(blog[1])) {
      target = `${OG_BASE}/blog-og-meta?id=${encodeURIComponent(blog[1])}`;
    } else if (venue && UUID_RE.test(venue[1])) {
      target = `${OG_BASE}/venue-og-meta?id=${encodeURIComponent(venue[1])}`;
    }

    if (!target) return fetch(request);

    const upstream = await fetch(target, {
      headers: { "user-agent": ua },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (!upstream.ok) return fetch(request); // fail open to the SPA

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  },
};
