export type LocationShare = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  sharing: boolean;
  updated_at: string;
};

type CoordinateValidation =
  | { valid: true; latitude: number; longitude: number }
  | { valid: false; error: string };

export function validateCoordinates(input: unknown): CoordinateValidation {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, error: "Location coordinates are required." };
  }

  const data = input as Record<string, unknown>;
  const hasLatitude = data.latitude !== undefined && data.latitude !== null;
  const hasLongitude = data.longitude !== undefined && data.longitude !== null;

  if (!hasLatitude || !hasLongitude) {
    return {
      valid: false,
      error: "Latitude and longitude must be supplied together.",
    };
  }

  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    return { valid: false, error: "Latitude and longitude must be numbers." };
  }

  if (
    !Number.isFinite(data.latitude) ||
    data.latitude < -90 ||
    data.latitude > 90
  ) {
    return { valid: false, error: "Latitude must be between -90 and 90." };
  }

  if (
    !Number.isFinite(data.longitude) ||
    data.longitude < -180 ||
    data.longitude > 180
  ) {
    return { valid: false, error: "Longitude must be between -180 and 180." };
  }

  return { valid: true, latitude: data.latitude, longitude: data.longitude };
}

export type LocationShareUpdate = {
  latitude?: number;
  longitude?: number;
  sharing?: boolean;
};

export function validateLocationShareUpdate(
  body: unknown,
):
  | { valid: true; updates: LocationShareUpdate }
  | { valid: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Request body must be valid JSON." };
  }

  const input = body as Record<string, unknown>;
  const hasLatitude = input.latitude !== undefined && input.latitude !== null;
  const hasLongitude =
    input.longitude !== undefined && input.longitude !== null;
  const hasCoordinates = hasLatitude || hasLongitude;
  const hasSharing = input.sharing !== undefined;

  if (hasSharing && typeof input.sharing !== "boolean") {
    return { valid: false, error: "Sharing must be a boolean." };
  }

  if (!hasSharing && !hasCoordinates) {
    return {
      valid: false,
      error: "Provide sharing or a current location to update.",
    };
  }

  if (hasCoordinates && (!hasLatitude || !hasLongitude)) {
    return {
      valid: false,
      error: "Latitude and longitude must be supplied together.",
    };
  }

  if (input.sharing === true && !hasCoordinates) {
    return {
      valid: false,
      error: "A current location is required when enabling sharing.",
    };
  }

  const coordinates = hasCoordinates ? validateCoordinates(input) : null;
  if (coordinates && !coordinates.valid) {
    return { valid: false, error: coordinates.error };
  }

  const updates: LocationShareUpdate = {};
  if (coordinates?.valid) {
    updates.latitude = coordinates.latitude;
    updates.longitude = coordinates.longitude;
  }
  if (hasSharing) {
    updates.sharing = input.sharing as boolean;
  }

  return { valid: true, updates };
}

export const LOCATION_FIELDS = "id, latitude, longitude, sharing, updated_at";

export function readLocationShare(
  value: unknown,
  expected?: { id?: string; sharing?: boolean },
): LocationShare | null {
  const invalid = () =>
    new Error(
      "The server returned invalid location-sharing state. Refresh to check the saved state.",
    );
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("locationShare" in value)
  )
    throw invalid();
  const row = (value as { locationShare: unknown }).locationShare;
  if (row === null && !expected) return null;
  if (!row || typeof row !== "object" || Array.isArray(row)) throw invalid();
  const data = row as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      data.id,
    ) ||
    typeof data.sharing !== "boolean" ||
    typeof data.updated_at !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T/.test(data.updated_at) ||
    !Number.isFinite(Date.parse(data.updated_at))
  )
    throw invalid();
  if (
    !(data.latitude === null && data.longitude === null) &&
    !validateCoordinates(data).valid
  )
    throw invalid();
  if (data.sharing && (data.latitude === null || data.longitude === null))
    throw invalid();
  if (
    (expected?.id && expected.id !== data.id) ||
    (expected?.sharing !== undefined && expected.sharing !== data.sharing)
  )
    throw invalid();
  return {
    id: data.id,
    latitude: data.latitude as number | null,
    longitude: data.longitude as number | null,
    sharing: data.sharing,
    updated_at: data.updated_at,
  };
}
