interface BarItem {
  label: string;
  value: number;
  detail?: string;
}

interface HorizontalBarChartProps {
  title: string;
  items: BarItem[];
  color: string; // Tailwind bg class like "bg-chart-1"
}

export function HorizontalBarChart({
  title,
  items,
  color,
}: HorizontalBarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-24 shrink-0 truncate text-sm">{item.label}</div>
            <div className="relative h-5 flex-1 overflow-hidden rounded bg-secondary/50">
              <div
                className={`absolute inset-y-0 left-0 rounded ${color}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <div className="w-16 shrink-0 text-right text-xs text-muted-foreground">
              {item.detail ?? item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
