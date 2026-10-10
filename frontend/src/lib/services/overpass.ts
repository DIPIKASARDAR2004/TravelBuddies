import "server-only";
import {
  distanceInMeters,
  readNearbyServices,
  type NearbySafetyService,
  type ServiceCategory,
} from "./nearbySafetyServices";

export class NearbyProviderError extends Error {
  constructor(
    message = "Nearby-service data is temporarily unavailable. Please try again.",
    public readonly status = 503,
  ) {
    super(message);
  }
}

function normalizeElements(
  value: unknown,
  category: ServiceCategory,
  latitude: number,
  longitude: number,
): NearbySafetyService[] {
  if (!value || typeof value !== "object") throw new NearbyProviderError();
  const payload = value as { elements?: unknown; remark?: unknown };
  // Overpass can return HTTP 200 with an incomplete result and a timeout remark.
  if (payload.remark || !Array.isArray(payload.elements))
    throw new NearbyProviderError();
  const ids = new Set<string>();
  const services = payload.elements.map(
    (entry: unknown): NearbySafetyService => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry))
        throw new NearbyProviderError();
      const element = entry as {
        type?: unknown;
        id?: unknown;
        lat?: unknown;
        lon?: unknown;
        center?: { lat?: unknown; lon?: unknown };
        tags?: unknown;
      };
      if (
        typeof element.type !== "string" ||
        !["node", "way", "relation"].includes(element.type) ||
        typeof element.id !== "number" ||
        !Number.isSafeInteger(element.id) ||
        element.id < 1 ||
        !element.tags ||
        typeof element.tags !== "object" ||
        Array.isArray(element.tags)
      )
        throw new NearbyProviderError();
      const tags = element.tags as Record<string, unknown>;
      if (
        Object.values(tags).some((value) => typeof value !== "string") ||
        tags.amenity !== category
      )
        throw new NearbyProviderError();
      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (
        typeof lat !== "number" ||
        !Number.isFinite(lat) ||
        Math.abs(lat) > 90 ||
        typeof lng !== "number" ||
        !Number.isFinite(lng) ||
        Math.abs(lng) > 180
      )
        throw new NearbyProviderError();
      const id = `${element.type}/${element.id}`;
      if (ids.has(id)) throw new NearbyProviderError();
      ids.add(id);
      const address = [
        tags["addr:housenumber"],
        tags["addr:street"],
        tags["addr:suburb"],
        tags["addr:city"],
      ]
        .filter(Boolean)
        .join(", ");
      return {
        id,
        name: (tags.name as string) || `${category.replace("_", " ")} service`,
        category,
        address: address || (tags["addr:full"] as string) || null,
        latitude: lat,
        longitude: lng,
        phone:
          (tags.phone as string) || (tags["contact:phone"] as string) || null,
        distanceMeters: Math.round(
          distanceInMeters(latitude, longitude, lat, lng),
        ),
      };
    },
  );
  return services
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 50);
}

export async function findNearbyServices(
  latitude: number,
  longitude: number,
  category: ServiceCategory,
  radius: number,
  signal: AbortSignal,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "TravelBuddies nearby safety services",
      },
      body: new URLSearchParams({
        data: `[out:json][timeout:15];nwr["amenity"="${category}"](around:${radius},${latitude},${longitude});out center tags;`,
      }),
      signal: AbortSignal.any([signal, controller.signal]),
      cache: "no-store",
      redirect: "error",
    });
    if (response.status === 429)
      throw new NearbyProviderError(
        "The nearby-service provider is busy. Please wait before trying again.",
        429,
      );
    if (!response.ok) throw new NearbyProviderError();
    const services = normalizeElements(
      await response.json(),
      category,
      latitude,
      longitude,
    );
    return readNearbyServices(
      { services, category, radiusMeters: radius },
      category,
      radius,
    );
  } catch (error) {
    if (signal.aborted)
      throw new NearbyProviderError("Nearby-service search cancelled.", 408);
    if (controller.signal.aborted)
      throw new NearbyProviderError(
        "Nearby-service search took too long. Please try again.",
        504,
      );
    if (error instanceof NearbyProviderError) throw error;
    throw new NearbyProviderError();
  } finally {
    clearTimeout(timer);
  }
}
