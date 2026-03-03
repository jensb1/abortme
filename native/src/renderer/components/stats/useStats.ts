import { useState, useEffect, useMemo } from "react";
import { rpc } from "@/rpc";
import type { Activity, WorkLog, BreakLog } from "../../../shared/types";

export type ViewMode = "day" | "week" | "month";

export interface StatsData {
  workLogs: WorkLog[];
  breakLogs: BreakLog[];
  workActivities: Activity[];
  breakActivities: Activity[];
  workSessionMinutes: number; // popup interval = assumed work duration per session
  loading: boolean;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDateRange(
  date: Date,
  mode: ViewMode,
): { from: Date; to: Date } {
  switch (mode) {
    case "day": {
      const from = startOfDay(date);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      return { from, to };
    }
    case "week": {
      const from = startOfWeek(date);
      const to = new Date(from);
      to.setDate(to.getDate() + 7);
      return { from, to };
    }
    case "month": {
      const from = startOfMonth(date);
      const to = new Date(from);
      to.setMonth(to.getMonth() + 1);
      return { from, to };
    }
  }
}

export function navigateDate(date: Date, mode: ViewMode, delta: number): Date {
  const d = new Date(date);
  switch (mode) {
    case "day":
      d.setDate(d.getDate() + delta);
      break;
    case "week":
      d.setDate(d.getDate() + delta * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + delta);
      break;
  }
  return d;
}

export function formatDateLabel(date: Date, mode: ViewMode): string {
  switch (mode) {
    case "day":
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    case "week": {
      const { from, to } = getDateRange(date, "week");
      const end = new Date(to);
      end.setDate(end.getDate() - 1);
      const fmt = (d: Date) =>
        d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `${fmt(from)} – ${fmt(end)}, ${from.getFullYear()}`;
    }
    case "month":
      return date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
  }
}

export function useStats(date: Date, mode: ViewMode): StatsData {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [breakLogs, setBreakLogs] = useState<BreakLog[]>([]);
  const [workActivities, setWorkActivities] = useState<Activity[]>([]);
  const [breakActivities, setBreakActivities] = useState<Activity[]>([]);
  const [workSessionMinutes, setWorkSessionMinutes] = useState(30);
  const [loading, setLoading] = useState(true);

  const { from, to } = useMemo(() => getDateRange(date, mode), [date, mode]);

  useEffect(() => {
    setLoading(true);

    const fromStr = from.toISOString();
    const toStr = to.toISOString();

    Promise.all([
      rpc.request.getWorkLogs({ from: fromStr, to: toStr }).catch(() => [] as WorkLog[]),
      rpc.request.getBreakLogs({ from: fromStr, to: toStr }).catch(() => [] as BreakLog[]),
      rpc.request.getWorkActivities({}).catch(() => [] as Activity[]),
      rpc.request.getBreakActivities({}).catch(() => [] as Activity[]),
      rpc.request.getPopupInterval({}).catch(() => 30),
    ]).then(([wl, bl, wa, ba, pi]) => {
      setWorkLogs(wl);
      setBreakLogs(bl);
      setWorkActivities(wa);
      setBreakActivities(ba);
      setWorkSessionMinutes(pi);
      setLoading(false);
    });
  }, [from.getTime(), to.getTime()]);

  return { workLogs, breakLogs, workActivities, breakActivities, workSessionMinutes, loading };
}

// Resolve activity IDs to names
export function resolveActivityNames(
  ids: string[],
  activities: Activity[],
): string[] {
  const map = new Map(activities.map((a) => [a.id, a.name]));
  return ids.map((id) => map.get(id) ?? "Unknown");
}

// Count activity frequency
export function countActivities(
  logs: { activities: string[] }[],
  activities: Activity[],
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    for (const id of log.activities) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const map = new Map(activities.map((a) => [a.id, a.name]));
  return [...counts.entries()]
    .map(([id, count]) => ({ label: map.get(id) ?? "Unknown", count }))
    .sort((a, b) => b.count - a.count);
}

// Compute total time per activity for work logs (each session = workSessionMinutes)
export function computeActivityTime(
  logs: { activities: string[] }[],
  activities: Activity[],
  minutesPerSession: number,
): { label: string; minutes: number }[] {
  const counts = new Map<string, number>();
  for (const log of logs) {
    for (const id of log.activities) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const map = new Map(activities.map((a) => [a.id, a.name]));
  return [...counts.entries()]
    .map(([id, count]) => ({
      label: map.get(id) ?? "Unknown",
      minutes: count * minutesPerSession,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

// Compute total break time per activity from break logs (uses actual duration)
export function computeBreakActivityTime(
  logs: BreakLog[],
  activities: Activity[],
): { label: string; minutes: number }[] {
  const totals = new Map<string, number>();
  const map = new Map(activities.map((a) => [a.id, a.name]));
  for (const log of logs) {
    for (const id of log.activities) {
      totals.set(id, (totals.get(id) ?? 0) + log.durationMinutes);
    }
  }
  return [...totals.entries()]
    .map(([id, minutes]) => ({
      label: map.get(id) ?? "Unknown",
      minutes,
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

// Format total minutes to human readable
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Group logs by date string (YYYY-MM-DD)
export function groupByDate<T extends { timestamp: string }>(
  logs: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const log of logs) {
    const dateKey = log.timestamp.slice(0, 10);
    const arr = groups.get(dateKey) ?? [];
    arr.push(log);
    groups.set(dateKey, arr);
  }
  return groups;
}
