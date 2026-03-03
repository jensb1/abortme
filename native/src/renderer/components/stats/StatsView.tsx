import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import {
  type ViewMode,
  useStats,
  navigateDate,
  formatDateLabel,
} from "./useStats";

interface StatsViewProps {
  onClose: () => void;
}

export function StatsView({ onClose }: StatsViewProps) {
  const [mode, setMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());

  const data = useStats(currentDate, mode);

  const handlePrev = useCallback(() => {
    setCurrentDate((d) => navigateDate(d, mode, -1));
  }, [mode]);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => navigateDate(d, mode, 1));
  }, [mode]);

  const handleDayClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setMode("day");
  }, []);

  const handleWeekClick = useCallback((date: Date) => {
    setCurrentDate(date);
    setMode("week");
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col rounded-xl border border-border bg-card shadow-2xl"
        style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 pt-5 pb-4">
          <h2 className="text-xl font-bold">Stats</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>

        {/* Tabs + Date nav */}
        <div className="flex flex-col gap-3 border-b border-border px-6 py-3">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as ViewMode)}
          >
            <TabsList className="w-full">
              <TabsTrigger value="day" className="flex-1">
                Day
              </TabsTrigger>
              <TabsTrigger value="week" className="flex-1">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="flex-1">
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {formatDateLabel(currentDate, mode)}
            </span>
            <button
              onClick={handleNext}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {data.loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              {mode === "day" && <DayView data={data} />}
              {mode === "week" && (
                <WeekView
                  data={data}
                  currentDate={currentDate}
                  onDayClick={handleDayClick}
                />
              )}
              {mode === "month" && (
                <MonthView
                  data={data}
                  currentDate={currentDate}
                  onWeekClick={handleWeekClick}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
