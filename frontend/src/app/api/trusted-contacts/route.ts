import { NextResponse } from "next/server";
import { createSupabaseServerClient, UnauthenticatedError, requireUser } from "@/lib/supabaseServer";
import { validateTrustedContactInput } from "@/lib/trustedContacts";

const contactFields = "id, name, phone, email, relationship, is_active, created_at, updated_at";

function unauthorizedResponse(error: unknown) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode });
  }

  return null;
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("trusted_contacts")
      .select(contactFields)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Trusted contacts list failed:", error.message);
      return NextResponse.json({ error: "Unable to load trusted contacts." }, { status: 500 });
    }

    return NextResponse.json({ contacts: data ?? [] });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to load trusted contacts." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const validation = validateTrustedContactInput(body);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("trusted_contacts")
      .insert({ user_id: user.id, ...validation.value })
      .select(contactFields)
      .single();

    if (error) {
      console.error("Trusted contact create failed:", error.message);
      return NextResponse.json({ error: "Unable to create trusted contact." }, { status: 500 });
    }

    return NextResponse.json({ contact: data }, { status: 201 });
  } catch (error) {
    return unauthorizedResponse(error) ?? NextResponse.json({ error: "Unable to create trusted contact." }, { status: 500 });
  }
}
