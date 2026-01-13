import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cache exchange rates for 1 hour to reduce API calls
let cachedRates: Record<string, number> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from, to, amount } = await req.json();
    
    if (!from || !to || amount === undefined) {
      throw new Error("Missing required parameters: from, to, amount");
    }

    const now = Date.now();
    
    // Use cached rates if still valid
    if (cachedRates && now - cacheTimestamp < CACHE_DURATION) {
      const convertedAmount = convertWithRates(cachedRates, from, to, amount);
      const rate = cachedRates[to] / cachedRates[from];
      return new Response(
        JSON.stringify({ 
          convertedAmount, 
          rate,
          cached: true 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fresh rates from exchangerate-api (free tier, no API key required for open access)
    // Using USD as base currency
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/USD`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }
    
    const data = await response.json();
    cachedRates = data.rates as Record<string, number>;
    cacheTimestamp = now;

    const convertedAmount = convertWithRates(cachedRates, from, to, amount);
    const rate = cachedRates[to] / cachedRates[from];

    return new Response(
      JSON.stringify({ 
        convertedAmount,
        rate,
        cached: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Currency conversion error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function convertWithRates(
  rates: Record<string, number>,
  from: string,
  to: string,
  amount: number
): number {
  if (from === to) return amount;
  
  // Convert from source to USD, then from USD to target
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  
  // amount in source currency -> USD -> target currency
  const amountInUsd = amount / fromRate;
  const convertedAmount = amountInUsd * toRate;
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
}
