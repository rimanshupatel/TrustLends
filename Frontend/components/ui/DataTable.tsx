import { ReactNode } from "react";
import EmptyState from "./EmptyState";

interface DataTableProps {
  headers: string[];
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: ReactNode;
}

export default function DataTable({
  headers,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  children,
}: DataTableProps) {
  return (
    <div className="w-full bg-white border border-cardBorder rounded-xl shadow-sm overflow-hidden">
      {isEmpty ? (
        <div className="p-8">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-borderCustom bg-slate-50/50">
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className={`py-3 px-4 text-xs font-semibold text-text-muted uppercase tracking-wider ${
                      idx === headers.length - 1 ? "text-right" : ""
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
