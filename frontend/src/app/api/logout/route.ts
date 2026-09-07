import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabaseRouteClient";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { supabase, applyCookies } = createSupabaseRouteClient(req);
    await supabase.auth.signOut();
    return applyCookies(NextResponse.json({ message: "Signed out successfully" }));
  } catch {
    return NextResponse.json({ message: "Sign out failed" }, { status: 500 });
  }
}
