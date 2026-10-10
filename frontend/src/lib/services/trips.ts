import { isDateOnly } from "@/lib/dateOnly";

export const tripFields =
  "id, title, destination, start_date, end_date, sharing, created_at, updated_at";
export const tripIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type Trip = {
  id: string;
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  sharing: boolean;
  created_at: string;
  updated_at: string;
};

export type TripInput = {
  title?: unknown;
  destination?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  sharing?: unknown;
};

type ValidationResult =
  | {
      valid: true;
      value: {
        title: string;
        destination: string;
        start_date: string;
        end_date: string;
        sharing: boolean;
      };
    }
  | { valid: false; error: string };

export function validateTripInput(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, error: "Trip details are required." };
  }

  const data = input as TripInput;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const destination =
    typeof data.destination === "string" ? data.destination.trim() : "";
  const startDate = data.start_date;
  const endDate = data.end_date;
  const sharing = data.sharing === undefined ? false : data.sharing;

  if (title.length < 1 || title.length > 120) {
    return {
      valid: false,
      error: "Trip title must be between 1 and 120 characters.",
    };
  }
  if (destination.length < 1 || destination.length > 160) {
    return {
      valid: false,
      error: "Destination must be between 1 and 160 characters.",
    };
  }
  if (!isDateOnly(startDate) || !isDateOnly(endDate)) {
    return { valid: false, error: "Start and end dates must be valid dates." };
  }
  if (endDate < startDate) {
    return { valid: false, error: "End date cannot be before the start date." };
  }
  if (typeof sharing !== "boolean") {
    return { valid: false, error: "Sharing must be a boolean." };
  }

  return {
    valid: true,
    value: {
      title,
      destination,
      start_date: startDate,
      end_date: endDate,
      sharing,
    },
  };
}

/** Only publish the documented record shape, never owner/private database fields. */
export function readTripRecord(value: unknown, expectedId?: string): Trip {
  const invalid = () =>
    new Error("The database returned invalid trip details.");
  const validation = validateTripInput(value);
  if (!validation.valid) throw invalid();
  const data = value as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    !tripIdPattern.test(data.id) ||
    (expectedId && data.id !== expectedId) ||
    typeof data.sharing !== "boolean"
  )
    throw invalid();
  for (const key of ["created_at", "updated_at"]) {
    const timestamp = data[key];
    if (
      typeof timestamp !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
        timestamp,
      ) ||
      !isDateOnly(timestamp.slice(0, 10)) ||
      !Number.isFinite(Date.parse(timestamp))
    )
      throw invalid();
  }
  return {
    id: data.id,
    ...validation.value,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

export function readTripRecords(value: unknown): Trip[] {
  if (!Array.isArray(value))
    throw new Error("The database returned an invalid trip list.");
  const trips = value.map((trip) => readTripRecord(trip));
  if (new Set(trips.map((trip) => trip.id)).size !== trips.length)
    throw new Error("The database returned duplicate trips.");
  return trips;
}
