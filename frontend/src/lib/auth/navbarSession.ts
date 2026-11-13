/** Concrete navbar lifecycle; SDK events are hints, never authorization grants. */
export type NavbarSessionState = {
  status: "checking" | "guest" | "signed_in" | "unknown" | "signing_out";
  user: { id: string; label: string } | null;
  notice: string;
  canCheck: boolean;
};
type NavbarAuth = {
  read: () => Promise<unknown>;
  logout: () => Promise<unknown>;
  subscribe: (listener: (event: string) => void) => () => void;
};
export const SESSION_WAIT_MS = 15000;
export const LOGOUT_UNCONFIRMED =
  "Remote sign-out was not confirmed. Local access may already be cleared. Check your session; this does not prove other sessions or existing access tokens were revoked.";
export const initialNavbarSession: NavbarSessionState = {
  status: "checking",
  user: null,
  notice: "",
  canCheck: false,
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function readNavbarUser(value: unknown): NavbarSessionState["user"] {
  const result = record(value);
  const error = record(result.error);
  if (
    error.name === "AuthSessionMissingError" &&
    record(result.data).user === null
  )
    return null;
  if (result.error !== null) throw new Error("Session could not be checked.");
  const data = record(result.data);
  if (data.user === null) return null;
  const user = record(data.user);
  if (
    typeof user.id !== "string" ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(user.id)
  )
    throw new Error("Session could not be checked.");
  return {
    id: user.id,
    label:
      typeof user.email === "string" && user.email.length <= 254
        ? user.email.split("@")[0] || "Account"
        : "Account",
  };
}

export function createNavbarSession(
  auth: NavbarAuth,
  changed: (state: NavbarSessionState) => void,
  signedOut: () => void,
) {
  let state = { ...initialNavbarSession };
  let disposed = false;
  let revision = 0;
  let navigation = 0;
  let reading = false;
  let logoutPending = false;
  let changedDuringLogout = false;
  let readTimer: ReturnType<typeof setTimeout> | undefined;
  let logoutTimer: ReturnType<typeof setTimeout> | undefined;
  let eventTimer: ReturnType<typeof setTimeout> | undefined;
  const emit = (patch: Partial<NavbarSessionState>) => {
    if (!disposed) {
      state = { ...state, ...patch };
      changed(state);
    }
  };
  const invalidateRead = () => {
    revision++;
    reading = false;
    clearTimeout(readTimer);
    clearTimeout(eventTimer);
  };

  const check = async () => {
    if (disposed || logoutPending || reading) return;
    invalidateRead();
    const attempt = revision;
    reading = true;
    emit({ status: "checking", user: null, canCheck: false });
    readTimer = setTimeout(() => {
      invalidateRead();
      emit({ status: "unknown", user: null, canCheck: true });
    }, SESSION_WAIT_MS);
    try {
      const result = await auth.read();
      if (disposed || revision !== attempt) return;
      const user = readNavbarUser(result);
      emit({ status: user ? "signed_in" : "guest", user, canCheck: true });
    } catch {
      if (!disposed && revision === attempt)
        emit({ status: "unknown", user: null, canCheck: true });
    } finally {
      if (revision === attempt) {
        clearTimeout(readTimer);
        reading = false;
      }
    }
  };

  const logout = async () => {
    if (disposed || logoutPending || state.status !== "signed_in") return;
    invalidateRead();
    logoutPending = true;
    changedDuringLogout = false;
    const origin = navigation;
    let timedOut = false;
    emit({ status: "signing_out", user: null, canCheck: false });
    logoutTimer = setTimeout(() => {
      timedOut = true;
      emit({ status: "unknown", notice: LOGOUT_UNCONFIRMED, canCheck: false });
    }, SESSION_WAIT_MS);
    try {
      const result = await auth.logout();
      if (disposed) return;
      if (record(result).error !== null) throw new Error("Unconfirmed logout");
      if (timedOut || changedDuringLogout || origin !== navigation) {
        emit({ status: "unknown", notice: LOGOUT_UNCONFIRMED });
      } else {
        emit({ status: "guest", user: null, notice: "" });
        signedOut();
      }
    } catch {
      emit({ status: "unknown", user: null, notice: LOGOUT_UNCONFIRMED });
    } finally {
      logoutPending = false;
      clearTimeout(logoutTimer);
      emit({ canCheck: true });
    }
  };

  const unsubscribe = auth.subscribe((event) => {
    if (disposed || event === "INITIAL_SESSION") return;
    if (logoutPending) {
      if (event !== "SIGNED_OUT") changedDuringLogout = true;
      return;
    }
    invalidateRead();
    if (event === "SIGNED_OUT") {
      // Local observation only; do not erase an earlier remote-revocation warning.
      emit({ status: "guest", user: null, canCheck: true });
    } else {
      emit({ status: "checking", user: null, canCheck: false });
      // Do not invoke SDK methods from inside its synchronous event callback.
      eventTimer = setTimeout(() => {
        void check();
      }, 0);
    }
  });
  void check();
  return {
    check,
    logout,
    depart() {
      navigation++;
      invalidateRead();
      if (!logoutPending) void check();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      invalidateRead();
      clearTimeout(logoutTimer);
      unsubscribe();
    },
  };
}
