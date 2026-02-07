import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status: "online" | "warning" | "error" | "neutral";
  trend?: { value: number; up: boolean };
  delay?: number;
}

const statusStyles = {
  online: "text-success",
  warning: "text-warning",
  error: "text-error",
  neutral: "text-muted-foreground",
};

export function StatusCard({
  title,
  value,
  unit,
  icon: Icon,
  status,
  trend,
  delay = 0,
}: StatusCardProps) {
  return (
    <div
      className={cn(
        "theme-card p-6 opacity-0 animate-fade-in-up",
        delay > 0 && `animation-delay-${delay}`
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-md bg-muted/50",
              statusStyles[status]
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-semibold mt-1">
              {value}
              {unit && (
                <span className="text-sm text-muted-foreground ml-1">
                  {unit}
                </span>
              )}
            </p>
          </div>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              trend.up ? "text-success" : "text-error"
            )}
          >
            <span>{trend.up ? "↑" : "↓"}</span>
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
