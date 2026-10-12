import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { DEFAULT_SETTINGS } from '../lib/constants';
import type { DistressLabel } from '../services/inferenceService';

export type MonitorStatus = 'idle' | 'starting' | 'listening' | 'countdown' | 'dispatching' | 'error';

export type WindowMode = 'cloud' | 'cloud-failed' | 'quiet' | 'loudness';

/** Diagnostic info about the most recent analyzed audio window. */
export interface LastWindow {
  peakDb: number;
  score: number | null; // distress confidence (0..1), null if not classified
  /** Predicted class, when the window was classified by the model. */
  label: DistressLabel | null;
  mode: WindowMode;
  hit: boolean;
  streak: number;
  at: number;
}

export interface DetectionSettings {
  sensitivity: number;
  consecutiveDetections: number;
  cooldownSeconds: number;
}

interface MonitoringState {
  // Monitoring on/off (user intent)
  isActive: boolean;
  status: MonitorStatus;
  statusMessage: string | null;

  // Live audio level (0..1) for the UI meter
  level: number;

  // Diagnostic readout of the last analyzed window
  lastWindow: LastWindow | null;

  // Detection bookkeeping
  lastDetectionAt: string | null;
  todayAlertCount: number;

  // Countdown state (when a scream is detected, before the alert fires)
  countdownActive: boolean;
  countdownConfidence: number;

  // Tunables (synced from device_settings)
  settings: DetectionSettings;

  // Actions
  setActive: (active: boolean) => void;
  toggle: () => void;
  setStatus: (status: MonitorStatus, message?: string | null) => void;
  setLevel: (level: number) => void;
  setLastWindow: (w: LastWindow) => void;
  setLastDetection: (time: string) => void;
  setTodayCount: (count: number) => void;
  incTodayCount: () => void;
  startCountdown: (confidence: number) => void;
  endCountdown: () => void;
  setSettings: (patch: Partial<DetectionSettings>) => void;
  loadSettings: () => Promise<void>;
}

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  isActive: false,
  status: 'idle',
  statusMessage: null,
  level: 0,
  lastWindow: null,
  lastDetectionAt: null,
  todayAlertCount: 0,
  countdownActive: false,
  countdownConfidence: 0,
  settings: { ...DEFAULT_SETTINGS },

  setActive: (active) =>
    set({ isActive: active, status: active ? 'starting' : 'idle', level: 0, statusMessage: null }),
  toggle: () => {
    const next = !get().isActive;
    set({ isActive: next, status: next ? 'starting' : 'idle', level: 0, statusMessage: null });
  },
  setStatus: (status, message = null) => set({ status, statusMessage: message }),
  setLevel: (level) => set({ level }),
  setLastWindow: (w) => set({ lastWindow: w }),
  setLastDetection: (time) => set({ lastDetectionAt: time }),
  setTodayCount: (count) => set({ todayAlertCount: count }),
  incTodayCount: () => set((s) => ({ todayAlertCount: s.todayAlertCount + 1 })),
  startCountdown: (confidence) =>
    set({ countdownActive: true, countdownConfidence: confidence, status: 'countdown' }),
  endCountdown: () => set({ countdownActive: false }),
  setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

  loadSettings: async () => {
    const { data } = await supabase.from('device_settings').select('*').single();
    if (data) {
      set({
        settings: {
          sensitivity: data.sensitivity ?? DEFAULT_SETTINGS.sensitivity,
          consecutiveDetections:
            data.consecutive_detections ?? DEFAULT_SETTINGS.consecutiveDetections,
          cooldownSeconds: data.cooldown_seconds ?? DEFAULT_SETTINGS.cooldownSeconds,
        },
      });
    }
  },
}));
