import { SummaryCards } from "./SummaryCards";
import { VerticalBarChart } from "./VerticalBarChart";
import {
  type StatsData,
  computeActivityTime,
  computeBreakActivityTime,
  formatMinutes,
  groupByDate,
  getDateRange,
} from "./useStats";

interface MonthViewProps {
  data: StatsData;
  currentDate: Date;
  onWeekClick: (date: Date) => void;
}

export function MonthView({
  data,
  currentDate,
  onWeekClick,
}: MonthViewProps) {
  const { workLogs, breakLogs, workActivities, breakActivities, workSessionMinutes } = data;

  const totalWorkMinutes = workLogs.length * workSessionMinutes;
  const totalBreakMinutes = breakLogs.reduce((s, l) => s + l.durationMinutes, 0);

  const { from, to } = getDateRange(currentDate, "month");

  const workByDate = groupByDate(workLogs);
  const breakByDate = groupByDate(breakLogs);

  const allDates = new Set([...workByDate.keys(), ...breakByDate.keys()]);
  const avgBreakPerDay =
    allDates.size > 0 ? Math.round(totalBreakMinutes / allDates.size) : 0;

  // Build weeks for the month
  const monthStart = new Date(from);
  const monthEnd = new Date(to);
  const calStart = new Date(monthStart);
  const dayOfWeek = calStart.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  calStart.setDate(calStart.getDate() + mondayOffset);

  const weeks: { label: string; days: string[] }[] = [];
  let weekStart = new Date(calStart);
  let weekNum = 1;
  while (weekStart < monthEnd) {
    const weekDays: string[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(weekStart);
      cellDate.setDate(cellDate.getDate() + d);
      if (cellDate >= monthStart && cellDate < monthEnd) {
        weekDays.push(cellDate.toISOString().slice(0, 10));
      }
    }
    if (weekDays.length > 0) {
      weeks.push({ label: `W${weekNum}`, days: weekDays });
    }
    weekStart.setDate(weekStart.getDate() + 7);
    weekNum++;
  }

  // Weekly trend bars (time-based)
  const weeklyGroups = weeks.map((week) => {
    let workMin = 0;
    let breakMin = 0;
    for (const day of week.days) {
      workMin += (workByDate.get(day)?.length ?? 0) * workSessionMinutes;
      breakMin += breakByDate.get(day)?.reduce((s, l) => s + l.durationMinutes, 0) ?? 0;
    }
    return {
      label: week.label,
      segments: [
        { value: workMin, color: "bg-chart-1" },
        { value: breakMin, color: "bg-chart-2" },
      ],
    };
  });

  // Per-activity time tables
  const workTime = computeActivityTime(workLogs, workActivities, workSessionMinutes);
  const breakTime = computeBreakActivityTime(breakLogs, breakActivities);

  // Weekly breakdown
  const weeklyBreakdown = weeks.map((week, i) => {
    let workMin = 0;
    let breakMin = 0;
    for (const day of week.days) {
      workMin += (workByDate.get(day)?.length ?? 0) * workSessionMinutes;
      breakMin += breakByDate.get(day)?.reduce((s, l) => s + l.durationMinutes, 0) ?? 0;
    }
    const fmtDate = (ds: string) => {
      const d = new Date(ds + "T12:00:00");
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };
    const range =
      week.days.length > 0
        ? `${fmtDate(week.days[0]!)}-${fmtDate(week.days[week.days.length - 1]!)}`
        : "";
    return {
      weekLabel: `Week ${i + 1}`,
      range,
      weekDate: week.days[0],
      workMin,
      breakMin,
    };
  });

  if (workLogs.length === 0 && breakLogs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No sessions logged for this month.
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
          Weekly Trend
        </div>
        <VerticalBarChart
          groups={weeklyGroups}
          legend={[
            { label: "Work", color: "bg-chart-1" },
            { label: "Break", color: "bg-chart-2" },
          ]}
          height={80}
        />
      </div>

      {/* Per-activity time tables */}
      <div className="grid grid-cols-2 gap-4">
        {workTime.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Work Time
            </div>
            <div className="flex flex-col gap-1">
              {workTime.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <span className="truncate">{a.label}</span>
                  <span className="shrink-0 text-xs font-medium text-chart-1">
                    {formatMinutes(a.minutes)}
                  </span>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-between border-t border-border px-2 pt-1 text-sm font-medium">
                <span>Total</span>
                <span className="text-xs text-chart-1">{formatMinutes(totalWorkMinutes)}</span>
              </div>
            </div>
          </div>
        )}
        {breakTime.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Break Time
            </div>
            <div className="flex flex-col gap-1">
              {breakTime.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center justify-between rounded px-2 py-1 text-sm"
                >
                  <span className="truncate">{a.label}</span>
                  <span className="shrink-0 text-xs font-medium text-chart-2">
                    {formatMinutes(a.minutes)}
                  </span>
                </div>
              ))}
              <div className="mt-1 flex items-center justify-between border-t border-border px-2 pt-1 text-sm font-medium">
                <span>Total</span>
                <span className="text-xs text-chart-2">{formatMinutes(totalBreakMinutes)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Weekly Breakdown
        </div>
        <div className="flex flex-col gap-1">
          {weeklyBreakdown.map((week) => (
            <button
              key={week.weekLabel}
              onClick={() =>
                week.weekDate &&
                onWeekClick(new Date(week.weekDate + "T12:00:00"))
              }
              className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary/50"
            >
              <span className="w-16 font-medium">{week.weekLabel}</span>
              <span className="text-[11px] text-muted-foreground">
                ({week.range})
              </span>
              <span className="flex-1 text-right text-muted-foreground">
                {formatMinutes(week.workMin)} / {formatMinutes(week.breakMin)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
