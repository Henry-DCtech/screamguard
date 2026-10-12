import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/constants';
import type { Coords } from './locationService';
import type { Alert } from '../lib/types';

export interface DispatchParams {
  coords: Coords | null;
  confidence: number;
}

export interface DispatchResult {
  ok: boolean;
  alert: Alert | null;
  smsDispatched: boolean;
  error?: string;
}

/**
 * Dispatch an emergency alert.
 *
 * Path A — backend configured (API_BASE_URL set): POST to FastAPI, which logs
 * the alert AND sends SMS + push to the user's emergency contacts.
 *
 * Path B — no backend: insert the alert directly into Supabase so it shows up in
 * history. SMS is not sent in this mode.
 */
export async function dispatchAlert({ coords, confidence }: DispatchParams): Promise<DispatchResult> {
  // Without coordinates we still log the alert at 0,0 so it isn't lost.
  const latitude = coords?.latitude ?? 0;
  const longitude = coords?.longitude ?? 0;

  if (API_BASE_URL) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ latitude, longitude, confidence }),
      });
      if (res.ok) {
        const alert = (await res.json()) as Alert;
        return { ok: true, alert, smsDispatched: true };
      }
      // Backend reachable but errored — fall through to Supabase so the alert
      // is at least recorded.
    } catch {
      // Network failure — fall back to direct Supabase insert.
    }
  }

  // Path B (or backend fallback): direct insert.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, alert: null, smsDispatched: false, error: 'Not signed in' };
  }

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: user.id,
      latitude,
      longitude,
      confidence,
      status: 'sent',
      sms_sent: false,
      push_sent: false,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, alert: null, smsDispatched: false, error: error.message };
  }
  return { ok: true, alert: data as Alert, smsDispatched: false };
}
