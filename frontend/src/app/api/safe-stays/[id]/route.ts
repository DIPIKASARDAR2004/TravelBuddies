import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { validateSafeStayInput } from "@/lib/safeStays";

const stayFields = "id, stay_name, address, check_in, check_out, status, created_at, updated_at";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function unauthorizedResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return null;
}

async function getStayId(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = await getStayId(context);
    if (!uuidPattern.test(id)) {
      return NextResponse.json({ error: "Invalid Safe Stay ID." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
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
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to load Safe Stay." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = await getStayId(context);
    if (!uuidPattern.test(id)) {
      return NextResponse.json({ error: "Invalid Safe Stay ID." }, { status: 400 });
    }

    const validation = validateSafeStayInput(await request.json().catch(() => null));
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
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
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to update Safe Stay." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const id = await getStayId(context);
    if (!uuidPattern.test(id)) {
      return NextResponse.json({ error: "Invalid Safe Stay ID." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
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
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to delete Safe Stay." }, { status: 500 });
  }
}
