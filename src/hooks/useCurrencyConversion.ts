import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ConversionResult {
  convertedAmount: number;
  rate: number;
  cached: boolean;
}

interface ExchangeRates {
  [currency: string]: number;
}

// Local cache for exchange rates to minimize API calls
let localRatesCache: ExchangeRates | null = null;
let localCacheTimestamp: number = 0;
const LOCAL_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
];

export const getCurrencySymbol = (currencyCode?: string): string => {
  if (!currencyCode) return "$";
  return CURRENCIES.find((c) => c.code === currencyCode)?.symbol || "$";
};

export const getCurrencyName = (currencyCode?: string): string => {
  if (!currencyCode) return "US Dollar";
  return CURRENCIES.find((c) => c.code === currencyCode)?.name || currencyCode;
};

/**
 * Convert amount from one currency to another using real exchange rates
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult | null> => {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, rate: 1, cached: true };
  }

  // Check local cache first
  const now = Date.now();
  if (localRatesCache && now - localCacheTimestamp < LOCAL_CACHE_DURATION) {
    const fromRate = localRatesCache[fromCurrency] || 1;
    const toRate = localRatesCache[toCurrency] || 1;
    const convertedAmount = Math.round((amount / fromRate) * toRate * 100) / 100;
    return { convertedAmount, rate: toRate / fromRate, cached: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke("get-exchange-rate", {
      body: { from: fromCurrency, to: toCurrency, amount },
    });

    if (error) throw error;
    
    // Update local cache with the rates we received
    // Since we fetch USD-based rates, we can reconstruct a partial cache
    if (data && !data.error) {
      return data as ConversionResult;
    }
    
    return null;
  } catch (error) {
    console.error("Currency conversion failed:", error);
    return null;
  }
};

/**
 * Fetch all exchange rates at once to minimize API calls
 */
export const fetchAllExchangeRates = async (): Promise<ExchangeRates | null> => {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (localRatesCache && now - localCacheTimestamp < LOCAL_CACHE_DURATION) {
    return localRatesCache;
  }

  try {
    // Fetch rates using a simple conversion request
    const { data, error } = await supabase.functions.invoke("get-exchange-rate", {
      body: { from: "USD", to: "USD", amount: 1 },
    });

    if (error) throw error;

    // The edge function caches rates, so we make a follow-up request to get all rates
    // For now, we'll fetch common currencies
    const rates: ExchangeRates = { USD: 1 };
    
    const currenciesToFetch = ["EUR", "GBP", "PHP", "JPY", "AUD", "CAD", "SGD", "INR", "CNY"];
    
    await Promise.all(
      currenciesToFetch.map(async (currency) => {
        const result = await supabase.functions.invoke("get-exchange-rate", {
          body: { from: "USD", to: currency, amount: 1 },
        });
        if (result.data && result.data.convertedAmount) {
          rates[currency] = result.data.convertedAmount;
        }
      })
    );

    localRatesCache = rates;
    localCacheTimestamp = now;
    
    return rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return null;
  }
};

/**
 * Hook for currency conversion with loading state
 */
export const useCurrencyConversion = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
) => {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (amount === 0) {
      setConvertedAmount(0);
      setRate(1);
      return;
    }

    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      setRate(1);
      return;
    }

    const convert = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await convertCurrency(amount, fromCurrency, toCurrency);
        if (result) {
          setConvertedAmount(result.convertedAmount);
          setRate(result.rate);
        } else {
          // Fallback: return original amount if conversion fails
          setConvertedAmount(amount);
          setRate(1);
          setError("Conversion failed, showing original value");
        }
      } catch (err) {
        setError("Failed to convert currency");
        setConvertedAmount(amount);
        setRate(1);
      } finally {
        setLoading(false);
      }
    };

    convert();
  }, [amount, fromCurrency, toCurrency]);

  return { convertedAmount, rate, loading, error };
};

/**
 * Format price with currency symbol and proper locale formatting
 */
export const formatPrice = (
  amount: number,
  currencyCode: string = "USD"
): string => {
  const symbol = getCurrencySymbol(currencyCode);
  
  // Handle currencies that typically don't use decimals
  const noDecimalCurrencies = ["JPY", "KRW", "VND"];
  const decimals = noDecimalCurrencies.includes(currencyCode) ? 0 : 2;
  
  const formattedNumber = amount.toLocaleString(undefined, {
    minimumFractionDigits: currencyCode === "JPY" ? 0 : 0,
    maximumFractionDigits: decimals,
  });
  
  return `${symbol}${formattedNumber}`;
};

/**
 * Hook to convert and format price display
 * Uses admin-set currency as the base and converts to display currency
 */
export const useConvertedPrice = (
  basePriceInAdminCurrency: number,
  adminCurrency: string = "USD",
  displayCurrency?: string
) => {
  // If no display currency specified or same as admin, use admin currency
  const targetCurrency = displayCurrency || adminCurrency;
  
  const { convertedAmount, rate, loading, error } = useCurrencyConversion(
    basePriceInAdminCurrency,
    adminCurrency,
    targetCurrency
  );

  const formattedPrice = convertedAmount !== null 
    ? formatPrice(convertedAmount, targetCurrency)
    : formatPrice(basePriceInAdminCurrency, adminCurrency);

  return {
    originalAmount: basePriceInAdminCurrency,
    originalCurrency: adminCurrency,
    convertedAmount: convertedAmount ?? basePriceInAdminCurrency,
    displayCurrency: targetCurrency,
    formattedPrice,
    rate,
    loading,
    error,
  };
};
