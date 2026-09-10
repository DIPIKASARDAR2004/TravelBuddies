export const formatINR = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

export function formatTime(minutesFromMidnight: number): string {
  if (minutesFromMidnight == null) return '--:--';
  const m = Math.round(minutesFromMidnight);
  const hours24 = Math.floor(m / 60) % 24;
  const mins = m % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

export function formatDuration(minutes: number): string {
  if (!minutes) return '0 min';
  const m = Math.round(minutes);
  const hrs = Math.floor(m / 60);
  const mins = m % 60;
  if (hrs > 0) return `${hrs} hr ${mins} min`;
  return `${mins} min`;
}
