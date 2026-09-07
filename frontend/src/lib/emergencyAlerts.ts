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
  | { valid: true; value: { latitude: number; longitude: number; message: string | null } }
  | { valid: false; error: string };

export function validateEmergencyAlertInput(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Emergency alert details are required." };
  }

  const data = input as EmergencyAlertInput;
  const hasLatitude = data.latitude !== undefined && data.latitude !== null;
  const hasLongitude = data.longitude !== undefined && data.longitude !== null;

  if (!hasLatitude || !hasLongitude) {
    return { valid: false, error: "A current location is required to create an alert." };
  }

  const latitude = typeof data.latitude === "number" ? data.latitude : Number(data.latitude);
  const longitude = typeof data.longitude === "number" ? data.longitude : Number(data.longitude);

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90." };
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180." };
  }

  if (data.message !== undefined && data.message !== null && typeof data.message !== "string") {
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
