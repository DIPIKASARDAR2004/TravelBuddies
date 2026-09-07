import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";

const alertFields = "id, latitude, longitude, message, status, created_at, resolved_at";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function unauthorizedResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    if (!uuidPattern.test(id)) {
      return NextResponse.json({ error: "Invalid alert ID." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("emergency_alerts")
      .select(alertFields)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Emergency alert lookup failed:", error.message);
      return NextResponse.json({ error: "Unable to load emergency alert." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Emergency alert not found." }, { status: 404 });
    }

    return NextResponse.json({ alert: data });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to load emergency alert." }, { status: 500 });
  }
}
