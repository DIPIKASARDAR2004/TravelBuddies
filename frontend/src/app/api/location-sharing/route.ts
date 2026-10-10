import { NextResponse } from "next/server";
import {
  validateCoordinates,
  validateLocationShareUpdate,
  LOCATION_FIELDS,
  readLocationShare,
} from "@/lib/services/locationShares";
import {
  withAuth,
  parseJson,
  ApiHandlerContext,
} from "@/lib/services/apiHandler";

const locationFields = LOCATION_FIELDS;

export const GET = withAuth(async ({ user, supabase }: ApiHandlerContext) => {
  const { data, error } = await supabase
    .from("location_shares")
    .select(locationFields)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Location sharing lookup failed:", error.message);
    return NextResponse.json(
      { error: "Unable to load location-sharing state." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    locationShare: readLocationShare({ locationShare: data ?? null }),
  });
});
export const POST = withAuth(
  async ({ user, supabase, request }: ApiHandlerContext) => {
    const body = await parseJson(request);
    const coordinates = validateCoordinates(body);

    if (!coordinates.valid) {
      return NextResponse.json({ error: coordinates.error }, { status: 400 });
    }

    const sharing = (body as Record<string, unknown>).sharing;
    if (typeof sharing !== "boolean")
      return NextResponse.json(
        { error: "An explicit sharing choice is required." },
        { status: 400 },
      );

    const { data, error } = await supabase
      .from("location_shares")
      .upsert(
        {
          user_id: user.id,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          sharing,
        },
        { onConflict: "user_id" },
      )
      .select(locationFields)
      .single();

    if (error) {
      console.error("Location sharing create failed:", error.message);
      return NextResponse.json(
        { error: "Unable to enable location sharing." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        locationShare: readLocationShare({ locationShare: data }, { sharing }),
      },
      { status: 201 },
    );
  },
);
export const PATCH = withAuth(
  async ({ user, supabase, request }: ApiHandlerContext) => {
    const body = await parseJson(request);

    const result = validateLocationShareUpdate(body);
    if (!result.valid)
      return NextResponse.json({ error: result.error }, { status: 400 });
    const updates = result.updates;

    const { data: existing, error: lookupError } = await supabase
      .from("location_shares")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      console.error(
        "Location sharing update lookup failed:",
        lookupError.message,
      );
      return NextResponse.json(
        { error: "Unable to update location-sharing state." },
        { status: 500 },
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Location-sharing record not found." },
        { status: 404 },
      );
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
      return NextResponse.json(
        { error: "Unable to update location-sharing state." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Location-sharing record not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      locationShare: readLocationShare(
        { locationShare: data },
        { id: existing.id, sharing: updates.sharing },
      ),
    });
  },
);
