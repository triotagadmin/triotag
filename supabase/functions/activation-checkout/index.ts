 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface CheckoutRequest {
   activationId: string;
   buyerName: string;
   buyerEmail: string;
   buyerPhone?: string;
   successUrl: string;
   cancelUrl: string;
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
 
     const body: CheckoutRequest = await req.json();
     console.log("Activation checkout request:", body);
 
     const { activationId, buyerName, buyerEmail, buyerPhone, successUrl, cancelUrl } = body;
 
     if (!activationId) {
       throw new Error("activationId is required");
     }
 
     // Fetch activation and calculate total from database
     const { data: activation, error: activationError } = await supabase
       .from("activations")
       .select(`
         *,
         ad_spaces (
           title,
           specifications,
           pricing
         )
       `)
       .eq("id", activationId)
       .single();
 
     if (activationError || !activation) {
       console.error("Activation not found:", activationError);
       throw new Error("Activation not found");
     }
 
     // Calculate booking amount from activation data
     let bookingAmount = activation.total_amount || activation.estimated_publisher_payout || 0;
     
     // If no total_amount, calculate from dates and pricing
     if (bookingAmount <= 0 && activation.start_date && activation.end_date) {
       const startDate = new Date(activation.start_date);
       const endDate = new Date(activation.end_date);
       const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
       const diffWeeks = Math.ceil(diffDays / 7);
       
       const adSpace = activation.ad_spaces;
       const adUnits = adSpace?.specifications?.ad_units || adSpace?.pricing?.ad_units || [];
       const selectedAdUnit = adUnits[0];
       
       const weeklyRate = selectedAdUnit?.pricePerWeek || adSpace?.pricing?.weekly || 0;
       const monthlyRate = selectedAdUnit?.pricePerMonth || adSpace?.pricing?.monthly || 0;
       
       if (diffWeeks >= 4 && monthlyRate > 0) {
         const fullMonths = Math.floor(diffWeeks / 4);
         const remainingWeeks = diffWeeks % 4;
         bookingAmount = (fullMonths * monthlyRate) + (remainingWeeks * weeklyRate);
       } else {
         bookingAmount = diffWeeks * weeklyRate;
       }
     }
 
     // Fetch print order total if exists
     let printOrderTotal = 0;
     if (activation.print_order_id) {
       const { data: printOrder } = await supabase
         .from("print_orders")
         .select("total_price")
         .eq("id", activation.print_order_id)
         .single();
       
       if (printOrder?.total_price) {
         printOrderTotal = printOrder.total_price;
       }
     }
 
     const totalAmount = bookingAmount + printOrderTotal;
     
     if (totalAmount <= 0) {
       throw new Error("Invalid booking amount. Please ensure dates and pricing are configured.");
     }
 
     // Get currency from ad space
     const currency = activation.ad_spaces?.specifications?.currency || "PHP";
     const listingTitle = activation.ad_spaces?.title || "Ad Space Booking";
 
     // Convert to centavos (PayMongo uses smallest currency unit)
     const amountInCentavos = Math.round(totalAmount * 100);
 
     console.log(`Creating checkout: ${totalAmount} ${currency} (${amountInCentavos} centavos)`);
 
     // Create PayMongo checkout session
     const checkoutPayload = {
       data: {
         attributes: {
           send_email_receipt: true,
           show_description: true,
           show_line_items: true,
           line_items: [
             {
               currency: currency,
               amount: amountInCentavos,
               description: `Booking: ${activation.start_date} to ${activation.end_date}`,
               name: listingTitle,
               quantity: 1,
             },
           ],
           payment_method_types: ["gcash", "card"],
           success_url: `${successUrl}?session_id={id}&activation_id=${activationId}`,
           cancel_url: cancelUrl,
           description: `Ad Space Activation - ${listingTitle}`,
           metadata: {
             activation_id: activationId,
             buyer_name: buyerName,
             buyer_email: buyerEmail,
             buyer_phone: buyerPhone || "",
             type: "activation_payment",
           },
         },
       },
     };
 
     console.log("Creating PayMongo checkout session...");
 
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
     console.log("PayMongo response status:", paymongoResponse.status);
 
     if (!paymongoResponse.ok) {
       console.error("PayMongo error:", paymongoData);
       throw new Error(paymongoData.errors?.[0]?.detail || "Failed to create checkout session");
     }
 
     const checkoutUrl = paymongoData.data.attributes.checkout_url;
     const sessionId = paymongoData.data.id;
 
     // Update activation with payment session info
     await supabase
       .from("activations")
       .update({
         status: "payment_pending",
         total_amount: totalAmount,
       })
       .eq("id", activationId);
 
     console.log("Checkout session created:", sessionId);
 
     return new Response(
       JSON.stringify({
         checkoutUrl,
         sessionId,
         amount: totalAmount,
         currency,
       }),
       {
         status: 200,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   } catch (error: any) {
     console.error("Activation checkout error:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 400,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });