import { validateCoordinates } from "./locationShares";
import { isRecord, isRecordId, isRecordTimestamp } from "./recordChecks";

export const ALERT_FIELDS =
  "id, latitude, longitude, message, status, created_at, resolved_at";
export const ALERT_HISTORY_LIMIT = 10;

export type EmergencyAlert = {
  id: string;
  latitude: number;
  longitude: number;
  message: string | null;
  status: "pending" | "processing" | "sent" | "failed" | "resolved";
  created_at: string;
  resolved_at: string | null;
};

export type EmergencyAlertInput = {
  latitude?: unknown;
  longitude?: unknown;
  message?: unknown;
};

type ValidationResult =
  | {
      valid: true;
      value: { latitude: number; longitude: number; message: string | null };
    }
  | { valid: false; error: string };

export function validateEmergencyAlertInput(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return { valid: false, error: "Emergency alert details are required." };
  }

  const data = input as EmergencyAlertInput;
  const hasLatitude = data.latitude !== undefined && data.latitude !== null;
  const hasLongitude = data.longitude !== undefined && data.longitude !== null;

  if (!hasLatitude || !hasLongitude) {
    return {
      valid: false,
      error: "A current location is required to create an alert.",
    };
  }

  const coordinates = validateCoordinates(data);
  if (!coordinates.valid) return coordinates;
  const { latitude, longitude } = coordinates;

  if (
    data.message !== undefined &&
    data.message !== null &&
    typeof data.message !== "string"
  ) {
    return { valid: false, error: "Message must be text." };
  }

  const message = typeof data.message === "string" ? data.message.trim() : "";
  if (message.length > 500) {
    return { valid: false, error: "Message must be 500 characters or fewer." };
  }

  return {
    valid: true,
    value: { latitude, longitude, message: message || null },
  };
}

export function readEmergencyAlert(
  value: unknown,
  expected?: {
    id?: string;
    created?: { latitude: number; longitude: number; message: string | null };
  },
): EmergencyAlert {
  const invalid = () =>
    new Error(
      "The server returned invalid SOS record details. Refresh to check saved records.",
    );
  if (!isRecord(value) || !isRecord(value.alert)) throw invalid();
  const row = value.alert;
  const coordinates = validateCoordinates(row);
  if (
    !coordinates.valid ||
    !isRecordId(row.id) ||
    !isRecordTimestamp(row.created_at) ||
    typeof row.status !== "string" ||
    !["pending", "processing", "sent", "failed", "resolved"].includes(
      row.status,
    ) ||
    // The existing database permits 1,000-character legacy notes; new API input stays at 500.
    !(
      row.message === null ||
      (typeof row.message === "string" && row.message.length <= 1000)
    ) ||
    !(
      row.resolved_at === null ||
      (row.status === "resolved" && isRecordTimestamp(row.resolved_at))
    )
  )
    throw invalid();
  if (expected?.id !== undefined && row.id !== expected.id) throw invalid();
  if (
    expected?.created &&
    (row.status !== "pending" ||
      row.resolved_at !== null ||
      row.latitude !== expected.created.latitude ||
      row.longitude !== expected.created.longitude ||
      row.message !== expected.created.message)
  )
    throw invalid();
  return {
    id: row.id,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    message: row.message as string | null,
    status: row.status as EmergencyAlert["status"],
    created_at: row.created_at,
    resolved_at: row.resolved_at as string | null,
  };
}

export function readEmergencyAlerts(value: unknown): EmergencyAlert[] {
  if (
    !isRecord(value) ||
    !Array.isArray(value.alerts) ||
    value.alerts.length > ALERT_HISTORY_LIMIT
  ) {
    throw new Error("The server returned an invalid SOS history.");
  }
  const alerts = value.alerts.map((alert) => readEmergencyAlert({ alert }));
  if (new Set(alerts.map((alert) => alert.id)).size !== alerts.length) {
    throw new Error("The server returned duplicate SOS records.");
  }
  return alerts;
}
