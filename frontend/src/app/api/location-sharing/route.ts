import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { validateCoordinates } from "@/lib/locationShares";

const locationFields = "id, latitude, longitude, sharing, updated_at";

type LocationShareUpdate = {
  latitude?: number;
  longitude?: number;
  sharing?: boolean;
};

function unauthorizedResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return null;
}

async function parseJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("location_shares")
      .select(locationFields)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Location sharing lookup failed:", error.message);
      return NextResponse.json({ error: "Unable to load location-sharing state." }, { status: 500 });
    }

    return NextResponse.json({ locationShare: data ?? null });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to load location-sharing state." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseJson(request);
    const coordinates = validateCoordinates(body);

    if (!coordinates.valid) {
      return NextResponse.json({ error: coordinates.error }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("location_shares")
      .upsert(
        {
          user_id: user.id,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          sharing: true,
        },
        { onConflict: "user_id" },
      )
      .select(locationFields)
      .single();

    if (error) {
      console.error("Location sharing create failed:", error.message);
      return NextResponse.json({ error: "Unable to enable location sharing." }, { status: 500 });
    }

    return NextResponse.json({ locationShare: data }, { status: 201 });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to enable location sharing." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await parseJson(request);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const hasLatitude = input.latitude !== undefined && input.latitude !== null;
    const hasLongitude = input.longitude !== undefined && input.longitude !== null;
    const hasCoordinates = hasLatitude || hasLongitude;
    const hasSharing = input.sharing !== undefined;

    if (hasSharing && typeof input.sharing !== "boolean") {
      return NextResponse.json({ error: "Sharing must be a boolean." }, { status: 400 });
    }

    if (!hasSharing && !hasCoordinates) {
      return NextResponse.json({ error: "Provide sharing or a current location to update." }, { status: 400 });
    }

    if (hasCoordinates && (!hasLatitude || !hasLongitude)) {
      return NextResponse.json({ error: "Latitude and longitude must be supplied together." }, { status: 400 });
    }

    if (input.sharing === true && !hasCoordinates) {
      return NextResponse.json({ error: "A current location is required when enabling sharing." }, { status: 400 });
    }

    const coordinates = hasCoordinates ? validateCoordinates(input) : null;
    if (coordinates && !coordinates.valid) {
      return NextResponse.json({ error: coordinates.error }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: existing, error: lookupError } = await supabase
      .from("location_shares")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Location sharing update lookup failed:", lookupError.message);
      return NextResponse.json({ error: "Unable to update location-sharing state." }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Location-sharing record not found." }, { status: 404 });
    }

    const updates: LocationShareUpdate = {};
    if (coordinates?.valid) {
      updates.latitude = coordinates.latitude;
      updates.longitude = coordinates.longitude;
    }
    if (hasSharing) {
      updates.sharing = input.sharing as boolean;
    }

    const { data, error } = await supabase
      .from("location_shares")
      .update(updates)
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select(locationFields)
      .maybeSingle();

    if (error) {
      console.error("Location sharing update failed:", error.message);
      return NextResponse.json({ error: "Unable to update location-sharing state." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Location-sharing record not found." }, { status: 404 });
    }

    return NextResponse.json({ locationShare: data });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to update location-sharing state." }, { status: 500 });
  }
}
