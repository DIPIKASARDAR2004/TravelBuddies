import { NextResponse } from "next/server";
import { validateTrustedContactInput } from '@/lib/services/trustedContacts';
import { withAuth, parseJson, ApiHandlerContext } from '@/lib/services/apiHandler';

const contactFields = "id, name, phone, email, relationship, is_active, created_at, updated_at";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;



export const PATCH = withAuth(async ({ user, supabase, request, params }: ApiHandlerContext) => {
          const id = params.id;
        if (!uuidPattern.test(id)) {
          return NextResponse.json({ error: "Invalid contact ID." }, { status: 400 });
        }

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

            const { data, error } = await supabase
          .from("trusted_contacts")
          .update(validation.value)
          .eq("id", id)
          .eq("user_id", user.id)
          .select(contactFields)
          .maybeSingle();

        if (error) {
          console.error("Trusted contact update failed:", error.message);
          return NextResponse.json({ error: "Unable to update trusted contact." }, { status: 500 });
        }

        if (!data) {
          return NextResponse.json({ error: "Trusted contact not found." }, { status: 404 });
        }

        return NextResponse.json({ contact: data });
    });
export const DELETE = withAuth(async ({ user, supabase, request, params }: ApiHandlerContext) => {
          const id = params.id;
        if (!uuidPattern.test(id)) {
          return NextResponse.json({ error: "Invalid contact ID." }, { status: 400 });
        }

            const { data, error } = await supabase
          .from("trusted_contacts")
          .update({ is_active: false })
          .eq("id", id)
          .eq("user_id", user.id)
          .select(contactFields)
          .maybeSingle();

        if (error) {
          console.error("Trusted contact deactivation failed:", error.message);
          return NextResponse.json({ error: "Unable to remove trusted contact." }, { status: 500 });
        }

        if (!data) {
          return NextResponse.json({ error: "Trusted contact not found." }, { status: 404 });
        }

        return NextResponse.json({ contact: data });
    });
