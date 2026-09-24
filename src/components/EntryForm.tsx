import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { db, type PaymentMode, type TransactionType } from "../db";
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES, learnOverride, suggestCategory } from "../lib/categorize";
import { dayLabel, todayISO } from "../lib/dateUtils";

function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

interface EntryFormProps {
  type: TransactionType;
  date: string;
  onSaved?: () => void;
}

export function EntryForm({ type, date, onSaved }: EntryFormProps) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [category, setCategory] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState<{ id: number; amount: number } | null>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reasonRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const overrides = useLiveQuery(() => db.categoryOverrides.toArray(), [], []);
  const pastEntries = useLiveQuery(
    () => db.transactions.where("type").equals(type).reverse().sortBy("createdAt"),
    [type],
    [],
  );
  const categories = type === "expense" ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES;

  const suggested = suggestCategory(reason, type, overrides ?? []);

  const reasonSuggestions = (() => {
    const q = reason.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const matches: string[] = [];
    for (const t of pastEntries ?? []) {
      const r = t.reason.trim();
      const key = r.toLowerCase();
      if (key === q || seen.has(key) || !key.includes(q)) continue;
      seen.add(key);
      matches.push(r);
      if (matches.length >= 5) break;
    }
    return matches;
  })();

  // Auto-fill the category as the reason changes, until the user picks one themselves.
  useEffect(() => {
    if (!touched) setCategory(suggested);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested, touched]);

  function handleReasonChange(value: string) {
    setReason(value);
    setTouched(false);
    setShowSuggestions(true);
  }

  function handleReasonPick(value: string) {
    setReason(value);
    setTouched(false);
    setShowSuggestions(false);
  }

  function handleCategoryPick(value: string) {
    setCategory(value);
    setTouched(true);
  }

  async function handleSave() {
    const parsedAmount = Number(amount);
    if (!reason.trim() || !parsedAmount || parsedAmount <= 0) return;

    const finalCategory = category || suggested;

    const id = await db.transactions.add({
      type,
      reason: reason.trim(),
      category: finalCategory,
      amount: parsedAmount,
      mode,
      date,
      createdAt: Date.now(),
    });

    if (touched && finalCategory !== suggested) {
      await learnOverride(reason, finalCategory, type);
    }

    setReason("");
    setAmount("");
    setCategory("");
    setTouched(false);
    setShowSuggestions(false);
    onSaved?.();
    reasonRef.current?.focus();

    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id, amount: parsedAmount });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }

  async function handleUndo() {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    await db.transactions.delete(toast.id);
    setToast(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {date !== todayISO() && (
        <div className="label rounded-lg bg-gold-soft/20 px-3 py-2 text-ink">
          Logging for {dayLabel(date)}
        </div>
      )}

      <div className="relative">
        <label className="label text-grey-dim">Reason</label>
        <input
          ref={reasonRef}
          type="text"
          value={reason}
          onChange={(e) => handleReasonChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
          placeholder={type === "expense" ? "e.g. milk delivery" : "e.g. counter sale"}
          className="mt-1.5 w-full rounded-lg border border-ink-line bg-paper px-3.5 py-3 text-base text-ink outline-none placeholder:text-grey-dim focus:border-ink"
        />
        {showSuggestions && reasonSuggestions.length > 0 && (
          <div className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-ink-line bg-paper shadow-lg">
            {reasonSuggestions.map((r) => (
              <button
                key={r}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleReasonPick(r)}
                className="pressable block w-full px-3.5 py-2.5 text-left text-base text-ink hover:bg-paper-dim"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label text-grey-dim">Category</label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleCategoryPick(c)}
                className={`pressable label rounded-pill border px-3 py-2 transition-colors ${
                  active
                    ? "border-ink bg-ink text-paper"
                    : "border-ink-line bg-paper-dim text-grey"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="label text-grey-dim">Amount</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="num mt-1.5 w-full rounded-lg border border-ink-line bg-paper px-4 py-4 text-4xl font-bold text-ink outline-none placeholder:text-grey-dim focus:border-ink md:text-5xl"
        />
      </div>

      <div>
        <label className="label text-grey-dim">Mode</label>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(["cash", "upi"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`pressable label rounded-lg border py-3 uppercase ${
                mode === m ? "border-ink bg-ink text-paper" : "border-ink-line bg-paper-dim text-grey"
              }`}
            >
              {m === "cash" ? "Cash" : "UPI"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="pressable label mt-1 rounded-lg bg-red py-4 text-paper"
      >
        Save {type === "expense" ? "Expense" : "Revenue"}
      </button>

      {toast && (
        <div className="fixed inset-x-4 bottom-20 z-20 flex items-center justify-between gap-3 rounded-lg bg-ink px-4 py-3 text-paper shadow-lg md:inset-x-auto md:bottom-6 md:left-1/2 md:w-full md:max-w-sm md:-translate-x-1/2">
          <span className="label">Saved ₹{formatINR(toast.amount)}</span>
          <button type="button" onClick={handleUndo} className="pressable label text-gold-soft">
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
