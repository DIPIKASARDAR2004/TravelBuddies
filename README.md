# TravelBuddies

A Next.js travel-planning prototype with budget recommendations, itineraries/maps, safety records, and a test-mode protected-booking workflow. The existing feature boundaries are retained; this refactor strengthens them without introducing a generic service or rules framework.

## Setup

Use Node.js 24 and npm (local checks have passed on Node 24 and Node 26).

```bash
cd frontend
npm ci
# If no local environment exists, copy .env.example to .env.local and configure it.
npm run dev
```

Open localhost:3000. Preserve an existing .env.local; never overwrite it with the example. Public pages can render with placeholder browser Supabase settings, but authenticated/data features require a configured project. For production, run `npm run build`, then `npm start` from frontend.

## Environment and external services

See [frontend/.env.example](frontend/.env.example), the single maintained environment template. Only browser-safe, restricted keys belong in NEXT_PUBLIC variables.

| Variable | Purpose |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY | Browser and cookie-scoped server Supabase client; access must be enforced by RLS |
| NEXT_PUBLIC_GOOGLE_MAPS_API_KEY | Browser Maps API key: restrict origins and enabled APIs |
| AI_CHATBOT_API_KEY | Server-only chat credential; never put it in a NEXT_PUBLIC variable |
| RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET | Server-side payment integration; use test credentials for development |
| NEXT_PUBLIC_RAZORPAY_KEY_ID | Public checkout key ID; must match the server's test account (never expose its secret) |
| PAYMENTS_TEST_MODE_ENABLED | Server flag, `false` by default; explicit `true` plus valid test configuration enables booking mutations |
| SUPABASE_SERVICE_ROLE_KEY | Privileged server-only booking writer, never bundled or passed to a browser |
| HOTEL_SIMULATOR_ENABLED | Server flag, `false` by default; enables owner-only hotel-action simulation, not hotel staff privileges |

Payment operations now fail closed until the ownership/grants migration and test-only configuration are in place. Follow [the payment setup and recovery guide](docs/payments.md); setting a UI test label is not sufficient. Do not enable this against real customer data.

The unused browser translation adapter referencing a public Gemini key was removed. Translation is not currently wired to a user flow. Any future implementation must keep the provider secret server-side with authorization, quotas, and bounded requests.

Chat uses the existing `gemini-3.6-flash` model through a server-only checked HTTP adapter; the unused legacy SDK dependency and unreferenced speech hook were removed. No voice UI is implemented. See [assistance contracts, privacy and limits](docs/assistance.md) before enabling chat or collecting locations.

## Architecture

