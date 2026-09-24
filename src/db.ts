import Dexie, { type EntityTable } from "dexie";

export type TransactionType = "expense" | "revenue";
export type PaymentMode = "cash" | "upi";

export interface Transaction {
  id: number;
  type: TransactionType;
  reason: string;
  category: string;
  amount: number;
  mode: PaymentMode;
  date: string; // ISO day, e.g. "2026-09-24"
  createdAt: number;
}

export interface CategoryOverride {
  id: number;
  keyword: string;
  category: string;
  type: TransactionType;
}

export const db = new Dexie("made-ledger") as Dexie & {
  transactions: EntityTable<Transaction, "id">;
  categoryOverrides: EntityTable<CategoryOverride, "id">;
};

db.version(1).stores({
  transactions: "++id, type, category, date, createdAt",
  categoryOverrides: "++id, &keyword, type",
});
