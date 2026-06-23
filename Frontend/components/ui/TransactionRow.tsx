import { Transaction } from "@/lib/mock-data";

interface TransactionRowProps {
  tx: Transaction;
}

export default function TransactionRow({ tx }: TransactionRowProps) {
  const isPositive = tx.impact.startsWith("+");
  const isNegative = tx.impact.startsWith("-") && tx.impact !== "—";

  const impactColor = isPositive
    ? "text-success font-bold"
    : isNegative
    ? "text-danger font-bold"
    : "text-text-muted font-mono";

  const statusStyles = {
    Completed: "bg-emerald-50 text-success border-emerald-100",
    Active: "bg-blue-50 text-primary border-blue-100",
    Pending: "bg-amber-50 text-warning border-amber-100",
  };

  return (
    <tr className="border-b border-borderCustom hover:bg-slate-50/50 transition-colors">
      <td className="py-4 px-4 text-sm font-semibold text-text-primary">
        {tx.type}
      </td>
      <td className="py-4 px-4 text-sm font-mono text-text-secondary">
        {tx.amount}
      </td>
      <td className="py-4 px-4 text-xs text-text-muted">
        {tx.date}
      </td>
      <td className="py-4 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles[tx.status] || "bg-slate-100"}`}>
          {tx.status}
        </span>
      </td>
      <td className={`py-4 px-4 text-sm font-mono text-right ${impactColor}`}>
        {tx.impact}
      </td>
    </tr>
  );
}
