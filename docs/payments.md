# Protected bookings: test-mode implementation

This is a local prototype, not regulated escrow or a production payment service.
Provider operations are disabled by default and reject live Razorpay keys. Hosted
Supabase, Razorpay transactions, merchant payouts and operational recovery have
**not** been verified here.

## Responsibilities

Paths below are relative to `frontend/src/`.

| Module | Owns |
| --- | --- |
| `lib/checkout/paymentContracts.ts` | Request validation, integer-paise calculations, cancellation rules |
| `lib/checkout/paymentServer.ts` | Authenticated payment boundary, test-only configuration, server-only database client |
| `lib/checkout/bookingPayments.ts` | Owner checks, catalog pricing, idempotency and guarded booking transitions |
| `lib/services/razorpay.ts` | Concrete order/payment/refund HTTP calls, response checks and 15-second request timeout |
| `lib/checkout/bookingResponses.ts` | Browser-facing booking/action response validation |
| `hooks/useBookingDraft.ts` | Selected trip payload and retry key; never trusted pricing |
| `hooks/useRazorpay.ts` | Checkout modal and verification UI; SDK loading is isolated in `lib/client/razorpayCheckout.ts` |

Routes parse requests, call these concrete operations and return responses. There
is no generic repository layer. The unused server SDK and fake-refund-ID fallback
were removed; an uncertain provider result is never reported as success.

## Configuration and migration order

Ordinary installs, builds and tests do not enable payments or apply SQL. First
obtain authorization for an isolated Supabase project and Razorpay test account.
Preserve existing local environment files.

1. Review and back up the target database. It must contain the existing
   `public."Hotels"` catalog and Supabase auth roles/functions. The repository does
   not provide a complete catalog/bootstrap migration; do not invent records or
   assume the SQL files provision the entire application.
2. For a fresh booking table, apply `supabase/02_protected_bookings.sql`, then
   `supabase/migrations/20260908000000_add_booking_policy_fields.sql`. If already
   applied, verify their schema instead of blindly replaying them.
3. Inspect duplicate non-null `razorpay_order_id` / `razorpay_payment_id` values
   before applying `supabase/migrations/20261010000000_secure_protected_bookings.sql`.
   It runs transactionally and deliberately aborts on duplicate provider IDs.
   Reconcile history with the provider; never delete duplicates merely to make a
   migration pass. Apply this migration once through your migration process.
4. Confirm owner-only reads and blocked direct client writes using two separate
   test users and an anonymous client. Verify clients cannot modify catalog prices.
   The migration revokes table **and existing column** write grants, enables/forces
   booking RLS, and adds both an owner SELECT policy and a restrictive ownership
   boundary against older broad SELECT policies.
5. Set server-only `SUPABASE_SERVICE_ROLE_KEY`, matching test
   `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`, and public
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`. Set `PAYMENTS_TEST_MODE_ENABLED=true` only in that
   approved test environment. Keep `HOTEL_SIMULATOR_ENABLED=false` unless deliberately
   testing the owner-operated hotel simulator. Never expose either secret as a
   `NEXT_PUBLIC` variable. Rebuild after changing public configuration.

Existing rows receive `order_creation_state=LEGACY`; no owner is guessed and no
payment history is deleted. Unowned rows are unreadable to browser users, and
legacy rows cannot perform payment actions. Account deletion nulls ownership,
preserving financial history. The managed-row check is `NOT VALID` for old data:
it constrains subsequent writes, not a certification of historical rows.

The privileged client does not inherit browser cookies. Every mutation verifies
the authenticated user and filters by owner. Privileged credentials can bypass
RLS, so application checks are essential; table grants and RLS are separate
protections. See [Supabase's RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Request and pricing contract

`POST /api/payments/create-order` requires a UUID `Idempotency-Key` header and:

```json
{
  "hotel": { "name": "<exact catalog hotel name>" },
  "destination": "<catalog destination>",
  "travellers": 2,
  "days": 2,
  "checkInDate": "2026-10-12",
  "checkOutDate": "2026-10-14"
}
```

The hotel/destination strings must contain 1–200 characters; travellers are whole
numbers from 1–100, nights (`days`) from 1–365. Dates must be real calendar dates and
their difference must equal nights. These bounds are implementation limits, not
an availability check or a confirmed hotel booking.

The server requires exactly one matching catalog hotel (exact name,
case-insensitive exact destination). Missing/ambiguous matches, invalid prices and
ratings outside 3.5–5 fail closed. Destination wildcard characters are escaped.
Browser-provided prices, owner IDs, status and totals are ignored. The trusted
amount is `price_per_night × ceil(travellers / 2) × nights`, converted to integer
paise; sub-paise prices are rejected. Recommendation scores, selection rules and
the 10% budget reserve are unchanged.

The browser preserves the latest payload/key in session storage. Same-payload
retries, including reload after a lost response, reuse that key. Storage-disabled
browsers retain it only while that component remains mounted. Different payloads
create new attempts; this is not a global exactly-once guarantee across devices.

## State and retry behavior

Order creation and booking status are separate fields:

```text
order_creation_state: CREATING → READY
                             ↘ RECONCILE (unknown provider/save outcome)

