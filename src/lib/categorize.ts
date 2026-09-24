import { db, type CategoryOverride, type TransactionType } from "../db";

export const EXPENSE_CATEGORIES = [
  "Stock & Supplies",
  "Staff & Wages",
  "Rent",
  "Maintenance & Repairs",
  "Transport & Delivery",
  "Distributor Bills",
  "Utilities",
  "Other",
] as const;

export const REVENUE_CATEGORIES = ["Counter Sale", "Bulk Order", "Online Order", "Other Income"] as const;

export const DEFAULT_CATEGORY: Record<TransactionType, string> = {
  expense: "Other",
  revenue: "Counter Sale",
};

// Seed dictionary drawn from real ledger line items. Keys are lowercase
// keywords; first match wins, so more specific words should sit above
// broader ones within a category block.
const EXPENSE_SEED: Record<string, string> = {
  // Stock & Supplies
  milk: "Stock & Supplies",
  colgate: "Stock & Supplies",
  sensodyne: "Stock & Supplies",
  santhoor: "Stock & Supplies",
  lays: "Stock & Supplies",
  cocacola: "Stock & Supplies",
  "coca cola": "Stock & Supplies",
  fizz: "Stock & Supplies",
  haldiram: "Stock & Supplies",
  bingo: "Stock & Supplies",
  aashirwad: "Stock & Supplies",
  ashirwad: "Stock & Supplies",
  unilever: "Stock & Supplies",
  badam: "Stock & Supplies",
  oil: "Stock & Supplies",
  biscuit: "Stock & Supplies",
  rice: "Stock & Supplies",
  atta: "Stock & Supplies",
  sugar: "Stock & Supplies",
  soap: "Stock & Supplies",
  shampoo: "Stock & Supplies",
  snacks: "Stock & Supplies",
  chips: "Stock & Supplies",
  stock: "Stock & Supplies",
  supplier: "Stock & Supplies",
  wholesale: "Stock & Supplies",
  // Staff & Wages
  wages: "Staff & Wages",
  wage: "Staff & Wages",
  salary: "Staff & Wages",
  staff: "Staff & Wages",
  advance: "Staff & Wages",
  bonus: "Staff & Wages",
  sai: "Staff & Wages",
  // Rent
  rent: "Rent",
  landlord: "Rent",
  // Maintenance & Repairs
  cycle: "Maintenance & Repairs",
  repair: "Maintenance & Repairs",
  maintenance: "Maintenance & Repairs",
  paint: "Maintenance & Repairs",
  fridge: "Maintenance & Repairs",
  freezer: "Maintenance & Repairs",
  equipment: "Maintenance & Repairs",
  // Transport & Delivery
  transport: "Transport & Delivery",
  delivery: "Transport & Delivery",
  auto: "Transport & Delivery",
  fuel: "Transport & Delivery",
  petrol: "Transport & Delivery",
  diesel: "Transport & Delivery",
  freight: "Transport & Delivery",
  // Distributor Bills
  distributor: "Distributor Bills",
  bill: "Distributor Bills",
  invoice: "Distributor Bills",
  // Utilities
  electricity: "Utilities",
  current: "Utilities",
  water: "Utilities",
  internet: "Utilities",
  wifi: "Utilities",
  phone: "Utilities",
  recharge: "Utilities",
};

const REVENUE_SEED: Record<string, string> = {
  bulk: "Bulk Order",
  wholesale: "Bulk Order",
  order: "Bulk Order",
  online: "Online Order",
  swiggy: "Online Order",
  zomato: "Online Order",
  app: "Online Order",
  refund: "Other Income",
  commission: "Other Income",
  rental: "Other Income",
  scrap: "Other Income",
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/** Longest-keyword-first match against a plain reason string. */
function matchDictionary(reason: string, dict: Record<string, string>): string | null {
  const text = normalize(reason);
  if (!text) return null;

  const keywords = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const keyword of keywords) {
    if (text.includes(keyword)) return dict[keyword];
  }
  return null;
}

/**
 * Suggests a category for a reason string, given the already-loaded
 * override list (pass the live Dexie query result — no per-keystroke
 * DB read). Learned overrides win over the seed dictionary.
 */
export function suggestCategory(reason: string, type: TransactionType, overrides: CategoryOverride[]): string {
  const text = normalize(reason);
  if (!text) return DEFAULT_CATEGORY[type];

  const learned: Record<string, string> = {};
  for (const o of overrides) {
    if (o.type === type) learned[o.keyword] = o.category;
  }

  return (
    matchDictionary(text, learned) ??
    matchDictionary(text, type === "expense" ? EXPENSE_SEED : REVENUE_SEED) ??
    DEFAULT_CATEGORY[type]
  );
}

/** Extracts the most distinctive word from a reason to key a learned override on. */
export function keyKeyword(reason: string): string {
  const words = normalize(reason)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return normalize(reason);
  return words.sort((a, b) => b.length - a.length)[0];
}

/** Persists a manual category pick so the next matching reason auto-fills it. */
export async function learnOverride(reason: string, category: string, type: TransactionType): Promise<void> {
  const keyword = keyKeyword(reason);
  if (!keyword) return;

  const existing = await db.categoryOverrides.where("keyword").equals(keyword).first();
  if (existing) {
    await db.categoryOverrides.update(existing.id, { category, type });
  } else {
    await db.categoryOverrides.add({ keyword, category, type } as CategoryOverride);
  }
}
