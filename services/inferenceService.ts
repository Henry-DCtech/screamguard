import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../lib/constants';

/** Classes the CNN-LSTM predicts (Paper Section IV-B). */
export type DistressLabel = 'scream' | 'dialect_distress' | 'non_distress';

export type Classification = {
  /** P(Scream) + P(Dialect-Distress) — the value an alert threshold applies to. */
  confidence: number;
  label: DistressLabel;
  probabilities: Record<DistressLabel, number>;
  /** Which model generation served the request, for diagnostics. */
  model: string;
};

/** Pick a sensible upload filename + MIME type from a recording URI. */
function audioMeta(uri: string): { name: string; type: string } {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.wav')) return { name: 'window.wav', type: 'audio/wav' };
  if (lower.endsWith('.3gp')) return { name: 'window.3gp', type: 'audio/3gpp' };
  if (lower.endsWith('.caf')) return { name: 'window.caf', type: 'audio/x-caf' };
  return { name: 'window.m4a', type: 'audio/m4a' };
}

/**
 * Upload a recorded audio window to the backend model and return the
 * classification, or null if the request fails (caller treats null as
 * "no decision" and falls back to loudness for that window).
 */
export async function classifyAudio(uri: string): Promise<Classification | null> {
  if (!API_BASE_URL) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { name, type } = audioMeta(uri);

    const form = new FormData();
    // React Native FormData accepts a file descriptor object for uploads.
    form.append('audio', { uri, name, type } as any);

    const res = await fetch(`${API_BASE_URL}/api/inference`, {
      method: 'POST',
      headers: {
        // Let fetch set the multipart boundary; only add auth.
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: form,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as Partial<Classification>;
    if (typeof json.confidence !== 'number') return null;

    return {
      confidence: json.confidence,
      // Older backends returned only `confidence`; infer a label so the caller
      // never has to special-case the response shape.
      label: json.label ?? (json.confidence >= 0.5 ? 'scream' : 'non_distress'),
      probabilities: json.probabilities ?? {
        scream: json.confidence,
        dialect_distress: 0,
        non_distress: 1 - json.confidence,
      },
      model: json.model ?? 'unknown',
    };
  } catch {
    return null;
  }
}
