import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export interface MonthlySummary {
  revenue: number;
  spend: number;
  net: number;
  monthLabel: string;
}

function monthBounds(monthKey: string): { start: string; end: string } {
  return { start: `${monthKey}-01`, end: `${monthKey}-32` };
}

/** Live-updating totals for a given month (defaults to the current month). YYYY-MM. */
export function useMonthlySummary(monthKey?: string): MonthlySummary {
  const key = monthKey ?? new Date().toISOString().slice(0, 7);

  const totals = useLiveQuery(async () => {
    const { start, end } = monthBounds(key);
    const rows = await db.transactions.where("date").between(start, end, true, true).toArray();

    let revenue = 0;
    let spend = 0;
    for (const row of rows) {
      if (row.type === "revenue") revenue += row.amount;
      else spend += row.amount;
    }
    return { revenue, spend };
  }, [key]);

  const monthLabel = new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return {
    revenue: totals?.revenue ?? 0,
    spend: totals?.spend ?? 0,
    net: (totals?.revenue ?? 0) - (totals?.spend ?? 0),
    monthLabel,
  };
}
