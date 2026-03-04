import { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { WorkingStep } from "@/components/WorkingStep";
import { WorkStep } from "@/components/WorkStep";
import { BreakStep } from "@/components/BreakStep";
import { TimerStep } from "@/components/TimerStep";
import { Settings, BarChart3 } from "lucide-react";
import { StatsView } from "@/components/stats/StatsView";
import { rpc } from "./rpc";
import { playPopupBeep } from "@/lib/beep";
import type { Activity } from "../shared/types";

type Step = "working" | "work" | "break" | "timer";

let idCounter = 0;
function localId() {
  return `local-${++idCounter}`;
}

const defaultWorkActivities: Activity[] = [
  "Coding", "Meetings", "Code Review", "Design", "Writing", "Research", "Admin",
].map((name) => ({ id: localId(), name }));

const defaultBreakActivities: Activity[] = [
  "Piano", "Anki Flashcards", "Take a Walk", "Stretch", "Meditation", "Snack Break",
].map((name) => ({ id: localId(), name }));

export function App() {
  const [step, setStep] = useState<Step>("working");
  const [popupInterval, setPopupInterval] = useState(20);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [idle, setIdle] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerKey, setTimerKey] = useState(0);

  // Activities
  const [workActivities, setWorkActivities] = useState<Activity[]>(defaultWorkActivities);
  const [breakActivities, setBreakActivities] = useState<Activity[]>(defaultBreakActivities);
  const [selectedWork, setSelectedWork] = useState<Set<string>>(new Set());
  const [selectedBreak, setSelectedBreak] = useState<Set<string>>(new Set());

  // Load from backend if available, otherwise keep defaults
  useEffect(() => {
    rpc.request.getPopupInterval({}).then(setPopupInterval).catch(() => {});
    rpc.request.getBreakDuration({}).then(setBreakDuration).catch(() => {});
    rpc.request.getWorkActivities({}).then((a) => { if (a.length) setWorkActivities(a); }).catch(() => {});
    rpc.request.getBreakActivities({}).then((a) => { if (a.length) setBreakActivities(a); }).catch(() => {});
  }, []);

  // Listen for popup-triggered event from main process
  useEffect(() => {
    const onPopup = () => {
      playPopupBeep();
      setStep("work");
    };
    window.addEventListener("popup-triggered", onPopup);
    return () => window.removeEventListener("popup-triggered", onPopup);
  }, []);

  // Listen for idle state changes
  useEffect(() => {
    const onIdle = (e: Event) => {
      setIdle((e as CustomEvent<{ idle: boolean }>).detail.idle);
    };
    window.addEventListener("idle-state-changed", onIdle);
    return () => window.removeEventListener("idle-state-changed", onIdle);
  }, []);

  const toggleWork = useCallback((id: string) => {
    setSelectedWork((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleBreak = useCallback((id: string) => {
    setSelectedBreak((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function addWorkActivity(name: string) {
    const fallback: Activity = { id: localId(), name };
    setWorkActivities((prev) => [...prev, fallback]);
    rpc.request.addWorkActivity({ name }).then((activity) => {
      setWorkActivities((prev) =>
        prev.map((a) => (a.id === fallback.id ? activity : a)),
      );
    }).catch(() => {});
  }

  function removeWorkActivity(id: string) {
    setWorkActivities((prev) => prev.filter((a) => a.id !== id));
    setSelectedWork((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    rpc.request.removeWorkActivity({ id }).catch(() => {});
  }

  function addBreakActivity(name: string) {
    const fallback: Activity = { id: localId(), name };
    setBreakActivities((prev) => [...prev, fallback]);
    rpc.request.addBreakActivity({ name }).then((activity) => {
      setBreakActivities((prev) =>
        prev.map((a) => (a.id === fallback.id ? activity : a)),
      );
    }).catch(() => {});
  }

  function removeBreakActivity(id: string) {
    setBreakActivities((prev) => prev.filter((a) => a.id !== id));
    setSelectedBreak((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    rpc.request.removeBreakActivity({ id }).catch(() => {});
  }

  function handleWorkNext() {
    rpc.request
      .logWork({ activityIds: [...selectedWork] })
      .catch(() => {});
    setStep("break");
  }

  function handleWorkExtend() {
    rpc.request
      .logWork({ activityIds: [...selectedWork] })
      .catch(() => {});
    rpc.request.dismissPopup({}).catch(() => {});
    setSelectedWork(new Set());
    setTimerMinutes(null);
    setTimerKey((k) => k + 1);
    setStep("working");
  }

  function handleSnooze() {
    rpc.request.dismissPopup({}).catch(() => {});
    rpc.request.extendTimer({ minutes: 5 }).catch(() => {});
    setTimerMinutes(5);
    setTimerKey((k) => k + 1);
    setStep("working");
  }

  function handleBreakStart() {
    rpc.request
      .logBreak({
        activityIds: [...selectedBreak],
        durationMinutes: breakDuration,
      })
      .catch(() => {});
    setStep("timer");
  }

  function handleTimerDone() {
    rpc.request.dismissPopup({}).catch(() => {});
    setSelectedWork(new Set());
    setSelectedBreak(new Set());
    setTimerMinutes(null);
    setTimerKey((k) => k + 1);
    setStep("working");
  }

  function handlePopupIntervalChange(value: number[]) {
    const minutes = value[0]!;
    setPopupInterval(minutes);
    rpc.request.setPopupInterval({ minutes }).catch(() => {});
  }

  function handleBreakDurationChange(minutes: number) {
    setBreakDuration(minutes);
    rpc.request.setBreakDuration({ minutes }).catch(() => {});
  }

  const selectedBreakNames = breakActivities
    .filter((a) => selectedBreak.has(a.id))
    .map((a) => a.name);

  // Stats overlay
  if (showStats) {
    return <StatsView onClose={() => setShowStats(false)} />;
  }

  return (
    <>
    {/* Settings overlay — rendered on top, does not unmount main content */}
    {showSettings && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Settings</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(false)}
            >
              Done
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Popup interval</label>
                <span className="text-muted-foreground text-sm">
                  {popupInterval}{" "}
                  {popupInterval === 1 ? "minute" : "minutes"}
                </span>
              </div>
              <Slider
                value={[popupInterval]}
                onValueChange={handlePopupIntervalChange}
                min={1}
                max={60}
                step={1}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Default break duration
                </label>
                <span className="text-muted-foreground text-sm">
                  {breakDuration}{" "}
                  {breakDuration === 1 ? "minute" : "minutes"}
                </span>
              </div>
              <Slider
                value={[breakDuration]}
                onValueChange={([v]) => handleBreakDurationChange(v!)}
                min={1}
                max={30}
                step={1}
              />
            </div>
          </div>
        </div>
      </div>
    )}

    <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      {/* Idle indicator */}
      {idle && (
        <div className="fixed left-4 top-4 flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">Idle</span>
        </div>
      )}

      {/* Top-right buttons */}
      <div className="fixed right-4 top-4 flex items-center gap-1">
        <button
          onClick={() => setShowStats(true)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <BarChart3 className="h-5 w-5" />
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        {step === "working" && (
          <WorkingStep key={timerKey} popupIntervalMinutes={timerMinutes ?? popupInterval} paused={idle} />
        )}

        {step === "work" && (
          <WorkStep
            activities={workActivities}
            selected={selectedWork}
            onToggle={toggleWork}
            onAdd={addWorkActivity}
            onRemove={removeWorkActivity}
            onNext={handleWorkNext}
            onExtend={handleWorkExtend}
            onSnooze={handleSnooze}
          />
        )}

        {step === "break" && (
          <BreakStep
            activities={breakActivities}
            selected={selectedBreak}
            onToggle={toggleBreak}
            onAdd={addBreakActivity}
            onRemove={removeBreakActivity}
            breakDuration={breakDuration}
            onBreakDurationChange={handleBreakDurationChange}
            onStart={handleBreakStart}
          />
        )}

        {step === "timer" && (
          <TimerStep
            durationMinutes={breakDuration}
            breakActivities={selectedBreakNames}
            onDone={handleTimerDone}
          />
        )}
      </div>
    </div>
    </>
  );
}