booking status: PAYMENT_PENDING → PROTECTED → RELEASED (ledger simulation only)
                                           → DISPUTED
                                           → REFUND_PENDING → CANCELLED_BY_USER
                                                            → CANCELLED_BY_HOTEL
                                                            → NO_SHOW
```

- Creation first saves owner, amount, request fingerprint and unique retry key.
  One concurrent claimant may request the provider order. Its receipt is the
  booking UUID. A READY replay returns the existing booking; changed details with
  the same key return 409. CREATING/RECONCILE attempts never create another order.
- `POST /api/payments/verify` accepts booking ID, provider order/payment IDs and
  signature. It checks ownership, stored test account/order, constant-time HMAC,
  and the provider's matching captured INR amount with no prior refund. Only a
  confirmed `PAYMENT_PENDING` row update becomes PROTECTED. Forged callbacks make
  no writes. Exact successful replays are safe; closed/disputed/refunding bookings
  cannot be reopened. Provider IDs have database uniqueness constraints.
- `POST /api/bookings/:id/release` and `/dispute` require PROTECTED and use
  compare-and-set updates. RELEASED records the commission split; it does not send
  money to a hotel. DISPUTED is a local state, not a provider freeze or dispute case.
- `POST /api/bookings/:id/cancel` saves the calculation and durable refund key
  before requesting a refund. REFUND_PENDING blocks competing actions. Provider
  pending/failed/unknown outcomes stay pending with HTTP 202. Only a confirmed
  processed refund (or a zero-refund no-show) reaches the target state.
- `POST /api/bookings/:id/refund` refreshes the saved refund. If no refund ID was
  saved, it retries the identical amount/key; otherwise it fetches that refund.
  Elapsed time never changes the saved cancellation tier during retry.
- `POST /api/hotel-admin/bookings/:id/cancel` is an explicitly enabled **owner-only
  test simulator**, not hotel staff authorization. It accepts only CANCEL or
  NO_SHOW, and no-show is rejected before the prototype check-in instant.

Verification follows the stored-order signature and payment-state contract in
[Razorpay's web integration guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).
Refund POSTs use the durable `X-Refund-Idempotency` key with an unchanged payload as
documented by [Razorpay's idempotent-refund reference](https://github.com/razorpay/markdown-docs/blob/master/api/refunds/normal-refunds-idempotent.md).
Neither contract substitutes for testing the actual account/provider behavior.

## Unknown outcomes: do not start another payment

An operator must reconcile CREATING/RECONCILE rows using the booking receipt,
account, expected amount and provider order/payment history. Do not clear the key,
delete the row, guess an order ID, or blindly repeat order creation. There is no
automated recovery worker or operator repair UI yet; any manual database repair
requires explicit authorization and an audit trail.

For REFUND_PENDING, use the same booking's status refresh. Provider failures are
not “refunded.” A failed refund or mismatched provider response requires operator
review; do not replace its durable key to bypass the failure. Lost verification
callbacks, delayed capture, server crashes and provider webhooks still need an
operational recovery design and hosted tests. Never ask a traveller to pay again
just because the callback failed.

## Verification and remaining gates

`npm run check` covers pure policies, adversarial route tests, adapter contracts
and the actual migration in local PGlite PostgreSQL. Those SQL tests simulate
Supabase roles and `auth.uid()`; they do not prove hosted PostgREST/JWT integration.
Production Chromium tests mock booking APIs/provider callbacks and block other
external browser traffic. See [Project Pulse](../../Project_Pulse.md) for counts.

Before real use: verify hosted grants/RLS and test-account capture/refund behavior;
add callback/webhook/reconciliation recovery, rate limits and real hotel roles;
review date/availability rules, catalog administration and quote freshness; define
privacy/retention, audit and merchant settlement operations. The current policy
uses midnight UTC for a date-only check-in: property-local check-in time is absent
and must be agreed before release. See [the policy prototype](return_policy.md).

No live payments, legal guarantees, bank payouts, safety certification or release
approval are established by these local checks.
