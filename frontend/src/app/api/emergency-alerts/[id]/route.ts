import { NextResponse } from "next/server";
import { withAuth, parseJson, ApiHandlerContext } from '@/lib/services/apiHandler';

const alertFields = "id, latitude, longitude, message, status, created_at, resolved_at";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const GET = withAuth(async ({ user, supabase, request, params }: ApiHandlerContext) => {
          const id = params.id;

        if (!uuidPattern.test(id)) {
          return NextResponse.json({ error: "Invalid alert ID." }, { status: 400 });
        }

            const { data, error } = await supabase
          .from("emergency_alerts")
          .select(alertFields)
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Emergency alert lookup failed:", error.message);
          return NextResponse.json({ error: "Unable to load emergency alert." }, { status: 500 });
        }

        if (!data) {
          return NextResponse.json({ error: "Emergency alert not found." }, { status: 404 });
        }

        return NextResponse.json({ alert: data });
    });
