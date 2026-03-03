import { useState, useEffect, useRef } from "react";

interface WorkingStepProps {
  popupIntervalMinutes: number;
  paused: boolean;
}

export function WorkingStep({ popupIntervalMinutes, paused }: WorkingStepProps) {
  const [secondsLeft, setSecondsLeft] = useState(popupIntervalMinutes * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(popupIntervalMinutes * 60);
  }, [popupIntervalMinutes]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Working</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {paused ? "Paused — inactive" : "Next break in"}
        </p>
      </div>

      <div className="flex items-center justify-center">
        <span
          className={`font-mono text-7xl font-bold tabular-nums tracking-tight ${
            paused ? "text-muted-foreground" : ""
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
