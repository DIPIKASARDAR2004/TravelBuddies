import { beforeEach, expect, it, vi } from "vitest";
import {
  validateCoordinates,
  validateLocationShareUpdate,
  readLocationShare,
} from "@/lib/services/locationShares";
const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabaseServer", () => ({
  requireUser: mocks.requireUser,
  createSupabaseServerClient: mocks.createClient,
  UnauthenticatedError: class extends Error {
    statusCode = 401;
    constructor() {
      super("Authentication required");
    }
  },
}));
import { UnauthenticatedError } from "@/lib/supabaseServer";
import { withAuth, parseJson } from "@/lib/services/apiHandler";
import { PATCH, POST, GET } from "@/app/api/location-sharing/route";
const id = "12345678-1234-4234-8234-123456789abc";
const row = {
  id,
  latitude: 0,
  longitude: 0,
  sharing: false,
  updated_at: "2026-10-10T10:00:00Z",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "owner" });
});
it("checks finite paired coordinates and opt-in semantics", () => {
  for (const value of [
    null,
    {},
    { latitude: 0 },
    { latitude: NaN, longitude: 1 },
    { latitude: 91, longitude: 0 },
    { latitude: 1, longitude: -181 },
  ])
    expect(validateCoordinates(value).valid).toBe(false);
  expect(validateCoordinates({ latitude: 0, longitude: 0 })).toEqual({
    valid: true,
    latitude: 0,
    longitude: 0,
  });
  expect(validateLocationShareUpdate({ sharing: true }).valid).toBe(false);
  expect(validateLocationShareUpdate({ sharing: "false" }).valid).toBe(false);
  expect(validateLocationShareUpdate({ sharing: false })).toEqual({
    valid: true,
    updates: { sharing: false },
  });
  expect(
    validateLocationShareUpdate({
      sharing: true,
      latitude: 1,
      longitude: 2,
      user_id: "attacker",
    }),
  ).toEqual({
    valid: true,
    updates: { sharing: true, latitude: 1, longitude: 2 },
  });
});
it("rejects unauthenticated requests before database access", async () => {
  mocks.requireUser.mockRejectedValue(new UnauthenticatedError());
  const handler = vi.fn();
  const response = await withAuth(handler)(new Request("http://test/api"), {
    params: Promise.resolve({}),
  });
  expect(response.status).toBe(401);
  expect(handler).not.toHaveBeenCalled();
  expect(mocks.createClient).not.toHaveBeenCalled();
});
it("uses a public fallback for unexpected errors and resolves route params", async () => {
  mocks.createClient.mockResolvedValue({});
  vi.spyOn(console, "error").mockImplementation(() => {});
  const handler = vi
    .fn()
    .mockRejectedValue(new Error("private database credentials"));
  const response = await withAuth(handler, "Unable to save.")(
    new Request("http://test/api"),
    { params: Promise.resolve({}) },
  );
  expect(await response.json()).toEqual({ error: "Unable to save." });
  expect(handler.mock.calls[0][0].params).toEqual({});
  expect(
    await parseJson(
      new Request("http://test/api", { method: "POST", body: "{" }),
    ),
  ).toBeNull();
});
it("limits both location lookup and mutation to the authenticated owner", async () => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.maybeSingle
    .mockResolvedValueOnce({ data: { id }, error: null })
    .mockResolvedValueOnce({
      data: row,
      error: null,
    });
  mocks.createClient.mockResolvedValue({
    from: vi.fn().mockReturnValue(query),
  });
  const response = await PATCH(
    new Request("http://test/api", {
      method: "PATCH",
      body: JSON.stringify({ sharing: false, user_id: "another-user" }),
    }),
    { params: Promise.resolve({}) },
  );
  expect(response.status).toBe(200);
  expect(query.eq.mock.calls.filter(([field]) => field === "user_id")).toEqual([
    ["user_id", "owner"],
    ["user_id", "owner"],
  ]);
  expect(query.update).toHaveBeenCalledWith({ sharing: false });
});

it("requires explicit creation consent and preserves sharing off with authenticated ownership", async () => {
  const query = {
    upsert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  };
  const from = vi.fn().mockReturnValue(query);
  mocks.createClient.mockResolvedValue({ from });
  const context = { params: Promise.resolve({}) };
  const request = (input: unknown) =>
    new Request("http://test/api", {
      method: "POST",
      body: JSON.stringify(input),
    });
  for (const sharing of [undefined, null, "false", 0]) {
    expect(
      (await POST(request({ latitude: 0, longitude: 0, sharing }), context))
        .status,
    ).toBe(400);
  }
  expect(from).not.toHaveBeenCalled();
  const response = await POST(
    request({ latitude: 0, longitude: 0, sharing: false, user_id: "spoofed" }),
    context,
  );
  expect(response.status).toBe(201);
  expect(query.upsert).toHaveBeenCalledWith(
    { user_id: "owner", latitude: 0, longitude: 0, sharing: false },
    { onConflict: "user_id" },
  );
  expect(await response.json()).toEqual({ locationShare: row });
});

it("checks read and mutation contracts instead of accepting malformed or contradictory saved state", () => {
  expect(readLocationShare({ locationShare: null })).toBeNull();
  expect(
    readLocationShare({ locationShare: { ...row, private: "hidden" } }),
  ).toEqual(row);
  for (const bad of [
    undefined,
    {},
    { locationShare: {} },
    { locationShare: { ...row, sharing: "false" } },
    { locationShare: { ...row, latitude: 91 } },
    { locationShare: { ...row, updated_at: "bad" } },
  ])
    expect(() => readLocationShare(bad)).toThrow(/invalid/);
  expect(() =>
    readLocationShare({ locationShare: null }, { sharing: false }),
  ).toThrow();
  expect(() =>
    readLocationShare({ locationShare: row }, { sharing: true }),
  ).toThrow();
  expect(() =>
    readLocationShare({ locationShare: row }, { id: "other" }),
  ).toThrow();
});

it("scopes location reads and fails safely when a database response is malformed", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: {}, error: null }),
  };
  mocks.createClient.mockResolvedValue({
    from: vi.fn().mockReturnValue(query),
  });
  const response = await GET(new Request("http://test/api"), {
    params: Promise.resolve({}),
  });
  expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Internal server error" });
});
