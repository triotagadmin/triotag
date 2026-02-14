import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    console.log("Venue registration checkout request");

    const { venueData, verificationDocs, successUrl, cancelUrl } = body;

    if (!venueData || !venueData.publisher_id) {
      throw new Error("Missing venue data or publisher ID");
    }

    // Insert venue as pending with payment_pending in description metadata
    const { data: venue, error: insertError } = await supabase
      .from("ad_spaces")
      .insert([{
        ...venueData,
        approval_status: "pending" as const,
      }])
      .select()
      .single();

    if (insertError || !venue) {
      console.error("Failed to create venue:", insertError);
      throw new Error("Failed to create venue registration");
    }

    // Upload verification document records (files already in storage from client)
    if (verificationDocs && verificationDocs.length > 0) {
      const docInserts = verificationDocs.map((doc: any) => ({
        publisher_id: venueData.publisher_id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_url: doc.file_url,
      }));

      const { error: docError } = await supabase
        .from("verification_documents")
        .insert(docInserts);

      if (docError) {
        console.error("Failed to save verification docs:", docError);
        // Don't throw - venue is created, docs can be added later
      }
    }

    // $10 USD ≈ PHP 580 (PayMongo uses PHP centavos)
    const amountInCentavos = 58000;

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
              description: "One-time venue registration fee",
              name: "Venue Registration Fee ($10 USD)",
              quantity: 1,
            },
          ],
          payment_method_types: ["gcash", "paymaya", "card"],
          success_url: `${successUrl}?venue_registered=${venue.id}`,
          cancel_url: cancelUrl,
          description: `Venue registration: ${venueData.title}`,
          metadata: {
            venue_id: venue.id,
            type: "venue_registration",
          },
        },
      },
    };

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

    if (!paymongoResponse.ok) {
      console.error("PayMongo error:", paymongoData);
      throw new Error(paymongoData.errors?.[0]?.detail || "Failed to create checkout session");
    }

    const checkoutUrl = paymongoData.data.attributes.checkout_url;

    return new Response(
      JSON.stringify({ checkoutUrl, venueId: venue.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Venue registration checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
