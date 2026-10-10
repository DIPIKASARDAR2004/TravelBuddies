import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { catalog, planInput } from "./support/plannerFixture";
const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: mocks.createClient,
}));
import { POST } from "@/app/api/plan/route";
import { readPlannerResponse } from "@/lib/planner/planResponses";

const request = (body: unknown) =>
  new Request("http://test/api/plan", {
    method: "POST",
    body: JSON.stringify(body),
  });
function database(
  overrides: Record<string, unknown> = {},
  errorTable?: string,
) {
  const tables: Record<string, unknown> = {
    Hotels: catalog.hotels,
    restaurants: catalog.restaurants,
    activities: catalog.activities,
    transport: catalog.transport,
    ...overrides,
  };
  const queries: Record<
    string,
    {
      select: ReturnType<typeof vi.fn>;
      ilike: ReturnType<typeof vi.fn>;
      order: ReturnType<typeof vi.fn>;
      abortSignal: ReturnType<typeof vi.fn>;
    }
  > = {};
  const from = vi.fn((table: string) => {
    const query = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      abortSignal: vi
        .fn()
        .mockResolvedValue({
          data: tables[table],
          error:
            table === errorTable
              ? { message: "private database failure" }
              : null,
        }),
    };
    queries[table] = query;
    return query;
  });
  mocks.createClient.mockResolvedValue({ from });
  return { from, queries };
}
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

it("rejects malformed JSON and invalid request types before catalog access", async () => {
  const response = await POST(
    new Request("http://test/api/plan", { method: "POST", body: "{" }),
  );
  expect(response.status).toBe(400);
  for (const body of [
    null,
    [],
    { ...planInput, days: 0 },
    { ...planInput, travellers: true },
    { ...planInput, womenOnly: "false" },
  ])
    expect((await POST(request(body))).status).toBe(400);
  expect(mocks.createClient).not.toHaveBeenCalled();
});

it("loads the four ordered catalogs with bounded requests and literal substring matching", async () => {
  const { queries, from } = database();
  const response = await POST(
    request({ ...planInput, destination: "50%_Town" }),
  );
  expect(response.status).toBe(200);
  expect(readPlannerResponse(await response.json()).isTripPossible).toBe(true);
  expect(from.mock.calls.map(([table]) => table)).toEqual([
    "Hotels",
    "restaurants",
    "activities",
    "transport",
  ]);
  for (const query of Object.values(queries)) {
    expect(query.ilike).toHaveBeenCalledWith("destination", "%50\\%\\_Town%");
    expect(query.abortSignal.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
  }
  expect(queries.Hotels.order).toHaveBeenCalledWith("price_per_night", {
    ascending: true,
  });
});

it.each(["Hotels", "restaurants", "activities", "transport"])(
  "reports %s outages as unavailable, not missing destination data",
  async (table) => {
    database({}, table);
    const response = await POST(request(planInput));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      code: "CATALOG_UNAVAILABLE",
    });
  },
);

it("distinguishes invalid/missing catalog records from valid free activities", async () => {
  for (const price of [null, -1, "2000", Infinity]) {
    database({ Hotels: [{ ...catalog.hotels[0], price_per_night: price }] });
    expect((await POST(request(planInput))).status).toBe(503);
  }
  database({ activities: [] });
  const missing = await POST(request(planInput));
  expect(missing.status).toBe(400);
  expect(await missing.json()).toMatchObject({ code: "INSUFFICIENT_DATA" });
  database({
    activities: [{ activity_name: "Free fixture", cost_per_person: 0 }],
  });
  const free = readPlannerResponse(
    await (await POST(request(planInput))).json(),
  );
  expect(free.withinBudget[0].activityCost).toBe(0);
});

it("keeps the safety filter explicit and normal planning independent of it", async () => {
  database({ Hotels: [{ ...catalog.hotels[0], is_women_friendly: false }] });
  expect((await POST(request(planInput))).status).toBe(200);
  expect((await POST(request({ ...planInput, womenOnly: true }))).status).toBe(
    400,
  );
});

it("redacts unexpected database setup errors", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.createClient.mockRejectedValue(new Error("private credential details"));
  const response = await POST(request(planInput));
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain("private");
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
    "private",
  );
});
