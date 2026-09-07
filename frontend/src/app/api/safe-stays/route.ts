import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { validateSafeStayInput } from "@/lib/safeStays";

const stayFields = "id, stay_name, address, check_in, check_out, status, created_at, updated_at";

function unauthorizedResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return null;
}

async function parseJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
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
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to load Safe Stays." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const validation = validateSafeStayInput(await parseJson(request));
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
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
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to create Safe Stay." }, { status: 500 });
  }
}
