-- Add fields for return policy and disputes
ALTER TABLE public.protected_bookings
ADD COLUMN IF NOT EXISTS total_amount_paid INTEGER,
ADD COLUMN IF NOT EXISTS hotel_gross_entitlement INTEGER,
ADD COLUMN IF NOT EXISTS customer_refund_amount INTEGER,
ADD COLUMN IF NOT EXISTS platform_commission_amount INTEGER,
ADD COLUMN IF NOT EXISTS hotel_net_payout INTEGER,
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_time TIMESTAMPTZ;
