import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconClass?: string;
  trend?: "up" | "down" | "neutral";
}

/**
 * Consistent KPI / stat card used across all dashboard pages.
 */
export function StatCard({ label, value, sub, icon: Icon, iconClass = "bg-primary/10 text-primary" }: StatCardProps) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground leading-tight truncate">{label}</p>
            {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Responsive stat grid — 2 cols on mobile, 4 on md+.
 * Pass `cols` to override (e.g. cols={3} for 3-column grids).
 */
export function StatGrid({ children, cols = 4 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass =
    cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 3
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 md:grid-cols-4";
  return <div className={`grid gap-3 sm:gap-4 ${colClass}`}>{children}</div>;
}
