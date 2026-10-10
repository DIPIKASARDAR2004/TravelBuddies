# Planning, map previews and saved-trip boundaries

The recommendation decisions in [brain.md](../brain.md) remain authoritative.
This guide describes validation and module ownership, not approval of rankings.
The Darjeeling Golden Test still needs actual-record inspection and agreed expected
results before recommendation algorithms are changed.

## Module map

Paths are relative to `frontend/src/`.

| Module | Responsibility |
| --- | --- |
| `app/api/plan/route.ts` | Public request boundary, response validation and safe HTTP errors |
| `lib/planner/planRequest.ts` | Request types and runtime input checks |
| `lib/planner/catalog.ts` | Four ordered catalog queries, bounded requests and record validation |
| `lib/planner/buildResponse.ts` | Existing minimum-cost checks, recommendation composition and API mapping |
| `lib/recommendation/{basePlanner,upgradePlanner,planService}.ts` | Existing scoring, selection, formulas and formatting; not re-ranked by this maintenance work |
| `lib/planner/planResponses.ts` | Nested response/package validation shared by server, browser and stored-state reader |
| `hooks/usePlannerSearch.ts` | One active request, timeout/unmount cancellation, one failure notification and validated store updates |
| `lib/planner/planStorage.ts` | Optional session storage and validated, data-only restoration |
| `lib/planner/planUtils.ts` | Existing swap/add/remove and budget calculations |
| `hooks/useTripCustomizer.ts` | Customizer actions using existing rules and `useBookingDraft`; the page composes controls |
| `app/plan/components/CustomizerBudget.tsx` | Budget input and totals presentation |
| `lib/itinerary/buildDayItinerary.ts` | Selected/add-on activity deduplication and existing draft distribution |
| `lib/itinerary/{coordinates,routePreview}.ts` | Coordinate checks, untimed fallback and pure route/timing composition |
| `lib/client/googleRoutes.ts` | Concrete Google Routes call, response validation, timeout and cancellation of waiting |
| `app/map/useTripRoutes.ts` | One calculation lifecycle, map drawings and cleanup |
| `app/map/GoogleTripMap.tsx` | SDK-loading state, markers, map and visible fallback |
| `lib/services/trips.ts` | Separate saved-trip request/record contracts and shared route field/ID definitions |

## Planner request and response

`POST /api/plan` accepts `destination`, `totalBudget`, `travellers`, `days`, and an
optional boolean `womenOnly` (default false). It remains public; the refactor does
not introduce a login requirement.

- Destination: trimmed text, 1–200 characters.
- Budget: positive finite number, at most `Number.MAX_SAFE_INTEGER / 100`.
- Travellers: whole number, 1–100. Days: whole number, 1–365. These are technical
  input bounds aligned with checkout, not hotel availability guarantees.
- Decimal numeric strings remain accepted for existing API callers; booleans,
  arrays, blank strings, non-finite numbers and fractional traveller/day counts do
  not get silently coerced. The UI submits numbers.
- Dates belong to the selected trip and are forwarded to checkout; the planning
  endpoint still calculates by day count, not date-specific inventory or pricing.

Catalog lookup preserves case-insensitive substring matching and ascending price
ordering. `%`, `_` and backslash in user input are treated literally, not as SQL
wildcards. Queries run together with a shared 15-second abort signal. Missing,
negative or non-numeric prices, malformed names, invalid ratings and malformed
optional quality flags cause a catalog error; records are not silently repaired or
invented. Zero-cost activities remain valid. Hotels/restaurants still use the
existing minimum rating, and normal planning does not rank/filter by the safety
flag. These flags are not independent safety verification.
The alternatives mapping is shared by both response branches; safety-mode hotel
alternatives now stay filtered even when no package fits the budget (the old
low-budget branch omitted that filter).

| Result | HTTP response |
| --- | --- |
| Invalid request | 400, `INVALID_REQUEST` |
| Missing required qualified catalog category | 400, `INSUFFICIENT_DATA` |
| Query failure or malformed catalog | 503, `CATALOG_UNAVAILABLE` |
| Valid data but minimum trip exceeds budget | 200 with `isTripPossible: false` and empty package arrays |
| Valid package response | 200; destination, budget, traveller/day count, packages and alternatives |
| Unexpected composition/output failure | 500 with a public fallback; no raw provider/database details |

Nested package validation covers item names/prices, finite amounts, arrays,
optional coordinates, upgrade metadata and extra-item raw data. Negative remaining
budget is valid for an over-budget/customized option; negative costs are not.
Validation does not prove a recommendation is meaningful, optimal, bookable or
schedule-feasible. Budget reserve/formula and selection logic were not changed.

## Browser state and adjustments

`usePlannerSearch` validates a successful response and checks it matches the
submitted trip before changing the store. Errors preserve form fields. A 15-second
timeout unlocks retry; navigation/unmount aborts the request without a failure
toast or a stale trip overwrite. A new valid result clears the previous customized
selection. Network and contract failures each produce one notification.

