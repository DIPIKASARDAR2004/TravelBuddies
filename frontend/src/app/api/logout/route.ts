import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ message: "Signed out successfully" });
  } catch {
    return NextResponse.json({ message: "Sign out failed" }, { status: 500 });
  }
}
