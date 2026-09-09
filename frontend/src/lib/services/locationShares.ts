export type LocationShare = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  sharing: boolean;
  updated_at: string;
};

type CoordinateValidation =
  | { valid: true; latitude: number; longitude: number }
  | { valid: false; error: string };

export function validateCoordinates(input: unknown): CoordinateValidation {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Location coordinates are required." };
  }

  const data = input as Record<string, unknown>;
  const hasLatitude = data.latitude !== undefined && data.latitude !== null;
  const hasLongitude = data.longitude !== undefined && data.longitude !== null;

  if (!hasLatitude || !hasLongitude) {
    return { valid: false, error: "Latitude and longitude must be supplied together." };
  }

  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    return { valid: false, error: "Latitude and longitude must be numbers." };
  }

  if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90." };
  }

  if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180." };
  }

  return { valid: true, latitude: data.latitude, longitude: data.longitude };
}
