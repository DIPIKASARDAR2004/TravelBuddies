# JourneyPilot Testing Checklist

This is a manual acceptance checklist, not a record of passing checks. Current automated evidence lives in [Project Pulse](../../Project_Pulse.md); current setup lives in [README](../README.md). Tests that create users, bookings, alerts or provider operations require an authorized disposable environment. Never use real customer data.

## 1. Authentication System (`/login`, `/signup`)
- [ ] **Account Creation:** Fill out the signup form and ensure an account is successfully created via Supabase.
- [ ] **Login:** Test login using email and password. Verify it successfully redirects to `/safety` and sets the SSR session cookies correctly.
- [ ] **Protected Routes:** Visit `/safety` or trigger `/api/trusted-contacts` and verify you no longer receive `401 Unauthorized` errors.

## 2. Transport Booking System (`/train`, `/bus`)
- [ ] **UI Rendering:** Ensure the search form, offer cards, and footer render correctly in both light and dark mode.
- [ ] **Component Reusability:** Verify that the `TransportSearchForm` and `TransportFooter` appear identical across both the Train and Bus pages.
- [ ] **Swap Functionality:** Click the swap button (⇄) in the search form to ensure the 'From' and 'To' fields exchange values correctly.
- [ ] **Search Submission:** Submit the form and verify the alert pops up with the correct captured data.

## 3. Intelligent Trip Planner (`/plan`)
- [ ] **Recommendation Engine:** Follow the approval workflow in [brain.md](../brain.md) for the Darjeeling ₹15,000 / 2 travellers / 2 days Golden Test. Agree expected selections before changing rankings; do not force duplicate categories merely to show three plans.
- [ ] **Calculation Integrity:** Ensure the total trip cost does not exceed the `tripSpendingLimit` (Budget minus 10% emergency reserve).
- [ ] **Quality Constraints:** Verify that no hotel or restaurant under a 3.5 rating is recommended.
- [ ] **Upgrades:** Check that "Slight Upgrade" or "Comfortable Upgrade" appear correctly and calculate the `extraNeeded` accurately if budget permits.
- [ ] **Trip Customizer:** Verify that clicking "+" adds the item to the "Custom Additions" section and correctly recalculates the budget. Test deleting custom items.
- [ ] **Map Persistence:** Click "View Trip on Map", verify the interactive map loads, and test the "Back to Trip Planner" button to ensure it preserves state without data loss.

## 4. Protected Checkout Prototype (`/plan/checkout/[id]`)

Follow [payment setup and recovery](payments.md) first. Hosted migration/provider checks below have not been performed during maintenance.

- [ ] **Configuration:** Default-disabled, missing-secret, public/server-key mismatch and live-key configurations fail closed. Never substitute live credentials to finish this checklist.
- [ ] **Database:** Apply reviewed migrations to a disposable project. Anonymous users cannot read bookings; user A cannot read/mutate user B's row; neither can directly write booking states or catalog prices. Verify old column grants and broad policies cannot bypass these boundaries.
- [ ] **Draft:** A catalog-backed order uses the selected dates and trusted amount, ignoring changed browser prices. Lost-response retries with the same key reuse the draft; mismatched details return a conflict.
- [ ] **Dates:** Checkout displays saved dates read-only. A legacy booking with missing dates cannot borrow another trip's dates or start payment.
- [ ] **Test Payment:** Test SDK denial/timeout/dismissal. A valid callback protects a booking only after the provider confirms its matching captured amount. Forged signatures, wrong owners/orders and closed-state replays do not mutate it.
- [ ] **Release/dispute race:** Only one PROTECTED transition wins. RELEASED records a simulated ledger split, not a hotel bank payout. DISPUTED prevents ordinary release but does not freeze provider funds.
- [ ] **Cancellation:** Verify exact 72/24-hour boundaries and integer-paise commission conservation. Unknown/pending/failed refunds remain pending; refresh reuses the original amount/key and confirms processing before showing completion.
- [ ] **Hotel simulator:** Disabled by default; when explicitly enabled, only the booking owner can test full hotel cancellation or the first-night no-show calculation. No-show before check-in is rejected. This is not a real hotel staff role.
- [ ] **Recovery:** Exercise lost callbacks, delayed capture, order-save failure and refund-save failure. Reconcile uncertain results by booking receipt/provider history; never blindly create another payment. Automated webhooks/operator recovery remain unfinished.

## 5. Women Safety Planner (`/safety`)
- [ ] **Catalog Filter:** Verify that safety-planner hotels have the `is_women_friendly` flag set to true; this is not independent safety certification.
- [ ] **Component Refactor:** Verify that all safety components (SOS, Location, Trusted Contacts) render correctly after their migration to `src/components/safety/`.
- [ ] **Trusted contacts:** Create/edit valid owner records; reject malformed fields and cross-owner IDs. Confirm/cancel removal and verify it deactivates rather than erases. A malformed or contradictory mutation response must not show success or silently drop the draft/record.
- [ ] **Record-only SOS:** Confirm/cancel a save; only confirmation requests GPS. Verify denied/stalled location, note preservation, bounded history and navigation before/after POST dispatch. Copy must state that no contact is notified and no help is dispatched, regardless of a stored status label.
- [ ] **Contact/SOS recovery:** Delay initial reads and prevent mutations until loaded. Lose a write response, then refresh and inspect records before explicitly acknowledging and considering another action. Verify no automatic retry. Repeat in concurrent tabs in an authorized environment; the current in-memory guard is not durable idempotency, and latest-ten history is not authoritative reconciliation.
- [ ] **Location:** Verify permission denied/unavailable states and an explicitly shared location. Do not describe a saved location as continuously live tracking.
- [ ] **Consent and unknown outcomes:** In a disposable environment, save a first location with sharing off, enable explicitly, then disable without granting GPS again. Missing consent is rejected. Lose a save response and verify UNKNOWN/refresh behavior; do not assume an aborted request rolled back a write.
- [ ] **Nearby provider:** Verify permission denial, timeout, quota/malformed/partial responses, category changes and navigation cleanup. Check actual listing accuracy separately; an empty search does not prove no services exist. Follow [assistance privacy limits](assistance.md).

## 6. Global Features
- [ ] **JourneyPilot Chatbot:** With authorized provider access, test `gemini-3.6-flash` availability and representative travel prompts. Review answer accuracy independently; local tests use synthetic replies.
- [ ] **Chat behavior:** Check unavailable/malformed/blocked/truncated responses, timeout, close/clear cancellation, draft recovery, keyboard focus and narrow screens. Chat must not auto-load generated images or render raw HTML.
- [ ] **Chatbot prompt limits:** Evaluate off-topic and adversarial requests. The prompt asks for travel-only guidance but is not an enforcement guarantee. Verify the assistant never claims implemented booking actions, verified safety or emergency dispatch.
- [ ] **Privacy and cost:** Review provider/deployment retention and logging, public-route abuse/rate limits and spending limits before enabling chat. Do not submit private records as test prompts.
