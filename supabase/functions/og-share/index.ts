import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const venueId = url.searchParams.get("id");

  if (!venueId) {
    return new Response("Missing id parameter", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: venue, error } = await supabase
    .from("ad_spaces")
    .select("id, title, description, media_urls, location")
    .eq("id", venueId)
    .single();

  if (error || !venue) {
    return new Response("Listing not found", { status: 404 });
  }

  const appUrl = "https://tinysticky.lovable.app";
  const canonicalUrl = `${appUrl}/venue/${venue.id}`;
  const title = venue.title || "Tiny Sticky Ads";
  const description = venue.description || "Check out this ad space on Tiny Sticky Ads!";
  const images = Array.isArray(venue.media_urls) ? venue.media_urls : [];
  const ogImage = images.length > 0 ? images[0] : `${appUrl}/favicon.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)} – Tiny Sticky Ads</title>
  <meta name="description" content="${escapeHtml(description)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Tiny Sticky Ads" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@TinyStickyAds" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />

  <link rel="canonical" href="${canonicalUrl}" />
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${canonicalUrl}">${escapeHtml(title)}</a>...</p>
  <script>window.location.replace("${canonicalUrl}");</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      ...corsHeaders,
    },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
