import { useEffect, useRef, useState } from 'react';
import {
  useAudioRecorder,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  IOSOutputFormat,
  AudioQuality,
  type RecordingOptions,
} from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { useMonitoringStore, type WindowMode } from '../stores/monitoringStore';
import {
  WINDOW,
  METERING,
  COUNTDOWN_SECONDS,
  hasBackend,
  sensitivityToThresholdDb,
  sensitivityToConfidenceThreshold,
  meteringToLevel,
  confidenceFromMetering,
} from '../lib/constants';
import { getCurrentCoords } from '../services/locationService';
import { dispatchAlert } from '../services/alertService';
import { classifyAudio, type DistressLabel } from '../services/inferenceService';
import {
  ensureNotificationSetup,
  notifyScreamDetected,
  notifyAlertSent,
  notifyAlertCancelled,
} from '../services/notificationService';

const KEEP_AWAKE_TAG = 'screamguard-monitor';

const WINDOW_OPTIONS: RecordingOptions = {
  isMeteringEnabled: true,
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 64000,
  },
};

export function useScreamMonitor() {
  useKeepAwake(KEEP_AWAKE_TAG);
  const recorder = useAudioRecorder(WINDOW_OPTIONS);

  const [countdownRemaining, setCountdownRemaining] = useState(COUNTDOWN_SECONDS);

  const loopRef = useRef(false);
  const windowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hitStreakRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const recordingRef = useRef(false);

  const isActive = useMonitoringStore((s) => s.isActive);

  useEffect(() => {
    if (isActive) {
      start();
    } else {
      stop();
    }
    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  async function start() {
    const store = useMonitoringStore.getState();
    store.setStatus('starting');

    const mic = await requestRecordingPermissionsAsync();
    if (!mic.granted) {
      store.setStatus('error', 'Microphone permission is required to monitor.');
      store.setActive(false);
      return;
    }
    await ensureNotificationSetup();
    store.loadSettings().catch(() => {});

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    } catch {
      store.setStatus('error', 'Could not access the microphone.');
      store.setActive(false);
      return;
    }

    hitStreakRef.current = 0;
    loopRef.current = true;
    store.setStatus('listening');
    runWindow();
  }

  async function stop() {
    loopRef.current = false;
    if (windowTimerRef.current) clearTimeout(windowTimerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    windowTimerRef.current = null;
    pollRef.current = null;
    cancelCountdownTimer();
    if (recordingRef.current) {
      recordingRef.current = false;
      try { await recorder.stop(); } catch {}
    }
    const store = useMonitoringStore.getState();
    store.setLevel(0);
    if (!store.isActive && store.status!== 'error') {
      store.setStatus('idle');
    }
  }

  async function runWindow() {
    if (!loopRef.current) return;
    const store = useMonitoringStore.getState();
    try {
      await recorder.prepareToRecordAsync(WINDOW_OPTIONS);
      recorder.record();
      recordingRef.current = true;
    } catch {
      scheduleNext(500);
      return;
    }

    let peakDb = METERING.floorDb;
    pollRef.current = setInterval(() => {
      if (!recordingRef.current) return;
      try {
        const status = recorder.getStatus();
        if (typeof status.metering === 'number' && isFinite(status.metering)) {
          peakDb = Math.max(peakDb, status.metering);
          store.setLevel(meteringToLevel(status.metering));
        }
      } catch {}
    }, WINDOW.pollIntervalMs);

    windowTimerRef.current = setTimeout(async () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      let uri: string | null = null;
      try {
        await recorder.stop();
        recordingRef.current = false;
        uri = recorder.uri;
      } catch {
        recordingRef.current = false;
      }
      await handleWindow(uri, peakDb);
      scheduleNext(0);
    }, WINDOW.ms);
  }

  function scheduleNext(delayMs: number) {
    if (!loopRef.current) return;
    windowTimerRef.current = setTimeout(runWindow, delayMs);
  }

  async function handleWindow(uri: string | null, peakDb: number) {
    const store = useMonitoringStore.getState();
    if (!loopRef.current) return;
    if (store.countdownActive) return;
    if (Date.now() < cooldownUntilRef.current) {
      hitStreakRef.current = 0;
      return;
    }

    const sensitivity = store.settings.sensitivity;
    let confidence: number;
    let isHit: boolean;
    let mode: WindowMode;
    let label: DistressLabel | null = null;

    if (hasBackend && uri && peakDb >= WINDOW.activityGateDb) {
      const result = await classifyAudio(uri);
      if (!loopRef.current || useMonitoringStore.getState().countdownActive) return;
      if (result == null) {
        const thrDb = sensitivityToThresholdDb(sensitivity);
        confidence = confidenceFromMetering(peakDb, thrDb);
        isHit = peakDb >= thrDb;
        mode = 'cloud-failed';
      } else {
        const thr = sensitivityToConfidenceThreshold(sensitivity);
        confidence = result.confidence;
        label = result.label;
        isHit = result.label!== 'non_distress' && result.confidence >= thr;
        mode = 'cloud';
      }
    } else if (hasBackend) {
      hitStreakRef.current = 0;
      store.setLastWindow({
        peakDb, score: null, label: null, mode: 'quiet', hit: false, streak: 0, at: Date.now(),
      });
      return;
    } else {
      const thrDb = sensitivityToThresholdDb(sensitivity);
      confidence = confidenceFromMetering(peakDb, thrDb);
      isHit = peakDb >= thrDb;
      mode = 'loudness';
    }

    hitStreakRef.current = isHit? hitStreakRef.current + 1 : 0;

    store.setLastWindow({
      peakDb,
      score: confidence!,
      label,
      mode,
      hit: isHit,
      streak: hitStreakRef.current,
      at: Date.now(),
    });

    if (hitStreakRef.current >= store.settings.consecutiveDetections) {
      hitStreakRef.current = 0;
      trigger(confidence!);
    }
  }

  function trigger(confidence: number) {
    const store = useMonitoringStore.getState();
    store.setLastDetection(new Date().toISOString());
    store.startCountdown(confidence);
    setCountdownRemaining(COUNTDOWN_SECONDS);
    notifyScreamDetected(COUNTDOWN_SECONDS).catch(() => {});

    let remaining = COUNTDOWN_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdownRemaining(remaining);
      if (remaining <= 0) {
        cancelCountdownTimer();
        fireAlert();
      }
    }, 1000);
  }

  function cancelCountdownTimer() {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }

  async function fireAlert() {
    const store = useMonitoringStore.getState();
    store.setStatus('dispatching');
    const confidence = store.countdownConfidence;
    const coords = await getCurrentCoords();
    const result = await dispatchAlert({ coords, confidence });
    startCooldown();
    store.endCountdown();
    if (result.ok) {
      store.incTodayCount();
      notifyAlertSent().catch(() => {});
      store.setStatus(store.isActive? 'listening' : 'idle');
    } else {
      store.setStatus('listening', result.error?? 'Failed to send alert.');
    }
  }

  function cancelPending() {
    cancelCountdownTimer();
    const store = useMonitoringStore.getState();
    store.endCountdown();
    startCooldown();
    notifyAlertCancelled().catch(() => {});
    store.setStatus(store.isActive? 'listening' : 'idle');
  }

  function startCooldown() {
    const { settings } = useMonitoringStore.getState();
    cooldownUntilRef.current = Date.now() + settings.cooldownSeconds * 1000;
    hitStreakRef.current = 0;
  }

  return { countdownRemaining, cancelPending };
}