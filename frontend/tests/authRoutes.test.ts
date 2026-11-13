import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: mocks.client,
}));
import { POST as login } from "@/app/api/login/route";
import { POST as signup } from "@/app/api/signup/route";
import { POST as logout } from "@/app/api/logout/route";

const request = (path: string, body?: unknown) =>
  new Request(`http://localhost/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const id = "12345678-1234-4234-8234-123456789abc";
const credentials = {
  email: "test@example.invalid",
  password: "fixture-password",
};
const acknowledged = () => ({
  error: null,
  data: {
    user: { id, private_field: "do not return" },
    session: {
      user: { id },
      access_token: "synthetic-access",
      refresh_token: "synthetic-refresh",
    },
  },
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockResolvedValue({
    auth: {
      signInWithPassword: mocks.login,
      signUp: mocks.signup,
      signOut: mocks.logout,
    },
  });
});
afterEach(() => vi.useRealTimers());

describe("auth route regressions", () => {
  it("rejects non-string credentials before constructing a provider client", async () => {
    const response = await login(
      request("login", {
        email: ["test@example.invalid"],
        password: { secret: true },
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("treats malformed JSON as a client error", async () => {
    const response = await signup(
      new Request("http://localhost/api/signup", { method: "POST", body: "{" }),
    );
    expect(response.status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });
  it("does not claim logout when the SDK returns an error", async () => {
    mocks.logout.mockResolvedValue({
      error: { message: "private provider details", status: 503 },
    });
    const response = await logout(request("logout"));
    expect(response.ok).toBe(false);
    expect(JSON.stringify(await response.json())).not.toContain(
      "private provider details",
    );
  });
  it("does not claim login without an acknowledged session", async () => {
    mocks.login.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    const response = await login(
      request("login", {
        email: "test@example.invalid",
        password: "fixture-password",
      }),
    );
    expect(response.ok).toBe(false);
  });
});

it("projects login credentials and returns only an acknowledged user ID", async () => {
  mocks.login.mockResolvedValue(acknowledged());
  const response = await login(
    request("login", {
      ...credentials,
      email: " test@example.invalid ",
      role: "admin",
    }),
  );
  expect(mocks.login).toHaveBeenCalledExactlyOnceWith(credentials);
  expect(mocks.client.mock.calls[0][0].strictCookies).toBe(true);
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
    status: "authenticated",
    message: "Signed in successfully.",
    user: { id },
  });
});

it.each([null, "authenticated"])(
  "signup distinguishes confirmation from a session: %s",
  async (state) => {
    const result = acknowledged();
    mocks.signup.mockResolvedValue(
      state ? result : { ...result, data: { ...result.data, session: null } },
    );
    const response = await signup(
      request("signup", {
        ...credentials,
        fullName: " Test Person ",
        phone: "not persisted",
        accountType: "host",
        user_id: "forged",
        confirmPassword: "ignored",
      }),
    );
    expect(mocks.signup).toHaveBeenCalledExactlyOnceWith({
      ...credentials,
      options: { data: { full_name: "Test Person" } },
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.status).toBe(state || "confirmation_required");
    expect(body.user).toEqual(state ? { id } : undefined);
    expect(JSON.stringify(body)).not.toContain("synthetic");
  },
);

it("only acknowledges error-free logout and uses no-store", async () => {
  mocks.logout.mockResolvedValue({ error: null });
  const response = await logout(request("logout"));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({
    status: "signed_out",
    message: "Signed out successfully.",
  });
});

it.each([400, 401, 403, 422, 429, 503])(
  "redacts provider failure details (%s)",
  async (status) => {
    mocks.login.mockResolvedValue({
      error: { status, message: "PRIVATE_PROVIDER_DETAIL", code: "secret" },
      data: null,
    });
    const response = await login(request("login", credentials));
    expect(response.status).toBe(
      status === 429 ? 429 : status === 503 ? 502 : 401,
    );
    expect(await response.text()).not.toContain("PRIVATE_PROVIDER_DETAIL");
  },
);

it.each([login, signup, logout])(
  "rejects cross-origin auth without invoking the provider",
  async (route) => {
    const response = await route(
      new Request("http://localhost/api/auth", {
        method: "POST",
        headers: { origin: "https://other.example" },
        body: JSON.stringify(credentials),
      }),
    );
    expect(response.status).toBe(403);
    expect(mocks.client).not.toHaveBeenCalled();
  },
);

it("accepts a matching Origin and hides thrown SDK/configuration failures", async () => {
  mocks.client.mockRejectedValue(new Error("PRIVATE_CONFIG"));
  const response = await login(
    new Request("http://localhost/api/login", {
      method: "POST",
      headers: { origin: "http://localhost" },
      body: JSON.stringify(credentials),
    }),
  );
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain("PRIVATE_CONFIG");
});

it("a ten-second deadline returns uncertainty, aborts fetch and ignores late success", async () => {
  vi.useFakeTimers();
  let resolve!: (value: unknown) => void;
  mocks.login.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = login(request("login", credentials));
  await vi.waitFor(() => expect(mocks.login).toHaveBeenCalled());
  const signal: AbortSignal = mocks.client.mock.calls[0][0].signal;
  await vi.advanceTimersByTimeAsync(10000);
  const response = await pending;
  expect(response.status).toBe(504);
  expect(signal.aborted).toBe(true);
  expect(await response.json()).toHaveProperty(
    "error",
    expect.stringContaining("Check your session or email"),
  );
  resolve(acknowledged());
  await vi.runAllTimersAsync();
  expect(vi.getTimerCount()).toBe(0);
});

it("request cancellation prevents a late client from starting an auth call", async () => {
  const controller = new AbortController();
  let resolve!: (value: unknown) => void;
  mocks.client.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = login(
    new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      signal: controller.signal,
    }),
  );
  await vi.waitFor(() => expect(mocks.client).toHaveBeenCalled());
  controller.abort();
  expect((await pending).status).toBe(504);
  resolve({ auth: { signInWithPassword: mocks.login } });
  await Promise.resolve();
  expect(mocks.login).not.toHaveBeenCalled();
});

it("an already-aborted request never constructs an auth client", async () => {
  const controller = new AbortController();
  controller.abort();
  const response = await logout(
    new Request("http://localhost/api/logout", {
      method: "POST",
      signal: controller.signal,
    }),
  );
  expect(response.status).toBe(504);
  expect(mocks.client).not.toHaveBeenCalled();
});
