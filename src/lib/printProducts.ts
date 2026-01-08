// Print Product Specifications - Manual Admin Order System
// Updated with new ad unit prices

export interface PrintProduct {
  id: string;
  name: string;
  sku: string;
  description: string;
  specs: {
    material: string;
    size: string;
    finish?: string;
    weight?: string;
  };
  leadTime: string;
  regions: string[];
  basePrice: number;
  pricePerUnit: number;
  minQuantity: number;
  image?: string;
}

export const PRINT_PRODUCTS: PrintProduct[] = [
  {
    id: "concrete-sticker",
    name: "Concrete Sticker",
    sku: "CS-A4-VINYL",
    description: "High-quality vinyl sticker designed for concrete surfaces. Weather-resistant and durable.",
    specs: {
      material: "Premium Vinyl",
      size: "8.3\" x 11.7\" (A4)",
      finish: "Matte",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 6,
    pricePerUnit: 6,
    minQuantity: 1,
  },
  {
    id: "wood-sticker",
    name: "Wood Sticker",
    sku: "WS-A4-VINYL",
    description: "Premium vinyl sticker optimized for wood surfaces. Long-lasting adhesive.",
    specs: {
      material: "Premium Vinyl",
      size: "8.3\" x 11.7\" (A4)",
      finish: "Gloss",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 6,
    pricePerUnit: 6,
    minQuantity: 1,
  },
  {
    id: "glass-sticker",
    name: "Glass Sticker",
    sku: "GS-A4-VINYL",
    description: "Clear vinyl sticker perfect for glass windows and surfaces. High visibility.",
    specs: {
      material: "Premium Vinyl",
      size: "8.3\" x 11.7\" (A4)",
      finish: "Gloss",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 6,
    pricePerUnit: 6,
    minQuantity: 1,
  },
  {
    id: "table-tent",
    name: "Table Tent",
    sku: "TT-4X6-CARD",
    description: "Sturdy table tent for restaurant and cafe table displays.",
    specs: {
      material: "350gsm Card Stock",
      size: "4\" x 6\"",
      finish: "Gloss UV Coating",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 12,
    pricePerUnit: 12,
    minQuantity: 1,
  },
];

export const SHIPPING_COUNTRIES = [
  { code: "PH", name: "Philippines" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
];

export function calculateOrderTotal(product: PrintProduct, quantity: number): number {
  if (quantity <= 0) return 0;
  return product.pricePerUnit * quantity;
}

export function getProductById(id: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find(p => p.id === id);
}

export function getProductBySku(sku: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find(p => p.sku === sku);
}

// Map ad unit types from listing to print products
export function getProductByAdUnitType(adUnitType: string): PrintProduct | undefined {
  const typeMap: Record<string, string> = {
    "window-sticker": "glass-sticker",
    "glass-sticker": "glass-sticker",
    "wall-sticker": "concrete-sticker",
    "concrete-sticker": "concrete-sticker",
    "wood-sticker": "wood-sticker",
    "door-sticker": "wood-sticker",
    "table-tent": "table-tent",
    "tabletop-qr-card": "table-tent",
    "sticker": "concrete-sticker",
  };
  
  const productId = typeMap[adUnitType.toLowerCase()] || "concrete-sticker";
  return getProductById(productId);
}
