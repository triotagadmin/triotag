import { PRINT_PRODUCTS, type PrintProduct } from "./printProducts";

// Maps listing ad_unit_material keys to PRINT_PRODUCTS IDs
const MATERIAL_TO_PRODUCT: Record<string, string> = {
  vinyl_sticker: "vinyl-sticker",
  table_tent_card: "table-tent-card",
  acrylic_table_tent: "table-tent-acrylic",
  coroplast_stand: "coroplast-a-frame",
  poster_frame: "vinyl-sticker", // fallback
  wall_decal: "vinyl-sticker",   // fallback
};

export function getProductForMaterial(materialType: string): PrintProduct | undefined {
  const productId = MATERIAL_TO_PRODUCT[materialType] || "vinyl-sticker";
  return PRINT_PRODUCTS.find((p) => p.id === productId);
}

export function getMaterialUnitPrice(materialType: string): number {
  const product = getProductForMaterial(materialType);
  return product?.pricePerUnit || 18;
}

export function calculateBranchCost(
  materials: { materialType: string; quantity: number }[]
): number {
  return materials.reduce((sum, m) => {
    if (m.quantity <= 0) return sum;
    return sum + getMaterialUnitPrice(m.materialType) * m.quantity;
  }, 0);
}

export function calculateTotalOrderCost(
  branches: { materials: { materialType: string; quantity: number }[] }[]
): number {
  return branches.reduce((sum, b) => sum + calculateBranchCost(b.materials), 0);
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  if (currency === "PHP") return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}
