import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import type { Activity } from "../shared/types";

const db = new Database("abortme.db");
db.run("PRAGMA journal_mode = WAL");

db.run(`
  CREATE TABLE IF NOT EXISTS work_activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS break_activities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS work_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    activities TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS break_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    activities TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

// Seed default work activities if empty
const workCount = db.query("SELECT COUNT(*) as count FROM work_activities").get() as { count: number };
if (workCount.count === 0) {
  const defaults = ["Coding", "Meetings", "Code Review", "Design", "Writing", "Research", "Admin"];
  const stmt = db.prepare("INSERT INTO work_activities (id, name) VALUES (?, ?)");
  for (const name of defaults) {
    stmt.run(randomUUID(), name);
  }
}

// Seed default break activities if empty
const breakCount = db.query("SELECT COUNT(*) as count FROM break_activities").get() as { count: number };
if (breakCount.count === 0) {
  const defaults = ["Piano", "Anki Flashcards", "Take a Walk", "Stretch", "Meditation", "Snack Break"];
  const stmt = db.prepare("INSERT INTO break_activities (id, name) VALUES (?, ?)");
  for (const name of defaults) {
    stmt.run(randomUUID(), name);
  }
}

export function getWorkActivities(): Activity[] {
  return db.query("SELECT id, name FROM work_activities ORDER BY name").all() as Activity[];
}

export function addWorkActivity(name: string): Activity {
  const id = randomUUID();
  db.run("INSERT INTO work_activities (id, name) VALUES (?, ?)", [id, name]);
  return { id, name };
}

export function removeWorkActivity(id: string): void {
  db.run("DELETE FROM work_activities WHERE id = ?", [id]);
}

export function getBreakActivities(): Activity[] {
  return db.query("SELECT id, name FROM break_activities ORDER BY name").all() as Activity[];
}

export function addBreakActivity(name: string): Activity {
  const id = randomUUID();
  db.run("INSERT INTO break_activities (id, name) VALUES (?, ?)", [id, name]);
  return { id, name };
}

export function removeBreakActivity(id: string): void {
  db.run("DELETE FROM break_activities WHERE id = ?", [id]);
}

export function logWork(activityIds: string[]): void {
  db.run("INSERT INTO work_logs (timestamp, activities) VALUES (?, ?)", [
    new Date().toISOString(),
    JSON.stringify(activityIds),
  ]);
}

export function logBreak(activityIds: string[], durationMinutes: number): void {
  db.run("INSERT INTO break_logs (timestamp, activities, duration_minutes) VALUES (?, ?, ?)", [
    new Date().toISOString(),
    JSON.stringify(activityIds),
    durationMinutes,
  ]);
}

export function getWorkLogs(from: string, to: string): { id: number; timestamp: string; activities: string }[] {
  return db
    .query("SELECT id, timestamp, activities FROM work_logs WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp ASC")
    .all(from, to) as { id: number; timestamp: string; activities: string }[];
}

export function getBreakLogs(from: string, to: string): { id: number; timestamp: string; activities: string; duration_minutes: number }[] {
  return db
    .query("SELECT id, timestamp, activities, duration_minutes FROM break_logs WHERE timestamp >= ? AND timestamp < ? ORDER BY timestamp ASC")
    .all(from, to) as { id: number; timestamp: string; activities: string; duration_minutes: number }[];
}

export function getSetting(key: string, defaultValue: string): string {
  const row = db.query("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | null;
  return row?.value ?? defaultValue;
}

export function setSetting(key: string, value: string): void {
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
}
