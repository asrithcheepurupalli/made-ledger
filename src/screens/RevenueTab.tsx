import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { EntryForm } from "../components/EntryForm";

const todayISO = () => new Date().toISOString().slice(0, 10);

function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function RevenueTab() {
  const today = todayISO();
  const rows = useLiveQuery(
    () => db.transactions.where("date").equals(today).and((t) => t.type === "revenue").reverse().sortBy("createdAt"),
    [today],
    [],
  );

  const total = (rows ?? []).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col gap-6 px-4 py-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Revenue</h1>
        <p className="label mt-1 text-grey-dim">What the shop took in today</p>
      </div>

      <EntryForm type="revenue" />

      <div>
        <div className="flex items-baseline justify-between">
          <span className="label text-grey-dim">Today</span>
          <span className="num text-lg font-bold text-ink md:text-xl">₹{formatINR(total)}</span>
        </div>
        <div className="mt-2 divide-y divide-ink-line border-t border-ink-line">
          {(rows ?? []).length === 0 && (
            <p className="py-4 text-sm text-grey-dim">No revenue logged yet today.</p>
          )}
          {(rows ?? []).map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm text-ink md:text-base">{t.reason}</div>
                <div className="label mt-0.5 text-grey-dim">
                  {t.category} · {t.mode === "cash" ? "Cash" : "UPI"}
                </div>
              </div>
              <div className="num text-base font-bold text-ink md:text-lg">₹{formatINR(t.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
