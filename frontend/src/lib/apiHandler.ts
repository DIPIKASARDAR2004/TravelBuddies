import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { SupabaseClient, User } from "@supabase/supabase-js";

export type ApiHandlerContext = {
  request: Request;
  user: User;
  supabase: SupabaseClient;
  params?: any;
};

type ApiHandler = (context: ApiHandlerContext) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler, defaultErrorMessage: string = "Internal server error"): any {
  return async (request: Request, context: any) => {
    try {
      const user = await requireUser();
      const supabase = await createSupabaseServerClient();
      
      let resolvedParams = context?.params;
      if (resolvedParams instanceof Promise) {
        resolvedParams = await resolvedParams;
      }
      
      return await handler({
        request,
        user,
        supabase,
        params: resolvedParams,
      });
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
      }
      console.error(`API Error [${defaultErrorMessage}]:`, error);
      return NextResponse.json({ error: defaultErrorMessage }, { status: 500 });
    }
  };
}

export async function parseJson<T = any>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
