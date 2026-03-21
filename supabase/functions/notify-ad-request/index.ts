import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyAdRequestPayload {
  publisherProfileId: string;
  listingTitle: string;
  activationId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { publisherProfileId, listingTitle, activationId }: NotifyAdRequestPayload = await req.json();

    console.log("Notifying publisher:", publisherProfileId, "for listing:", listingTitle);

    // Get publisher user_id from profile
    const { data: publisherProfile, error: profileError } = await supabase
      .from("publisher_profiles")
      .select("user_id, business_name")
      .eq("id", publisherProfileId)
      .single();

    if (profileError || !publisherProfile) {
      console.error("Publisher profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: "Publisher profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create notification for publisher
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: publisherProfile.user_id,
        title: "New Ad Request Received!",
        message: `A Print Partner has submitted an ad request for "${listingTitle}". Please review and respond.`,
        type: "ad_request_received",
      });

    if (notificationError) {
      console.error("Failed to create notification:", notificationError);
      return new Response(
        JSON.stringify({ error: "Failed to create notification" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Notification created successfully for user:", publisherProfile.user_id);

    return new Response(
      JSON.stringify({ success: true, notifiedUserId: publisherProfile.user_id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-ad-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
