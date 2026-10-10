export type SafeStayStatus = "active" | "completed";

export const safeStayFields =
  "id, stay_name, address, check_in, check_out, status, created_at, updated_at";
export const safeStayIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  | {
      valid: true;
      value: {
        stay_name: string;
        address: string | null;
        check_in: string;
        check_out: string;
        status: SafeStayStatus;
      };
    }
  | { valid: false; error: string };

const isoDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})Z$/;

function parseStrictIsoDateTime(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(isoDateTimePattern);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day) ||
    date.getUTCHours() !== Number(hour) ||
    date.getUTCMinutes() !== Number(minute) ||
    date.getUTCSeconds() !== Number(second)
  )
    return null;

  return date;
}

export function validateSafeStayInput(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, error: "Safe Stay details are required." };
  }

  const data = input as Record<string, unknown>;
  const stayName =
    typeof data.stay_name === "string" ? data.stay_name.trim() : "";
  const address = typeof data.address === "string" ? data.address.trim() : "";
  const checkIn = parseStrictIsoDateTime(data.check_in);
  const checkOut = parseStrictIsoDateTime(data.check_out);
  const status = data.status === undefined ? "active" : data.status;

  if (stayName.length < 1 || stayName.length > 160) {
    return {
      valid: false,
      error: "Stay name must be between 1 and 160 characters.",
    };
  }
  if (data.address != null && typeof data.address !== "string") {
    return { valid: false, error: "Address must be text." };
  }
  if (address.length > 300) {
    return { valid: false, error: "Address must be 300 characters or fewer." };
  }
  if (!checkIn || !checkOut) {
    return {
      valid: false,
      error: "Check-in and check-out must be valid date/time values.",
    };
  }
  if (checkOut < checkIn) {
    return {
      valid: false,
      error: "Check-out cannot be earlier than check-in.",
    };
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

// Postgres returns offsets and may include microseconds; request bodies use UTC
// milliseconds. Check the wire format before normalizing it for input validation.
function isStayTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/,
  );
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, year, month, day, hour, minute, second] = match.map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth &&
    hour < 24 &&
    minute < 60 &&
    second < 60
  );
}

function readStay(value: unknown): SafeStay {
  const invalid = () =>
    new Error("The server returned invalid Safe Stay details.");
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw invalid();
  const data = value as Record<string, unknown>;
  if (
    typeof data.id !== "string" ||
    !safeStayIdPattern.test(data.id) ||
    (data.address !== null && typeof data.address !== "string") ||
    (data.status !== "active" && data.status !== "completed") ||
    !isStayTimestamp(data.check_in) ||
    !isStayTimestamp(data.check_out) ||
    !isStayTimestamp(data.created_at) ||
    !isStayTimestamp(data.updated_at)
  )
    throw invalid();
  const validation = validateSafeStayInput({
    ...data,
    check_in: new Date(data.check_in).toISOString(),
    check_out: new Date(data.check_out).toISOString(),
  });
  if (!validation.valid) throw invalid();
  return {
    id: data.id,
    ...validation.value,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export function readSafeStayResponse(
  body: unknown,
  expectedId?: string,
): SafeStay {
  const stay = readStay(
    body && typeof body === "object"
      ? (body as Record<string, unknown>).stay
      : null,
  );
  if (expectedId && stay.id !== expectedId)
    throw new Error("The server returned a different Safe Stay.");
  return stay;
}

export function readSafeStayList(body: unknown): SafeStay[] {
  const stays =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).stays
      : null;
  if (!Array.isArray(stays))
    throw new Error("The server returned an invalid Safe Stay list.");
  const parsed = stays.map(readStay);
  if (new Set(parsed.map((stay) => stay.id)).size !== parsed.length) {
    throw new Error("The server returned duplicate Safe Stay records.");
  }
  return parsed;
}
