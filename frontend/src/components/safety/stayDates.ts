/** datetime-local fields use the browser's timezone, not UTC. */
export function toInputDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    throw new Error("Invalid saved stay date.");
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${String(date.getFullYear()).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toIsoDateTime(value: string, original?: string): string {
  // Preserve seconds and the original offset during an unchanged edit, including
  // the repeated hour when clocks go back at the end of daylight saving time.
  if (original && value === toInputDateTime(original)) {
    return new Date(original).toISOString();
  }
  const date = new Date(value);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    toInputDateTime(date.toISOString()) !== value
  ) {
    throw new Error("Choose a valid local check-in and check-out time.");
  }
  return date.toISOString();
}
