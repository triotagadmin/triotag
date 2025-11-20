import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { create, verify } from "https://deno.land/x/djwt@v3.0.0/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-secret-key-change-in-production";

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
      return new Response(
        JSON.stringify({ error: "Missing verification token" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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
      console.error("Token verification failed:", error);
      return new Response(
        JSON.stringify({ error: "Invalid or expired verification token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const adminUserId = payload.sub as string;
    const verifiedBy = payload.verifiedBy as string;
    const timestamp = new Date().toISOString();

    console.log(`[Verify Admin] Processing verification for admin: ${adminUserId} at ${timestamp}`);
    console.log(`[Verify Admin] Verified by: ${verifiedBy}`);

    // Update admin profile status
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: adminProfile, error: fetchError } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("user_id", adminUserId)
      .single();

    if (fetchError || !adminProfile) {
      console.error("[Verify Admin Error] Admin profile not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Admin profile not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[Verify Admin] Found admin profile: ${adminProfile.full_name}, current status: ${adminProfile.status}`);

    if (adminProfile.status === "verified") {
      console.log(`[Verify Admin] Admin ${adminUserId} is already verified`);
      // Already verified, redirect to approval page
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${url.origin}/admin/approve?verified=already`,
          ...corsHeaders,
        },
      });
    }

    const { error: updateError } = await supabase
      .from("admin_profiles")
      .update({
        status: "verified",
        verified_at: timestamp,
        verified_by: verifiedBy,
      })
      .eq("user_id", adminUserId);

    if (updateError) {
      console.error("[Verify Admin Error] Failed to update admin profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to verify admin" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[Verify Admin Success] Admin ${adminProfile.full_name} (${adminUserId}) verified successfully at ${timestamp} by ${verifiedBy}`);

    // Redirect to approval confirmation page (not login page)
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/admin/approve?verified=success`,
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in verify-admin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
