import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// 1x1 transparent GIF
const PIXEL = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), (c) => c.charCodeAt(0));

serve(async (req) => {
  const url = new URL(req.url);
  const t = url.searchParams.get("t");
  const e = url.searchParams.get("e");
  const u = url.searchParams.get("u");

  if (t) {
    const { data: msg } = await admin
      .from("venue_subscription_messages")
      .select("id, opens, clicks, first_opened_at, first_clicked_at")
      .eq("tracking_token", t)
      .maybeSingle();
    if (msg) {
      const now = new Date().toISOString();
      if (e === "open") {
        await admin.from("venue_subscription_messages").update({
          opens: (msg.opens || 0) + 1,
          last_opened_at: now,
          first_opened_at: msg.first_opened_at || now,
        }).eq("id", msg.id);
      } else if (e === "click") {
        await admin.from("venue_subscription_messages").update({
          clicks: (msg.clicks || 0) + 1,
          last_clicked_at: now,
          first_clicked_at: msg.first_clicked_at || now,
        }).eq("id", msg.id);
      }
    }
  }

  if (e === "click" && u) {
    return Response.redirect(u, 302);
  }

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
    },
  });
});
