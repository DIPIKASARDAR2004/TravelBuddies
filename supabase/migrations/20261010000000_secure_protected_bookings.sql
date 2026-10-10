-- Review/back up before applying to a disposable project, then an authorized host.
-- No owner is guessed for old rows. Existing unowned rows remain private legacy data.
BEGIN;
ALTER TABLE public.protected_bookings
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_key_id text,
  ADD COLUMN IF NOT EXISTS idempotency_key uuid,
  ADD COLUMN IF NOT EXISTS request_fingerprint text,
  ADD COLUMN IF NOT EXISTS order_creation_state text NOT NULL DEFAULT 'LEGACY',
  ADD COLUMN IF NOT EXISTS refund_action text,
  ADD COLUMN IF NOT EXISTS refund_target_status text,
  ADD COLUMN IF NOT EXISTS refund_idempotency_key uuid;

ALTER TABLE public.protected_bookings
  ADD CONSTRAINT booking_order_creation_state_check CHECK (order_creation_state IN ('LEGACY','CREATING','READY','RECONCILE')),
  ADD CONSTRAINT booking_refund_action_check CHECK (refund_action IS NULL OR refund_action IN ('TRAVELLER_CANCEL','HOTEL_CANCEL','NO_SHOW')),
  ADD CONSTRAINT booking_managed_amount_check CHECK (order_creation_state = 'LEGACY' OR COALESCE((amount_paise > 0 AND currency = 'INR' AND nights BETWEEN 1 AND 365 AND travellers BETWEEN 1 AND 100 AND rooms = (travellers + 1) / 2 AND check_out_date - check_in_date = nights AND payment_key_id ~ '^rzp_test_[a-zA-Z0-9]+$' AND idempotency_key IS NOT NULL AND request_fingerprint ~ '^[a-f0-9]{64}$'), false)) NOT VALID;

-- Abort on duplicate provider IDs; never silently deduplicate payment history.
CREATE UNIQUE INDEX booking_owner_request_key ON public.protected_bookings(user_id, idempotency_key);
CREATE UNIQUE INDEX booking_provider_order_key ON public.protected_bookings(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX booking_provider_payment_key ON public.protected_bookings(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE INDEX booking_owner_created ON public.protected_bookings(user_id, created_at DESC);

ALTER TABLE public.protected_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protected_bookings FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.protected_bookings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.protected_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.protected_bookings TO service_role;
CREATE POLICY booking_owner_read ON public.protected_bookings FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
-- Even a previously installed permissive SELECT policy cannot widen ownership.
CREATE POLICY booking_owner_read_boundary ON public.protected_bookings AS RESTRICTIVE FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

-- The catalog price is authoritative only if browsers cannot modify it.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public."Hotels" FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public."Hotels" TO service_role;

-- Table REVOKE does not remove older column-specific grants. Remove those too.
DO $$
DECLARE column_grant record;
BEGIN
  FOR column_grant IN
    SELECT c.relname, a.attname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_attribute a ON a.attrelid = c.oid
    WHERE n.nspname = 'public' AND c.relname IN ('protected_bookings', 'Hotels') AND a.attnum > 0 AND NOT a.attisdropped
  LOOP
    EXECUTE format('REVOKE INSERT (%I), UPDATE (%I), REFERENCES (%I) ON public.%I FROM PUBLIC, anon, authenticated', column_grant.attname, column_grant.attname, column_grant.attname, column_grant.relname);
    IF column_grant.relname = 'protected_bookings' THEN
      EXECUTE format('REVOKE SELECT (%I) ON public.protected_bookings FROM PUBLIC, anon, authenticated', column_grant.attname);
    END IF;
  END LOOP;
END $$;
COMMIT;
