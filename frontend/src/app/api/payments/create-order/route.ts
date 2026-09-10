import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { ProtectedBookingHotelSnapshot } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { razorpayClient as razorpay } from "@/lib/services/razorpay";

interface CreateOrderRequestBody {
  hotel?: ProtectedBookingHotelSnapshot & { price?: number; price_per_night?: number };
  destination?: string;
  travellers?: number | string;
  days?: number | string;
  checkInDate?: string | null;
  checkOutDate?: string | null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderRequestBody;
    const hotel = body.hotel;
    const travellers = Number(body.travellers);
    const days = Number(body.days);

    if (!hotel || !travellers || !days) {
      return NextResponse.json({ error: "Missing required trip details" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const pricePerNight = hotel.price || hotel.price_per_night || 0;
    const accommodationCost = pricePerNight * Math.ceil(travellers / 2) * days;
    const amountInPaise = Math.round(accommodationCost * 100);

    if (amountInPaise <= 0) {
      return NextResponse.json({ error: "Invalid accommodation cost" }, { status: 400 });
    }

    const { data: bookingDraft, error: insertError } = await supabase
      .from("protected_bookings")
      .insert({
        hotel_id: hotel.id ? String(hotel.id) : null,
        hotel_snapshot: hotel,
        destination: body.destination || "",
        travellers,
        nights: days,
        rooms: Math.ceil(travellers / 2),
        amount_paise: amountInPaise,
        currency: "INR",
        status: "PAYMENT_PENDING",
        check_in_date: body.checkInDate || null,
        check_out_date: body.checkOutDate || null,
      })
      .select("id")
      .single();

    if (insertError || !bookingDraft) {
      console.error("Database Error:", insertError);
      return NextResponse.json({ error: "Failed to create booking draft" }, { status: 500 });
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `receipt_${bookingDraft.id}`,
    });

    if (!order?.id) {
      return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 });
    }

    await supabase.from("protected_bookings").update({ razorpay_order_id: order.id }).eq("id", bookingDraft.id);

    return NextResponse.json({
      success: true,
      booking_id: bookingDraft.id,
      razorpay_order_id: order.id,
      amount_paise: amountInPaise,
      currency: "INR",
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
