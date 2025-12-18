import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRODIGI_BASE_URL = "https://api.sandbox.prodigi.com/v4.0";

interface QuoteRequest {
  sku: string;
  copies: number;
  artworkUrl: string;
  shippingCountry: string;
}

interface OrderRequest {
  recipient: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
    email?: string;
    phone?: string;
  };
  sku: string;
  copies: number;
  artworkUrl: string;
  shippingMethod: "Budget" | "Standard" | "Express" | "Overnight";
  idempotencyKey?: string;
  merchantReference?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PRODIGI_API_KEY = Deno.env.get('PRODIGI_API_KEY');
    if (!PRODIGI_API_KEY) {
      throw new Error('PRODIGI_API_KEY is not configured');
    }

    const { action, data } = await req.json();

    if (action === 'quote') {
      const quoteData = data as QuoteRequest;
      
      // Build quote request body
      const quoteBody = {
        shippingMethod: "Budget",
        destinationCountryCode: quoteData.shippingCountry,
        items: [
          {
            sku: quoteData.sku,
            copies: quoteData.copies,
            assets: [
              {
                printArea: "default",
                url: quoteData.artworkUrl
              }
            ]
          }
        ]
      };

      console.log("Creating Prodigi quote:", JSON.stringify(quoteBody));

      const response = await fetch(`${PRODIGI_BASE_URL}/Quotes`, {
        method: 'POST',
        headers: {
          'X-API-Key': PRODIGI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteBody),
      });

      const result = await response.json();
      console.log("Prodigi quote response:", JSON.stringify(result));

      if (!response.ok) {
        return new Response(JSON.stringify({ error: result }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'order') {
      const orderData = data as OrderRequest;
      
      // Build order request body
      const orderBody = {
        shippingMethod: orderData.shippingMethod,
        idempotencyKey: orderData.idempotencyKey || crypto.randomUUID(),
        merchantReference: orderData.merchantReference,
        recipient: {
          name: orderData.recipient.name,
          email: orderData.recipient.email,
          phoneNumber: orderData.recipient.phone,
          address: {
            line1: orderData.recipient.address.line1,
            line2: orderData.recipient.address.line2,
            postalOrZipCode: orderData.recipient.address.postalCode,
            townOrCity: orderData.recipient.address.city,
            stateOrCounty: orderData.recipient.address.state,
            countryCode: orderData.recipient.address.country,
          }
        },
        items: [
          {
            sku: orderData.sku,
            copies: orderData.copies,
            assets: [
              {
                printArea: "default",
                url: orderData.artworkUrl
              }
            ]
          }
        ]
      };

      console.log("Creating Prodigi order:", JSON.stringify(orderBody));

      const response = await fetch(`${PRODIGI_BASE_URL}/Orders`, {
        method: 'POST',
        headers: {
          'X-API-Key': PRODIGI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderBody),
      });

      const result = await response.json();
      console.log("Prodigi order response:", JSON.stringify(result));

      if (!response.ok) {
        return new Response(JSON.stringify({ error: result }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use "quote" or "order"' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Prodigi API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
