import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { verify } from "https://deno.land/x/djwt@v3.0.0/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET");
const frontendUrl = "https://tinystickyads.com";

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required.");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${frontendUrl}/verify?listing_verified=failed` },
      });
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const payload: any = await verify(token, key);
    if (payload?.purpose !== "listing_ownership_verification") {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${frontendUrl}/verify?listing_verified=failed` },
      });
    }

    const adSpaceId = payload.ad_space_id as string;
    const advertiserUserId = payload.advertiser_user_id as string;
    const advertiserEmail = (payload.advertiser_email as string)?.toLowerCase();

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: listing, error: listingError } = await adminClient
      .from("ad_spaces")
      .select("id, title, advertiser_id, pending_advertiser_email, publisher_id")
      .eq("id", adSpaceId)
      .maybeSingle();

    if (listingError || !listing) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${frontendUrl}/verify?listing_verified=failed` },
      });
    }

    if (
      listing.advertiser_id === advertiserUserId &&
      !listing.pending_advertiser_email
    ) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${frontendUrl}/verify?listing_verified=already` },
      });
    }

    if ((listing.pending_advertiser_email || "").toLowerCase() !== advertiserEmail) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: `${frontendUrl}/verify?listing_verified=failed` },
      });
    }

    const { error: updateError } = await adminClient
      .from("ad_spaces")
      .update({ advertiser_id: advertiserUserId, pending_advertiser_email: null })
      .eq("id", adSpaceId);

    if (updateError) {
      throw updateError;
    }

    const { data: publisherProfile } = await adminClient
      .from("publisher_profiles")
      .select("user_id")
      .eq("id", listing.publisher_id)
      .maybeSingle();

    if (publisherProfile?.user_id) {
      await adminClient.from("notifications").insert({
        user_id: publisherProfile.user_id,
        title: "Print Partner ownership verified",
        message: `${advertiserEmail} verified and is now linked as primary Print Partner for ${listing.title}.`,
        type: "listing_ownership_verified",
      });
    }

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: `${frontendUrl}/verify?listing_verified=success` },
    });
  } catch (error) {
    console.error("verify-listing-ownership error", error);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: `${frontendUrl}/verify?listing_verified=failed` },
    });
  }
});
