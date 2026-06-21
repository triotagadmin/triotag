import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { verify } from "https://deno.land/x/djwt@v3.0.0/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_URL = "https://triotag.com";

// SECURITY: JWT_SECRET must be provided via environment variable - no fallbacks allowed
const JWT_SECRET = Deno.env.get("JWT_SECRET");
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Token operations cannot proceed without a secure secret.");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const emailToken = url.searchParams.get("token");
    const listingToken = url.searchParams.get("listing_token");
    const token = emailToken || listingToken;

    if (!token) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${FRONTEND_URL}/verify?verified=failed`,
          ...corsHeaders,
        },
      });
    }

    // Verify the JWT token
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    let payload;
    try {
      payload = await verify(token, key);
    } catch (error) {
      console.error("[Verify Email Error] Token verification failed:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${FRONTEND_URL}/verify?verified=failed`,
          ...corsHeaders,
        },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle listing ownership verification tokens
    if (payload.purpose === "listing_ownership_verification") {
      const adSpaceId = payload.ad_space_id as string;
      const advertiserUserId = payload.advertiser_user_id as string;
      const advertiserEmail = (payload.advertiser_email as string)?.toLowerCase();

      const { data: listing, error: listingError } = await supabase
        .from("ad_spaces")
        .select("id, title, advertiser_id, pending_advertiser_email, publisher_id")
        .eq("id", adSpaceId)
        .maybeSingle();

      if (listingError || !listing || (listing.pending_advertiser_email || "").toLowerCase() !== advertiserEmail) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?listing_verified=failed`,
            ...corsHeaders,
          },
        });
      }

      if (listing.advertiser_id === advertiserUserId && !listing.pending_advertiser_email) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?listing_verified=already`,
            ...corsHeaders,
          },
        });
      }

      const { error: linkError } = await supabase
        .from("ad_spaces")
        .update({ advertiser_id: advertiserUserId, pending_advertiser_email: null })
        .eq("id", adSpaceId);

      if (linkError) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?listing_verified=failed`,
            ...corsHeaders,
          },
        });
      }

      const { data: publisherProfile } = await supabase
        .from("publisher_profiles")
        .select("user_id")
        .eq("id", listing.publisher_id)
        .maybeSingle();

      if (publisherProfile?.user_id) {
        await supabase.from("notifications").insert({
          user_id: publisherProfile.user_id,
          title: "Advertiser ownership verified",
          message: `${advertiserEmail} verified and is now linked as primary advertiser for ${listing.title}.`,
          type: "listing_ownership_verified",
        });
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${FRONTEND_URL}/verify?listing_verified=success`,
          ...corsHeaders,
        },
      });
    }

    // Validate account-email token purpose
    if (payload.purpose !== "email_verification") {
      console.error("[Verify Email Error] Invalid token purpose:", payload.purpose);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${FRONTEND_URL}/verify?verified=failed`,
          ...corsHeaders,
        },
      });
    }

    const userId = payload.sub as string;
    const userType = payload.userType as string;
    const timestamp = new Date().toISOString();

    console.log(`[Verify Email] Processing verification for user: ${userId} (${userType}) at ${timestamp}`);

    // Determine which table to update based on user type
    if (userType === "advertiser") {
      const { data: profile, error: fetchError } = await supabase
        .from("advertiser_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError || !profile) {
        console.error("[Verify Email Error] Advertiser profile not found:", fetchError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      if (profile.verified) {
        console.log(`[Verify Email] Advertiser already verified`);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=already`,
            ...corsHeaders,
          },
        });
      }

      const { error: updateError } = await supabase
        .from("advertiser_profiles")
        .update({
          verified: true,
          verification_token: null,
          token_expires: null,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Verify Email Error] Failed to update advertiser:", updateError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      console.log(`[Verify Email Success] Advertiser verified successfully`);
    } else if (userType === "print_partner") {
      const { data: profile, error: fetchError } = await supabase
        .from("print_partner_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError || !profile) {
        console.error("[Verify Email Error] Print partner profile not found:", fetchError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      if (profile.verified) {
        console.log(`[Verify Email] Print partner already verified`);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=already`,
            ...corsHeaders,
          },
        });
      }

      const { error: updateError } = await supabase
        .from("print_partner_profiles")
        .update({ verified: true })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Verify Email Error] Failed to update print partner:", updateError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      console.log(`[Verify Email Success] Print partner verified successfully`);
    } else if (userType === "talent") {
      console.log(`[Verify Email Success] Talent email verified successfully for user: ${userId}`);
    } else if (userType === "brand_advertiser") {
      const { data: profile, error: fetchError } = await supabase
        .from("brand_advertiser_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError || !profile) {
        console.error("[Verify Email Error] Brand advertiser profile not found:", fetchError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      if (profile.verified) {
        console.log(`[Verify Email] Brand advertiser already verified`);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=already`,
            ...corsHeaders,
          },
        });
      }

      const { error: updateError } = await supabase
        .from("brand_advertiser_profiles")
        .update({ verified: true })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Verify Email Error] Failed to update brand advertiser:", updateError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      console.log(`[Verify Email Success] Brand advertiser verified successfully`);
    } else {

      // Publisher (venue, digital, agent)
      const { data: profile, error: fetchError } = await supabase
        .from("publisher_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError || !profile) {
        console.error("[Verify Email Error] Publisher profile not found:", fetchError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      if (profile.verified) {
        console.log(`[Verify Email] Publisher already verified`);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=already`,
            ...corsHeaders,
          },
        });
      }

      const { error: updateError } = await supabase
        .from("publisher_profiles")
        .update({
          verified: true,
          verification_token: null,
          token_expires: null,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("[Verify Email Error] Failed to update publisher:", updateError);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `${FRONTEND_URL}/verify?verified=failed`,
            ...corsHeaders,
          },
        });
      }

      console.log(`[Verify Email Success] Publisher verified successfully`);
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${FRONTEND_URL}/verify?verified=success`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[Verify Email Error]:", error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${FRONTEND_URL}/verify?verified=failed`,
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
