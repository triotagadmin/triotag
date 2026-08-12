import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode, Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIZE = 200;
const BUCKET = "ad-space-media";
const FALLBACK = "https://triotag.com/triotag-social-200.jpg";
const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/jpg",
];

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

/** Center-crop to a square then resize to exactly 200x200 (upscales if needed). */
async function makeSquare(bytes: Uint8Array): Promise<Uint8Array> {
  const decoded = await decode(bytes);
  const img = decoded as Image;
  const w = img.width;
  const h = img.height;
  const side = Math.min(w, h);
  const x = Math.floor((w - side) / 2);
  const y = Math.floor((h - side) / 2);
  const square = side === w && side === h ? img : img.crop(x, y, side, side);
  square.resize(SIZE, SIZE);
  return await square.encodeJPEG(85);
}

async function generateForPost(post: {
  id: string;
  image_url: string | null;
  social_image_url: string | null;
  social_image_source_url: string | null;
}, force: boolean) {
  const source = post.image_url?.trim() || null;

  // No featured image -> dedicated TrioTag 200x200 fallback.
  if (!source) {
    if (post.social_image_url === FALLBACK && !force) {
      return { id: post.id, status: "skipped", url: FALLBACK };
    }
    await admin
      .from("blog_posts")
      .update({ social_image_url: FALLBACK, social_image_source_url: null })
      .eq("id", post.id);
    return { id: post.id, status: "fallback", url: FALLBACK };
  }

  // Up-to-date derivative already exists for this exact source image.
  if (
    !force &&
    post.social_image_url &&
    post.social_image_source_url === source
  ) {
    const head = await fetch(post.social_image_url, { method: "HEAD" });
    if (head.ok) {
      return { id: post.id, status: "skipped", url: post.social_image_url };
    }
  }

  const res = await fetch(source);
  if (!res.ok) throw new Error(`source fetch failed (${res.status})`);
  const contentType = (res.headers.get("content-type") || "").split(";")[0]
    .toLowerCase();
  if (!ALLOWED_MIME.includes(contentType)) {
    // Unsupported/unsafe source (e.g. avif, svg, non-image) -> branded fallback.
    await admin
      .from("blog_posts")
      .update({ social_image_url: FALLBACK, social_image_source_url: source })
      .eq("id", post.id);
    return {
      id: post.id,
      status: "fallback",
      url: FALLBACK,
      reason: `unsupported content-type ${contentType || "unknown"}`,
    };
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  let jpeg: Uint8Array;
  try {
    jpeg = await makeSquare(bytes);
  } catch (_e) {
    await admin
      .from("blog_posts")
      .update({ social_image_url: FALLBACK, social_image_source_url: source })
      .eq("id", post.id);
    return { id: post.id, status: "fallback", url: FALLBACK, reason: "decode failed" };
  }

  const path = `blog-images/social/${post.id}-200-${Date.now()}.jpg`;
  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, jpeg, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: true,
  });
  if (upErr) throw upErr;

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { error: updErr } = await admin
    .from("blog_posts")
    .update({ social_image_url: publicUrl, social_image_source_url: source })
    .eq("id", post.id);
  if (updErr) throw updErr;

  return { id: post.id, status: "generated", url: publicUrl };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ---- auth: admins only ----
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const postId: string | undefined = body.post_id;
    const backfill: boolean = body.backfill === true;
    const force: boolean = body.force === true;

    let query = admin
      .from("blog_posts")
      .select("id, image_url, social_image_url, social_image_source_url");

    if (postId) {
      if (!/^[0-9a-f-]{36}$/i.test(postId)) {
        return json({ error: "Invalid post_id" }, 400);
      }
      query = query.eq("id", postId);
    } else if (!backfill) {
      return json({ error: "post_id or backfill required" }, 400);
    }

    const { data: posts, error } = await query;
    if (error) throw error;

    const results = [];
    for (const p of posts ?? []) {
      try {
        results.push(await generateForPost(p as never, force));
      } catch (e) {
        results.push({ id: p.id, status: "error", error: String(e) });
      }
    }

    return json({ ok: true, count: results.length, results });
  } catch (e) {
    console.error("generate-blog-social-image error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
