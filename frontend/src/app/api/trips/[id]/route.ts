import { NextResponse } from "next/server";
import {
  validateTripInput,
  tripFields,
  tripIdPattern,
  readTripRecord,
} from "@/lib/services/trips";
import {
  withAuth,
  parseJson,
  ApiHandlerContext,
} from "@/lib/services/apiHandler";

export const GET = withAuth(
  async ({ user, supabase, params }: ApiHandlerContext) => {
    const id = params.id;
    if (!tripIdPattern.test(id)) {
      return NextResponse.json({ error: "Invalid trip ID." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("trips")
      .select(tripFields)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Trip lookup failed:");
      return NextResponse.json(
        { error: "Unable to load trip." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    return NextResponse.json({ trip: readTripRecord(data, id) });
  },
);
export const PATCH = withAuth(
  async ({ user, supabase, request, params }: ApiHandlerContext) => {
    const id = params.id;
    if (!tripIdPattern.test(id)) {
      return NextResponse.json({ error: "Invalid trip ID." }, { status: 400 });
    }

    const body = await parseJson(request);
    const validation = validateTripInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("trips")
      .update(validation.value)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(tripFields)
      .maybeSingle();

    if (error) {
      console.error("Trip update failed:");
      return NextResponse.json(
        { error: "Unable to update trip." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    return NextResponse.json({ trip: readTripRecord(data, id) });
  },
);
export const DELETE = withAuth(
  async ({ user, supabase, params }: ApiHandlerContext) => {
    const id = params.id;
    if (!tripIdPattern.test(id)) {
      return NextResponse.json({ error: "Invalid trip ID." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("trips")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Trip delete failed:");
      return NextResponse.json(
        { error: "Unable to delete trip." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    if (data.id !== id)
      return NextResponse.json(
        { error: "Trip deletion could not be confirmed." },
        { status: 500 },
      );
    return NextResponse.json({ success: true });
  },
);
