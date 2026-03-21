import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { create } from "https://deno.land/x/djwt@v3.0.0/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const jwtSecret = Deno.env.get("JWT_SECRET");
const frontendUrl = "https://tinystickyads.com";

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required.");
}

const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  listingId: string;
  email: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { listingId, email }: RequestBody = await req.json();
    const normalizedEmail = normalizeEmail(email || "");

    if (!listingId || !normalizedEmail) {
      return new Response(JSON.stringify({ error: "listingId and email are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: publisherProfile, error: publisherError } = await adminClient
      .from("publisher_profiles")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (publisherError || !publisherProfile) {
      return new Response(JSON.stringify({ error: "Publisher profile not found" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: listing, error: listingError } = await adminClient
      .from("ad_spaces")
      .select("id, title, location, publisher_id")
      .eq("id", listingId)
      .maybeSingle();

    if (listingError || !listing || listing.publisher_id !== publisherProfile.id) {
      return new Response(JSON.stringify({ error: "Listing not found or access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: advertiserProfile } = await adminClient
      .from("advertiser_profiles")
      .select("user_id, verified, contact_email")
      .ilike("contact_email", normalizedEmail)
      .maybeSingle();

    const registeredAdvertiserId = advertiserProfile?.user_id ?? null;

    let duplicateCheck = adminClient
      .from("ad_spaces")
      .select("id")
      .neq("id", listingId)
      .eq("publisher_id", publisherProfile.id)
      .eq("location", listing.location || "");

    duplicateCheck = registeredAdvertiserId
      ? duplicateCheck.or(`pending_advertiser_email.ilike.${normalizedEmail},advertiser_id.eq.${registeredAdvertiserId}`)
      : duplicateCheck.ilike("pending_advertiser_email", normalizedEmail);

    const { data: duplicate } = await duplicateCheck.limit(1).maybeSingle();

    if (duplicate) {
      return new Response(JSON.stringify({ error: "A listing with the same location and advertiser email already exists." }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { error: updateError } = await adminClient
      .from("ad_spaces")
      .update({
        advertiser_id: null,
        pending_advertiser_email: normalizedEmail,
      })
      .eq("id", listingId)
      .eq("publisher_id", publisherProfile.id);

    if (updateError) {
      throw updateError;
    }

    let workflowType: "verification" | "registration" = "registration";

    if (registeredAdvertiserId) {
      workflowType = "verification";

      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      const token = await create(
        { alg: "HS256", typ: "JWT" },
        {
          purpose: "listing_ownership_verification",
          ad_space_id: listingId,
          advertiser_user_id: registeredAdvertiserId,
          advertiser_email: normalizedEmail,
          publisher_user_id: user.id,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 48,
        },
        key,
      );

      const verificationUrl = `${frontendUrl}/verify?listing_token=${token}`;

      await resend.emails.send({
        from: "TinyStickyAds <noreply@tinystickyads.com>",
        to: [normalizedEmail],
        subject: "Confirm ad space ownership assignment",
        html: `
          <h2>Listing ownership confirmation</h2>
          <p>A publisher assigned you as the primary advertiser for <strong>${listing.title}</strong>.</p>
          <p>Please confirm this assignment:</p>
          <p><a href="${verificationUrl}">Confirm ownership</a></p>
          <p>If this wasn't expected, you can ignore this message.</p>
        `,
      });
    } else {
      const signupUrl = `${frontendUrl}/auth?account_type=advertiser`;

      await resend.emails.send({
        from: "TinyStickyAds <noreply@tinystickyads.com>",
        to: [normalizedEmail],
        subject: "You've been invited to claim an ad space",
        html: `
          <h2>You're invited to TinyStickyAds</h2>
          <p>A publisher added this email to an ad space listing (<strong>${listing.title}</strong>).</p>
          <p>Create your advertiser account to claim ownership:</p>
          <p><a href="${signupUrl}">Create advertiser account</a></p>
        `,
      });
    }

    await adminClient.from("notifications").insert({
      user_id: user.id,
      title: "Print Partner ownership request sent",
      message:
        workflowType === "verification"
          ? `Verification request sent to ${normalizedEmail} for ${listing.title}.`
          : `Registration invite sent to ${normalizedEmail} for ${listing.title}.`,
      type: "listing_ownership_pending",
    });

    return new Response(
      JSON.stringify({
        success: true,
        workflowType,
        pending_advertiser_email: normalizedEmail,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("request-listing-ownership error", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
