export class PlannerError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = "INVALID_REQUEST",
  ) {
    super(message);
  }
}

export interface PlanRequest {
  destination: string;
  totalBudget: number;
  travellers: number;
  days: number;
  womenOnly: boolean;
}

/** Accept legacy decimal strings, but never coerce booleans, arrays or blanks. */
function requestNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim()))
    return Number(value);
  return NaN;
}

export function readPlanRequest(value: unknown): PlanRequest {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new PlannerError("Trip details are required.");
  const input = value as Record<string, unknown>;
  const destination =
    typeof input.destination === "string" ? input.destination.trim() : "";
  if (!destination || destination.length > 200)
    throw new PlannerError("Destination must be between 1 and 200 characters.");
  const totalBudget = requestNumber(input.totalBudget);
  const travellers = requestNumber(input.travellers);
  const days = requestNumber(input.days);
  if (
    !Number.isFinite(totalBudget) ||
    totalBudget <= 0 ||
    totalBudget > Number.MAX_SAFE_INTEGER / 100
  )
    throw new PlannerError("Enter a positive, finite total budget.");
  if (!Number.isSafeInteger(travellers) || travellers < 1 || travellers > 100)
    throw new PlannerError("Choose 1–100 whole travellers.");
  if (!Number.isSafeInteger(days) || days < 1 || days > 365)
    throw new PlannerError("Choose a stay of 1–365 whole days.");
  if (input.womenOnly !== undefined && typeof input.womenOnly !== "boolean")
    throw new PlannerError("The safety filter must be a boolean.");
  return {
    destination,
    totalBudget,
    travellers,
    days,
    womenOnly: input.womenOnly === true,
  };
}
