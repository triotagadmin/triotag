import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { verify } from "https://deno.land/x/djwt@v3.0.0/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "RadXT9RTrMZvVsSccejHkrsIx3BDMLqRI10t1vKVH0U=";
const FRONTEND_URL = "https://tinystickyads.com";

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
    const token = url.searchParams.get("token");

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

    // Validate token purpose
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
