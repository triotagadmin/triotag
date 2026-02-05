 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface VerifyRequest {
   sessionId: string;
   activationId: string;
 }
 
 serve(async (req) => {
   // Handle CORS preflight
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
 
     const body: VerifyRequest = await req.json();
     console.log("Payment verification request:", body);
 
     const { sessionId, activationId } = body;
 
     if (!sessionId || !activationId) {
       throw new Error("sessionId and activationId are required");
     }
 
     // Verify payment status with PayMongo
     const paymongoResponse = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${sessionId}`, {
       method: "GET",
       headers: {
         Accept: "application/json",
         Authorization: `Basic ${btoa(paymongoSecretKey + ":")}`,
       },
     });
 
     const paymongoData = await paymongoResponse.json();
     console.log("PayMongo session status:", paymongoData.data?.attributes?.status);
 
     if (!paymongoResponse.ok) {
       console.error("PayMongo error:", paymongoData);
       throw new Error("Failed to verify payment session");
     }
 
     const sessionStatus = paymongoData.data?.attributes?.status;
     const paymentStatus = paymongoData.data?.attributes?.payment_intent?.attributes?.status;
     const payments = paymongoData.data?.attributes?.payments || [];
 
     // Check if payment is successful
     const isPaid = sessionStatus === "paid" || 
                    sessionStatus === "active" && payments.length > 0 ||
                    paymentStatus === "succeeded";
 
     console.log("Payment verification:", { sessionStatus, paymentStatus, paymentsCount: payments.length, isPaid });
 
     if (isPaid) {
       // Update activation to completed
       const { error: updateError } = await supabase
         .from("activations")
         .update({
           status: "completed",
           updated_at: new Date().toISOString(),
         })
         .eq("id", activationId);
 
       if (updateError) {
         console.error("Failed to update activation:", updateError);
         throw new Error("Failed to update booking status");
       }
 
       // Get activation details for notification
       const { data: activation } = await supabase
         .from("activations")
         .select(`
           *,
           ad_spaces (
             title,
             publisher_id
           )
         `)
         .eq("id", activationId)
         .single();
 
       // Notify publisher about confirmed booking
       if (activation?.publisher_id) {
         const { data: publisherProfile } = await supabase
           .from("publisher_profiles")
           .select("user_id, business_name")
           .eq("id", activation.publisher_id)
           .single();
 
         if (publisherProfile?.user_id) {
           await supabase
             .from("notifications")
             .insert({
               user_id: publisherProfile.user_id,
               title: "Booking Confirmed & Paid!",
               message: `Great news! Payment received for "${activation.ad_spaces?.title}". The advertiser's booking is now confirmed from ${activation.start_date} to ${activation.end_date}.`,
               type: "payment_received",
             });
         }
       }
 
       console.log("Activation marked as completed:", activationId);
 
       return new Response(
         JSON.stringify({
           success: true,
           status: "paid",
           message: "Payment verified and booking confirmed",
         }),
         {
           status: 200,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         }
       );
     } else {
       return new Response(
         JSON.stringify({
           success: false,
           status: sessionStatus,
           message: "Payment not yet completed",
         }),
         {
           status: 200,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         }
       );
     }
   } catch (error: any) {
     console.error("Payment callback error:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });