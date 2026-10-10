import { beforeEach, expect, it, vi } from "vitest";

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
import { GET as list, POST } from "@/app/api/safe-stays/route";
import { GET, PATCH, DELETE } from "@/app/api/safe-stays/[id]/route";

const id = "12345678-1234-4234-8234-123456789abc";
const payload = {
  stay_name: "Test stay",
  address: null,
  check_in: "2026-10-12T09:00:00.000Z",
  check_out: "2026-10-14T09:00:00.000Z",
  status: "active",
};
const context = { params: Promise.resolve({ id }) };
const request = (method = "GET", body?: unknown) =>
  new Request("http://test/api/safe-stays", {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

function database(data: unknown = { id, ...payload }, error: unknown = null) {
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

it("rejects every unauthenticated Safe Stay operation before database access", async () => {
  mocks.requireUser.mockRejectedValue(new UnauthenticatedError());
  for (const handler of [list, GET, POST, PATCH, DELETE]) {
    expect((await handler(request(), context)).status).toBe(401);
  }
  expect(mocks.createClient).not.toHaveBeenCalled();
});

it("lists only the owner's stays and creates using authenticated ownership", async () => {
  const { query } = database([]);
  expect((await list(request(), context)).status).toBe(200);
  expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
  expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
  expect(
    (
      await POST(
        request("POST", { ...payload, user_id: "attacker", id: "spoofed" }),
        context,
      )
    ).status,
  ).toBe(201);
  expect(query.insert).toHaveBeenCalledWith({ ...payload, user_id: "owner" });
});

it.each([
  ["GET", GET],
  ["PATCH", PATCH],
  ["DELETE", DELETE],
] as const)(
  "scopes %s to both record and owner, including not-found responses",
  async (method, handler) => {
    const { query } = database(null);
    const response = await handler(
      request(
        method,
        method === "PATCH" ? { ...payload, user_id: "attacker" } : undefined,
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

it("rejects invalid IDs and malformed JSON without touching records", async () => {
  const { from } = database();
  for (const handler of [GET, PATCH, DELETE]) {
    expect(
      (await handler(request(), { params: Promise.resolve({ id: "bad" }) }))
        .status,
    ).toBe(400);
  }
  for (const handler of [POST, PATCH]) {
    expect(
      (
        await handler(
          new Request("http://test/api", { method: "POST", body: "{" }),
          context,
        )
      ).status,
    ).toBe(400);
  }
  expect(from).not.toHaveBeenCalled();
});

it("returns confirmed mutation results and redacts database failures", async () => {
  database();
  expect(
    await (await PATCH(request("PATCH", payload), context)).json(),
  ).toEqual({ stay: { id, ...payload } });
  expect(await (await DELETE(request("DELETE"), context)).json()).toEqual({
    success: true,
  });
  database(null, { message: "private database details" });
  vi.spyOn(console, "error").mockImplementation(() => {});
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
});
