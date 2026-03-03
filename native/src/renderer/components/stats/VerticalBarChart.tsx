interface BarGroup {
  label: string;
  segments: { value: number; color: string }[];
}

interface VerticalBarChartProps {
  groups: BarGroup[];
  legend?: { label: string; color: string }[];
  height?: number;
}

export function VerticalBarChart({
  groups,
  legend,
  height = 120,
}: VerticalBarChartProps) {
  const maxTotal = Math.max(
    ...groups.map((g) => g.segments.reduce((s, seg) => s + seg.value, 0)),
    1,
  );

  return (
    <div>
      <div className="flex items-end justify-around gap-1" style={{ height }}>
        {groups.map((group) => {
          const total = group.segments.reduce((s, seg) => s + seg.value, 0);
          return (
            <div key={group.label} className="flex flex-1 flex-col items-center">
              <div
                className="flex w-full max-w-8 flex-col justify-end overflow-hidden rounded-t"
                style={{ height: `${(total / maxTotal) * 100}%`, minHeight: total > 0 ? 4 : 0 }}
              >
                {group.segments.map((seg, i) => (
                  <div
                    key={i}
                    className={seg.color}
                    style={{
                      height: total > 0 ? `${(seg.value / total) * 100}%` : 0,
                      minHeight: seg.value > 0 ? 2 : 0,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-around gap-1">
        {groups.map((group) => (
          <div
            key={group.label}
            className="flex-1 text-center text-[10px] text-muted-foreground"
          >
            {group.label}
          </div>
        ))}
      </div>
      {legend && (
        <div className="mt-2 flex items-center justify-center gap-4">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-sm ${l.color}`} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
