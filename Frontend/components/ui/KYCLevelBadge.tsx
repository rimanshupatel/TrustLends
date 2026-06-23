interface KYCLevelBadgeProps {
  level: number;
}

export default function KYCLevelBadge({ level }: KYCLevelBadgeProps) {
  const configs = {
    1: { text: "Level 1 Verified", style: "bg-blue-50 text-blue-700 border-blue-150" },
    2: { text: "Level 2 Verified", style: "bg-emerald-50 text-success border-emerald-150" },
    3: { text: "Level 3 Premium", style: "bg-violet-50 text-accent border-violet-150" },
  };

  const current = configs[level as 1 | 2 | 3] || { text: `Level ${level}`, style: "bg-slate-50 text-text-secondary border-borderCustom" };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.style}`}>
      {current.text}
    </span>
  );
}
