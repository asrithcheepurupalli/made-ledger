import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { SummaryStrip } from "./components/SummaryStrip";
import { AnalyticsTab } from "./screens/AnalyticsTab";
import { RevenueTab } from "./screens/RevenueTab";
import { SpendTab } from "./screens/SpendTab";

type Tab = "spend" | "revenue" | "analytics";

const TABS: { key: Tab; label: string; icon: typeof TrendingDown }[] = [
  { key: "spend", label: "Spend", icon: TrendingDown },
  { key: "revenue", label: "Revenue", icon: TrendingUp },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("spend");

  return (
    <div className="flex h-dvh flex-col bg-paper md:flex-row">
      <aside className="hidden shrink-0 flex-col border-r border-ink-line bg-paper-dim md:flex md:w-60 md:p-5">
        <div className="mb-8">
          <div className="font-display text-lg font-semibold text-ink">Vaarahi Super Market</div>
          <div className="label mt-1 text-grey-dim">made. ledger</div>
        </div>
        <nav className="flex flex-col gap-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`pressable label flex items-center gap-3 rounded-lg px-3 py-3 text-left ${
                  active ? "bg-ink text-paper" : "text-grey"
                }`}
              >
                <Icon size={18} className={active ? "text-red" : "text-grey"} strokeWidth={active ? 2.5 : 2} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-ink-line bg-paper px-4 py-3 md:hidden">
          <div className="font-display text-base font-semibold text-ink">Vaarahi Super Market</div>
          <div className="label mt-0.5 text-grey-dim">made. ledger</div>
        </header>

        <SummaryStrip />

        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto pb-20 md:pb-8">
          {tab === "spend" && <SpendTab />}
          {tab === "revenue" && <RevenueTab />}
          {tab === "analytics" && <AnalyticsTab />}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 flex border-t border-ink-line bg-paper md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className="pressable label flex flex-1 flex-col items-center gap-1 py-3"
              >
                <Icon size={20} className={active ? "text-red" : "text-grey"} strokeWidth={active ? 2.5 : 2} />
                <span className={active ? "text-ink" : "text-grey-dim"}>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
