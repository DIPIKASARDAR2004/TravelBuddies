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
  | { valid: true; value: { title: string; destination: string; start_date: string; end_date: string; sharing: boolean } }
  | { valid: false; error: string };

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateTripInput(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Trip details are required." };
  }

  const data = input as TripInput;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const destination = typeof data.destination === "string" ? data.destination.trim() : "";
  const startDate = data.start_date;
  const endDate = data.end_date;
  const sharing = data.sharing === undefined ? false : data.sharing;

  if (title.length < 1 || title.length > 120) {
    return { valid: false, error: "Trip title must be between 1 and 120 characters." };
  }
  if (destination.length < 1 || destination.length > 160) {
    return { valid: false, error: "Destination must be between 1 and 160 characters." };
  }
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
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
    value: { title, destination, start_date: startDate, end_date: endDate, sharing },
  };
}
