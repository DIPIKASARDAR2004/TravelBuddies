import { NextResponse } from "next/server";
import { validateSafeStayInput } from '@/lib/services/safeStays';
import { withAuth, parseJson, ApiHandlerContext } from '@/lib/services/apiHandler';

const stayFields = "id, stay_name, address, check_in, check_out, status, created_at, updated_at";
export const GET = withAuth(async ({ user, supabase }: ApiHandlerContext) => {
              const { data, error } = await supabase
          .from("safe_stays")
          .select(stayFields)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Safe Stay list failed:", error.message);
          return NextResponse.json({ error: "Unable to load Safe Stays." }, { status: 500 });
        }

        return NextResponse.json({ stays: data ?? [] });
    });
export const POST = withAuth(async ({ user, supabase, request }: ApiHandlerContext) => {
          const validation = validateSafeStayInput(await parseJson(request));
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

            const { data, error } = await supabase
          .from("safe_stays")
          .insert({ user_id: user.id, ...validation.value })
          .select(stayFields)
          .single();

        if (error) {
          console.error("Safe Stay create failed:", error.message);
          return NextResponse.json({ error: "Unable to create Safe Stay." }, { status: 500 });
        }

        return NextResponse.json({ stay: data }, { status: 201 });
    });
