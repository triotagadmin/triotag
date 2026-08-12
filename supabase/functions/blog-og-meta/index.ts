import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const APP_URL = "https://triotag.com";
const FALLBACK_IMAGE = `${APP_URL}/triotag-social-200.jpg`;
const BOT_RE =
  /facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Pinterest|redditbot|Applebot|SkypeUriPreview|vkShare|embedly|Iframely|Yahoo|DuckDuckBot|Baiduspider|ia_archiver/i;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ua = req.headers.get("user-agent") || "";
  const isBot = BOT_RE.test(ua);

  const url = new URL(req.url);
  // Supports ?id=<uuid> and path style /blog-og-meta/insights/<uuid>
  const postId = url.searchParams.get("id") ||
    (url.pathname.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)?.[1] ?? null);

  const generic = () =>
    new Response(
      buildHtml({
        title: "TrioTag",
        description: "Discover advertising insights on TrioTag!",
        image: FALLBACK_IMAGE,
        canonical: `${APP_URL}/insights`,
        isBot,
      }),
      { headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders } },
    );

  if (!postId) return generic();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select(
      "id, title, meta_title, excerpt, meta_description, content, image_url, social_image_url, image_alt_text, author, created_at, updated_at, status",
    )
    .eq("id", postId)
    .maybeSingle();

  if (error || !post || post.status !== "published") return generic();

  const canonical = `${APP_URL}/insights/${post.id}`;
  const title = post.meta_title || post.title || "TrioTag";
  const description = firstNonEmpty([
    post.meta_description,
    post.excerpt,
    summarize(post.content),
  ]) || "Advertising insights from TrioTag.";
  const image = post.social_image_url || FALLBACK_IMAGE;

  const html = buildHtml({
    title,
    description,
    image,
    canonical,
    isBot,
    article: {
      published: post.created_at,
      modified: post.updated_at || post.created_at,
      author: post.author || "TrioTag",
      imageAlt: post.image_alt_text || title,
    },
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      ...corsHeaders,
    },
  });
});

function firstNonEmpty(values: (string | null | undefined)[]): string {
  for (const v of values) {
    const s = (v || "").replace(/\s+/g, " ").trim();
    if (s) return s.length > 300 ? `${s.slice(0, 297)}...` : s;
  }
  return "";
}

function summarize(content?: string | null): string {
  if (!content) return "";
  const plain = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>-]/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 200);
}

function buildHtml(opts: {
  title: string;
  description: string;
  image: string;
  canonical: string;
  isBot: boolean;
  article?: {
    published?: string | null;
    modified?: string | null;
    author?: string;
    imageAlt?: string;
  };
}): string {
  const t = esc(opts.title);
  const d = esc(opts.description);
  const img = escUrl(opts.image);
  const cUrl = escUrl(opts.canonical);
  const a = opts.article;

  const jsonLd = a
    ? `<script type="application/ld+json">${
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: opts.title,
        description: opts.description,
        image: [opts.image],
        datePublished: a.published || undefined,
        dateModified: a.modified || a.published || undefined,
        author: { "@type": "Person", name: a.author || "TrioTag" },
        publisher: {
          "@type": "Organization",
          name: "TrioTag",
          logo: {
            "@type": "ImageObject",
            url: `${APP_URL}/icon-512x512.png`,
          },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": opts.canonical },
      }).replace(/</g, "\\u003c")
    }</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${t} | TRIOTAG</title>
  <meta name="description" content="${d}" />
  <link rel="canonical" href="${cUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${cUrl}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:secure_url" content="${img}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="200" />
  <meta property="og:image:height" content="200" />
  <meta property="og:image:alt" content="${esc(a?.imageAlt || opts.title)}" />
  <meta property="og:site_name" content="TRIOTAG" />
${
    a
      ? `  <meta property="article:published_time" content="${escUrl(a.published || "")}" />
  <meta property="article:modified_time" content="${escUrl(a.modified || a.published || "")}" />
  <meta property="article:author" content="${esc(a.author || "TrioTag")}" />`
      : ""
  }

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />

  ${jsonLd}
  ${opts.isBot ? "" : `<meta http-equiv="refresh" content="0;url=${cUrl}" />`}
</head>
<body>
  <h1>${t}</h1>
  <p>${d}</p>
  <p><a href="${cUrl}">${t}</a></p>
</body>
</html>`;
}

function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escUrl(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
