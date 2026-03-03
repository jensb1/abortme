import { Badge } from "@/components/ui/badge";

interface TimelineEntry {
  timestamp: string;
  type: "work" | "break";
  activityNames: string[];
  durationMinutes?: number;
}

interface TimelineProps {
  entries: TimelineEntry[];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) return null;

  return (
    <div>
      <div className="flex flex-col gap-2">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-12 shrink-0 pt-0.5 text-xs text-muted-foreground">
              {formatTime(entry.timestamp)}
            </div>
            <div
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                entry.type === "work"
                  ? "bg-chart-1/20 text-chart-1"
                  : "bg-chart-2/20 text-chart-2"
              }`}
            >
              {entry.type === "work" ? "Work" : "Brk"}
            </div>
            <div className="flex flex-1 flex-wrap gap-1">
              {entry.activityNames.map((name) => (
                <Badge key={name} variant="secondary" className="text-[10px]">
                  {name}
                </Badge>
              ))}
            </div>
            {entry.durationMinutes != null && (
              <div className="shrink-0 text-xs text-muted-foreground">
                {formatDuration(entry.durationMinutes)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
