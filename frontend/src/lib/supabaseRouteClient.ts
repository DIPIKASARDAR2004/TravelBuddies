import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";

export function createSupabaseRouteClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];
  const requestCookies = request.headers.get("cookie") ?? "";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return requestCookies
          .split("; ")
          .filter(Boolean)
          .map((cookie) => {
            const separator = cookie.indexOf("=");
            return {
              name: separator >= 0 ? cookie.slice(0, separator) : cookie,
              value: separator >= 0 ? decodeURIComponent(cookie.slice(separator + 1)) : "",
            };
          });
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  return {
    supabase,
    applyCookies(response: NextResponse) {
      pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      return response;
    },
  };
}
