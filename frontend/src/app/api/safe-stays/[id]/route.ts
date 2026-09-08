import { NextResponse } from "next/server";
import { validateSafeStayInput } from "@/lib/safeStays";
import { withAuth, parseJson, ApiHandlerContext } from "@/lib/apiHandler";

const stayFields = "id, stay_name, address, check_in, check_out, status, created_at, updated_at";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;



export const GET = withAuth(async ({ user, supabase, request, params }: ApiHandlerContext) => {
          const id = params.id;
        if (!uuidPattern.test(id)) {
          return NextResponse.json({ error: "Invalid Safe Stay ID." }, { status: 400 });
        }

            const { data, error } = await supabase
          .from("safe_stays")
          .select(stayFields)
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Safe Stay lookup failed:", error.message);
          return NextResponse.json({ error: "Unable to load Safe Stay." }, { status: 500 });
        }
        if (!data) {
          return NextResponse.json({ error: "Safe Stay not found." }, { status: 404 });
        }

        return NextResponse.json({ stay: data });
    });
export const PATCH = withAuth(async ({ user, supabase, request, params }: ApiHandlerContext) => {
          const id = params.id;
        if (!uuidPattern.test(id)) {
          return NextResponse.json({ error: "Invalid Safe Stay ID." }, { status: 400 });
        }

        const validation = validateSafeStayInput(await request.json().catch(() => null));
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

            const { data, error } = await supabase
          .from("safe_stays")
          .update(validation.value)
          .eq("id", id)
          .eq("user_id", user.id)
          .select(stayFields)
          .maybeSingle();

        if (error) {
          console.error("Safe Stay update failed:", error.message);
          return NextResponse.json({ error: "Unable to update Safe Stay." }, { status: 500 });
        }
        if (!data) {
          return NextResponse.json({ error: "Safe Stay not found." }, { status: 404 });
        }

        return NextResponse.json({ stay: data });
    });
export const DELETE = withAuth(async ({ user, supabase, request, params }: ApiHandlerContext) => {
          const id = params.id;
        if (!uuidPattern.test(id)) {
          return NextResponse.json({ error: "Invalid Safe Stay ID." }, { status: 400 });
        }

            const { data, error } = await supabase
          .from("safe_stays")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id")
          .maybeSingle();

        if (error) {
          console.error("Safe Stay delete failed:", error.message);
          return NextResponse.json({ error: "Unable to delete Safe Stay." }, { status: 500 });
        }
        if (!data) {
          return NextResponse.json({ error: "Safe Stay not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    });
