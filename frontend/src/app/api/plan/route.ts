import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { parseJson } from "@/lib/services/apiHandler";
import { PlannerError, readPlanRequest } from "@/lib/planner/planRequest";
import { loadPlannerCatalog } from "@/lib/planner/catalog";
import { buildPlannerResponse } from "@/lib/planner/buildResponse";
import { readPlannerResponse } from "@/lib/planner/planResponses";

export async function POST(request: Request) {
  try {
    const input = readPlanRequest(await parseJson(request));
    const supabase = await createSupabaseServerClient();
    const catalog = await loadPlannerCatalog(supabase, input.destination);
    return NextResponse.json(
      readPlannerResponse(buildPlannerResponse(input, catalog), input),
    );
  } catch (error) {
    if (error instanceof PlannerError)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    console.error("Trip planning failed unexpectedly.");
    return NextResponse.json(
      { error: "Unable to build a trip plan. Please try again." },
      { status: 500 },
    );
  }
}
