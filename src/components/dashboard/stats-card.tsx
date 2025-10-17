import { ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export function StatsCard({ title, value, change, subtitle }: StatsCardProps) {
  return (
    <div className="bg-[#0F1E19] rounded-xl p-6 space-y-4">
      <h3 className="text-xs font-semibold text-[#6B7F77] uppercase tracking-wider">
        {title}
      </h3>
      
      <div className="space-y-2">
        <p className="text-4xl font-bold text-[#E5F5ED]">{value}</p>
        
        {change && (
          <div
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
              change.isPositive
                ? "bg-[#1F3D32] text-[#4ADE80]"
                : "bg-[#3D2E1F] text-[#DEA154]"
            }`}
          >
            {change.isPositive ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {change.value}
          </div>
        )}
        
        {subtitle && (
          <p className="text-xs text-[#6B7F77]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
