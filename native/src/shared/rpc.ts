import type { ElectrobunRPCSchema } from "electrobun";
import type { Activity, WorkLog, BreakLog } from "./types";

export type AppRPC = ElectrobunRPCSchema & {
  bun: {
    requests: {
      getWorkLogs: {
        params: { from: string; to: string };
        response: WorkLog[];
      };
      getBreakLogs: {
        params: { from: string; to: string };
        response: BreakLog[];
      };
      getPopupInterval: {
        params: {};
        response: number;
      };
      setPopupInterval: {
        params: { minutes: number };
        response: { success: boolean };
      };
      getWorkActivities: {
        params: {};
        response: Activity[];
      };
      addWorkActivity: {
        params: { name: string };
        response: Activity;
      };
      removeWorkActivity: {
        params: { id: string };
        response: { success: boolean };
      };
      getBreakActivities: {
        params: {};
        response: Activity[];
      };
      addBreakActivity: {
        params: { name: string };
        response: Activity;
      };
      removeBreakActivity: {
        params: { id: string };
        response: { success: boolean };
      };
      logWork: {
        params: { activityIds: string[] };
        response: { success: boolean };
      };
      logBreak: {
        params: { activityIds: string[]; durationMinutes: number };
        response: { success: boolean };
      };
      getBreakDuration: {
        params: {};
        response: number;
      };
      setBreakDuration: {
        params: { minutes: number };
        response: { success: boolean };
      };
      dismissPopup: {
        params: {};
        response: { success: boolean };
      };
      restartTimer: {
        params: {};
        response: { success: boolean };
      };
      extendTimer: {
        params: { minutes: number };
        response: { success: boolean };
      };
      getTimerRemaining: {
        params: {};
        response: number;
      };
    };
    messages: {
      popupTriggered: {};
      idleStateChanged: { idle: boolean };
    };
  };
  webview: {
    requests: {};
    messages: {};
  };
};
