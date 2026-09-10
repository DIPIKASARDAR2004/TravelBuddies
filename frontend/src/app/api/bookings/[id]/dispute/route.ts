import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ProtectedBookingStatus } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DisputeRequestBody {
  reason?: string;
}

interface ProtectedBookingStatusRow {
  status: ProtectedBookingStatus;
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id: bookingId } = await params;
    const supabase = await createSupabaseServerClient();

    let disputeReason = "DENIED_ENTRY";
    try {
      const body = (await request.json()) as DisputeRequestBody;
      if (body.reason) {
        disputeReason = body.reason;
      }
    } catch {
      // Leave the default dispute reason in place when no JSON body is provided.
    }

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
      return NextResponse.json({ error: "Only PROTECTED bookings can be disputed" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("protected_bookings")
      .update({
        status: "DISPUTED" satisfies ProtectedBookingStatus,
        dispute_reason: disputeReason,
      })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update booking status to disputed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "DISPUTED" satisfies ProtectedBookingStatus,
      message: "Booking marked as disputed. Payout frozen.",
    });
  } catch (error) {
    console.error("Dispute Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
