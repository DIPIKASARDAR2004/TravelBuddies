import { NextResponse } from "next/server";
import {
  isServiceCategory,
  parseCoordinate,
  parseRadius,
} from "@/lib/services/nearbySafetyServices";
import { withAuth } from "@/lib/services/apiHandler";
import {
  findNearbyServices,
  NearbyProviderError,
} from "@/lib/services/overpass";

export const GET = withAuth(async ({ request }) => {
  const params = new URL(request.url).searchParams;
  const latitude = parseCoordinate(params.get("latitude"), -90, 90);
  const longitude = parseCoordinate(params.get("longitude"), -180, 180);
  const category = params.get("type") || "police";
  const radius = parseRadius(params.get("radius"));
  if (latitude === null || longitude === null)
    return NextResponse.json(
      { error: "Valid latitude and longitude are required." },
      { status: 400 },
    );
  if (!isServiceCategory(category))
    return NextResponse.json(
      { error: "Unsupported safety service category." },
      { status: 400 },
    );
  if (radius === null)
    return NextResponse.json(
      { error: "Radius must be between 250 and 5000 meters." },
      { status: 400 },
    );
  try {
    const services = await findNearbyServices(
      latitude,
      longitude,
      category,
      radius,
      request.signal,
    );
    return NextResponse.json(
      { services, category, radiusMeters: radius },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof NearbyProviderError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    throw error;
  }
}, "Unable to find nearby services.");
