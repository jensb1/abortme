import { BrowserWindow, BrowserView } from "electrobun/bun";
import type { AppRPC } from "../shared/rpc";
import * as db from "./db";

import { existsSync } from "fs";
import { resolve } from "path";

const viewsExist = existsSync(resolve("../Resources/app/views/renderer/index.html"));
const appUrl = viewsExist
  ? "views://renderer/index.html"
  : "http://localhost:6001";

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

function startPopupTimer(win: BrowserWindow) {
  if (popupTimer) clearTimeout(popupTimer);
  popupRemainingMs = popupIntervalMinutes * 60_000;
  popupStartedAt = Date.now();

  popupTimer = setTimeout(() => {
    win.setAlwaysOnTop(true);
    win.focus();
    (rpc as any).send.popupTriggered({});
    // Reset for next cycle
    popupRemainingMs = popupIntervalMinutes * 60_000;
    popupStartedAt = Date.now();
    popupTimer = setTimeout(arguments.callee as any, popupRemainingMs);
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

function resumePopupTimer(win: BrowserWindow) {
  if (popupTimer) clearTimeout(popupTimer);
  popupStartedAt = Date.now();

  popupTimer = setTimeout(() => {
    win.setAlwaysOnTop(true);
    win.focus();
    (rpc as any).send.popupTriggered({});
    startPopupTimer(win);
  }, popupRemainingMs);
}

function startIdlePolling(win: BrowserWindow) {
  if (idlePoller) clearInterval(idlePoller);
  idlePoller = setInterval(async () => {
    const idle = await getIdleSeconds();
    const nowIdle = idle >= IDLE_THRESHOLD_SECONDS;

    if (nowIdle && !isIdle) {
      isIdle = true;
      pausePopupTimer();
      (rpc as any).send.idleStateChanged({ idle: true });
    } else if (!nowIdle && isIdle) {
      isIdle = false;
      resumePopupTimer(win);
      (rpc as any).send.idleStateChanged({ idle: false });
    }
  }, IDLE_POLL_MS);
}

const rpc = BrowserView.defineRPC<AppRPC>({
  handlers: {
    requests: ({
      getPopupInterval: () => popupIntervalMinutes,

      setPopupInterval: ({ minutes }) => {
        popupIntervalMinutes = minutes;
        db.setSetting("popupInterval", String(minutes));
        startPopupTimer(win);
        return { success: true };
      },

      getBreakDuration: () => breakDurationMinutes,

      setBreakDuration: ({ minutes }) => {
        breakDurationMinutes = minutes;
        db.setSetting("breakDuration", String(minutes));
        return { success: true };
      },

      getWorkActivities: () => db.getWorkActivities(),

      addWorkActivity: ({ name }) => db.addWorkActivity(name),

      removeWorkActivity: ({ id }) => {
        db.removeWorkActivity(id);
        return { success: true };
      },

      getBreakActivities: () => db.getBreakActivities(),

      addBreakActivity: ({ name }) => db.addBreakActivity(name),

      removeBreakActivity: ({ id }) => {
        db.removeBreakActivity(id);
        return { success: true };
      },

      logWork: ({ activityIds }) => {
        db.logWork(activityIds);
        return { success: true };
      },

      logBreak: ({ activityIds, durationMinutes }) => {
        db.logBreak(activityIds, durationMinutes);
        return { success: true };
      },

      getWorkLogs: ({ from, to }) => {
        const rawWorkLogs = db.getWorkLogs(from, to);
        return rawWorkLogs.map((log) => ({
          id: log.id,
          timestamp: log.timestamp,
          activities: JSON.parse(log.activities),
        }));
      },

      getBreakLogs: ({ from, to }) => {
        const rawBreakLogs = db.getBreakLogs(from, to);
        return rawBreakLogs.map((log) => ({
          id: log.id,
          timestamp: log.timestamp,
          activities: JSON.parse(log.activities),
          durationMinutes: log.duration_minutes,
        }));
      },

      dismissPopup: () => {
        win.setAlwaysOnTop(false);
        return { success: true };
      },
    }) as any,
    messages: {},
  },
});

const win = new BrowserWindow({
  title: "AbortMe",
  url: appUrl,
  frame: {
    x: 100,
    y: 100,
    width: 1024,
    height: 768,
  },
  rpc,
});

startPopupTimer(win);
startIdlePolling(win);
