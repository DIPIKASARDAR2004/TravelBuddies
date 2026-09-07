export const SERVICE_CATEGORIES = ["police", "hospital", "pharmacy", "fire_station"] as const;

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

export function parseCoordinate(value: string | null, min: number, max: number) {
  if (!value || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : null;
}

export function parseRadius(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return DEFAULT_RADIUS_METERS;
  const radius = Number(value);
  if (!Number.isFinite(radius) || radius < 250 || radius > MAX_RADIUS_METERS) return null;
  return radius;
}

export function distanceInMeters(latitude: number, longitude: number, targetLatitude: number, targetLongitude: number) {
  const earthRadius = 6371000;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(targetLatitude - latitude);
  const longitudeDelta = toRadians(targetLongitude - longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(latitude)) * Math.cos(toRadians(targetLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
}
