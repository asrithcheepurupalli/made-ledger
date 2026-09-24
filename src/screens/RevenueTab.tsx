import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { db, type Transaction } from "../db";
import { EditTransactionModal } from "../components/EditTransactionModal";
import { EntryForm } from "../components/EntryForm";
import { dayLabel, shiftDay, todayISO } from "../lib/dateUtils";

function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function RevenueTab() {
  const [date, setDate] = useState(todayISO());
  const [editing, setEditing] = useState<Transaction | null>(null);

  const rows = useLiveQuery(
    () => db.transactions.where("date").equals(date).and((t) => t.type === "revenue").reverse().sortBy("createdAt"),
    [date],
    [],
  );

  const total = (rows ?? []).reduce((sum, r) => sum + r.amount, 0);
  const isToday = date === todayISO();

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Revenue</h1>
          <p className="label mt-1 text-grey-dim">What the shop took in</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDate((d) => shiftDay(d, -1))}
            className="pressable rounded-full p-2 text-ink"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="num rounded-lg border border-ink-line bg-paper px-2 py-1.5 text-xs text-ink outline-none"
          />
          <button
            type="button"
            onClick={() => setDate((d) => shiftDay(d, 1))}
            disabled={isToday}
            className="pressable rounded-full p-2 text-ink disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <EntryForm type="revenue" date={date} />

      <div>
        <div className="flex items-baseline justify-between">
          <span className="label text-grey-dim">{dayLabel(date)}</span>
          <span className="num text-lg font-bold text-ink md:text-xl">₹{formatINR(total)}</span>
        </div>
        <div className="mt-2 divide-y divide-ink-line border-t border-ink-line">
          {(rows ?? []).length === 0 && (
            <p className="py-4 text-sm text-grey-dim">No revenue logged for this day.</p>
          )}
          {(rows ?? []).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setEditing(t)}
              className="pressable flex w-full items-center justify-between py-3 text-left"
            >
              <div>
                <div className="text-sm text-ink md:text-base">{t.reason}</div>
                <div className="label mt-0.5 text-grey-dim">
                  {t.category} · {t.mode === "cash" ? "Cash" : "UPI"}
                </div>
              </div>
              <div className="num text-base font-bold text-ink md:text-lg">₹{formatINR(t.amount)}</div>
            </button>
          ))}
        </div>
      </div>

      {editing && <EditTransactionModal transaction={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
