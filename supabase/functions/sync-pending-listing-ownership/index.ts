import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await authedClient.auth.getUser();

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const normalizedEmail = user.email.trim().toLowerCase();

    const { data: linkedListings, error: updateError } = await adminClient
      .from("ad_spaces")
      .update({ advertiser_id: user.id, pending_advertiser_email: null })
      .is("advertiser_id", null)
      .ilike("pending_advertiser_email", normalizedEmail)
      .select("id, title, publisher_id");

    if (updateError) {
      throw updateError;
    }

    if (linkedListings && linkedListings.length > 0) {
      const publisherProfileIds = [...new Set(linkedListings.map((l) => l.publisher_id).filter(Boolean))];
      const { data: publisherProfiles } = await adminClient
        .from("publisher_profiles")
        .select("id, user_id")
        .in("id", publisherProfileIds as string[]);

      const publisherUserByProfileId = new Map(
        (publisherProfiles || []).map((p) => [p.id, p.user_id]),
      );

      const notifications = linkedListings
        .map((listing) => {
          const publisherUserId = publisherUserByProfileId.get(listing.publisher_id);
          if (!publisherUserId) return null;
          return {
            user_id: publisherUserId,
            title: "Advertiser ownership linked",
            message: `${normalizedEmail} completed signup/verification and is now linked to ${listing.title}.`,
            type: "listing_ownership_verified",
          };
        })
        .filter(Boolean);

      if (notifications.length > 0) {
        await adminClient.from("notifications").insert(notifications as any[]);
      }
    }

    return new Response(
      JSON.stringify({ success: true, linkedCount: linkedListings?.length || 0 }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("sync-pending-listing-ownership error", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
