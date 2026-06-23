interface RiskBadgeProps {
  risk: "Low" | "Medium" | "High" | "Low Risk" | "Medium Risk" | "High Risk" | string;
}

export default function RiskBadge({ risk }: RiskBadgeProps) {
  const normRisk = risk.toLowerCase().replace(" risk", "");

  const config = {
    low: { text: "Low Risk", style: "bg-emerald-50 text-success border-emerald-100" },
    medium: { text: "Medium Risk", style: "bg-amber-50 text-warning border-amber-100" },
    high: { text: "High Risk", style: "bg-red-50 text-danger border-red-100" },
  };

  const current = config[normRisk as "low" | "medium" | "high"] || { text: risk, style: "bg-slate-50 text-text-secondary border-borderCustom" };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        normRisk === "low" ? "bg-success" : normRisk === "medium" ? "bg-warning" : "bg-danger"
      }`}></span>
      {current.text}
    </span>
  );
}
