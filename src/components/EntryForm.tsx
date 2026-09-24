import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db, type PaymentMode, type TransactionType } from "../db";
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES, learnOverride, suggestCategory } from "../lib/categorize";

interface EntryFormProps {
  type: TransactionType;
  onSaved?: () => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export function EntryForm({ type, onSaved }: EntryFormProps) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [category, setCategory] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

    await db.transactions.add({
      type,
      reason: reason.trim(),
      category: finalCategory,
      amount: parsedAmount,
      mode,
      date: todayISO(),
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
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <label className="label text-grey-dim">Reason</label>
        <input
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
    </div>
  );
}
