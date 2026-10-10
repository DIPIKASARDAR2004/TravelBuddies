import { afterEach, expect, it, vi } from "vitest";
import {
  readSafeStayList,
  readSafeStayResponse,
  validateSafeStayInput,
} from "@/lib/services/safeStays";
import { toInputDateTime, toIsoDateTime } from "@/components/safety/stayDates";

const stay = {
  id: "12345678-1234-4234-8234-123456789abc",
  stay_name: "Test stay",
  address: null,
  check_in: "2026-10-12T09:00:00.000Z",
  check_out: "2026-10-14T09:00:00.000Z",
  status: "active",
  created_at: "2026-10-10T00:00:00.123456+00:00",
  updated_at: "2026-10-10T00:00:00+00:00",
};

afterEach(() => vi.unstubAllEnvs());

it("edits local time without shifting the saved instant or losing seconds", () => {
  vi.stubEnv("TZ", "Asia/Kolkata");
  const original = "2026-10-12T09:00:34.123Z";
  expect(toInputDateTime(original)).toBe("2026-10-12T14:30");
  expect(toIsoDateTime("2026-10-12T14:30", original)).toBe(original);
  expect(toIsoDateTime("2026-10-12T15:00", original)).toBe(
    "2026-10-12T09:30:00.000Z",
  );
});

it("rejects rollover and DST gap times while preserving an unchanged repeated hour", () => {
  vi.stubEnv("TZ", "America/New_York");
  for (const value of [
    "",
    "invalid",
    "2026-02-30T12:00",
    "2026-03-08T02:30",
    "2026-10-12T24:00",
  ]) {
    expect(() => toIsoDateTime(value)).toThrow("valid local");
  }
  const repeatedHour = "2026-11-01T06:30:00.000Z";
  expect(toInputDateTime(repeatedHour)).toBe("2026-11-01T01:30");
  expect(toIsoDateTime("2026-11-01T01:30", repeatedHour)).toBe(repeatedHour);
});

it("normalizes inputs, ignores ownership fields, and preserves equal-time policy", () => {
  const result = validateSafeStayInput({
    ...stay,
    stay_name: "  Test stay  ",
    address: " ",
    check_out: stay.check_in,
    user_id: "attacker",
  });
  expect(result).toEqual({
    valid: true,
    value: {
      stay_name: "Test stay",
      address: null,
      check_in: stay.check_in,
      check_out: stay.check_in,
      status: "active",
    },
  });
});

it("rejects malformed fields and reversed or rolled-over dates", () => {
  for (const input of [
    null,
    [],
    {},
    { ...stay, address: 123 },
    { ...stay, stay_name: " " },
    { ...stay, status: "unknown" },
    { ...stay, check_in: "2026-02-30T09:00:00.000Z" },
    { ...stay, check_out: "2026-10-11T09:00:00.000Z" },
  ]) {
    expect(validateSafeStayInput(input).valid).toBe(false);
  }
});

it("validates list and mutation responses including Postgres timestamp formats", () => {
  expect(readSafeStayList({ stays: [stay] })).toEqual([stay]);
  expect(readSafeStayResponse({ stay }, stay.id)).toEqual(stay);
  for (const body of [
    null,
    {},
    { stays: null },
    { stays: [stay, stay] },
    { stays: [{ ...stay, check_in: "2026-02-30T09:00:00+00:00" }] },
    { stays: [{ ...stay, id: "../private" }] },
    { stays: [{ ...stay, status: "invalid" }] },
  ]) {
    expect(() => readSafeStayList(body)).toThrow();
  }
  expect(() => readSafeStayResponse({ stay }, "different-id")).toThrow(
    "different Safe Stay",
  );
});
