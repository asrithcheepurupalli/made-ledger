const LAST_EXPORT_KEY = "made-ledger-last-export";
const DISMISSED_KEY = "made-ledger-backup-dismissed";

export function getLastExportAt(): number | null {
  const raw = localStorage.getItem(LAST_EXPORT_KEY);
  return raw ? Number(raw) : null;
}

export function markExported(): void {
  localStorage.setItem(LAST_EXPORT_KEY, String(Date.now()));
}

export function getDismissedUntil(): number {
  const raw = localStorage.getItem(DISMISSED_KEY);
  return raw ? Number(raw) : 0;
}

export function dismissForToday(): void {
  const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISSED_KEY, String(tomorrow));
}
