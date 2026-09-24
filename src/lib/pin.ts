const PIN_KEY = "made-ledger-pin";
const UNLOCK_KEY = "made-ledger-unlocked";

export function getPin(): string | null {
  return localStorage.getItem(PIN_KEY);
}

export function setPin(pin: string): void {
  localStorage.setItem(PIN_KEY, pin);
}

export function clearPin(): void {
  localStorage.removeItem(PIN_KEY);
  sessionStorage.removeItem(UNLOCK_KEY);
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === "1";
}

export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCK_KEY, "1");
}

export function lockNow(): void {
  sessionStorage.removeItem(UNLOCK_KEY);
}
