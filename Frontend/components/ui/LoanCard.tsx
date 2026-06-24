import { Calendar, Tag, ShieldCheck, DollarSign } from "lucide-react";
import { ActiveLoan } from "@/lib/mock-data";

interface LoanCardProps {
  loan: ActiveLoan;
  onPay?: () => void;
}

export default function LoanCard({ loan, onPay }: LoanCardProps) {
  console.log("loan data:", loan);
  const isCompleted = !loan || loan.remaining <= 0;

  return (
    <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-borderCustom">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider font-mono">Loan {loan.id}</span>
            <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${loan.status === "On Track"
              ? "bg-emerald-50 text-success border-emerald-100"
              : "bg-amber-50 text-warning border-amber-100"
              }`}>
              {loan.status}
            </span>
          </div>
          <h3 className="text-lg font-bold text-text-primary mt-1">₹{loan.amount.toLocaleString()} borrowed</h3>
        </div>

        <button
          onClick={onPay}
          disabled={isCompleted}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
        >
          {isCompleted ? "Fully Repaid" : "Make Payment"}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="py-6">
        <div className="flex items-center justify-between text-xs text-text-secondary font-medium mb-2">
          <span>Progress ({loan.progress}% Repaid)</span>
          <span className="font-mono">₹{loan.repaid.toLocaleString()} / ₹{loan.amount.toLocaleString()}</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${loan.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[11px] text-text-muted mt-1.5 font-medium">
          <span>Remaining: ₹{loan.remaining.toLocaleString()}</span>
          <span>Due date: {loan.dueDate}</span>
        </div>
      </div>

      {/* Grid details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-borderCustom bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-borderCustom flex items-center justify-center text-text-secondary">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-semibold uppercase">Purpose</p>
            <p className="text-xs font-bold text-text-primary">{loan.purpose}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-borderCustom flex items-center justify-center text-text-secondary">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-semibold uppercase">Interest Rate</p>
            <p className="text-xs font-bold text-text-primary font-mono">{loan.interestRate}% APY</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-borderCustom flex items-center justify-center text-text-secondary">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-text-muted font-semibold uppercase">Due In</p>
            <p className="text-xs font-bold text-text-primary">15 Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
