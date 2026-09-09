import { NextResponse } from "next/server";
import { validateTripInput } from '@/lib/services/trips';
import { withAuth, parseJson, ApiHandlerContext } from '@/lib/services/apiHandler';

const tripFields = "id, title, destination, start_date, end_date, sharing, created_at, updated_at";
export const GET = withAuth(async ({ user, supabase }: ApiHandlerContext) => {
              const { data, error } = await supabase
          .from("trips")
          .select(tripFields)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Trip list failed:", error.message);
          return NextResponse.json({ error: "Unable to load trips." }, { status: 500 });
        }

        return NextResponse.json({ trips: data ?? [] });
    });
export const POST = withAuth(async ({ user, supabase, request }: ApiHandlerContext) => {
          const body = await parseJson(request);
        const validation = validateTripInput(body);

        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

            const { data, error } = await supabase
          .from("trips")
          .insert({ user_id: user.id, ...validation.value })
          .select(tripFields)
          .single();

        if (error) {
          console.error("Trip create failed:", error.message);
          return NextResponse.json({ error: "Unable to create trip." }, { status: 500 });
        }

        return NextResponse.json({ trip: data }, { status: 201 });
    });
