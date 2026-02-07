import { Activity } from "lucide-react";

interface ChartPlaceholderProps {
  title: string;
  subtitle?: string;
  dataPoints?: number;
  delay?: number;
}

export function ChartPlaceholder({
  title,
  subtitle,
  dataPoints = 24,
  delay = 0,
}: ChartPlaceholderProps) {
  // Generate mock data points
  const points = Array.from({ length: dataPoints }, () => Math.random() * 60 + 20);
  const max = Math.max(...points);

  return (
    <div
      className="theme-card p-6 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-lg">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span className="text-sm">Live</span>
        </div>
      </div>

      <div className="relative h-48 bg-muted/30 rounded-md overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-20">
          <div className="theme-divider" />
          <div className="theme-divider" />
          <div className="theme-divider" />
          <div className="theme-divider" />
        </div>

        {/* Chart line */}
        <svg
          className="absolute inset-0 w-full h-full p-4"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="text-accent">
            {/* Fill area */}
            <path
              d={`M 0,${100 - (points[0] / max) * 80} ${points
                .map(
                  (p, i) =>
                    `L ${(i / (points.length - 1)) * 100},${100 - (p / max) * 80}`
                )
                .join(" ")} L 100,100 L 0,100 Z`}
              fill="url(#chartGradient)"
            />
            {/* Line */}
            <path
              d={`M 0,${100 - (points[0] / max) * 80} ${points
                .map(
                  (p, i) =>
                    `L ${(i / (points.length - 1)) * 100},${100 - (p / max) * 80}`
                )
                .join(" ")}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </svg>

        {/* Hover indicator */}
        <div className="absolute top-4 right-1/3 flex flex-col items-center">
          <div className="w-0.5 h-12 bg-accent opacity-50" />
          <div className="w-2 h-2 rounded-full bg-accent" />
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-4 text-xs text-muted-foreground">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>Now</span>
      </div>
    </div>
  );
}
