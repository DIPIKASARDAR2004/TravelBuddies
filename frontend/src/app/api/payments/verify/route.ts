import crypto from "crypto";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ProtectedBookingStatus } from "@/types";

interface VerifyPaymentRequestBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  booking_id?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPaymentRequestBody;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = body;
    const supabase = await createSupabaseServerClient();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return NextResponse.json({ error: "Missing payment verification details" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("Signature mismatch");

      await supabase
        .from("protected_bookings")
        .update({ status: "PAYMENT_FAILED" satisfies ProtectedBookingStatus })
        .eq("id", booking_id);

      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("protected_bookings")
      .update({
        status: "PROTECTED" satisfies ProtectedBookingStatus,
        razorpay_payment_id,
      })
      .eq("id", booking_id)
      .eq("razorpay_order_id", razorpay_order_id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: "PROTECTED" satisfies ProtectedBookingStatus });
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
