import { NextResponse } from "next/server";
import {
  validateSafeStayInput,
  safeStayFields,
  safeStayIdPattern,
} from "@/lib/services/safeStays";
import {
  withAuth,
  parseJson,
  ApiHandlerContext,
} from "@/lib/services/apiHandler";

export const GET = withAuth(
  async ({ user, supabase, params }: ApiHandlerContext) => {
    const id = params.id;
    if (!safeStayIdPattern.test(id)) {
      return NextResponse.json(
        { error: "Invalid Safe Stay ID." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("safe_stays")
      .select(safeStayFields)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Safe Stay lookup failed:", error.message);
      return NextResponse.json(
        { error: "Unable to load Safe Stay." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { error: "Safe Stay not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ stay: data });
  },
);
export const PATCH = withAuth(
  async ({ user, supabase, request, params }: ApiHandlerContext) => {
    const id = params.id;
    if (!safeStayIdPattern.test(id)) {
      return NextResponse.json(
        { error: "Invalid Safe Stay ID." },
        { status: 400 },
      );
    }

    const validation = validateSafeStayInput(await parseJson(request));
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("safe_stays")
      .update(validation.value)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(safeStayFields)
      .maybeSingle();

    if (error) {
      console.error("Safe Stay update failed:", error.message);
      return NextResponse.json(
        { error: "Unable to update Safe Stay." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { error: "Safe Stay not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ stay: data });
  },
);
export const DELETE = withAuth(
  async ({ user, supabase, params }: ApiHandlerContext) => {
    const id = params.id;
    if (!safeStayIdPattern.test(id)) {
      return NextResponse.json(
        { error: "Invalid Safe Stay ID." },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "Unable to delete Safe Stay." },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { error: "Safe Stay not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
