import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ActivitySelect } from "./ActivitySelect";
import type { Activity } from "../../shared/types";

interface BreakStepProps {
  activities: Activity[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  breakDuration: number;
  onBreakDurationChange: (minutes: number) => void;
  onStart: () => void;
}

export function BreakStep({
  activities,
  selected,
  onToggle,
  onAdd,
  onRemove,
  breakDuration,
  onBreakDurationChange,
  onStart,
}: BreakStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Time for a break!
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          What will you do?
        </p>
      </div>

      <ActivitySelect
        activities={activities}
        selected={selected}
        onToggle={onToggle}
        onAdd={onAdd}
        onRemove={onRemove}
        showManage
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Break duration</label>
          <span className="text-muted-foreground text-sm">
            {breakDuration} {breakDuration === 1 ? "minute" : "minutes"}
          </span>
        </div>
        <Slider
          value={[breakDuration]}
          onValueChange={([v]) => onBreakDurationChange(v!)}
          min={1}
          max={30}
          step={1}
        />
      </div>

      <Button
        size="lg"
        onClick={onStart}
        disabled={selected.size === 0}
        className="w-full"
      >
        Start break
      </Button>
    </div>
  );
}
