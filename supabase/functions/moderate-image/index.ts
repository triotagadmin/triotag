import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, fileName } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ safe: false, reason: "No image provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 to binary
    const imageBytes = Uint8Array.from(atob(image), (c) => c.charCodeAt(0));

    // Use Lovable AI (Gemini) for content moderation
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Call the AI to classify the image
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/moderate-image-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ image, fileName }),
    }).catch(() => null);

    // If the AI sub-function isn't deployed yet, do a basic pass-through
    // The moderation happens via simple heuristic on file metadata for now
    // and will be enhanced when the AI function is available
    if (!aiResponse || !aiResponse.ok) {
      // Basic moderation: check file name for obvious violations
      const lowerName = (fileName || "").toLowerCase();
      const blockedTerms = ["nsfw", "porn", "xxx", "nude", "naked", "hentai"];
      const hasBlockedTerm = blockedTerms.some((term) => lowerName.includes(term));

      if (hasBlockedTerm) {
        return new Response(
          JSON.stringify({
            safe: false,
            reason: "This image violates our advertising content policy and cannot be uploaded.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check file size - extremely small files might be suspicious
      if (imageBytes.length < 100) {
        return new Response(
          JSON.stringify({ safe: false, reason: "Invalid image file." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ safe: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await aiResponse.json();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ safe: true, error: "Moderation service error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
