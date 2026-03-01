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
  const venueId = url.searchParams.get("id");

  if (!venueId) {
    return new Response("Missing id parameter", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: venue, error } = await supabase
    .from("ad_spaces")
    .select("id, title, description, media_urls, location")
    .eq("id", venueId)
    .single();

  const appUrl = "https://tinystickyads.com";
  const fallbackImage = `${appUrl}/favicon.png`;

  if (error || !venue) {
    // Return fallback OG page even on error
    const html = buildHtml(
      "Tiny Sticky Ads",
      "Discover micro OOH ad spaces on Tiny Sticky Ads!",
      fallbackImage,
      appUrl,
    );
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
    });
  }

  const canonicalUrl = `${appUrl}/venue/${venue.id}`;
  const title = venue.title || "Tiny Sticky Ads";
  const description =
    venue.description || "Check out this ad space on Tiny Sticky Ads!";
  const images: string[] = Array.isArray(venue.media_urls)
    ? venue.media_urls
    : [];
  const ogImage = images.length > 0 ? images[0] : fallbackImage;

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
  canonicalUrl: string,
): string {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const img = escapeHtml(ogImage);
  const cUrl = escapeHtml(canonicalUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${t} – Tiny Sticky Ads</title>
  <meta name="description" content="${d}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${cUrl}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Tiny Sticky Ads" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@TinyStickyAds" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${img}" />

  <link rel="canonical" href="${cUrl}" />
  <meta http-equiv="refresh" content="0;url=${cUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${cUrl}">${t}</a>…</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
