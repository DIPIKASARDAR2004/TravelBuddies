import { afterEach, expect, it, vi } from "vitest";
import {
  AuthRequestFailure,
  AUTH_UNCERTAIN,
  readAuthResponse,
  requestAuth,
} from "@/lib/auth/client";

const id = "12345678-1234-4234-8234-123456789abc";
const authenticated = { status: "authenticated", user: { id } };
afterEach(() => vi.unstubAllGlobals());

it.each([
  null,
  [],
  {},
  { message: "success" },
  { status: "authenticated" },
  { status: "authenticated", user: { id: "bad" } },
  { status: "confirmation_required" },
  { status: "signed_out" },
])(
  "does not treat a malformed/wrong login acknowledgement as success %#",
  (body) => {
    expect(() => readAuthResponse("login", body)).toThrow(AuthRequestFailure);
  },
);
it("projects authenticated data without reflecting server messages or secrets", () => {
  expect(
    readAuthResponse("signup", {
      ...authenticated,
      message: "untrusted",
      token: "synthetic",
    }),
  ).toEqual({ ...authenticated, message: "Signed in successfully." });
});
it("keeps confirmation conditional and logout action-specific", () => {
  expect(
    readAuthResponse("signup", { status: "confirmation_required" }).message,
  ).toMatch(/^If signup/);
  expect(readAuthResponse("logout", { status: "signed_out" }).status).toBe(
    "signed_out",
  );
  expect(() => readAuthResponse("logout", authenticated)).toThrow();
});
it.each([400, 401, 403, 422, 429])(
  "handles explicit rejection %i without exposing raw errors",
  async (status) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("raw-provider-diagnostics", { status }),
        ),
    );
    await expect(
      requestAuth("login", {}, new AbortController().signal),
    ).rejects.toMatchObject({ uncertain: false });
    await expect(
      requestAuth("login", {}, new AbortController().signal),
    ).rejects.not.toThrow("raw-provider");
  },
);
it.each([500, 502, 504])(
  "treats server failure %i as uncertain",
  async (status) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("untrusted", { status })),
    );
    await expect(
      requestAuth("signup", {}, new AbortController().signal),
    ).rejects.toMatchObject({ uncertain: true, message: AUTH_UNCERTAIN });
  },
);
it("treats non-JSON success as uncertain", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("<html>wrong endpoint</html>")),
  );
  await expect(
    requestAuth("login", {}, new AbortController().signal),
  ).rejects.toThrow(AUTH_UNCERTAIN);
});
it("sends exact credentials without caching and forwards cancellation", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(authenticated));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const input = { email: "test@example.invalid", password: " x " };
  await expect(
    requestAuth("login", input, controller.signal),
  ).resolves.toMatchObject(authenticated);
  expect(fetch).toHaveBeenCalledWith(
    "/api/login",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify(input),
    }),
  );
});
it("never starts an already-aborted request", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  await expect(requestAuth("login", {}, AbortSignal.abort())).rejects.toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it("rejects a late body after cancellation", async () => {
  const controller = new AbortController();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        controller.abort();
        return authenticated;
      },
    }),
  );
  await expect(requestAuth("login", {}, controller.signal)).rejects.toThrow();
});
