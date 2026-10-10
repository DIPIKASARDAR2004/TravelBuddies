export const SERVICE_CATEGORIES = [
  "police",
  "hospital",
  "pharmacy",
  "fire_station",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export type NearbySafetyService = {
  id: string;
  name: string;
  category: ServiceCategory;
  address: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  distanceMeters: number;
};

export const DEFAULT_RADIUS_METERS = 2000;
export const MAX_RADIUS_METERS = 5000;

export function isServiceCategory(value: string): value is ServiceCategory {
  return SERVICE_CATEGORIES.includes(value as ServiceCategory);
}

export function parseCoordinate(
  value: string | null,
  min: number,
  max: number,
) {
  if (!value || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max
    ? coordinate
    : null;
}

export function parseRadius(value: string | null) {
  if (value === null) return DEFAULT_RADIUS_METERS;
  if (!/^\d+$/.test(value)) return null;
  const radius = Number(value);
  if (!Number.isFinite(radius) || radius < 250 || radius > MAX_RADIUS_METERS)
    return null;
  return radius;
}

export function distanceInMeters(
  latitude: number,
  longitude: number,
  targetLatitude: number,
  targetLongitude: number,
) {
  const earthRadius = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function readNearbyServices(
  value: unknown,
  category: ServiceCategory,
  radius: number,
): NearbySafetyService[] {
  const invalid = () =>
    new Error(
      "The server returned invalid nearby-service data. Please try again.",
    );
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  const data = value as Record<string, unknown>;
  if (
    data.category !== category ||
    data.radiusMeters !== radius ||
    !Array.isArray(data.services) ||
    data.services.length > 50
  )
    throw invalid();
  const ids = new Set<string>();
  return data.services.map((entry: unknown) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw invalid();
    const row = entry as Record<string, unknown>;
    if (
      typeof row.id !== "string" ||
      !/^(node|way|relation)\/[1-9]\d*$/.test(row.id) ||
      ids.has(row.id) ||
      typeof row.name !== "string" ||
      !row.name.trim() ||
      row.category !== category ||
      typeof row.latitude !== "number" ||
      !Number.isFinite(row.latitude) ||
      Math.abs(row.latitude) > 90 ||
      typeof row.longitude !== "number" ||
      !Number.isFinite(row.longitude) ||
      Math.abs(row.longitude) > 180 ||
      typeof row.distanceMeters !== "number" ||
      !Number.isFinite(row.distanceMeters) ||
      row.distanceMeters < 0 ||
      (row.address !== null && typeof row.address !== "string") ||
      (row.phone !== null && typeof row.phone !== "string")
    )
      throw invalid();
    ids.add(row.id);
    return {
      id: row.id,
      name: row.name,
      category,
      latitude: row.latitude,
      longitude: row.longitude,
      distanceMeters: row.distanceMeters,
      address: row.address as string | null,
      phone: row.phone as string | null,
    };
  });
}
