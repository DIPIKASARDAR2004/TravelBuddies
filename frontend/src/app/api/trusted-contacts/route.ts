import { NextResponse } from "next/server";
import {
  CONTACT_FIELDS,
  readTrustedContact,
  readTrustedContacts,
  validateTrustedContactInput,
} from "@/lib/services/trustedContacts";
import { withAuth, parseJson } from "@/lib/services/apiHandler";

export const GET = withAuth(async ({ user, supabase }) => {
  const { data, error } = await supabase
    .from("trusted_contacts")
    .select(CONTACT_FIELDS)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Trusted contacts query failed.");
  return NextResponse.json(
    { contacts: readTrustedContacts({ contacts: data }) },
    { headers: { "Cache-Control": "no-store" } },
  );
}, "Unable to load trusted contacts.");

export const POST = withAuth(async ({ user, supabase, request }) => {
  const validation = validateTrustedContactInput(await parseJson(request));
  if (!validation.valid)
    return NextResponse.json({ error: validation.error }, { status: 400 });
  const { data, error } = await supabase
    .from("trusted_contacts")
    .insert({ user_id: user.id, ...validation.value })
    .select(CONTACT_FIELDS)
    .single();
  if (error) throw new Error("Trusted contact insert failed.");
  const contact = readTrustedContact(
    { contact: data },
    { active: true, details: validation.value },
  );
  return NextResponse.json(
    { contact },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}, "Unable to create trusted contact.");
