import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ProtectedBookingStatus } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ProtectedBookingStatusRow {
  status: ProtectedBookingStatus;
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id: bookingId } = await params;
    const supabase = await createSupabaseServerClient();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });
    }

    const { data: booking, error: fetchError } = await supabase
      .from("protected_bookings")
      .select("status")
      .eq("id", bookingId)
      .single<ProtectedBookingStatusRow>();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "PROTECTED") {
      return NextResponse.json({ error: "Only PROTECTED bookings can be released" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("protected_bookings")
      .update({ status: "RELEASED" satisfies ProtectedBookingStatus })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to release booking" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "RELEASED" satisfies ProtectedBookingStatus,
      message: "Payment released in test mode.",
    });
  } catch (error) {
    console.error("Release Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
