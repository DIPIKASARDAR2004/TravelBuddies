import { beforeEach, expect, it, vi } from "vitest";
import {
  CONTACT_FIELDS,
  readTrustedContact,
  readTrustedContacts,
  validateTrustedContactInput,
} from "@/lib/services/trustedContacts";
import {
  ALERT_FIELDS,
  readEmergencyAlert,
  readEmergencyAlerts,
  validateEmergencyAlertInput,
} from "@/lib/services/emergencyAlerts";
import { isRecordId, isRecordTimestamp } from "@/lib/services/recordChecks";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabaseServer", () => ({
  requireUser: mocks.requireUser,
  createSupabaseServerClient: mocks.createClient,
  UnauthenticatedError: class extends Error {
    statusCode = 401;
  },
}));
import { UnauthenticatedError } from "@/lib/supabaseServer";
import {
  GET as contactsGET,
  POST as contactsPOST,
} from "@/app/api/trusted-contacts/route";
import {
  PATCH as contactPATCH,
  DELETE as contactDELETE,
} from "@/app/api/trusted-contacts/[id]/route";
import {
  GET as alertsGET,
  POST as alertsPOST,
} from "@/app/api/emergency-alerts/route";
import { GET as alertGET } from "@/app/api/emergency-alerts/[id]/route";

