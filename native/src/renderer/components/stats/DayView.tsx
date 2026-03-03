import { SummaryCards } from "./SummaryCards";
import { HorizontalBarChart } from "./HorizontalBarChart";
import { Timeline } from "./Timeline";
import {
  type StatsData,
  computeActivityTime,
  computeBreakActivityTime,
  resolveActivityNames,
  formatMinutes,
} from "./useStats";

interface DayViewProps {
  data: StatsData;
}

export function DayView({ data }: DayViewProps) {
  const { workLogs, breakLogs, workActivities, breakActivities, workSessionMinutes } = data;

  const totalWorkMinutes = workLogs.length * workSessionMinutes;
  const totalBreakMinutes = breakLogs.reduce((s, l) => s + l.durationMinutes, 0);
  const avgBreak =
    breakLogs.length > 0 ? Math.round(totalBreakMinutes / breakLogs.length) : 0;

  const workTime = computeActivityTime(workLogs, workActivities, workSessionMinutes);
  const breakTime = computeBreakActivityTime(breakLogs, breakActivities);

  // Timeline entries
  const timelineEntries = [
    ...workLogs.map((log) => ({
      timestamp: log.timestamp,
      type: "work" as const,
      activityNames: resolveActivityNames(log.activities, workActivities),
      durationMinutes: workSessionMinutes,
    })),
    ...breakLogs.map((log) => ({
      timestamp: log.timestamp,
      type: "break" as const,
      activityNames: resolveActivityNames(log.activities, breakActivities),
      durationMinutes: log.durationMinutes,
    })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (workLogs.length === 0 && breakLogs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No sessions logged for this day.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SummaryCards
        cards={[
          { label: "Total work", value: formatMinutes(totalWorkMinutes) },
          { label: "Total break", value: formatMinutes(totalBreakMinutes) },
          { label: "Work sessions", value: workLogs.length },
          { label: "Avg break", value: formatMinutes(avgBreak) },
        ]}
      />

      {workTime.length > 0 && (
        <HorizontalBarChart
          title="Work Activities"
          items={workTime.map((a) => ({
            label: a.label,
            value: a.minutes,
            detail: formatMinutes(a.minutes),
          }))}
          color="bg-chart-1"
        />
      )}

      {breakTime.length > 0 && (
        <HorizontalBarChart
          title="Break Activities"
          items={breakTime.map((a) => ({
            label: a.label,
            value: a.minutes,
            detail: formatMinutes(a.minutes),
          }))}
          color="bg-chart-2"
        />
      )}

      {timelineEntries.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </div>
          <div className="max-h-48 overflow-y-auto rounded border border-border p-2">
            <Timeline entries={timelineEntries} />
          </div>
        </div>
      )}
    </div>
  );
}
