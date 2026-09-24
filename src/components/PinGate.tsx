import { Delete, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { getPin, markUnlocked, setPin } from "../lib/pin";

const PIN_LENGTH = 4;
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

interface PinGateProps {
  onUnlock: () => void;
}

export function PinGate({ onUnlock }: PinGateProps) {
  const existingPin = getPin();
  const [mode, setMode] = useState<"unlock" | "create" | "confirm">(existingPin ? "unlock" : "create");
  const [entry, setEntry] = useState("");
  const [firstEntry, setFirstEntry] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (entry.length < PIN_LENGTH) return;

    if (mode === "unlock") {
      if (entry === existingPin) {
        markUnlocked();
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setEntry("");
          setError(false);
        }, 400);
      }
      return;
    }

    if (mode === "create") {
      setFirstEntry(entry);
      setEntry("");
      setMode("confirm");
      return;
    }

    if (entry === firstEntry) {
      setPin(entry);
      markUnlocked();
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => {
        setEntry("");
        setFirstEntry("");
        setMode("create");
        setError(false);
      }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  function press(digit: string) {
    if (entry.length >= PIN_LENGTH) return;
    setEntry((e) => e + digit);
  }

  const title = mode === "unlock" ? "Enter PIN" : mode === "create" ? "Set a PIN" : "Confirm PIN";
  const subtitle =
    mode === "unlock"
      ? "This device is locked"
      : mode === "create"
        ? "Choose a 4-digit PIN for this counter"
        : "Enter it again to confirm";

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-8 bg-paper px-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="rounded-full bg-paper-dim p-3 text-ink">
          <Lock size={22} />
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        <p className="label text-grey-dim">{subtitle}</p>
      </div>

      <div className="flex gap-3">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={`size-3.5 rounded-full border ${
              i < entry.length
                ? error
                  ? "border-red bg-red"
                  : "border-ink bg-ink"
                : "border-ink-line bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="pressable num flex size-16 items-center justify-center rounded-full bg-paper-dim text-xl font-bold text-ink"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          onClick={() => press("0")}
          className="pressable num flex size-16 items-center justify-center rounded-full bg-paper-dim text-xl font-bold text-ink"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => setEntry((e) => e.slice(0, -1))}
          className="pressable flex size-16 items-center justify-center rounded-full text-ink"
          aria-label="Backspace"
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}
