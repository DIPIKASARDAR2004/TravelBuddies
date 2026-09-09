import { NextResponse } from "next/server";
import {
  distanceInMeters,
  isServiceCategory,
  parseCoordinate,
  parseRadius,
  type NearbySafetyService,
  type ServiceCategory,
} from '@/lib/services/nearbySafetyServices';
import { withAuth, parseJson, ApiHandlerContext } from '@/lib/services/apiHandler';

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const categoryFilters: Record<ServiceCategory, string> = {
  police: '["amenity"="police"]',
  hospital: '["amenity"="hospital"]',
  pharmacy: '["amenity"="pharmacy"]',
  fire_station: '["amenity"="fire_station"]',
};

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function getAddress(tags: Record<string, string>) {
  const address = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
  ].filter(Boolean).join(", ");
  return address || tags["addr:full"] || null;
}

function normalizeElement(
  element: OverpassElement,
  category: ServiceCategory,
  latitude: number,
  longitude: number,
): NearbySafetyService | null {
  const elementLatitude = element.lat ?? element.center?.lat;
  const elementLongitude = element.lon ?? element.center?.lon;
  if (typeof elementLatitude !== "number" || typeof elementLongitude !== "number") return null;

  const tags = element.tags ?? {};
  return {
    id: `${element.type}/${element.id}`,
    name: tags.name || `${category.replace("_", " ")} service`,
    category,
    address: getAddress(tags),
    latitude: elementLatitude,
    longitude: elementLongitude,
    phone: tags.phone || tags["contact:phone"] || null,
    distanceMeters: Math.round(distanceInMeters(latitude, longitude, elementLatitude, elementLongitude)),
  };
}

export const GET = withAuth(async ({ user, supabase, request }: ApiHandlerContext) => {
          const searchParams = new URL(request.url).searchParams;
        const latitude = parseCoordinate(searchParams.get("latitude"), -90, 90);
        const longitude = parseCoordinate(searchParams.get("longitude"), -180, 180);
        const type = searchParams.get("type") || "police";
        const radius = parseRadius(searchParams.get("radius"));

        if (latitude === null || longitude === null) {
          return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
        }
        if (!isServiceCategory(type)) {
          return NextResponse.json({ error: "Unsupported safety service category." }, { status: 400 });
        }
        if (radius === null) {
          return NextResponse.json({ error: "Radius must be between 250 and 5000 meters." }, { status: 400 });
        }

        const query = `[out:json][timeout:15];nwr${categoryFilters[type]}(around:${radius},${latitude},${longitude});out center tags;`;
        const response = await fetch(OVERPASS_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            "User-Agent": "TravelBuddies nearby safety services",
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(20000),
        });

        if (response.status === 429) {
          return NextResponse.json({ error: "The safety-service provider is rate-limiting requests. Try again shortly." }, { status: 429 });
        }
        if (!response.ok) {
          return NextResponse.json({ error: "The safety-service provider is temporarily unavailable." }, { status: 503 });
        }

        const payload = (await response.json()) as { elements?: OverpassElement[] };
        const services = (payload.elements ?? [])
          .map((element) => normalizeElement(element, type, latitude, longitude))
          .filter((service): service is NearbySafetyService => service !== null)
          .sort((first, second) => first.distanceMeters - second.distanceMeters)
          .slice(0, 50);

        return NextResponse.json({ services, category: type, radiusMeters: radius });
    });
