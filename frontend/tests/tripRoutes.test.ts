import { afterEach, beforeEach, expect, it, vi } from "vitest";
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
import { GET as list, POST } from "@/app/api/trips/route";
import { GET, PATCH, DELETE } from "@/app/api/trips/[id]/route";
import { tripFields } from "@/lib/services/trips";

const id = "12345678-1234-4234-8234-123456789abc";
const payload = {
  title: "Fixture trip",
  destination: "Fixture town",
  start_date: "2026-10-12",
  end_date: "2026-10-14",
  sharing: false,
};
const trip = {
  id,
  ...payload,
  created_at: "2026-10-10T00:00:00Z",
  updated_at: "2026-10-10T00:00:00Z",
};
const context = { params: Promise.resolve({ id }) };
const request = (method = "GET", body?: unknown) =>
  new Request("http://test/api/trips", {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
function database(data: unknown = trip, error: unknown = null) {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    order: vi.fn().mockResolvedValue({ data, error }),
  };
  const from = vi.fn().mockReturnValue(query);
  mocks.createClient.mockResolvedValue({ from });
  return { query, from };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "owner" });
});
afterEach(() => vi.restoreAllMocks());

it("rejects all unauthenticated saved-trip operations before accessing data", async () => {
  mocks.requireUser.mockRejectedValue(new UnauthenticatedError());
  for (const handler of [list, GET, POST, PATCH, DELETE])
    expect((await handler(request(), context)).status).toBe(401);
  expect(mocks.createClient).not.toHaveBeenCalled();
});
it("lists only owned trips and ignores spoofed ownership on creation", async () => {
  const listing = database([{ ...trip, user_id: "owner" }]);
  expect(await (await list(request(), context)).json()).toEqual({
    trips: [trip],
  });
  expect(listing.query.eq).toHaveBeenCalledWith("user_id", "owner");
  expect(listing.query.select).toHaveBeenCalledWith(tripFields);
  const creation = database();
  const response = await POST(
    request("POST", { ...payload, id: "spoofed", user_id: "other" }),
    context,
  );
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ trip });
  expect(creation.query.insert).toHaveBeenCalledWith({
    ...payload,
    user_id: "owner",
  });
});
it.each([
  ["GET", GET],
  ["PATCH", PATCH],
  ["DELETE", DELETE],
] as const)(
  "scopes %s by ID and owner, hiding absent/other-owner records",
  async (method, handler) => {
    const { query } = database(null);
    const response = await handler(
      request(
        method,
        method === "PATCH" ? { ...payload, user_id: "other" } : undefined,
      ),
      context,
    );
    expect(response.status).toBe(404);
    expect(query.eq.mock.calls).toEqual([
      ["id", id],
      ["user_id", "owner"],
    ]);
    if (method === "PATCH") expect(query.update).toHaveBeenCalledWith(payload);
  },
);
it("rejects invalid IDs and JSON before touching records", async () => {
  const { from } = database();
  for (const handler of [GET, PATCH, DELETE])
    expect(
      (await handler(request(), { params: Promise.resolve({ id: "bad" }) }))
        .status,
    ).toBe(400);
  for (const handler of [POST, PATCH]) {
    expect(
      (
        await handler(
          new Request("http://test/api", { method: "POST", body: "{" }),
          context,
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await handler(
          request("POST", { ...payload, end_date: "2026-02-30" }),
          context,
        )
      ).status,
    ).toBe(400);
  }
  expect(from).not.toHaveBeenCalled();
});
it("requires valid confirmed responses and redacts database errors", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  database();
  expect(
    await (await PATCH(request("PATCH", payload), context)).json(),
  ).toEqual({ trip });
  expect(await (await DELETE(request("DELETE"), context)).json()).toEqual({
    success: true,
  });
  for (const data of [null, { id: "wrong" }, { ...trip, sharing: "false" }]) {
    database(data);
    expect((await POST(request("POST", payload), context)).status).toBe(500);
  }
  database({ id: "wrong" });
  expect((await DELETE(request("DELETE"), context)).status).toBe(500);
  database(null, { message: "private database details" });
  for (const [method, handler] of [
    ["GET", list],
    ["GET", GET],
    ["POST", POST],
    ["PATCH", PATCH],
    ["DELETE", DELETE],
  ] as const) {
    const response = await handler(
      request(method, ["POST", "PATCH"].includes(method) ? payload : undefined),
      context,
    );
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private database");
  }
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
    "private database",
  );
});
