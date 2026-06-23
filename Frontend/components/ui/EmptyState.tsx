import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: any;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = "No data found",
  description = "There are no records matching your request at this time.",
  icon: Icon = AlertCircle,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-borderCustom rounded-xl bg-slate-50/50 my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-text-muted mb-4 border border-borderCustom">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-text-primary mb-1">{title}</h4>
      <p className="text-xs text-text-muted max-w-xs leading-relaxed mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 border-2 border-primary text-primary hover:bg-primary-light font-semibold rounded-xl text-xs transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
