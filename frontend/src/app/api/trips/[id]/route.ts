import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { validateTripInput } from "@/lib/trips";

const tripFields = "id, title, destination, start_date, end_date, sharing, created_at, updated_at";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function unauthorizedResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return null;
}

async function getTripId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = await getTripId(context);
    if (!uuidPattern.test(id)) {
      return NextResponse.json({ error: "Invalid trip ID." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("trips")
      .select(tripFields)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Trip lookup failed:", error.message);
      return NextResponse.json({ error: "Unable to load trip." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    return NextResponse.json({ trip: data });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to load trip." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = await getTripId(context);
    if (!uuidPattern.test(id)) {
      return NextResponse.json({ error: "Invalid trip ID." }, { status: 400 });
    }

    const body = await request.json().catch(() => null) as unknown;
    const validation = validateTripInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("trips")
      .update(validation.value)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(tripFields)
      .maybeSingle();

    if (error) {
      console.error("Trip update failed:", error.message);
      return NextResponse.json({ error: "Unable to update trip." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    return NextResponse.json({ trip: data });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to update trip." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = await getTripId(context);
    if (!uuidPattern.test(id)) {
      return NextResponse.json({ error: "Invalid trip ID." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("trips")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Trip delete failed:", error.message);
      return NextResponse.json({ error: "Unable to delete trip." }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Trip not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to delete trip." }, { status: 500 });
  }
}
