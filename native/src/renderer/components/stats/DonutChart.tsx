interface DonutSegment {
  label: string;
  value: number;
  color: string; // CSS color value
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
}

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}

export function DonutChart({ segments, size = 80 }: DonutChartProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div
        className="rounded-full border-4 border-secondary"
        style={{ width: size, height: size }}
      />
    );
  }

  let accumulated = 0;
  const gradientStops = segments.flatMap((seg) => {
    const start = (accumulated / total) * 360;
    accumulated += seg.value;
    const end = (accumulated / total) * 360;
    return [`${seg.color} ${start}deg ${end}deg`];
  });

  return (
    <div className="flex items-center gap-3">
      <div
        className="shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${gradientStops.join(", ")})`,
          mask: `radial-gradient(circle at center, transparent ${size * 0.35}px, black ${size * 0.35}px)`,
          WebkitMask: `radial-gradient(circle at center, transparent ${size * 0.35}px, black ${size * 0.35}px)`,
        }}
      />
      <div className="flex flex-col gap-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-muted-foreground">
              {seg.label}{" "}
              <span className="font-medium text-foreground">
                {Math.round((seg.value / total) * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
