import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Ad unit types and their environment prompts
const AD_UNIT_ENVIRONMENTS: Record<string, string> = {
  "window-sticker": "a modern storefront or café window with natural daylight streaming through, urban street visible outside",
  "table-tent": "an elegant restaurant or café table with subtle ambient lighting, coffee cups or plates nearby",
  "countertop-stand": "a retail checkout counter with clean modern design, cash register and products visible in background",
  "wall-sticker": "a stylish indoor wall in a modern retail space or café, warm interior lighting",
  "door-sticker": "a glass or wooden door entrance to a trendy shop or restaurant, welcoming atmosphere",
  "tabletop-qr-card": "a café or restaurant table surface with food, drinks, or coffee cups nearby, inviting ambiance",
};

const AD_UNIT_DESCRIPTIONS: Record<string, string> = {
  "window-sticker": "window sticker/decal adhered to glass",
  "table-tent": "triangular table tent display stand",
  "countertop-stand": "acrylic countertop display stand",
  "wall-sticker": "vinyl wall sticker/decal",
  "door-sticker": "door decal/sticker",
  "tabletop-qr-card": "small tabletop card display",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { adUnitType, imageBase64 } = await req.json();

    if (!adUnitType || !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing adUnitType or imageBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const environment = AD_UNIT_ENVIRONMENTS[adUnitType] || AD_UNIT_ENVIRONMENTS["table-tent"];
    const adDescription = AD_UNIT_DESCRIPTIONS[adUnitType] || "display stand";

    // Build the prompt for mockup generation
    const prompt = `Create a photorealistic product mockup. Show this design applied to a ${adDescription} placed in ${environment}. 
The design should appear naturally integrated onto the physical product with realistic perspective, lighting, shadows, and reflections. 
The scene should look like a professional product photography shot. 
Make the mockup look high-quality and commercially appealing.
The uploaded design should be clearly visible and properly scaled on the ad unit.
Ultra high resolution, professional product photography style.`;

    console.log("Generating mockup for ad unit type:", adUnitType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    const generatedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      throw new Error("No image generated from AI");
    }

    return new Response(
      JSON.stringify({ 
        mockupImage: generatedImage,
        message: data.choices?.[0]?.message?.content || "Mockup generated successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating mockup:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
