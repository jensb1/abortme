import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import logoUrl from "@/assets/logo.svg";
import { rpc } from "@/rpc";

interface WorkingStepProps {
  popupIntervalMinutes: number;
  paused: boolean;
}

export function WorkingStep({ popupIntervalMinutes, paused }: WorkingStepProps) {
  const [secondsLeft, setSecondsLeft] = useState(popupIntervalMinutes * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  function handleRestart() {
    setSecondsLeft(popupIntervalMinutes * 60);
    rpc.request.restartTimer({}).catch(() => {});
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="flex flex-col items-center gap-6">
      <img src={logoUrl} alt="AbortMe" className="h-16 w-16" />
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Working</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {paused ? "Paused — inactive" : "Next break in"}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <span
          className={`font-mono text-7xl font-bold tabular-nums tracking-tight ${
            paused ? "text-muted-foreground" : ""
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <button
          onClick={handleRestart}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
          title="Restart timer"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
