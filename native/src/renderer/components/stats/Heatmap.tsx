interface HeatmapCell {
  date: string; // YYYY-MM-DD
  value: number;
}

interface HeatmapProps {
  cells: HeatmapCell[];
  weeks: { label: string; days: (HeatmapCell | null)[] }[];
  onDayClick?: (date: string) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({ weeks, onDayClick }: HeatmapProps) {
  const allValues = weeks
    .flatMap((w) => w.days)
    .filter((d): d is HeatmapCell => d !== null)
    .map((d) => d.value);
  const maxVal = Math.max(...allValues, 1);

  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Activity Heatmap
      </div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 pr-1 pt-0">
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="flex h-6 items-center text-[10px] text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="flex flex-1 gap-1">
          {weeks.map((week) => (
            <div key={week.label} className="flex flex-1 flex-col gap-1">
              {week.days.map((cell, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`h-6 rounded-sm ${
                    cell && onDayClick ? "cursor-pointer" : ""
                  }`}
                  style={{
                    backgroundColor: cell
                      ? `oklch(0.488 0.243 264.376 / ${Math.max(
                          0.15,
                          cell.value / maxVal,
                        )})`
                      : "var(--color-secondary)",
                    opacity: cell === null ? 0.3 : 1,
                  }}
                  title={cell ? `${cell.date}: ${cell.value} sessions` : ""}
                  onClick={() => cell && onDayClick?.(cell.date)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex gap-1 pl-8">
        {weeks.map((week) => (
          <div
            key={week.label}
            className="flex-1 text-center text-[10px] text-muted-foreground"
          >
            {week.label}
          </div>
        ))}
      </div>
    </div>
  );
}
