export interface Coordinates {
  lat: number;
  lng: number;
}

function coordinate(value: unknown, bound: number): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const result = Number(value);
  return Number.isFinite(result) && Math.abs(result) <= bound ? result : null;
}

/** Null/empty coordinates are unknown, not a location at zero degrees. */
export function readCoordinates(
  value: { latitude?: unknown; longitude?: unknown } | null | undefined,
): Coordinates | null {
  const lat = coordinate(value?.latitude, 90);
  const lng = coordinate(value?.longitude, 180);
  return lat === null || lng === null ? null : { lat, lng };
}
