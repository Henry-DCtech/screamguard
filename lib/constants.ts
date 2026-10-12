// App-wide configuration & detection tuning.

/**
 * Backend base URL (FastAPI). When set, alerts are POSTed to the backend so it
 * can dispatch SMS + push to emergency contacts. When empty, the app logs the
 * alert directly to Supabase (history still works, but no SMS is sent).
 *
 * Set EXPO_PUBLIC_API_BASE_URL in a .env file to enable backend dispatch.
 */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

// ── Detection defaults (mirrors device_settings table) ──────────────────────
export const DEFAULT_SETTINGS = {
  sensitivity: 0.85, // 0.60 – 0.95 confidence threshold
  consecutiveDetections: 2, // loud windows in a row before triggering
  cooldownSeconds: 60, // minimum gap between alerts
};

// ── Audio metering tuning ───────────────────────────────────────────────────
// expo-audio reports metering in dBFS: ~ -60 (silence) up to 0 (loudest).
// A scream pushes the level close to 0. We map the user's sensitivity slider
// (0.60 low → 0.95 high) onto a dB trigger threshold: higher sensitivity means
// a lower (easier to cross) threshold, so more sounds qualify.
export const METERING = {
  floorDb: -60, // treated as silence for the 0..1 UI level bar
  // Threshold range, in dBFS, mapped from sensitivity 0.60 → 0.95
  thresholdLowSensDb: -18, // sensitivity 0.60: only very loud sounds trigger
  thresholdHighSensDb: -42, // sensitivity 0.95: moderately loud sounds trigger
  pollIntervalMs: 350, // how often we sample the live level
};

/**
 * Map the sensitivity slider (0.60 low → 0.95 high) to a model confidence
 * threshold. Higher sensitivity = MORE alerts = a LOWER bar the model score must
 * clear. Range: 0.75 (strict) → 0.40 (loose); default 0.85 ≈ 0.50.
 */
export function sensitivityToConfidenceThreshold(sensitivity: number): number {
  const t = (clamp(sensitivity, 0.6, 0.95) - 0.6) / (0.95 - 0.6); // 0..1
  return 0.75 - t * (0.75 - 0.4);
}

/** Map a sensitivity value (0.60–0.95) to a dBFS trigger threshold. */
export function sensitivityToThresholdDb(sensitivity: number): number {
  const t = (clamp(sensitivity, 0.6, 0.95) - 0.6) / (0.95 - 0.6); // 0..1
  return (
    METERING.thresholdLowSensDb +
    t * (METERING.thresholdHighSensDb - METERING.thresholdLowSensDb)
  );
}

/** Normalise a dBFS metering value to a 0..1 level for UI bars. */
export function meteringToLevel(db: number): number {
  return clamp((db - METERING.floorDb) / (0 - METERING.floorDb), 0, 1);
}

/** Estimate a 0..1 "confidence" for an alert from how far the level exceeds the threshold. */
export function confidenceFromMetering(db: number, thresholdDb: number): number {
  // At threshold → ~0.70, at 0 dB → ~1.0
  const span = 0 - thresholdDb;
  const over = clamp((db - thresholdDb) / (span || 1), 0, 1);
  return clamp(0.7 + over * 0.3, 0, 1);
}

/** True when a backend is configured for cloud ML inference. */
export const hasBackend = API_BASE_URL.length > 0;

// ── Windowed capture (cloud inference) ──────────────────────────────────────
// The mic records fixed windows; loud windows are uploaded to the backend ML
// model for distress classification. Quiet windows are skipped to save bandwidth.
//
// DEVIATION FROM THE PAPER: Algorithm 1 specifies 1-second windows with 50%
// overlap. The window length matches, but capture here is back-to-back rather
// than overlapping — expo-audio exposes a single recorder, so producing
// overlapping windows on-device would need two interleaved recorders. The
// consequence is that a vocalisation straddling a window boundary is split
// across two windows instead of being caught whole by an overlapping one; the
// consecutive-detections setting partly compensates. Worth stating as a
// limitation rather than leaving the paper's claim unqualified.
export const WINDOW = {
  ms: 1000, // 1-second windows (matches the model's training window)
  pollIntervalMs: 150, // metering sample rate for the live UI meter + peak gate
  activityGateDb: -55, // only classify windows with a peak louder than this
};

export const COUNTDOWN_SECONDS = 10;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
