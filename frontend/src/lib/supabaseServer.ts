import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export class UnauthenticatedError extends Error {
  readonly statusCode = 401;

  constructor() {
    super("Authentication required");
    this.name = "UnauthenticatedError";
  }
}

export async function createSupabaseServerClient(
  options: { signal?: AbortSignal; strictCookies?: boolean } = {},
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    ...(options.signal
      ? {
          global: {
            fetch: (input: RequestInfo | URL, init?: RequestInit) =>
              fetch(input, {
                ...init,
                signal: init?.signal
                  ? AbortSignal.any([options.signal!, init.signal])
                  : options.signal,
              }),
          },
        }
      : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) {
        try {
          options.signal?.throwIfAborted();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          if (options.strictCookies) throw error;
          // Server Components cannot always write cookies; middleware refreshes sessions.
        }
      },
    },
  });
}

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new UnauthenticatedError();
  }

  return data.user;
}
