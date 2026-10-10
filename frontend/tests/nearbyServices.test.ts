import { afterEach, beforeEach, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ user: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/supabaseServer", () => ({
  requireUser: auth.user,
  createSupabaseServerClient: auth.client,
  UnauthenticatedError: class extends Error {
    statusCode = 401;
  },
}));
import { UnauthenticatedError } from "@/lib/supabaseServer";
import { GET } from "@/app/api/nearby-safety-services/route";
import { findNearbyServices } from "@/lib/services/overpass";
import {
  distanceInMeters,
  parseRadius,
  readNearbyServices,
} from "@/lib/services/nearbySafetyServices";

const fetchMock = vi.fn<typeof fetch>();
const node = {
  type: "node",
  id: 1,
  lat: 27,
  lon: 88,
  tags: { amenity: "police", name: "Fixture station", phone: "+00 1234567" },
};
const context = { params: Promise.resolve({}) };
const request = (query = "latitude=27&longitude=88&type=police&radius=2000") =>
  new Request(`http://test/api/nearby-safety-services?${query}`);
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  auth.user.mockResolvedValue({ id: "owner" });
  auth.client.mockResolvedValue({});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("authenticates before calling the external location provider", async () => {
  auth.user.mockRejectedValue(new UnauthenticatedError());
  expect((await GET(request(), context)).status).toBe(401);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("rejects invalid query values rather than silently defaulting malformed radii", async () => {
  for (const query of [
    "latitude=&longitude=88",
    "latitude=NaN&longitude=88",
    "latitude=91&longitude=0",
    "latitude=0&longitude=0&type=evil",
    "latitude=0&longitude=0&radius=abc",
    "latitude=0&longitude=0&radius=249",
    "latitude=0&longitude=0&radius=5001",
  ])
    expect((await GET(request(query), context)).status).toBe(400);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(parseRadius(null)).toBe(2000);
  expect(parseRadius("bad")).toBeNull();
});
it("normalizes node/way centers, sorts distance and returns only public fields", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({
      elements: [
        {
          type: "way",
          id: 2,
          center: { lat: 27.01, lon: 88.01 },
          tags: {
            amenity: "police",
            "addr:street": "Fixture street",
            private: "unused",
          },
        },
        node,
      ],
    }),
  );
  const response = await GET(request(), context);
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.services.map((service: { id: string }) => service.id)).toEqual([
    "node/1",
    "way/2",
  ]);
  expect(data.services[0]).toMatchObject({
    name: "Fixture station",
    latitude: 27,
    longitude: 88,
    distanceMeters: 0,
  });
  expect(data.services[1].address).toBe("Fixture street");
  expect(JSON.stringify(data)).not.toContain("unused");
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe("https://overpass-api.de/api/interpreter");
  expect(String(options?.body)).toContain("%5Btimeout%3A15%5D");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
it("does not turn partial, malformed or provider failure responses into an empty successful search", async () => {
  for (const payload of [
    null,
    {},
    { elements: {} },
    { elements: [], remark: "runtime timeout private details" },
    { elements: [{ ...node, lat: null }] },
    { elements: [{ ...node, tags: { amenity: "hospital" } }] },
    { elements: [{ ...node, tags: { amenity: "police", name: {} } }] },
    { elements: [node, node] },
  ]) {
    fetchMock.mockResolvedValueOnce(Response.json(payload));
    const response = await GET(request(), context);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private");
  }
  fetchMock.mockResolvedValueOnce(
    Response.json({ error: "private quota" }, { status: 429 }),
  );
  expect((await GET(request(), context)).status).toBe(429);
  fetchMock.mockResolvedValueOnce(Response.json({ elements: [] }));
  expect(await (await GET(request(), context)).json()).toEqual({
    services: [],
    category: "police",
    radiusMeters: 2000,
  });
});
it("bounds provider waiting and forwards cancellation without leaking raw failures", async () => {
  vi.useFakeTimers();
  fetchMock.mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) =>
        options?.signal?.addEventListener("abort", () =>
          reject(new Error("private abort")),
        ),
      ),
  );
  const pending = findNearbyServices(
    0,
    0,
    "police",
    2000,
    new AbortController().signal,
  );
  const assertion = expect(pending).rejects.toMatchObject({ status: 504 });
  await vi.advanceTimersByTimeAsync(20000);
  await assertion;
  const controller = new AbortController();
  const cancelled = findNearbyServices(0, 0, "police", 2000, controller.signal);
  const cancelledAssertion = expect(cancelled).rejects.toMatchObject({
    status: 408,
  });
  controller.abort();
  await cancelledAssertion;
  expect(vi.getTimerCount()).toBe(0);
});
it("checks browser category/radius/record contracts and keeps antipodal distances finite", () => {
  for (const value of [
    null,
    {},
    { services: [], category: "hospital", radiusMeters: 2000 },
    { services: [{}], category: "police", radiusMeters: 2000 },
  ])
    expect(() => readNearbyServices(value, "police", 2000)).toThrow();
  expect(
    readNearbyServices(
      { services: [], category: "police", radiusMeters: 2000 },
      "police",
      2000,
    ),
  ).toEqual([]);
  expect(Number.isFinite(distanceInMeters(27, 88, -27, -92))).toBe(true);
});
