import { NextResponse } from "next/server";
import {
  CONTACT_FIELDS,
  readTrustedContact,
  validateTrustedContactInput,
} from "@/lib/services/trustedContacts";
import { isRecordId } from "@/lib/services/recordChecks";
import { withAuth, parseJson } from "@/lib/services/apiHandler";

export const PATCH = withAuth(async ({ user, supabase, request, params }) => {
  const id = params.id;
  if (!isRecordId(id))
    return NextResponse.json({ error: "Invalid contact ID." }, { status: 400 });
  const validation = validateTrustedContactInput(await parseJson(request));
  if (!validation.valid)
    return NextResponse.json({ error: validation.error }, { status: 400 });
  const { data, error } = await supabase
    .from("trusted_contacts")
    .update(validation.value)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .select(CONTACT_FIELDS)
    .maybeSingle();
  if (error) throw new Error("Trusted contact update failed.");
  if (!data)
    return NextResponse.json(
      { error: "Trusted contact not found." },
      { status: 404 },
    );
  const contact = readTrustedContact(
    { contact: data },
    { id, active: true, details: validation.value },
  );
  return NextResponse.json(
    { contact },
    { headers: { "Cache-Control": "no-store" } },
  );
}, "Unable to update trusted contact.");

export const DELETE = withAuth(async ({ user, supabase, params }) => {
  const id = params.id;
  if (!isRecordId(id))
    return NextResponse.json({ error: "Invalid contact ID." }, { status: 400 });
  // Existing API semantics: deactivate, do not erase. Repeating this is idempotent.
  const { data, error } = await supabase
    .from("trusted_contacts")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(CONTACT_FIELDS)
    .maybeSingle();
  if (error) throw new Error("Trusted contact deactivation failed.");
  if (!data)
    return NextResponse.json(
      { error: "Trusted contact not found." },
      { status: 404 },
    );
  const contact = readTrustedContact({ contact: data }, { id, active: false });
  return NextResponse.json(
    { contact },
    { headers: { "Cache-Control": "no-store" } },
  );
}, "Unable to remove trusted contact.");
