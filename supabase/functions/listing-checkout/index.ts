import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ListingCheckoutRequest {
  locationName: string;
  address: string;
  spaceType: string;
  photoUrl?: string;
  size: string;
  notes?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  successUrl: string;
  cancelUrl: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY");
    if (!paymongoSecretKey) {
      throw new Error("PAYMONGO_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: ListingCheckoutRequest = await req.json();
    console.log("Listing checkout request:", body);

    const {
      locationName, address, spaceType, photoUrl, size, notes,
      submitterName, submitterEmail, submitterPhone,
      successUrl, cancelUrl
    } = body;

    // Create a pending listing submission
    const { data: listing, error: insertError } = await supabase
      .from("listing_submissions")
      .insert({
        location_name: locationName,
        address: address,
        space_type: spaceType,
        photo_url: photoUrl || null,
        size: size,
        notes: notes || null,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        submitter_phone: submitterPhone || null,
        payment_status: "pending",
        listing_status: "pending_review",
      })
      .select()
      .single();

    if (insertError || !listing) {
      console.error("Failed to create listing:", insertError);
      throw new Error("Failed to create listing submission");
    }

    // $10 USD ≈ PHP 580 (PayMongo uses PHP centavos)
    const amountInCentavos = 58000; // PHP 580.00

    const checkoutPayload = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount: amountInCentavos,
              description: "One-time listing fee for ad space submission",
              name: "Ad Space Listing Fee ($10 USD)",
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "card"],
          success_url: `${successUrl}?listing_id=${listing.id}`,
          cancel_url: cancelUrl,
          description: `Ad space listing: ${locationName}`,
          metadata: {
            listing_id: listing.id,
            type: "listing_submission",
          },
        },
      },
    };

    console.log("Creating PayMongo checkout for listing:", JSON.stringify(checkoutPayload));

    const paymongoResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${btoa(paymongoSecretKey + ":")}`,
      },
      body: JSON.stringify(checkoutPayload),
    });

    const paymongoData = await paymongoResponse.json();
    console.log("PayMongo response:", JSON.stringify(paymongoData));

    if (!paymongoResponse.ok) {
      console.error("PayMongo error:", paymongoData);
      throw new Error(paymongoData.errors?.[0]?.detail || "Failed to create checkout session");
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;
    const sessionId = paymongoData.data.id;

    // Update listing with checkout session ID
    await supabase
      .from("listing_submissions")
      .update({ paymongo_checkout_session_id: sessionId })
      .eq("id", listing.id);

    return new Response(
      JSON.stringify({ checkoutUrl, sessionId, listingId: listing.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Listing checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
