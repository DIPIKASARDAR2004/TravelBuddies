/** Real Supabase SDK/SSR adapter, synthetic HTTP and request-cookie storage. */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const cookies = vi.hoisted(() => ({ getAll: vi.fn(() => []), set: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => cookies }));
import { POST as login } from "@/app/api/login/route";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const id = "12345678-1234-4234-8234-123456789abc";
const credentials = {
  email: "fixture@example.invalid",
  password: "fixture-password",
};
const token = () => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: id, aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture-signature`;
};
const response = () =>
  Response.json({
    access_token: token(),
    refresh_token: "fixture-refresh",
    token_type: "bearer",
    expires_in: 3600,
    user: {
      id,
      aud: "authenticated",
      email: credentials.email,
      app_metadata: {},
      user_metadata: {},
    },
  });
const http = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  cookies.getAll.mockReturnValue([]);
  cookies.set.mockReset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth-fixture.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "fixture-public-key");
  http.mockReset().mockImplementation(async () => response());
  vi.stubGlobal("fetch", http);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("real SDK login writes request cookies before acknowledging only the user ID", async () => {
  const result = await login(
    new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  );
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({
    status: "authenticated",
    user: { id },
    message: "Signed in successfully.",
  });
  expect(http).toHaveBeenCalledTimes(1);
  expect(String(http.mock.calls[0][0])).toContain(
    "/auth/v1/token?grant_type=password",
  );
  expect(cookies.set).toHaveBeenCalled();
  expect(cookies.set.mock.calls[0][0]).toContain("auth-token");
  expect(cookies.set.mock.calls[0][2]).toMatchObject({
    path: "/",
    sameSite: "lax",
  });
});

it("real SDK cookie-write failure cannot become HTTP login success", async () => {
  cookies.set.mockImplementation(() => {
    throw new Error("FIXTURE_COOKIE_WRITE_FAILURE");
  });
  const result = await login(
    new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
  );
  expect(cookies.set).toHaveBeenCalled();
  expect(http).toHaveBeenCalledTimes(1);
  expect(result.ok).toBe(false);
  expect(await result.text()).not.toContain("FIXTURE_COOKIE_WRITE_FAILURE");
});

it("an aborted real SDK request cannot write late session cookies", async () => {
  const controller = new AbortController();
  let finish!: (value: Response) => void;
  http.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const client = await createSupabaseServerClient({
    signal: controller.signal,
    strictCookies: true,
  });
  const pending = client.auth.signInWithPassword(credentials).then(
    (result) => ({ error: result.error }),
    (error) => ({ error }),
  );
  await vi.waitFor(() => expect(http).toHaveBeenCalledTimes(1));
  expect(http.mock.calls[0][1].signal.aborted).toBe(false);
  controller.abort();
  finish(response());
  expect((await pending).error).toBeTruthy();
  expect(http.mock.calls[0][1].signal.aborted).toBe(true);
  expect(cookies.set).not.toHaveBeenCalled();
});

it("default server-component clients retain their existing readonly-cookie tolerance", async () => {
  cookies.set.mockImplementation(() => {
    throw new Error("Readonly fixture");
  });
  const client = await createSupabaseServerClient();
  const result = await client.auth.signInWithPassword(credentials);
  expect(cookies.set).toHaveBeenCalled();
  expect(result.error).toBeNull();
});