- `frontend/src/app`: route/page composition and HTTP boundaries.
- `src/lib/services/apiHandler.ts`: authenticated server handlers; unexpected errors return a public fallback, not private provider details.
- `src/lib/client/requestJson.ts`: transport, header normalization, empty responses, JSON errors, cancellation and a default timeout.
- `src/lib/services/apiClient.ts`: UI adapter adding one toast to the transport contract. Endpoint-specific validation still belongs to the feature.
- `src/lib/services/{locationShares,safeStays,...}`: concrete feature rules and validation.
- `src/lib/auth/contracts.ts`: checked credential/signup inputs and projected provider outcomes. `src/lib/auth/server.ts`: bounded login/signup/logout route orchestration; it uses the existing cookie-scoped Supabase factory, not a new auth framework.
- `src/components/auth/AuthForm.tsx` and `src/hooks/useAuthForm.ts`: shared personal login/signup fields and request lifecycle. `src/lib/auth/client.ts` checks HTTP outcomes and distinguishes rejected from uncertain attempts; route pages compose the existing auth shell.
- `src/lib/auth/navbarSession.ts`: navbar identity/logout lifecycle, with a concrete SDK adapter in `useNavbarSession`. `NavbarAccount` shares desktop/mobile account presentation; theme-storage failures no longer prevent session initialization.
- `src/lib/planner`: budget/selection logic. `src/lib/checkout`: payment contracts, owner-scoped transitions, guarded test configuration and browser response validation; [payment module map](docs/payments.md#responsibilities).
- Planner boundaries now have separate request/catalog/response modules and `usePlannerSearch` for cancellable, validated UI requests. `planStorage.ts` restores only valid data fields and tolerates unavailable storage; [planning contracts and module map](docs/planning.md).
- `src/hooks/useTripCustomizer.ts` owns adjustment actions; `CustomizerBudget` presents totals. Existing calculation rules stay in `planUtils.ts`.
- `src/lib/itinerary` owns activity distribution, coordinate checks and route/timing composition. `src/lib/client/googleRoutes.ts` checks the provider contract with a bounded wait; `src/app/map/useTripRoutes.ts` owns drawings and cleanup. `GoogleTripMap` handles loading and markers; [map behavior and limits](docs/planning.md#map-preview-and-failure-behavior).
- `src/components/safety/useSafeStays.ts`: Safe Stay loading/mutations/reminders; `safestay.tsx` contains the view and reuses existing UI controls. `stayDates.ts` owns the browser-local input/UTC conversion.
- `src/hooks/useBookingDraft.ts`: customizer-to-checkout request, selected dates, validated draft ID and a session-persisted retry key. Only the server prices a booking from the trusted catalog.
- `src/lib/services/razorpay.ts`: server-only HTTP adapter with bounded requests and checked order/payment/refund responses; unknown outcomes never become simulated refunds.
- `src/lib/client/razorpayCheckout.ts`: checkout SDK loading with a 10-second timeout, constructor checks and abort cleanup. `useRazorpay` owns one gateway attempt, deduplicates callbacks, cancels local verification on departure and checks acknowledgements before showing success. Unknown verification/provider-failure outcomes require recovery, not another payment attempt.
- `src/hooks/useCheckoutBooking.ts`: booking reads/actions, per-mounted-booking cancellation and explicit uncertain-outcome review. `src/lib/checkout/checkoutClient.ts`: concrete Supabase/action adapters, action-specific acknowledgement checks and 15-second waits including response bodies. The checkout view is keyed by booking ID; [payment lifecycle and limitations](docs/payments.md#browser-checkout-lifecycle) describe recovery boundaries.
- `src/lib/chat/{contracts,gemini}.ts` and `src/hooks/useTripAssistant.ts`: bounded conversations, one server-side generation request, checked replies and recoverable browser drafts. `Chatbot` owns presentation, focus and restricted Markdown.
- `src/components/safety/{useLocationSharing,useNearbyServices}.ts`: explicit one-time location actions, validated responses and navigation cleanup. `src/lib/services/overpass.ts` owns the nearby provider call; [module map and failure behavior](docs/assistance.md).
- `src/components/safety/{useTrustedContacts,useEmergencyAlerts}.ts`: contact editing/deactivation and record-only SOS confirmation, with checked responses, bounded requests and recovery after uncertain writes. Views do not own fetch workflows; [contracts and recovery limits](docs/assistance.md#trusted-contacts-and-sos-records).
- `frontend/scripts`: manually invoked database diagnostics/data maintenance, separate from tests.

Supabase browser clients use the anon key. Ordinary server clients use request cookies and verified users. Payment writes use a separate privileged server-only client after authentication and explicit owner checks; it never inherits user cookies. No service-role secret belongs in client bundles. The location-sharing route checks both authenticated ownership and the coordinate/opt-in contract before mutation.

### Auth HTTP boundary

`POST /api/login` accepts string `email` and `password`; `POST /api/signup` also requires `fullName`. Email/name are trimmed, passwords are not. Email is capped at 254 characters and passwords at 1024; signup names must be 3–120 characters and signup passwords at least six. Hosted password policy can be stricter. Login does not impose the signup minimum on existing passwords. Malformed JSON, non-string fields and invalid/oversized fields are rejected before a provider client is constructed. These are field limits, not a deployment request-body/rate limit.

| Endpoint | Successful JSON outcome |
| --- | --- |
| Login | `status: "authenticated"`, safe `message`, and `user: { id }` after a matching user/session acknowledgement |
| Signup | `status: "authenticated"` with `user: { id }`, or `status: "confirmation_required"` without a user record |
| Logout | `status: "signed_out"` only after the SDK returns no error |

Login/logout success use HTTP 200; signup retains HTTP 201 for compatibility. The confirmation-required wording is conditional: Supabase can obfuscate an already-registered address, so it is **not proof that a new account was created**. Responses never return session tokens or the full provider user record. Errors use `{ error: string }` with safe messages; provider diagnostics are not forwarded. Responses are `no-store`. Requests with an explicit different `Origin` are rejected; origin-less API clients remain supported. Reverse-proxy/origin behavior still needs hosted acceptance.

The routes wait at most ten seconds, forward cancellation to provider HTTP, and prevent late work from starting an auth call or writing session cookies after that wait ends. A timeout means the outcome is unconfirmed: it does not retract a provider request, revoke a session, or undo a signup email. Auth routes require writable cookies; cookie-write failures cannot become login success. Ordinary server-component clients retain their existing read-only-cookie tolerance. Cookie batches/provider operations are not atomic transactions or rollback guarantees.

Only name/email/password are supported by this registration boundary. Legacy `phone`, `accountType`, confirmation and claimed role fields are not persisted or used to grant privileges. Forms no longer collect the discarded phone number or advertise business/host onboarding. Password confirmation remains a local signup check and is not transmitted. Unsupported policy-agreement/payment-certification wording has been replaced by a prototype limitation notice; this is not a legal acceptance flow.

The shared form uses the same input rules as the server and a synchronous in-flight guard. Fields are locked while submitting; leaving aborts the request and suppresses late UI/navigation. A 15-second browser deadline covers headers and body reading, including a transport that ignores abort. Only a checked authenticated acknowledgement navigates to `/safety`, using a full document navigation so the browser SDK reads fresh server-set cookies rather than retaining its old cached session. Confirmation-required signup stays on screen with conditional email guidance, not a new-account guarantee.

Explicit rejection permits correction; network loss, server failure, timeout or malformed success locks another attempt until the user acknowledges checking their email/session. There is no automatic retry. That acknowledgement is not provider verification, rollback or idempotency; this guard is local to the mounted form and does not survive reload or coordinate tabs/devices. Credentials remain in component memory only; no new credential logging/storage was introduced. Existing authentication cookies are still managed by Supabase.

The navbar independently checks `getUser()` results, distinguishes absent sessions from unavailable verification, and projects only a display identity. SDK auth events invalidate older reads; new-identity events schedule verification outside the SDK callback. These UI states are not authorization grants or a replacement for server/RLS checks. Desktop/mobile controls share the same controller, and failed theme storage does not break auth initialization.

Navbar logout retains the browser SDK's existing global scope and local-cookie/broadcast behavior, but now checks its returned error and guards duplicate operations. The installed SDK may clear local cookies **even when remote sign-out fails**. That failure remains a visible warning after local sign-out or a subsequent session check; no successful remote revocation is inferred. Checked success navigates home; late completion after timeout, identity change, departure or disposal cannot redirect a newer page.

Identity/logout waits become visibly unavailable after 15 seconds. The SDK methods used here do not expose cancellation: pending logout continues underneath, so another check/logout is disabled until it settles. A late result permits explicit recovery but does not automatically report success or navigate. Reloading cannot undo its provider effects. Cross-tab session creation, local SDK cookie mutations and remote revocation are not atomic with a concurrent login. Existing access-token validity, other-device sessions, cached page data and broader hosted privacy/security acceptance still need review; this navbar is not a route guard or data-erasure mechanism.

Hosted confirmation delivery, rate/abuse controls, session revocation, cookie policy and RLS remain separate gates; no real account is created by the local tests.

Safe Stay routes use the authenticated user for inserts and constrain reads, updates and deletes by owner. The feature validates incoming fields and browser response shapes, including timestamps and mutation IDs. Initial loading is cancelled on unmount and bounded to 15 seconds. Date fields display browser-local time; unchanged edits preserve the original instant and seconds, including a repeated daylight-saving hour. Nonexistent local times are rejected. A reminder appears on an explicit active check-in, not when existing records load; completing/deleting that stay clears its reminder. These reminders are not an emergency-response service.

The planner remains public and preserves its recommendation scoring/formulas. Input and nested output contracts now distinguish invalid requests, unavailable catalogs and genuinely missing data. Four catalog queries run concurrently with a 15-second bound. Browser results must match the submitted trip; navigation cancels pending work, invalid stored selections reset to the form, and blocked session storage leaves in-memory planning usable. The adjustment dialog supports keyboard dismissal and focus return. Separate owner-scoped saved-trip routes validate their records and confirmed mutation results; they are not yet connected to the planner UI. See [planning contracts](docs/planning.md) for technical input limits and existing API behavior.

## Verification

From frontend:

```bash
npm run check  # lint, TypeScript, isolated tests
npm run build # production build with type/lint bypasses removed
PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install chromium
npm run test:e2e # fresh production build + localhost:4182 + Chromium
```

The isolated suite covers transport, coordinate/opt-in validation, owner-scoped location and Safe Stay routes, malformed inputs and response contracts, timezone/DST conversion, budget rounding/reserves/extras, and booking-stage presentation. Payment tests cover authentication, forged/other-owner requests, catalog pricing, concurrent creation, signature/capture checks, guarded transitions and repeatable refunds. Local PGlite tests execute the actual migration with simulated Supabase roles, including legacy grants, anonymous access and forbidden client writes. TypeScript checks include test/config files. See [the workspace progress journal](../Project_Pulse.md) for run counts and evidence.

Auth tests cover malformed credentials, safe acknowledgement/error projection, confirmation-required versus immediate sessions, same-origin checks, deadlines/cancellation and late SDK results. A separate suite uses the actual installed Supabase SDK/SSR adapter with synthetic HTTP and cookie stores to verify cookie writes, write failures and canceled late writes. It makes no external auth requests and does not replace hosted confirmation/cookie acceptance.

Auth-form browser tests mock HTTP outcomes and exercise validation/projection, both signup outcomes, legacy short-password login, fresh navigation, duplicate submits, rejection/rate limits, uncertain outcomes/explicit acknowledgement, timeout, departure and mobile/password controls. They do not establish a hosted session or confirm delivery of email. Run only this slice with `npm run test:e2e -- tests/browser/authForms.spec.ts`; the normal browser command also includes it.

Navbar tests cover malformed/failed identities, stale reads/events, duplicate logout, timeout, departure/identity change and disposal. `npm run test:e2e -- tests/browser/navbarSession.spec.ts` uses the installed browser SDK with synthetic cookies and mocked provider HTTP to exercise successful/failed local cookie clearing, explicit recovery, stalled operations, a synthetic broadcast sign-out, blocked theme storage and mobile controls. No real provider call or second-device revocation is implied.

The browser suite covers Safe Stay creation/edit/completion/deletion and failures, mobile reminder behavior, normal and safety planning, preserved selection after reload, draft-date forwarding and retry-key reuse after a lost response. Checkout coverage includes unavailable/malformed data, no date borrowing from another trip, denied actions, dispute and pending-refund refresh. It also covers blocked/stalled payment SDKs, modal dismissal and malformed/successful mocked verification. Tests use explicitly synthetic fixtures; they do not establish real business prices or approve recommendation rankings. All browser API requests are mocked and other external traffic is blocked. Payment callbacks use a local fake SDK where needed. No hosted records or payment orders are created.

Contact/SOS tests cover authenticated owner queries, invalid inputs/records, state/ID mismatches, deactivation, safe errors and latest-ten history. Browser checks exercise the full contact editor, confirmation/cancellation, locked pending forms, duplicate clicks, unknown-outcome refresh/review, denied/stalled GPS, request deadlines, navigation cleanup and 375px layouts. They do not prove hosted RLS, real-device permissions, notification delivery or duplicate-free writes across sessions.

The browser command builds with fake public credentials (including Maps), empty AI and service-role credentials, and payment/simulator flags explicitly disabled, independently of `.env.local`. Rebuild with the intended environment before any deployment. It always starts a fresh local server, never reuses a development session, and retains screenshots/traces for failures under ignored `test-results/`. If multiple projects use different Playwright versions, `PLAYWRIGHT_SKIP_BROWSER_GC=1` avoids removing their cached browsers. The production build currently fetches its Google font, so building still requires that network access; browser journeys themselves need no provider access.

These checks establish isolated payment rules and local SQL enforcement, not hosted RLS or provider settlement. Before release, use an authorized disposable Supabase project to verify migrations and user-A/user-B access; use Razorpay test mode for capture, callback recovery, idempotency, retries and refunds. Also exercise login/session refresh, hosted trip creation, actual-provider maps, other safety tools, and broader keyboard/mobile journeys.

Planner/trip tests also cover coercion attempts, private database errors, query failures versus missing records, free activities, shape validation, saved-state method injection and owner-scoped trip mutations. Browser regressions cover malformed/mismatched responses, corrupt/denied storage, timeout/retry, navigation cancellation, swaps, over-budget/free add-ons, reload persistence and dialog focus. Synthetic fixtures establish these mechanics only; they do not approve real catalog rankings or the Darjeeling Golden Test.

Map tests cover coordinate validation, ordered/complete route legs, pure draft timing, partial provider failures, timeout/unmount cancellation and activity overflow. Browser journeys exercise the real React map wrapper with a fake SDK: stable requests across unrelated renders, polyline cleanup, missing coordinates, blocked/stalled loading, late responses and normal/safety planner return. Customizer budget/reserve inputs retain the existing formulas. No Google route requests or tiles are fetched by these tests; real API restrictions, quotas, billing and mobile map gestures remain acceptance gates.

Chat/location/nearby tests cover strict request/reply contracts, explicit sharing consent, spoofed ownership, unknown write outcomes, provider redaction, bounded waits and cancellation. Browser regressions cover draft recovery, keyboard closing, blocked generated images/unsafe HTML, location denial/timeout, sharing-off without GPS, late location callbacks and stale nearby categories. Actual Google/Overpass calls and real device permissions are not exercised.

## Database/data scripts

Run scripts **from frontend/**. They load frontend/.env.local without printing keys. Read the script first: even diagnostics may print customer/database rows. Do not paste their output publicly.

- Read-only database queries: `node scripts/check_schema.mjs`, `check_columns.mjs`, `inspect_darjeeling.mjs`, `fetch_coords.mjs`.
- Local planner diagnostic: `node scripts/test_plan.mjs` calls an already-running local API and is not an isolated automated test.
- Mutating: `insert_activities.mjs`, `insert_darjeeling.mjs`, `update_null_coords.mjs` require explicit `--allow-writes`. Back up the chosen database, review target rows, and use a disposable environment first. Never include these scripts in an install/build hook.

No scripts or migrations were run against hosted data during this refactor.

The local-check workflow is defined in `.github/workflows/check.yml`. Hosted CI execution remains unverified. Compatible dependency updates cleared the production-only npm audit findings at the October 10 checkpoint; development lint-tool findings still need review.

## Documentation and release limits

This README is authoritative for setup, architecture, and current quality commands. [Workflow](docs/workflow.md) indexes the current feature guides; [presentation guidance](docs/presentation_guide.md) distinguishes demonstrations from unimplemented claims. Older duplicate presentation/journey paths point there. The [manual checklist](docs/testing_checklist.md) records acceptance tasks, not passing results; the [policy prototype](docs/return_policy.md) is not a legal guarantee. [Branch review](GIT_CHEATSHEET.md) is a separate later workflow and does not claim that `testing` has been created or published. Historical map/planning proposals remain labeled as such.

### Payment hardening and remaining release gates

The previously observed browser-price, missing-owner, empty-secret and unchecked-state-update defects have been addressed locally:

- Orders are priced from an unambiguous trusted catalog row, with owner-bound retry keys and guarded creation. Browser prices are ignored.
- Payment actions authenticate first, check ownership, reject live/missing/mismatched configuration and confirm matching-row state transitions. Verification checks the stored order, signature and captured amount; forged callbacks cannot mutate bookings.
- The new migration restricts browser reads to owners and removes browser booking/catalog write privileges. Refund retries retain the original amount/key; pending/failed provider outcomes never become fake success.

This does not finish a production payment system. The migration has not been applied to hosted data; legacy rows are not automatically assigned to users. Reconciliation/webhooks, real hotel roles, provider capture/refund tests, rate limits, property-local check-in rules and merchant settlement remain open. RELEASED is a ledger simulation, not a bank payout; DISPUTED is not a provider freeze. The [payment guide](docs/payments.md) explains configuration, states, recovery limits and acceptance gates. No real/test provider transaction was attempted during maintenance.

Protected funds/refunds are a prototype workflow, not a claim of regulated escrow or guaranteed travel safety. Geolocation needs permission and HTTPS outside localhost. Maps/AI outages must remain visible. Review dependency findings, auth/RLS, payment transitions, provider quotas, privacy/retention and safety claims before deployment. Map/customizer/chat/safety responsibilities are separated and locally tested; actual-provider validation and durable contact/SOS write recovery remain pending.

The map is a draft driving preview, not an optimized or verified safe itinerary. It labels the existing 9:00 AM/90-minute assumptions, leaves missing-coordinate or failed days untimed, names activities beyond its two-per-day preview cap and preserves selections on loading failure. The cap remains IN REVIEW; route ideas are illustrative, not implemented routing modes. See [map limits](docs/planning.md#map-preview-and-failure-behavior).

The safety page describes catalog flags and saved records, not verified properties, continuously live tracking or guaranteed emergency dispatch. Locally tested payment contracts do not establish provider settlement or public release readiness.

Trusted contacts are unverified saved details. Removing one deactivates its record rather than erasing it. SOS saves a location/note with `pending` status; it sends no notification and dispatches no help. Failed or malformed save responses preserve drafts and require refresh/review before another action. This browser guard does not guarantee exactly-once creation across reloads or concurrent sessions.

Location creation now requires explicit sharing consent and preserves `false`; turning sharing off does not erase the saved location. Nearby searches send coordinates to Overpass and do not verify service availability. Chat sends only submitted conversation text to Google; it cannot read account records or perform actions. Its prompt is guidance, not an off-topic/safety enforcement guarantee. The public endpoint still needs deployment rate limits and a cost budget. See [assistance privacy and release gates](docs/assistance.md).
