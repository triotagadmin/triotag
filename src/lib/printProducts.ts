// Print Product Specifications - Manual Admin Order System
// This replaces the Prodigi API integration

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
    id: "retractable-banner-33x80",
    name: "Retractable Banner Stand",
    sku: "RB-33X80-PREMIUM",
    description: "Premium retractable banner with aluminum stand. Perfect for high-traffic venue entrances and trade shows.",
    specs: {
      material: "15oz Scrim Vinyl",
      size: "33\" x 80\" (Standard)",
      finish: "Matte Anti-Glare",
      weight: "6 lbs with stand"
    },
    leadTime: "48 hours",
    regions: ["Philippines", "Asia Pacific"],
    basePrice: 85,
    pricePerUnit: 85,
    minQuantity: 1,
  },
  {
    id: "gallery-board-24x36",
    name: "Gallery Board",
    sku: "GB-24X36-FOAM",
    description: "Lightweight foam board perfect for indoor displays and gallery presentations.",
    specs: {
      material: "5mm Foam Core",
      size: "24\" x 36\"",
      finish: "Gloss Laminate",
      weight: "1.2 lbs"
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific"],
    basePrice: 45,
    pricePerUnit: 35,
    minQuantity: 1,
  },
  {
    id: "table-tent-4x6",
    name: "Table Tent",
    sku: "TT-4X6-CARD",
    description: "Sturdy table tent for restaurant and cafe table displays.",
    specs: {
      material: "350gsm Card Stock",
      size: "4\" x 6\"",
      finish: "Gloss UV Coating",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific"],
    basePrice: 25,
    pricePerUnit: 2.5,
    minQuantity: 10,
  },
  {
    id: "window-sticker-a4",
    name: "Window Sticker",
    sku: "WS-A4-VINYL",
    description: "High-quality vinyl sticker for window displays.",
    specs: {
      material: "Premium Vinyl",
      size: "A4 (8.3\" x 11.7\")",
      finish: "Gloss",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific"],
    basePrice: 15,
    pricePerUnit: 3,
    minQuantity: 5,
  },
  {
    id: "poster-18x24",
    name: "Poster Print",
    sku: "PP-18X24-SATIN",
    description: "Professional satin finish poster for indoor displays.",
    specs: {
      material: "200gsm Satin Paper",
      size: "18\" x 24\"",
      finish: "Satin",
    },
    leadTime: "24 hours",
    regions: ["Philippines", "Asia Pacific"],
    basePrice: 20,
    pricePerUnit: 8,
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
  // Base price for first unit, then pricePerUnit for additional
  return product.basePrice + (Math.max(0, quantity - 1) * product.pricePerUnit);
}

export function getProductById(id: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find(p => p.id === id);
}

export function getProductBySku(sku: string): PrintProduct | undefined {
  return PRINT_PRODUCTS.find(p => p.sku === sku);
}
