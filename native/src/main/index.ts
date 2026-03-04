import { BrowserWindow, BrowserView, Tray } from "electrobun/bun";
import Electrobun from "electrobun/bun";
import type { AppRPC } from "../shared/rpc";
import * as db from "./db";

import { existsSync } from "fs";
import { resolve } from "path";

const viewsExist = existsSync(resolve("../Resources/app/views/renderer/index.html"));
const appUrl = viewsExist
  ? "views://renderer/index.html"
  : "http://localhost:6001";

const trayIconWork = viewsExist
  ? resolve("../Resources/app/assets/tray-iconTemplate.png")
  : resolve("assets/tray-iconTemplate.png");

const trayIconBreak = viewsExist
  ? resolve("../Resources/app/assets/tray-icon-breakTemplate.png")
  : resolve("assets/tray-icon-breakTemplate.png");

let popupIntervalMinutes = Number(db.getSetting("popupInterval", "20"));
let breakDurationMinutes = Number(db.getSetting("breakDuration", "5"));

// --- Popup timer with idle detection ---
const IDLE_THRESHOLD_SECONDS = 60;
const IDLE_POLL_MS = 10_000;

let popupTimer: ReturnType<typeof setTimeout> | null = null;
let popupRemainingMs = 0;
let popupStartedAt = 0;
let isIdle = false;
let idlePoller: ReturnType<typeof setInterval> | null = null;

// --- Break timer state ---
let isOnBreak = false;
let breakRemainingMs = 0;
let breakStartedAt = 0;

async function getIdleSeconds(): Promise<number> {
  try {
    const proc = Bun.spawn(["ioreg", "-c", "IOHIDSystem"], { stdout: "pipe" });
    const text = await new Response(proc.stdout).text();
    const match = text.match(/HIDIdleTime.*?(\d+)/);
    if (!match) return 0;
    return Math.floor(parseInt(match[1]!) / 1_000_000_000);
  } catch {
    return 0;
  }
}

