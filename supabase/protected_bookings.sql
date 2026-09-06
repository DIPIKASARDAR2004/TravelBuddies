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

-- Note: RLS policies can be added later if authentication is implemented.
-- For the current prototype, we will allow anonymous inserts and updates since there is no auth.
ALTER TABLE public.protected_bookings DISABLE ROW LEVEL SECURITY;

-- If RLS is enforced later, you can use these policies:
-- CREATE POLICY "Allow anonymous inserts" ON public.protected_bookings FOR INSERT TO anon WITH CHECK (true);
-- CREATE POLICY "Allow anonymous selects" ON public.protected_bookings FOR SELECT TO anon USING (true);
-- CREATE POLICY "Allow anonymous updates" ON public.protected_bookings FOR UPDATE TO anon USING (true);
