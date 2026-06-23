interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  subLabel?: string;
  colorClass?: string;
  size?: "sm" | "md" | "lg";
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  subLabel,
  colorClass = "bg-gradient-to-r from-primary to-accent",
  size = "md",
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      {(label || subLabel) && (
        <div className="flex items-center justify-between text-xs font-semibold text-text-secondary mb-1.5">
          {label && <span>{label}</span>}
          {subLabel && <span className="font-mono text-text-muted">{subLabel}</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
