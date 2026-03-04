import { Button } from "@/components/ui/button";
import { ActivitySelect } from "./ActivitySelect";
import type { Activity } from "../../shared/types";

interface WorkStepProps {
  activities: Activity[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onNext: () => void;
  onExtend: () => void;
  onSnooze: () => void;
}

export function WorkStep({
  activities,
  selected,
  onToggle,
  onAdd,
  onRemove,
  onNext,
  onExtend,
  onSnooze,
}: WorkStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          What are you working on?
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Select all that apply
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

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          onClick={onNext}
          disabled={selected.size === 0}
          className="w-full"
        >
          Log &amp; take a break
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onExtend}
          disabled={selected.size === 0}
          className="w-full"
        >
          Log &amp; keep working
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSnooze}
          className="w-full text-muted-foreground"
        >
          +5 min
        </Button>
      </div>
    </div>
  );
}
