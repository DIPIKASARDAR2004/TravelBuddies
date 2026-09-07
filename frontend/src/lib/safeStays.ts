export type SafeStayStatus = "active" | "completed";

export type SafeStay = {
  id: string;
  stay_name: string;
  address: string | null;
  check_in: string;
  check_out: string;
  status: SafeStayStatus;
  created_at: string;
  updated_at: string;
};

type ValidationResult =
  | { valid: true; value: { stay_name: string; address: string | null; check_in: string; check_out: string; status: SafeStayStatus } }
  | { valid: false; error: string };

const isoDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})Z$/;

function parseStrictIsoDateTime(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(isoDateTimePattern);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() + 1 !== Number(month)
    || date.getUTCDate() !== Number(day)
    || date.getUTCHours() !== Number(hour)
    || date.getUTCMinutes() !== Number(minute)
    || date.getUTCSeconds() !== Number(second)
  ) return null;

  return date;
}

export function validateSafeStayInput(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Safe Stay details are required." };
  }

  const data = input as Record<string, unknown>;
  const stayName = typeof data.stay_name === "string" ? data.stay_name.trim() : "";
  const address = typeof data.address === "string" ? data.address.trim() : "";
  const checkIn = parseStrictIsoDateTime(data.check_in);
  const checkOut = parseStrictIsoDateTime(data.check_out);
  const status = data.status === undefined ? "active" : data.status;

  if (stayName.length < 1 || stayName.length > 160) {
    return { valid: false, error: "Stay name must be between 1 and 160 characters." };
  }
  if (address.length > 300) {
    return { valid: false, error: "Address must be 300 characters or fewer." };
  }
  if (!checkIn || !checkOut) {
    return { valid: false, error: "Check-in and check-out must be valid date/time values." };
  }
  if (checkOut < checkIn) {
    return { valid: false, error: "Check-out cannot be earlier than check-in." };
  }
  if (status !== "active" && status !== "completed") {
    return { valid: false, error: "Status must be active or completed." };
  }

  return {
    valid: true,
    value: {
      stay_name: stayName,
      address: address || null,
      check_in: checkIn.toISOString(),
      check_out: checkOut.toISOString(),
      status,
    },
  };
}
