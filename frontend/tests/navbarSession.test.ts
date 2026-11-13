import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createNavbarSession,
  initialNavbarSession,
  readNavbarUser,
  SESSION_WAIT_MS,
  type NavbarSessionState,
} from "@/lib/auth/navbarSession";

const id = "12345678-1234-4234-8234-123456789abc";
const user = { id, email: "fixture@example.invalid" };
const valid = { data: { user }, error: null };
const missing = {
  data: { user: null },
  error: { name: "AuthSessionMissingError" },
};
function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const cleanup: Array<() => void> = [];
function setup(
  read = vi.fn().mockResolvedValue(valid),
  logout = vi.fn().mockResolvedValue({ error: null }),
) {
  let state: NavbarSessionState = initialNavbarSession;
  let event!: (name: string) => void;
  const changed = vi.fn((next: NavbarSessionState) => {
    state = next;
  });
  const signedOut = vi.fn();
  const unsubscribe = vi.fn();
  const session = createNavbarSession(
    {
      read,
      logout,
      subscribe(listener) {
        event = listener;
        return unsubscribe;
      },
    },
    changed,
    signedOut,
  );
  cleanup.push(session.dispose);
  return {
    session,
    read,
    logout,
    changed,
    signedOut,
    unsubscribe,
    event: (name: string) => event(name),
    state: () => state,
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup.splice(0).forEach((dispose) => dispose());
  vi.useRealTimers();
});

it.each([
  null,
  [],
  {},
  { error: null },
  { data: { user: { id: "bad" } }, error: null },
  { data: { user }, error: { status: 500, message: "private" } },
])("rejects malformed/failed identity reads %#", (value) => {
  expect(() => readNavbarUser(value)).toThrow("Session could not be checked");
});
it("projects only display identity and treats missing local session separately from failure", () => {
  expect(readNavbarUser(valid)).toEqual({ id, label: "fixture" });
  expect(readNavbarUser(missing)).toBeNull();
  expect(() => readNavbarUser({ ...missing, data: { user } })).toThrow();
});
it("coalesces read clicks and ignores a late initial read after sign-out", async () => {
  const pending = deferred();
  const f = setup(vi.fn().mockReturnValue(pending.promise));
  void f.session.check();
  void f.session.check();
  expect(f.read).toHaveBeenCalledTimes(1);
  f.event("SIGNED_OUT");
  pending.resolve(valid);
  await Promise.resolve();
  expect(f.state().status).toBe("guest");
});
it("revalidates changed identities outside the SDK callback and ignores older reads", async () => {
  const pending = deferred();
  const f = setup(
    vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue({
        data: { user: { ...user, email: "new@example.invalid" } },
        error: null,
      }),
  );
  f.event("SIGNED_IN");
  expect(f.read).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(0);
  expect(f.state().user?.label).toBe("new");
  pending.resolve(valid);
  await Promise.resolve();
  expect(f.state().user?.label).toBe("new");
});
it("bounds stalled reads and ignores their late result after a fresh check", async () => {
  const pending = deferred();
  const f = setup(
    vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(missing),
  );
  await vi.advanceTimersByTimeAsync(SESSION_WAIT_MS);
  expect(f.state()).toMatchObject({
    status: "unknown",
    canCheck: true,
    user: null,
  });
  await f.session.check();
  pending.resolve(valid);
  await Promise.resolve();
  expect(f.state().status).toBe("guest");
});
it("deduplicates logout and only navigates on a checked acknowledgement", async () => {
  const pending = deferred();
  const f = setup(undefined, vi.fn().mockReturnValue(pending.promise));
  await Promise.resolve();
  const task = f.session.logout();
  void f.session.logout();
  f.event("SIGNED_OUT");
  expect(f.state().status).toBe("signing_out");
  pending.resolve({ error: null });
  await task;
  expect(f.logout).toHaveBeenCalledTimes(1);
  expect(f.signedOut).toHaveBeenCalledTimes(1);
});
it.each([undefined, {}, { error: { message: "private error" } }])(
  "does not confuse local clearing with logout confirmation %#",
  async (result) => {
    const f = setup(undefined, vi.fn().mockResolvedValue(result));
    await Promise.resolve();
    await f.session.logout();
    expect(f.signedOut).not.toHaveBeenCalled();
    expect(f.state().notice).toContain("Remote sign-out was not confirmed");
    f.event("SIGNED_OUT");
    expect(f.state().status).toBe("guest");
    expect(f.state().notice).toContain("not confirmed");
    expect(f.state().notice).not.toContain("private error");
  },
);
it("retains remote uncertainty after checking a cleared local session", async () => {
  const f = setup(
    vi.fn().mockResolvedValueOnce(valid).mockResolvedValue(missing),
    vi.fn().mockRejectedValue(new Error("private")),
  );
  await Promise.resolve();
  await f.session.logout();
  await f.session.check();
  expect(f.state()).toMatchObject({ status: "guest", user: null });
  expect(f.state().notice).toContain("not confirmed");
});
it("a logout timeout does not permit overlapping SDK operations or late navigation", async () => {
  const pending = deferred();
  const f = setup(undefined, vi.fn().mockReturnValue(pending.promise));
  await Promise.resolve();
  const task = f.session.logout();
  await vi.advanceTimersByTimeAsync(SESSION_WAIT_MS);
  expect(f.state()).toMatchObject({ status: "unknown", canCheck: false });
  void f.session.logout();
  void f.session.check();
  expect(f.read).toHaveBeenCalledTimes(1);
  expect(f.logout).toHaveBeenCalledTimes(1);
  pending.resolve({ error: null });
  await task;
  expect(f.signedOut).not.toHaveBeenCalled();
  expect(f.state()).toMatchObject({ status: "unknown", canCheck: true });
});
it.each(["departure", "new_identity"])(
  "does not navigate after %s during logout",
  async (change) => {
    const pending = deferred();
    const f = setup(undefined, vi.fn().mockReturnValue(pending.promise));
    await Promise.resolve();
    const task = f.session.logout();
    if (change === "departure") f.session.depart();
    else f.event("SIGNED_IN");
    pending.resolve({ error: null });
    await task;
    expect(f.signedOut).not.toHaveBeenCalled();
    expect(f.state().status).toBe("unknown");
  },
);
it("disposal unsubscribes, clears timers and prevents late logout effects", async () => {
  const pending = deferred();
  const f = setup(undefined, vi.fn().mockReturnValue(pending.promise));
  await Promise.resolve();
  const task = f.session.logout();
  f.session.dispose();
  f.session.dispose();
  const calls = f.changed.mock.calls.length;
  pending.resolve({ error: null });
  await task;
  expect(f.changed).toHaveBeenCalledTimes(calls);
  expect(f.signedOut).not.toHaveBeenCalled();
  expect(f.unsubscribe).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});
