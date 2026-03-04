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
    id: "vinyl-sticker",
    name: "Vinyl Sticker",
    sku: "VS-A4-VINYL",
    description: "Durable, weather-resistant A4 vinyl sticker ideal for indoor and outdoor surfaces like walls, windows, doors, and countertops. Easy to apply with a strong adhesive backing.",
    specs: {
      material: "Premium Vinyl",
      size: "8.3\" x 11.7\" (A4)",
      finish: "Matte",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 18,
    pricePerUnit: 18,
    minQuantity: 1,
  },
  {
    id: "table-tent-card",
    name: "Table Tent Card",
    sku: "TTC-A4-CARD",
    description: "Lightweight A4-sized table tent card printed on premium card stock. Perfect for restaurant tables, café counters, and reception desks to showcase promotions and brand messaging.",
    specs: {
      material: "350gsm Card Stock",
      size: "8.3\" x 11.7\" (A4)",
      finish: "Gloss UV Coating",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 18,
    pricePerUnit: 18,
    minQuantity: 1,
  },
  {
    id: "table-tent-acrylic",
    name: "Table Tent Acrylic",
    sku: "TTA-4X6-ACRYLIC",
    description: "Sleek, transparent acrylic table tent stand with a printed insert. Built for durability and a premium look — great for upscale restaurants, salons, and retail counters.",
    specs: {
      material: "Clear Acrylic + Printed Insert",
      size: "4\" x 6\"",
      finish: "High Gloss",
    },
    leadTime: "3-5 business days",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 32,
    pricePerUnit: 32,
    minQuantity: 1,
  },
  {
    id: "coroplast-a-frame",
    name: "Coroplast A-Frame Sign",
    sku: "CAF-18X24-CORO",
    description: "Corrugated plastic A-frame sign built for high-visibility sidewalk and storefront advertising. Lightweight, weather-resistant, and easy to set up for maximum foot traffic exposure.",
    specs: {
      material: "4mm Coroplast",
      size: "18\" x 24\"",
      finish: "UV Printed",
      weight: "1.5 lbs",
    },
    leadTime: "3-5 business days",
    regions: ["Philippines", "Asia Pacific", "Global"],
    basePrice: 66,
    pricePerUnit: 66,
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
    "vinyl-sticker": "vinyl-sticker",
    "window-sticker": "vinyl-sticker",
    "glass-sticker": "vinyl-sticker",
    "wall-sticker": "vinyl-sticker",
    "concrete-sticker": "vinyl-sticker",
    "wood-sticker": "vinyl-sticker",
    "door-sticker": "vinyl-sticker",
    "sticker": "vinyl-sticker",
    "table-tent": "table-tent-card",
    "table-tent-card": "table-tent-card",
    "table-tent-acrylic": "table-tent-acrylic",
    "tabletop-qr-card": "table-tent-card",
    "coroplast-a-frame": "coroplast-a-frame",
    "a-frame": "coroplast-a-frame",
  };
  
  const productId = typeMap[adUnitType.toLowerCase()] || "vinyl-sticker";
  return getProductById(productId);
}
