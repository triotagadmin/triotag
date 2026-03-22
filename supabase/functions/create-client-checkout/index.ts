import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const {
      printPartnerId,
      activationId,
      adSpaceId,
      clientName,
      clientEmail,
      clientCompany,
      listingTitle,
      campaignDates,
      lineItems,
      leaseTotal,
      materialTotal,
      grandTotal,
      currency,
    } = body;

    if (!printPartnerId || !clientName || !clientEmail) {
      throw new Error("printPartnerId, clientName, and clientEmail are required");
    }

    if (!lineItems || lineItems.length === 0) {
      throw new Error("At least one line item is required");
    }

    if (grandTotal <= 0) {
      throw new Error("Grand total must be greater than zero");
    }

    const { data: checkout, error } = await supabase
      .from("client_checkouts")
      .insert({
        print_partner_id: printPartnerId,
        activation_id: activationId || null,
        ad_space_id: adSpaceId || null,
        client_name: clientName,
        client_email: clientEmail,
        client_company: clientCompany || null,
        listing_title: listingTitle || null,
        campaign_dates: campaignDates || null,
        line_items: lineItems,
        lease_total: leaseTotal || 0,
        material_total: materialTotal || 0,
        grand_total: grandTotal,
        currency: currency || "PHP",
        status: "awaiting_client_payment",
      })
      .select("id, token")
      .single();

    if (error) throw error;

    const publicUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")}/checkout/${checkout.token}`;

    console.log("[create-client-checkout] Created checkout:", checkout.id, "token:", checkout.token);

    return new Response(
      JSON.stringify({
        id: checkout.id,
        token: checkout.token,
        publicUrl: `/checkout/${checkout.token}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[create-client-checkout] ERROR:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
