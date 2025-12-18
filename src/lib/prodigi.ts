import { supabase } from "@/integrations/supabase/client";

// ============================================
// TYPES
// ============================================

export interface ProdigiQuoteRequest {
  sku: string;
  copies: number;
  artworkUrl: string;
  shippingCountry: string; // ISO 2-letter country code (e.g., "US", "GB", "PH")
}

export interface ProdigiOrderRequest {
  recipient: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string; // ISO 2-letter country code
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

export interface ProdigiQuoteResponse {
  outcome: string;
  quotes: Array<{
    shipmentMethod: string;
    costSummary: {
      items: { amount: string; currency: string };
      shipping: { amount: string; currency: string };
      totalCost: { amount: string; currency: string };
    };
  }>;
}

export interface ProdigiOrderResponse {
  outcome: string;
  order: {
    id: string;
    status: {
      stage: string;
      issues: any[];
    };
    merchantReference?: string;
  };
}

// ============================================
// EXAMPLE SKUs FOR STICKERS
// ============================================

/**
 * Common Prodigi sticker SKUs (Sandbox):
 * - GLOBAL-STI-CIR-2X2    : Circle sticker 2x2 inches
 * - GLOBAL-STI-SQU-2X2    : Square sticker 2x2 inches
 * - GLOBAL-STI-REC-3X4    : Rectangle sticker 3x4 inches
 * - GLOBAL-STI-CIR-3X3    : Circle sticker 3x3 inches
 * - GLOBAL-STI-SQU-4X4    : Square sticker 4x4 inches
 * 
 * Check Prodigi catalog for full list: https://www.prodigi.com/products/stickers/
 */
export const STICKER_SKUS = {
  CIRCLE_2X2: "GLOBAL-STI-CIR-2X2",
  SQUARE_2X2: "GLOBAL-STI-SQU-2X2",
  RECTANGLE_3X4: "GLOBAL-STI-REC-3X4",
  CIRCLE_3X3: "GLOBAL-STI-CIR-3X3",
  SQUARE_4X4: "GLOBAL-STI-SQU-4X4",
} as const;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get a quote for printing stickers or other products
 * 
 * @example
 * const quote = await createProdigiQuote({
 *   sku: "GLOBAL-STI-SQU-2X2",
 *   copies: 100,
 *   artworkUrl: "https://example.com/my-sticker-artwork.png",
 *   shippingCountry: "US"
 * });
 */
export async function createProdigiQuote(
  data: ProdigiQuoteRequest
): Promise<ProdigiQuoteResponse> {
  const { data: result, error } = await supabase.functions.invoke('prodigi', {
    body: { action: 'quote', data }
  });

  if (error) {
    console.error('Prodigi quote error:', error);
    throw new Error(error.message || 'Failed to get quote');
  }

  if (result.error) {
    console.error('Prodigi API error:', result.error);
    throw new Error(JSON.stringify(result.error));
  }

  return result;
}

/**
 * Create a print order with Prodigi
 * 
 * @example
 * const order = await createProdigiOrder({
 *   recipient: {
 *     name: "John Doe",
 *     address: {
 *       line1: "123 Main Street",
 *       city: "New York",
 *       state: "NY",
 *       postalCode: "10001",
 *       country: "US"
 *     },
 *     email: "john@example.com"
 *   },
 *   sku: "GLOBAL-STI-SQU-2X2",
 *   copies: 100,
 *   artworkUrl: "https://example.com/my-sticker-artwork.png",
 *   shippingMethod: "Standard",
 *   merchantReference: "venue-order-123"
 * });
 */
export async function createProdigiOrder(
  data: ProdigiOrderRequest
): Promise<ProdigiOrderResponse> {
  const { data: result, error } = await supabase.functions.invoke('prodigi', {
    body: { action: 'order', data }
  });

  if (error) {
    console.error('Prodigi order error:', error);
    throw new Error(error.message || 'Failed to create order');
  }

  if (result.error) {
    console.error('Prodigi API error:', result.error);
    throw new Error(JSON.stringify(result.error));
  }

  return result;
}

// ============================================
// EXAMPLE REQUEST BODIES FOR STICKERS
// ============================================

/**
 * Example quote request for 2x2 square stickers
 */
export const EXAMPLE_QUOTE_REQUEST: ProdigiQuoteRequest = {
  sku: "GLOBAL-STI-SQU-2X2",
  copies: 100,
  artworkUrl: "https://example.com/artwork/sticker-design.png",
  shippingCountry: "US"
};

/**
 * Example order request for 2x2 square stickers
 */
export const EXAMPLE_ORDER_REQUEST: ProdigiOrderRequest = {
  recipient: {
    name: "Jane Smith",
    address: {
      line1: "456 Oak Avenue",
      line2: "Suite 200",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
      country: "US"
    },
    email: "jane@example.com",
    phone: "+1-555-123-4567"
  },
  sku: "GLOBAL-STI-SQU-2X2",
  copies: 100,
  artworkUrl: "https://example.com/artwork/sticker-design.png",
  shippingMethod: "Standard",
  merchantReference: "VENUE-ORDER-001"
};
