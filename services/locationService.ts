import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Request foreground location permission. Returns true if granted. */
export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * Reverse-geocode coordinates into a human-readable address using the device's
 * built-in geocoder (no API key required). Returns null if it can't resolve.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const granted = await ensureLocationPermission();
    if (!granted) return null;
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!results.length) return null;
    const a = results[0];
    const parts = [
      a.name,
      a.street,
      a.district,
      a.city ?? a.subregion,
      a.region,
      a.country,
    ].filter((p): p is string => !!p);
    // Drop consecutive duplicates (name is often the same as street/number).
    const out: string[] = [];
    for (const p of parts) {
      if (out[out.length - 1] !== p) out.push(p);
    }
    return out.length ? out.join(', ') : null;
  } catch {
    return null;
  }
}

/**
 * Get the device's current position. Returns null if permission is denied or
 * the fix fails — callers should still be able to send an alert without coords.
 */
export async function getCurrentCoords(): Promise<Coords | null> {
  try {
    const granted = await ensureLocationPermission();
    if (!granted) return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    // Fall back to the last known position if a fresh fix times out.
    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        return { latitude: last.coords.latitude, longitude: last.coords.longitude };
      }
    } catch {
      // ignore
    }
    return null;
  }
}
