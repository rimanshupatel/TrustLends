import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  badgeText?: string;
  badgeType?: "success" | "warning" | "danger" | "info";
  icon?: LucideIcon;
  isLoading?: boolean;
}

export default function StatCard({
  title,
  value,
  subtext,
  badgeText,
  badgeType = "info",
  icon: Icon,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
          <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-8 w-32 bg-slate-200 rounded"></div>
        <div className="h-4 w-40 bg-slate-200 rounded"></div>
      </div>
    );
  }

  const badgeStyles = {
    success: "bg-emerald-50 text-success border-emerald-100",
    warning: "bg-amber-50 text-warning border-amber-100",
    danger: "bg-red-50 text-danger border-red-100",
    info: "bg-primary-light text-primary border-blue-100",
  };

  return (
    <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-text-secondary">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-slate-50 border border-borderCustom flex items-center justify-center text-text-secondary">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-2xl font-bold text-text-primary tracking-tight">{value}</span>
          {badgeText && (
            <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full ${badgeStyles[badgeType]}`}>
              {badgeText}
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-text-muted font-medium">{subtext}</p>}
      </div>
    </div>
  );
}
