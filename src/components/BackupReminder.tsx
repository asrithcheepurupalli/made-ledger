import { useLiveQuery } from "dexie-react-hooks";
import { X } from "lucide-react";
import { useState } from "react";
import { db } from "../db";
import { dismissForToday, getDismissedUntil, getLastExportAt } from "../lib/backup";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface BackupReminderProps {
  onExport: () => void;
}

export function BackupReminder({ onExport }: BackupReminderProps) {
  const [, forceRerender] = useState(0);
  const newest = useLiveQuery(() => db.transactions.orderBy("createdAt").last(), [], undefined);

  if (!newest) return null;

  const lastExport = getLastExportAt();
  const dismissedUntil = getDismissedUntil();
  const now = Date.now();

  const overdue = now - (lastExport ?? 0) > WEEK_MS && newest.createdAt > (lastExport ?? 0);
  if (!overdue || now < dismissedUntil) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink-line bg-gold-soft/20 px-4 py-2.5 md:px-6">
      <p className="label text-ink">
        {lastExport ? "It has been a week since your last backup." : "You have not backed up your data yet."} Export a
        copy so nothing is lost.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="pressable label rounded-full bg-ink px-3 py-1.5 text-paper"
        >
          Back up now
        </button>
        <button
          type="button"
          onClick={() => {
            dismissForToday();
            forceRerender((n) => n + 1);
          }}
          className="pressable rounded-full p-1.5 text-grey-dim"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