// --- Tray timer display ---
function formatTimer(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getRemainingMs(): number {
  if (isIdle || !popupTimer) return popupRemainingMs;
  const elapsed = Date.now() - popupStartedAt;
  return Math.max(0, popupRemainingMs - elapsed);
}

let trayUpdateInterval: ReturnType<typeof setInterval> | null = null;

function getBreakRemainingMs(): number {
  if (!isOnBreak) return 0;
  const elapsed = Date.now() - breakStartedAt;
  return Math.max(0, breakRemainingMs - elapsed);
}

function persistTimerState() {
  const remaining = getRemainingMs();
  db.setSetting("timerRemainingMs", String(remaining));
  db.setSetting("timerSavedAt", String(Date.now()));
}

let currentTrayMode: "work" | "break" = "work";

function updateTrayTitle() {
  if (isOnBreak) {
    const remaining = getBreakRemainingMs();
    tray.setTitle(formatTimer(remaining));
    if (currentTrayMode !== "break") {
      tray.setImage(trayIconBreak);
      currentTrayMode = "break";
    }
  } else {
    const remaining = getRemainingMs();
    tray.setTitle(formatTimer(remaining));
    persistTimerState();
    if (currentTrayMode !== "work") {
      tray.setImage(trayIconWork);
      currentTrayMode = "work";
    }
  }
}

function startTrayUpdates() {
  if (trayUpdateInterval) clearInterval(trayUpdateInterval);
  updateTrayTitle();
  trayUpdateInterval = setInterval(updateTrayTitle, 1000);
}

// --- Window management ---
let win: BrowserWindow | null = null;

function createWindow() {
  if (win) {
    win.focus();
    return;
  }

  const newRpc = BrowserView.defineRPC<AppRPC>({
    handlers: {
      requests: ({
        getPopupInterval: () => popupIntervalMinutes,

        setPopupInterval: ({ minutes }: { minutes: number }) => {
          popupIntervalMinutes = minutes;
          db.setSetting("popupInterval", String(minutes));
          return { success: true };
        },

        getBreakDuration: () => breakDurationMinutes,

        setBreakDuration: ({ minutes }: { minutes: number }) => {
          breakDurationMinutes = minutes;
          db.setSetting("breakDuration", String(minutes));
          return { success: true };
        },

        getWorkActivities: () => db.getWorkActivities(),

        addWorkActivity: ({ name }: { name: string }) => db.addWorkActivity(name),

        removeWorkActivity: ({ id }: { id: string }) => {
          db.removeWorkActivity(id);
          return { success: true };
        },

        getBreakActivities: () => db.getBreakActivities(),

        addBreakActivity: ({ name }: { name: string }) => db.addBreakActivity(name),

        removeBreakActivity: ({ id }: { id: string }) => {
          db.removeBreakActivity(id);
          return { success: true };
        },

        logWork: ({ activityIds }: { activityIds: string[] }) => {
          db.logWork(activityIds);
          return { success: true };
        },

        logBreak: ({ activityIds, durationMinutes }: { activityIds: string[]; durationMinutes: number }) => {
          db.logBreak(activityIds, durationMinutes);
          return { success: true };
        },

        getWorkLogs: ({ from, to }: { from: string; to: string }) => {
          const rawWorkLogs = db.getWorkLogs(from, to);
          return rawWorkLogs.map((log) => ({
            id: log.id,
            timestamp: log.timestamp,
            activities: JSON.parse(log.activities),
          }));
        },

        getBreakLogs: ({ from, to }: { from: string; to: string }) => {
          const rawBreakLogs = db.getBreakLogs(from, to);
          return rawBreakLogs.map((log) => ({
            id: log.id,
            timestamp: log.timestamp,
            activities: JSON.parse(log.activities),
            durationMinutes: log.duration_minutes,
          }));
        },

        dismissPopup: () => {
          if (win) win.setAlwaysOnTop(false);
          isOnBreak = false;
          breakRemainingMs = 0;
          startPopupTimer();
          return { success: true };
        },

        restartTimer: () => {
          startPopupTimer();
          return { success: true };
        },

        extendTimer: ({ minutes }: { minutes: number }) => {
          extendPopupTimer(minutes);
          return { success: true };
        },

        getTimerRemaining: () => getRemainingMs(),

        startBreakTimer: ({ minutes }: { minutes: number }) => {
          isOnBreak = true;
          breakRemainingMs = minutes * 60_000;
          breakStartedAt = Date.now();
          return { success: true };
        },
      }) as any,
      messages: {},
    },
  });

  currentRpc = newRpc;

  win = new BrowserWindow({
    title: "AbortMe",
    url: appUrl,
    frame: {
      x: 100,
      y: 100,
      width: 1024,
      height: 768,
    },
    rpc: newRpc,
  });
}

let currentRpc: ReturnType<typeof BrowserView.defineRPC<AppRPC>> | null = null;

// --- Popup timer ---
function startPopupTimer() {
  if (popupTimer) clearTimeout(popupTimer);
  popupRemainingMs = popupIntervalMinutes * 60_000;
  popupStartedAt = Date.now();

  popupTimer = setTimeout(() => {
    // Ensure window exists and show it
    if (!win) createWindow();
    if (win) {
      win.setAlwaysOnTop(true);
      win.focus();
    }
    if (currentRpc) (currentRpc as any).send.popupTriggered({});
    // Don't auto-restart — wait for dismissPopup after break flow completes
    popupTimer = null;
    popupRemainingMs = 0;
  }, popupRemainingMs);
}

function extendPopupTimer(minutes: number) {
  if (popupTimer) clearTimeout(popupTimer);
  popupRemainingMs = minutes * 60_000;
  popupStartedAt = Date.now();

  popupTimer = setTimeout(() => {
    if (!win) createWindow();
    if (win) {
      win.setAlwaysOnTop(true);
      win.focus();
    }
    if (currentRpc) (currentRpc as any).send.popupTriggered({});
    popupTimer = null;
    popupRemainingMs = 0;
  }, popupRemainingMs);
}

function pausePopupTimer() {
  if (popupTimer) {
    clearTimeout(popupTimer);
    popupTimer = null;
    const elapsed = Date.now() - popupStartedAt;
    popupRemainingMs = Math.max(0, popupRemainingMs - elapsed);
  }
}

function resumePopupTimer() {
  if (popupTimer) clearTimeout(popupTimer);
  popupStartedAt = Date.now();

  popupTimer = setTimeout(() => {
    if (!win) createWindow();
    if (win) {
      win.setAlwaysOnTop(true);
      win.focus();
    }
    if (currentRpc) (currentRpc as any).send.popupTriggered({});
    popupTimer = null;
    popupRemainingMs = 0;
  }, popupRemainingMs);
}

function startIdlePolling() {
  if (idlePoller) clearInterval(idlePoller);
  idlePoller = setInterval(async () => {
    const idle = await getIdleSeconds();
    const nowIdle = idle >= IDLE_THRESHOLD_SECONDS;

    if (nowIdle && !isIdle) {
      isIdle = true;
      pausePopupTimer();
      if (currentRpc) (currentRpc as any).send.idleStateChanged({ idle: true });
    } else if (!nowIdle && isIdle) {
      isIdle = false;
      resumePopupTimer();
      if (currentRpc) (currentRpc as any).send.idleStateChanged({ idle: false });
    }
  }, IDLE_POLL_MS);
}

// Track window destruction
Electrobun.events.on("close", (event: { data: { id: number } }) => {
  if (win && (win as any).id === event.data.id) {
    win = null;
    currentRpc = null;
  }
});

// --- Tray setup ---
const tray = new Tray({
  title: "00:00",
  image: trayIconWork,
  template: true,
  width: 18,
  height: 18,
});

tray.setMenu([
  {
    type: "normal",
    label: "Show AbortMe",
    action: "show",
  },
  {
    type: "separator",
  },
  {
    type: "normal",
    label: "Quit",
    action: "quit",
  },
]);

tray.on("tray-clicked", (event: any) => {
  const action = event?.data?.action;
  if (action === "show") {
    if (win) {
      win.focus();
    } else {
      createWindow();
    }
  } else if (action === "quit") {
    process.exit(0);
  }
});

// --- Start ---
createWindow();

// Restore timer from persisted state if available
const savedRemainingMs = Number(db.getSetting("timerRemainingMs", "0"));
const savedAt = Number(db.getSetting("timerSavedAt", "0"));

if (savedAt > 0 && savedRemainingMs > 0) {
  const elapsed = Date.now() - savedAt;
  const remaining = savedRemainingMs - elapsed;
  if (remaining > 0) {
    // Resume from where we left off
    popupRemainingMs = remaining;
    popupStartedAt = Date.now();
    popupTimer = setTimeout(() => {
      if (!win) createWindow();
      if (win) {
        win.setAlwaysOnTop(true);
        win.focus();
      }
      if (currentRpc) (currentRpc as any).send.popupTriggered({});
      popupTimer = null;
      popupRemainingMs = 0;
    }, popupRemainingMs);
  } else {
    // Timer would have fired while app was closed — start fresh
    startPopupTimer();
  }
} else {
  startPopupTimer();
}

startIdlePolling();
startTrayUpdates();
