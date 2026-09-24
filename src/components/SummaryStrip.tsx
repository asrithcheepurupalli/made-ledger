import { useMonthlySummary } from "../hooks/useMonthlySummary";

function formatINR(amount: number): string {
  return amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function SummaryStrip() {
  const { revenue, spend, net, monthLabel } = useMonthlySummary();
  const netPositive = net >= 0;

  return (
    <div className="border-b border-ink-line bg-ink px-4 py-4 text-paper md:px-6">
      <div className="label text-grey-dim">{monthLabel}</div>
      <div className="num mt-1.5 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-lg md:text-xl">
        <span className="flex items-baseline gap-2">
          <span className="label text-grey-dim">Revenue</span>
          <span className="font-bold">₹{formatINR(revenue)}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="label text-grey-dim">Spend</span>
          <span className="font-bold">₹{formatINR(spend)}</span>
        </span>
        <span className="flex items-baseline gap-2">
          <span className="label text-grey-dim">Net</span>
          <span className={`font-bold ${netPositive ? "text-gold" : "text-red"}`}>
            {netPositive ? "+" : "-"}₹{formatINR(Math.abs(net))}
          </span>
        </span>
      </div>
    </div>
  );
}
