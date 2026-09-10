import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/utils/errorUtils";

type RouteParams = Record<string, string>;

export type ApiHandlerContext = {
  request: Request;
  user: User;
  supabase: SupabaseClient;
  params: RouteParams;
};

type ApiHandler = (context: ApiHandlerContext) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler, defaultErrorMessage: string = "Internal server error") {
  return async (
    request: Request,
    context: { params: Promise<RouteParams> },
  ): Promise<NextResponse> => {
    try {
      const user = await requireUser();
      const supabase = await createSupabaseServerClient();
      
      const resolvedParams = await context.params;
      
      return await handler({
        request,
        user,
        supabase,
        params: resolvedParams || {},
      });
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }
      console.error(`API Error [${defaultErrorMessage}]:`, error);
      return NextResponse.json({ error: getErrorMessage(error, defaultErrorMessage) }, { status: 500 });
    }
  };
}

export async function parseJson<T = unknown>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
