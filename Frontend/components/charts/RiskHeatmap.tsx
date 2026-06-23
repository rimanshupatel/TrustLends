import { Info } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";

const scoreBrackets = ["800 - 1000", "700 - 800", "600 - 700", "500 - 600", "< 500"];
const durations = ["1 Month", "3 Months", "6 Months", "12 Months"];

const heatmapData = [
  // Row 1 (800-1000)
  [0.1, 0.2, 0.3, 0.5],
  // Row 2 (700-800)
  [0.3, 0.5, 0.8, 1.2],
  // Row 3 (600-700)
  [0.8, 1.4, 2.1, 3.2],
  // Row 4 (500-600)
  [1.8, 3.2, 4.7, 6.5],
  // Row 5 (<500)
  [4.5, 7.8, 10.2, 14.5],
];

export default function RiskHeatmap() {
  // Helper to color cells based on default rate percentage
  const getCellColor = (rate: number) => {
    if (rate <= 0.5) return "bg-emerald-50 text-emerald-800 border-emerald-100";
    if (rate <= 1.5) return "bg-emerald-100/70 text-emerald-900 border-emerald-200";
    if (rate <= 3.5) return "bg-amber-50 text-amber-800 border-amber-100";
    if (rate <= 7.0) return "bg-amber-100/70 text-amber-900 border-amber-200";
    return "bg-red-50 text-red-800 border-red-100";
  };

  return (
    <div className="bg-white border border-cardBorder rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Platform Risk Heatmap</h3>
          <p className="text-xs text-text-muted mt-0.5">Historical default rates (%) by score and term</p>
        </div>
        <Tooltip content="Historical performance metrics illustrating how credit ratings correlate with actual default ratios across active Stellar lending pools.">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-slate-50 border border-borderCustom">
            <Info className="w-3.5 h-3.5" />
          </div>
        </Tooltip>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="py-2.5 px-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Trust Score
              </th>
              {durations.map((d, idx) => (
                <th
                  key={idx}
                  className="py-2.5 px-3 text-center text-[11px] font-semibold text-text-muted uppercase tracking-wider"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scoreBrackets.map((bracket, rowIdx) => (
              <tr key={rowIdx} className="border-t border-slate-100">
                <td className="py-3.5 px-3 text-xs font-semibold text-text-secondary">
                  {bracket}
                </td>
                {heatmapData[rowIdx].map((rate, colIdx) => (
                  <td key={colIdx} className="py-2 px-1">
                    <div
                      className={`py-3.5 text-center font-mono text-xs font-bold rounded-lg border transition-all hover:scale-[1.03] ${getCellColor(
                        rate
                      )}`}
                    >
                      {rate}%
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-6 mt-6 pt-4 border-t border-slate-100 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-100"></span>
          <span>Low Risk (0 - 1.5%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-100"></span>
          <span>Medium Risk (1.6 - 7%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-100"></span>
          <span>High Risk (&gt; 7%)</span>
        </div>
      </div>
    </div>
  );
}
