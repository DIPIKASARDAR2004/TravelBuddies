-- Migration: Create protected_bookings table

CREATE TABLE IF NOT EXISTS public.protected_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id TEXT,
    hotel_snapshot JSONB,
    destination TEXT,
    travellers INTEGER,
    nights INTEGER,
    rooms INTEGER,
    amount_paise INTEGER,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_refund_id TEXT,
    check_in_date DATE,
    check_out_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fail closed for fresh setups. Apply the dated payment-hardening migration
-- after the policy-fields migration to add ownership and server-only writes.
ALTER TABLE public.protected_bookings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.protected_bookings FROM PUBLIC, anon, authenticated;
