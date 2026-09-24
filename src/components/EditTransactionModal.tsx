import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { db, type Transaction } from "../db";
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from "../lib/categorize";

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export function EditTransactionModal({ transaction, onClose }: EditTransactionModalProps) {
  const [reason, setReason] = useState(transaction.reason);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [category, setCategory] = useState(transaction.category);
  const [mode, setMode] = useState(transaction.mode);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = transaction.type === "expense" ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES;

  async function handleSave() {
    const parsedAmount = Number(amount);
    if (!reason.trim() || !parsedAmount || parsedAmount <= 0) return;
    await db.transactions.update(transaction.id, {
      reason: reason.trim(),
      amount: parsedAmount,
      category,
      mode,
    });
    onClose();
  }

  async function handleDelete() {
    await db.transactions.delete(transaction.id);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 md:items-center"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-paper p-5 md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            Edit {transaction.type === "expense" ? "expense" : "revenue"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="pressable rounded-full p-1.5 text-grey-dim"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="label text-grey-dim">Reason</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-ink-line bg-paper px-3.5 py-3 text-base text-ink outline-none focus:border-ink"
          />
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
                  onClick={() => setCategory(c)}
                  className={`pressable label rounded-full border px-3 py-2 transition-colors ${
                    active ? "border-ink bg-ink text-paper" : "border-ink-line bg-paper-dim text-grey"
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
            className="num mt-1.5 w-full rounded-lg border border-ink-line bg-paper px-4 py-3 text-3xl font-bold text-ink outline-none focus:border-ink"
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

        <div className="mt-1 flex gap-2">
          {confirmDelete ? (
            <>
              <button
                type="button"
                onClick={handleDelete}
                className="pressable label flex-1 rounded-lg bg-red py-3.5 text-paper"
              >
                Confirm delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="pressable label rounded-lg border border-ink-line px-4 py-3.5 text-ink"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="pressable label flex-1 rounded-lg bg-ink py-3.5 text-paper"
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="pressable rounded-lg border border-ink-line px-4 py-3.5 text-red"
                aria-label="Delete entry"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
