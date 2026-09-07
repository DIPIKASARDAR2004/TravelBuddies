import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { validateEmergencyAlertInput } from "@/lib/emergencyAlerts";

const alertFields = "id, latitude, longitude, message, status, created_at, resolved_at";

function unauthorizedResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return null;
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("emergency_alerts")
      .select(alertFields)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Emergency alert list failed:", error.message);
      return NextResponse.json({ error: "Unable to load emergency alerts." }, { status: 500 });
    }

    return NextResponse.json({ alerts: data ?? [] });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to load emergency alerts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const validation = validateEmergencyAlertInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("emergency_alerts")
      .insert({
        user_id: user.id,
        latitude: validation.value.latitude,
        longitude: validation.value.longitude,
        message: validation.value.message,
        status: "pending",
      })
      .select(alertFields)
      .single();

    if (error) {
      console.error("Emergency alert create failed:", error.message);
      return NextResponse.json({ error: "Unable to create emergency alert." }, { status: 500 });
    }

    return NextResponse.json({ alert: data }, { status: 201 });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to create emergency alert." }, { status: 500 });
  }
}
