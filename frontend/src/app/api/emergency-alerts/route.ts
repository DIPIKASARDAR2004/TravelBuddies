import { NextResponse } from "next/server";
import {
  ALERT_FIELDS,
  ALERT_HISTORY_LIMIT,
  readEmergencyAlert,
  readEmergencyAlerts,
  validateEmergencyAlertInput,
} from "@/lib/services/emergencyAlerts";
import { withAuth, parseJson } from "@/lib/services/apiHandler";

export const GET = withAuth(async ({ user, supabase }) => {
  const { data, error } = await supabase
    .from("emergency_alerts")
    .select(ALERT_FIELDS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(ALERT_HISTORY_LIMIT);
  if (error) throw new Error("Emergency alert query failed.");
  return NextResponse.json(
    { alerts: readEmergencyAlerts({ alerts: data }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}, "Unable to load SOS records.");

export const POST = withAuth(async ({ user, supabase, request }) => {
  const validation = validateEmergencyAlertInput(await parseJson(request));
  if (!validation.valid)
    return NextResponse.json({ error: validation.error }, { status: 400 });
  const { data, error } = await supabase
    .from("emergency_alerts")
    .insert({ user_id: user.id, ...validation.value, status: "pending" })
    .select(ALERT_FIELDS)
    .single();
  if (error) throw new Error("Emergency alert insert failed.");
  const alert = readEmergencyAlert(
    { alert: data },
    { created: validation.value },
  );
  return NextResponse.json(
    { alert },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}, "Unable to create SOS record.");
