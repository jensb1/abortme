import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { playBreakEndBeep } from "@/lib/beep";

interface TimerStepProps {
  durationMinutes: number;
  breakActivities: string[];
  onDone: () => void;
}

export function TimerStep({
  durationMinutes,
  breakActivities,
  onDone,
}: TimerStepProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const beeped = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0 && !beeped.current) {
      beeped.current = true;
      playBreakEndBeep();
    }
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const done = secondsLeft <= 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {done ? "Break's over!" : "Enjoy your break"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {breakActivities.join(", ")}
        </p>
      </div>

      <div className="flex items-center justify-center">
        <span className="font-mono text-7xl font-bold tabular-nums tracking-tight">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>

      {done && (
        <Button size="lg" onClick={onDone} className="w-full">
          Back to work
        </Button>
      )}
    </div>
  );
}
