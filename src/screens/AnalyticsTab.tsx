import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, Download, HardDriveDownload } from "lucide-react";
import { useState } from "react";
import { db, type Transaction } from "../db";
import { downloadFullBackupCSV, downloadMonthCSV } from "../lib/csv";

function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(monthKey: string): string {
  return new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function dayLabel(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

interface DayGroup {
  date: string;
  revenue: number;
  spend: number;
  net: number;
  rows: Transaction[];
}

function groupByDay(rows: Transaction[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const r of rows) {
    let group = map.get(r.date);
    if (!group) {
      group = { date: r.date, revenue: 0, spend: 0, net: 0, rows: [] };
      map.set(r.date, group);
    }
    if (r.type === "revenue") group.revenue += r.amount;
    else group.spend += r.amount;
    group.net = group.revenue - group.spend;
    group.rows.push(r);
  }
  for (const group of map.values()) {
    group.rows.sort((a, b) => b.createdAt - a.createdAt);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export function AnalyticsTab() {
  const [monthKey, setMonthKey] = useState(() => new Date().toISOString().slice(0, 7));
  const [openDay, setOpenDay] = useState<string | null>(null);

  const rows = useLiveQuery(
    () => db.transactions.where("date").between(`${monthKey}-01`, `${monthKey}-32`, true, true).toArray(),
    [monthKey],
    [],
  );

  const data = rows ?? [];
  const revenue = data.filter((r) => r.type === "revenue").reduce((s, r) => s + r.amount, 0);
  const spend = data.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const net = revenue - spend;

  const days = groupByDay(data);

  const byCategory = new Map<string, number>();
  for (const r of data) {
    if (r.type !== "expense") continue;
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + r.amount);
  }
  const categoryRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategory = categoryRows[0]?.[1] ?? 0;

  const cashTotal = data.filter((r) => r.mode === "cash").reduce((s, r) => s + r.amount, 0);
  const upiTotal = data.filter((r) => r.mode === "upi").reduce((s, r) => s + r.amount, 0);
  const modeTotal = cashTotal + upiTotal || 1;

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-ink">Analytics</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonthKey((m) => shiftMonth(m, -1))}
            className="pressable rounded-full p-2 text-ink"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="label w-28 text-center text-ink">{monthLabel(monthKey)}</span>
          <button
            type="button"
            onClick={() => setMonthKey((m) => shiftMonth(m, 1))}
            className="pressable rounded-full p-2 text-ink"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-ink-line bg-paper-dim p-3">
          <div className="label text-grey-dim">Revenue</div>
          <div className="num mt-1 text-2xl font-bold text-ink md:text-3xl">₹{formatINR(revenue)}</div>
        </div>
        <div className="rounded-lg border border-ink-line bg-paper-dim p-3">
          <div className="label text-grey-dim">Spend</div>
          <div className="num mt-1 text-2xl font-bold text-ink md:text-3xl">₹{formatINR(spend)}</div>
        </div>
        <div className="rounded-lg border border-ink-line bg-paper-dim p-3">
          <div className="label text-grey-dim">Net</div>
          <div className={`num mt-1 text-2xl font-bold md:text-3xl ${net >= 0 ? "text-gold" : "text-red"}`}>
            {net >= 0 ? "+" : "-"}₹{formatINR(Math.abs(net))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="label text-grey-dim">Day by day</h2>
        <div className="mt-3 flex flex-col divide-y divide-ink-line border-t border-ink-line">
          {days.length === 0 && <p className="py-4 text-sm text-grey-dim">No entries this month.</p>}
          {days.map((day) => {
            const isOpen = openDay === day.date;
            return (
              <div key={day.date}>
                <button
                  type="button"
                  onClick={() => setOpenDay(isOpen ? null : day.date)}
                  className="pressable flex w-full items-center justify-between py-3 text-left"
                >
                  <span className="text-sm text-ink md:text-base">{dayLabel(day.date)}</span>
                  <span className="num flex items-baseline gap-3 text-sm md:text-base">
                    <span className="text-grey-dim">+₹{formatINR(day.revenue)}</span>
                    <span className="text-grey-dim">-₹{formatINR(day.spend)}</span>
                    <span className={`font-bold ${day.net >= 0 ? "text-gold" : "text-red"}`}>
                      {day.net >= 0 ? "+" : "-"}₹{formatINR(Math.abs(day.net))}
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-2.5 pb-3">
                    {day.rows.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg bg-paper-dim px-3 py-2.5">
                        <div>
                          <div className="text-sm text-ink">{t.reason}</div>
                          <div className="label mt-0.5 text-grey-dim">
                            {t.category} · {t.mode === "cash" ? "Cash" : "UPI"}
                          </div>
                        </div>
                        <div className={`num text-sm font-bold ${t.type === "revenue" ? "text-ink" : "text-red"}`}>
                          {t.type === "revenue" ? "+" : "-"}₹{formatINR(t.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="label text-grey-dim">Spend by category</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {categoryRows.length === 0 && <p className="text-sm text-grey-dim">No expenses this month.</p>}
          {categoryRows.map(([category, amount]) => (
            <div key={category}>
              <div className="flex items-baseline justify-between text-base md:text-lg">
                <span className="text-ink">{category}</span>
                <span className="num font-bold text-ink">₹{formatINR(amount)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-pill bg-paper-dim">
                <div
                  className="h-full rounded-pill bg-ink"
                  style={{ width: `${maxCategory ? (amount / maxCategory) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="label text-grey-dim">Cash vs UPI</h2>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-pill bg-paper-dim">
          <div className="h-full bg-ink" style={{ width: `${(cashTotal / modeTotal) * 100}%` }} />
          <div className="h-full bg-gold-soft" style={{ width: `${(upiTotal / modeTotal) * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-base md:text-lg">
          <span className="flex items-center gap-1.5 text-ink">
            <span className="inline-block size-2 rounded-full bg-ink" />
            Cash <span className="num font-bold">₹{formatINR(cashTotal)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-ink">
            <span className="inline-block size-2 rounded-full bg-gold-soft" />
            UPI <span className="num font-bold">₹{formatINR(upiTotal)}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => downloadMonthCSV(monthKey, data)}
          disabled={data.length === 0}
          className="pressable label flex items-center justify-center gap-2 rounded-lg border border-ink-line py-3 text-ink disabled:opacity-40"
        >
          <Download size={14} />
          Export month
        </button>
        <button
          type="button"
          onClick={() => downloadFullBackupCSV()}
          className="pressable label flex items-center justify-center gap-2 rounded-lg border border-ink-line py-3 text-ink"
        >
          <HardDriveDownload size={14} />
          Back up all data
        </button>
      </div>
    </div>
  );
}
