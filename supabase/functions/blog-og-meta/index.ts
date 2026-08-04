import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const postId = url.searchParams.get("id");

  const appUrl = "https://triotag.com";
  const fallbackImage = `${appUrl}/favicon.png`;

  if (!postId) {
    const html = buildHtml(
      "TrioTag",
      "Discover advertising insights on TrioTag!",
      fallbackImage,
      `${appUrl}/insights`
    );
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("id, title, meta_title, excerpt, meta_description, image_url, slug")
    .eq("id", postId)
    .single();

  if (error || !post) {
    const html = buildHtml(
      "TrioTag",
      "Discover advertising insights on TrioTag!",
      fallbackImage,
      `${appUrl}/insights`
    );
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  }

  const canonicalUrl = `${appUrl}/insights/${post.id}`;
  const title = post.meta_title || post.title || "TrioTag";
  const description =
    post.meta_description || post.excerpt || "Check out this article on TrioTag!";
  const ogImage = post.image_url
    ? `https://images.weserv.nl/?url=${encodeURIComponent(post.image_url)}&w=1200&h=630&fit=contain&cbg=white&output=jpg&q=85`
    : fallbackImage;

  const html = buildHtml(title, description, ogImage, canonicalUrl);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      ...corsHeaders,
    },
  });
});

function buildHtml(
  title: string,
  description: string,
  ogImage: string,
  canonicalUrl: string
): string {
  const t = esc(title);
  const d = esc(description);
  const img = escUrl(ogImage);
  const cUrl = escUrl(canonicalUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${t} – TrioTag</title>
  <meta name="description" content="${d}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${cUrl}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="TrioTag" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />

  <link rel="canonical" href="${cUrl}" />
  <!-- Delay redirect so crawlers can read OG tags -->
  <meta http-equiv="refresh" content="2;url=${cUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${cUrl}">${t}</a>…</p>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escUrl(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
