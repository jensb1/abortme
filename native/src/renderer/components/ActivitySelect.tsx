import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import type { Activity } from "../../shared/types";

interface ActivitySelectProps {
  activities: Activity[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  showManage?: boolean;
}

export function ActivitySelect({
  activities,
  selected,
  onToggle,
  onAdd,
  onRemove,
  showManage = false,
}: ActivitySelectProps) {
  const [newName, setNewName] = useState("");
  const [managing, setManaging] = useState(false);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewName("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => (managing ? undefined : onToggle(activity.id))}
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
              selected.has(activity.id)
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground",
              managing && "pr-8",
            )}
          >
            {activity.name}
            {managing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(activity.id);
                }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </button>
        ))}
      </div>

      {showManage && (
        <div className="flex items-center gap-2 pt-1">
          {managing ? (
            <>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="New activity..."
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleAdd}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setManaging(false)}
              >
                Done
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground text-xs"
              onClick={() => setManaging(true)}
            >
              Edit activities...
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
