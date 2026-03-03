export interface Activity {
  id: string;
  name: string;
}

export interface WorkLog {
  id: number;
  timestamp: string;
  activities: string[]; // activity IDs
}

export interface BreakLog {
  id: number;
  timestamp: string;
  activities: string[]; // activity IDs
  durationMinutes: number;
}
