import { db, type Transaction } from "../db";
import { markExported } from "./backup";

function toCSV(rows: Transaction[]): string {
  const header = ["Date", "Type", "Reason", "Category", "Amount", "Mode"];
  const lines = rows.map((r) =>
    [r.date, r.type, JSON.stringify(r.reason), JSON.stringify(r.category), r.amount, r.mode].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function download(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMonthCSV(monthKey: string, rows: Transaction[]): void {
  download(`made-ledger-${monthKey}.csv`, toCSV(rows));
  markExported();
}

/** Full-history backup, independent of whatever month Analytics happens to be viewing. */
export async function downloadFullBackupCSV(): Promise<void> {
  const rows = await db.transactions.orderBy("date").toArray();
  download(`made-ledger-backup-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  markExported();
}
