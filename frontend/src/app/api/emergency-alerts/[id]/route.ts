import { NextResponse } from "next/server";
import {
  ALERT_FIELDS,
  readEmergencyAlert,
} from "@/lib/services/emergencyAlerts";
import { isRecordId } from "@/lib/services/recordChecks";
import { withAuth } from "@/lib/services/apiHandler";

export const GET = withAuth(async ({ user, supabase, params }) => {
  const id = params.id;
  if (!isRecordId(id))
    return NextResponse.json({ error: "Invalid alert ID." }, { status: 400 });
  const { data, error } = await supabase
    .from("emergency_alerts")
    .select(ALERT_FIELDS)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Emergency alert lookup failed.");
  if (!data)
    return NextResponse.json(
      { error: "SOS record not found." },
      { status: 404 },
    );
  return NextResponse.json(
    { alert: readEmergencyAlert({ alert: data }, { id }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}, "Unable to load SOS record.");