const id = "12345678-1234-4234-8234-123456789abc";
const otherId = "12345678-1234-4234-8234-123456789abd";
const timestamp = "2026-10-10T10:00:00.123456+00:00";
const details = {
  name: "Fixture friend",
  phone: "+91 1234567890",
  email: null,
  relationship: "Friend",
};
const contact = {
  id,
  ...details,
  is_active: true,
  created_at: timestamp,
  updated_at: timestamp,
};
const created = { latitude: 0, longitude: 0, message: "Fixture note" };
const alert = {
  id,
  ...created,
  status: "pending",
  created_at: timestamp,
  resolved_at: null,
};
const context = (recordId = id) => ({
  params: Promise.resolve({ id: recordId }),
});
const request = (method = "GET", body?: unknown) =>
  new Request("http://test/api", {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

function database(data: unknown, error: unknown = null) {
  const result = { data, error };
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  const from = vi.fn().mockReturnValue(query);
  mocks.createClient.mockResolvedValue({ from });
  return { query, from };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "authenticated-owner" });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

it("validates and normalizes contact input without silently discarding wrong field types", () => {
  expect(
    validateTrustedContactInput({
      name: "  Fixture friend ",
      email: " FRIEND@EXAMPLE.COM ",
      phone: " ",
      relationship: null,
      user_id: "spoofed",
    }),
  ).toEqual({
    valid: true,
    value: {
      name: "Fixture friend",
      email: "friend@example.com",
      phone: null,
      relationship: null,
    },
  });
  for (const value of [
    null,
    [],
    {},
    { ...details, name: " " },
    { ...details, name: "x".repeat(121) },
    { ...details, phone: null },
    { ...details, phone: "123" },
    { ...details, phone: 12345678 },
    { ...details, email: false },
    { ...details, relationship: [] },
    { ...details, email: "bad@address" },
    { ...details, relationship: "x".repeat(81) },
  ])
    expect(validateTrustedContactInput(value).valid).toBe(false);
});

it("rejects coerced SOS coordinates and oversized new notes but accepts real zeroes", () => {
  expect(
    validateEmergencyAlertInput({
      ...created,
      message: "  Fixture note  ",
      status: "sent",
      user_id: "spoofed",
    }),
  ).toEqual({ valid: true, value: created });
  for (const value of [
    null,
    [],
    {},
    { latitude: 0 },
    ...["", "0", false, null, [], NaN, Infinity, 91].map((latitude) => ({
      ...created,
      latitude,
    })),
    { ...created, longitude: -181 },
    { ...created, message: false },
    { ...created, message: "x".repeat(501) },
  ])
    expect(validateEmergencyAlertInput(value).valid).toBe(false);
  expect(
    validateEmergencyAlertInput({
      latitude: 90,
      longitude: -180,
      message: " ",
    }),
  ).toEqual({
    valid: true,
    value: { latitude: 90, longitude: -180, message: null },
  });
});

it("checks saved UUIDs and actual timezone-qualified calendar timestamps", () => {
  expect(isRecordId(id)).toBe(true);
  expect(isRecordId("not-an-id")).toBe(false);
  for (const value of [
    timestamp,
    "2024-02-29T23:59:59Z",
    "2026-10-10T10:00:00+05:30",
  ])
    expect(isRecordTimestamp(value)).toBe(true);
  for (const value of [
    null,
    "bad",
    "2025-02-29T10:00:00Z",
    "2026-02-30T10:00:00Z",
    "2026-10-10T24:00:00Z",
    "2026-10-10T10:00:00",
    "2026-10-10",
  ])
    expect(isRecordTimestamp(value)).toBe(false);
});

it("checks contact records and expected mutation identity, active flag and details", () => {
  expect(
    readTrustedContact(
      { contact: { ...contact, user_id: "private", extra: "hidden" } },
      { id, active: true, details },
    ),
  ).toEqual(contact);
  expect(readTrustedContacts({ contacts: [] })).toEqual([]);
  for (const row of [
    null,
    {},
    { ...contact, id: "bad" },
    { ...contact, phone: undefined },
    { ...contact, is_active: "true" },
    { ...contact, created_at: "bad" },
    { ...contact, updated_at: null },
  ])
    expect(() => readTrustedContact({ contact: row })).toThrow();
  expect(() => readTrustedContact({ contact }, { id: otherId })).toThrow();
  expect(() => readTrustedContact({ contact }, { active: false })).toThrow();
  expect(() =>
    readTrustedContact({ contact }, { details: { ...details, name: "Other" } }),
  ).toThrow();
  for (const value of [
    {},
    { contacts: null },
    { contacts: [contact, contact] },
    { contacts: [{ ...contact, is_active: false }] },
  ])
    expect(() => readTrustedContacts(value)).toThrow();
});

it("checks SOS history limits, status/timestamps, requested values and whitelisted fields", () => {
  expect(
    readEmergencyAlert(
      { alert: { ...alert, user_id: "private" } },
      { id, created },
    ),
  ).toEqual(alert);
  expect(readEmergencyAlerts({ alerts: [] })).toEqual([]);
  expect(
    readEmergencyAlert({ alert: { ...alert, message: "x".repeat(1000) } })
      .message,
  ).toHaveLength(1000);
  expect(
    readEmergencyAlert({
      alert: { ...alert, status: "resolved", resolved_at: timestamp },
    }).status,
  ).toBe("resolved");
  for (const row of [
    null,
    {},
    { ...alert, id: "bad" },
    { ...alert, latitude: false },
    { ...alert, message: "x".repeat(1001) },
    { ...alert, status: "dispatched" },
    { ...alert, created_at: "bad" },
    { ...alert, resolved_at: timestamp },
    { ...alert, resolved_at: undefined },
  ])
    expect(() => readEmergencyAlert({ alert: row })).toThrow();
  expect(() => readEmergencyAlert({ alert }, { id: otherId })).toThrow();
  expect(() =>
    readEmergencyAlert(
      { alert },
      { created: { ...created, message: "Other" } },
    ),
  ).toThrow();
  expect(() =>
    readEmergencyAlert({ alert: { ...alert, status: "sent" } }, { created }),
  ).toThrow();
  for (const value of [
    {},
    { alerts: null },
    { alerts: [alert, alert] },
    { alerts: Array(11).fill(alert) },
  ])
    expect(() => readEmergencyAlerts(value)).toThrow();
});

it("requires authentication on every contact/SOS endpoint before database access", async () => {
  mocks.requireUser.mockRejectedValue(new UnauthenticatedError());
  for (const handler of [
    contactsGET,
    contactsPOST,
    contactPATCH,
    contactDELETE,
    alertsGET,
    alertsPOST,
    alertGET,
  ]) {
    expect((await handler(request(), context())).status).toBe(401);
  }
  expect(mocks.createClient).not.toHaveBeenCalled();
});

it("reads only active owner contacts, whitelists data and disables response caching", async () => {
  const { query, from } = database([{ ...contact, private: true }]);
  const response = await contactsGET(request(), context());
  expect(from).toHaveBeenCalledWith("trusted_contacts");
  expect(query.select).toHaveBeenCalledWith(CONTACT_FIELDS);
  expect(query.eq.mock.calls).toEqual([
    ["user_id", "authenticated-owner"],
    ["is_active", true],
  ]);
  expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ contacts: [contact] });
});

it("takes contact ownership from authentication, not request fields", async () => {
  const { query } = database(contact);
  const response = await contactsPOST(
    request("POST", {
      ...details,
      user_id: "spoofed",
      is_active: false,
      id: otherId,
    }),
    context(),
  );
  expect(response.status).toBe(201);
  expect(query.insert).toHaveBeenCalledWith({
    ...details,
    user_id: "authenticated-owner",
  });
  expect(await response.json()).toEqual({ contact });
});

