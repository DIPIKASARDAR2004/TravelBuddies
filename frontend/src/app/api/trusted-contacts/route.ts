import { NextResponse } from "next/server";
import { validateTrustedContactInput } from '@/lib/services/trustedContacts';
import { withAuth, parseJson, ApiHandlerContext } from '@/lib/services/apiHandler';

const contactFields = "id, name, phone, email, relationship, is_active, created_at, updated_at";
export const GET = withAuth(async ({ user, supabase }: ApiHandlerContext) => {
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
    });
export const POST = withAuth(async ({ user, supabase, request }: ApiHandlerContext) => {
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
          .insert({ user_id: user.id, ...validation.value })
          .select(contactFields)
          .single();

        if (error) {
          console.error("Trusted contact create failed:", error.message);
          return NextResponse.json({ error: "Unable to create trusted contact." }, { status: 500 });
        }

        return NextResponse.json({ contact: data }, { status: 201 });
    });
