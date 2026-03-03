import { SummaryCards } from "./SummaryCards";
import { VerticalBarChart } from "./VerticalBarChart";
import { DonutChart, getChartColor } from "./DonutChart";
import {
  type StatsData,
  computeActivityTime,
  computeBreakActivityTime,
  formatMinutes,
  groupByDate,
  getDateRange,
} from "./useStats";

interface WeekViewProps {
  data: StatsData;
  currentDate: Date;
  onDayClick: (date: Date) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekView({ data, currentDate, onDayClick }: WeekViewProps) {
  const { workLogs, breakLogs, workActivities, breakActivities, workSessionMinutes } = data;

  const totalWorkMinutes = workLogs.length * workSessionMinutes;
  const totalBreakMinutes = breakLogs.reduce((s, l) => s + l.durationMinutes, 0);
  const { from } = getDateRange(currentDate, "week");

  // Build per-day data
  const workByDate = groupByDate(workLogs);
  const breakByDate = groupByDate(breakLogs);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const daysWithData = days.filter(
    (d) => (workByDate.get(d)?.length ?? 0) + (breakByDate.get(d)?.length ?? 0) > 0,
  );
  const avgBreakPerDay =
    daysWithData.length > 0
      ? Math.round(totalBreakMinutes / daysWithData.length)
      : 0;

  // Vertical bar chart — time in minutes per day
  const barGroups = days.map((dateStr, i) => ({
    label: DAY_NAMES[i]!,
    segments: [
      { value: (workByDate.get(dateStr)?.length ?? 0) * workSessionMinutes, color: "bg-chart-1" },
      { value: breakByDate.get(dateStr)?.reduce((s, l) => s + l.durationMinutes, 0) ?? 0, color: "bg-chart-2" },
    ],
  }));

  // Top activities by time
  const workTime = computeActivityTime(workLogs, workActivities, workSessionMinutes).slice(0, 5);
  const breakTime = computeBreakActivityTime(breakLogs, breakActivities).slice(0, 5);

  // Daily breakdown
  const dailyBreakdown = days.map((dateStr, i) => {
    const workMin = (workByDate.get(dateStr)?.length ?? 0) * workSessionMinutes;
    const breakMin =
      breakByDate.get(dateStr)?.reduce((s, l) => s + l.durationMinutes, 0) ?? 0;
    return {
      label: DAY_NAMES[i]!,
      dateStr,
      workMin,
      breakMin,
    };
  });

  if (workLogs.length === 0 && breakLogs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No sessions logged for this week.
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
          { label: "Avg break/day", value: formatMinutes(avgBreakPerDay) },
        ]}
      />

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Daily Time
        </div>
        <VerticalBarChart
          groups={barGroups}
          legend={[
            { label: "Work", color: "bg-chart-1" },
            { label: "Break", color: "bg-chart-2" },
          ]}
        />
      </div>

      {(workTime.length > 0 || breakTime.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {workTime.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top Work
              </div>
              <DonutChart
                segments={workTime.map((a, i) => ({
                  label: a.label,
                  value: a.minutes,
                  color: getChartColor(i),
                }))}
                size={64}
              />
            </div>
          )}
          {breakTime.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top Break
              </div>
              <DonutChart
                segments={breakTime.map((a, i) => ({
                  label: a.label,
                  value: a.minutes,
                  color: getChartColor(i),
                }))}
                size={64}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Daily Breakdown
        </div>
        <div className="flex flex-col gap-1">
          {dailyBreakdown.map((day) => (
            <button
              key={day.dateStr}
              onClick={() => onDayClick(new Date(day.dateStr + "T12:00:00"))}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary/50"
            >
              <span className="w-8 font-medium">{day.label}</span>
              <span className="flex-1 text-muted-foreground">
                {formatMinutes(day.workMin)} work / {formatMinutes(day.breakMin)} break
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