it("scopes contact edits by owner, ID and active state; soft removal confirms the requested record", async () => {
  const edit = database(contact);
  expect(
    (await contactPATCH(request("PATCH", details), context())).status,
  ).toBe(200);
  expect(edit.query.eq.mock.calls).toEqual([
    ["id", id],
    ["user_id", "authenticated-owner"],
    ["is_active", true],
  ]);
  expect(edit.query.update).toHaveBeenCalledWith(details);
  const remove = database({ ...contact, is_active: false });
  const response = await contactDELETE(request("DELETE"), context());
  expect(response.status).toBe(200);
  expect(remove.query.update).toHaveBeenCalledWith({ is_active: false });
  expect(remove.query.eq.mock.calls).toEqual([
    ["id", id],
    ["user_id", "authenticated-owner"],
  ]);
  expect(await response.json()).toEqual({
    contact: { ...contact, is_active: false },
  });
});

it("rejects invalid IDs/bodies before issuing queries", async () => {
  const { from } = database(null);
  for (const handler of [contactPATCH, contactDELETE, alertGET])
    expect((await handler(request(), context("bad"))).status).toBe(400);
  for (const handler of [contactsPOST, alertsPOST, contactPATCH]) {
    expect(
      (
        await handler(
          new Request("http://test/api", { method: "POST", body: "{" }),
          context(),
        )
      ).status,
    ).toBe(400);
  }
  expect(
    (await contactsPOST(request("POST", { ...details, email: {} }), context()))
      .status,
  ).toBe(400);
  expect(
    (
      await alertsPOST(
        request("POST", { ...created, latitude: "0" }),
        context(),
      )
    ).status,
  ).toBe(400);
  expect(from).not.toHaveBeenCalled();
});

it("returns not found for absent or non-owned individual records", async () => {
  database(null);
  expect(
    (await contactPATCH(request("PATCH", details), context())).status,
  ).toBe(404);
  expect((await contactDELETE(request("DELETE"), context())).status).toBe(404);
  expect((await alertGET(request(), context())).status).toBe(404);
});

it("rejects malformed/contradictory contact results instead of reporting success", async () => {
  for (const bad of [
    null,
    {},
    [contact, contact],
    [{ ...contact, is_active: false }],
  ]) {
    database(bad);
    expect((await contactsGET(request(), context())).status).toBe(500);
  }
  database({ ...contact, id: otherId });
  expect(
    (await contactPATCH(request("PATCH", details), context())).status,
  ).toBe(500);
  database(contact);
  expect((await contactDELETE(request("DELETE"), context())).status).toBe(500);
  database({ ...contact, name: "Not the saved name" });
  expect((await contactsPOST(request("POST", details), context())).status).toBe(
    500,
  );
});

it("lists the latest ten owner SOS records and scopes individual lookups", async () => {
  const list = database([alert]);
  const response = await alertsGET(request(), context());
  expect(list.from).toHaveBeenCalledWith("emergency_alerts");
  expect(list.query.select).toHaveBeenCalledWith(ALERT_FIELDS);
  expect(list.query.eq).toHaveBeenCalledWith("user_id", "authenticated-owner");
  expect(list.query.limit).toHaveBeenCalledWith(10);
  expect(list.query.order).toHaveBeenCalledWith("created_at", {
    ascending: false,
  });
  expect(await response.json()).toEqual({ alerts: [alert] });
  const lookup = database(alert);
  expect((await alertGET(request(), context())).status).toBe(200);
  expect(lookup.query.eq.mock.calls).toEqual([
    ["id", id],
    ["user_id", "authenticated-owner"],
  ]);
});

it("creates only a pending owner SOS record and ignores spoofed status/identity", async () => {
  const { query } = database(alert);
  const response = await alertsPOST(
    request("POST", {
      ...created,
      user_id: "spoofed",
      status: "sent",
      resolved_at: timestamp,
    }),
    context(),
  );
  expect(response.status).toBe(201);
  expect(query.insert).toHaveBeenCalledWith({
    ...created,
    user_id: "authenticated-owner",
    status: "pending",
  });
  expect(await response.json()).toEqual({ alert });
});

it("fails safely on bad SOS data and contradictory create/lookup results", async () => {
  database(null);
  expect((await alertsGET(request(), context())).status).toBe(500);
  database({ ...alert, id: otherId });
  expect((await alertGET(request(), context())).status).toBe(500);
  for (const bad of [
    null,
    {},
    { ...alert, status: "sent" },
    { ...alert, latitude: 1 },
    { ...alert, message: "Other" },
  ]) {
    database(bad);
    expect((await alertsPOST(request("POST", created), context())).status).toBe(
      500,
    );
  }
});

it("redacts database failures on every endpoint", async () => {
  database(null, { message: "private database contents" });
  for (const [handler, input] of [
    [contactsGET, request()],
    [contactsPOST, request("POST", details)],
    [contactPATCH, request("PATCH", details)],
    [contactDELETE, request("DELETE")],
    [alertsGET, request()],
    [alertsPOST, request("POST", created)],
    [alertGET, request()],
  ] as const) {
    const response = await handler(input, context());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private database contents");
  }
});