`plan-storage` holds the selected response, customized package, trip details and
view in session storage. It is not trusted input: invalid JSON/shape, inconsistent
trip dates or missing required selections fall back to the initial form. Only
known data fields are restored; persisted methods, loading state and modal state
are ignored. A changed customizer budget can differ from the original search
budget. If storage is denied, planning continues in memory without reload
persistence. This is not a cross-device saved-trip feature or a trusted price quote.

Swap/add choices use a native modal dialog with named controls, keyboard focus,
Escape dismissal and focus return. Each option is one real button, not nested
interactive controls. Existing calculations still allow swaps, reject over-budget
add-ons, preserve free extras and recalculate when an extra is removed.
Budget/reserve controls reject negative and non-finite input. Changing the budget
does not silently reset the selected reserve; an over-budget state remains visible
and disables checkout. These controls are not authoritative payment pricing.

## Map preview and failure behavior

The preview starts from the selected package, not a separate saved-trip API record.
Returning from `/map` goes directly to the correct normal/safety planner and keeps
the selection. Direct entry without a plan offers a usable planner link. Collapsing
a day or opening the route-ideas panel does not recalculate driving routes.

The existing prototype distribution deduplicates selected and extra activities and
includes at most two per day. **This rule remains IN REVIEW.** Overflow activities
are named in a notice and remain in the plan/budget; they are not silently removed
or presented as scheduled. No ranking, budget formula or activity-selection rule
was changed.

- A missing API key or invalid hotel coordinates leaves the itinerary available
  without loading the map SDK. Null/blank coordinates are unknown, not `(0, 0)`;
  actual zero-degree coordinates remain valid.
- SDK loading has a 10-second UI bound. Failure/timeout explains how to retry by
  refreshing; it does not clear the plan. The wrapper's `onLoad`/`onError` hooks are
  documented in [APIProvider](https://visgl.github.io/react-google-maps/docs/api-reference/components/api-provider).
- Each non-empty day requests a driving round trip: hotel → activities in their
  existing order → hotel. All activities that day must have valid coordinates;
  otherwise the whole day stays untimed. This prevents assigning a partial route's
  legs to the wrong activities. Empty days do not request routes.
- The adapter requires a usable path and exactly one more leg than activity stops,
  with finite nonnegative distance/duration values. Missing values never become
  zero-minute trips. It requests only path and leg metrics using the
  [Google Routes field-mask contract](https://developers.google.com/maps/documentation/javascript/reference/route).
- Per-day requests have a 15-second wait bound. A failed day remains visible while
  successful days retain estimates. Unmount stops waiting, ignores late results
  and removes owned polylines. This does **not** cancel an already-issued provider
  request or guarantee that it will not be billed. Day requests currently run
  concurrently; quota/load acceptance remains open.

Timing is explicitly a draft: 9:00 AM departure and 90 minutes per activity when
no positive recorded duration exists. Valid route legs, including the return leg,
are added to those assumptions. Opening hours, admission, live traffic, schedule
feasibility and safe return conditions are not established. These are **driving**
estimates even when the planner's local-transport item describes another mode.
The route-ideas panel is illustrative only; it has no invented durations and does
not change the map. Cooperative map gestures preserve page scrolling; the old
whole-map CSS color inversion was removed.

Local browser tests use a minimal fake Google SDK underneath the real React map
wrapper, with other network traffic blocked. They cover loading failures, malformed
legs, timeout/late results, drawing cleanup, selection preservation, day collapse,
overflow notices and a 375px safety-planner return. A static-render test covers
missing configuration. These do not verify actual map tiles, key restrictions,
billing/auth errors, quotas, real routes or broad touch/device usability.

## Separate saved-trip API

`/api/trips` and `/api/trips/:id` manage owner-scoped records. These endpoints are
**not currently connected to the planner UI**; session persistence does not create
a database trip, publish a shared trip or save a protected booking.

The contract includes title (1–120 characters), destination (1–160), strict
`YYYY-MM-DD` start/end dates and boolean sharing (default false on input). Equal
start/end dates remain allowed for saved-trip records; checkout nights require a
positive date difference. PATCH currently validates a complete editable record,
not an arbitrary partial field merge. Owner and record IDs cannot be changed by
payload fields. Reads/updates/deletes filter both user and ID; absent/other-owner
records return 404. Mutation results are checked before reporting success, and
responses expose only the documented record fields and timestamps.

Isolated tests cover these API contracts with synthetic data and mocked query
boundaries, not hosted RLS/JWT or sharing access. There are no hosted writes in the
test suite. Run the commands in [README](../README.md#verification); exact results
live in [Project Pulse](../../Project_Pulse.md).

## Remaining work

Remaining safety/chat/speech vendor boundaries, hosted auth/trip-sharing policies,
actual-provider map acceptance, and wider mobile/device acceptance remain open. The
approved Golden Test is not replaced by synthetic contract fixtures. Rate limits
and catalog-size/algorithm load testing are also required before exposing the
public planner to untrusted traffic at scale.
