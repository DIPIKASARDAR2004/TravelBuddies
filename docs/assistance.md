# Assistance and safety-record boundaries

These features provide prototype assistance, not verified travel safety, live
tracking or emergency dispatch. [README](../README.md) has setup and check commands;
[Project Pulse](../../Project_Pulse.md) records completed runs and remaining work.

## Module ownership

Paths below are relative to `frontend/src/`.

| Module | Owns |
| --- | --- |
| `lib/chat/contracts.ts` | Conversation limits, history ordering, request/reply validation |
| `lib/chat/gemini.ts` | Server-only text-generation call, app instructions, checked reply and provider errors |
| `app/api/chat/route.ts` | Public HTTP boundary and safe error/status response |
| `hooks/useTripAssistant.ts` | In-memory conversation, request lifecycle, draft recovery and cancellation |
| `components/Chatbot.tsx` | Non-modal panel, focus, messages and restricted Markdown rendering |
| `lib/client/safetyClient.ts` | Explicit one-time geolocation request with cancellation/timeout |
| `lib/services/locationShares.ts` | Location input/response contracts and field projection |
| `components/safety/useLocationSharing.ts` | Loading, explicit consent, saving and uncertain-outcome handling |
| `lib/services/nearbySafetyServices.ts` | Search values, distances and browser response contract |
| `lib/services/overpass.ts` | Authenticated route's concrete external search adapter |
| `components/safety/useNearbyServices.ts` | One search lifecycle, category state and stale-result prevention |
| `lib/services/{trustedContacts,emergencyAlerts}.ts` | Input/response contracts, selected fields and expected saved values |
| `lib/services/recordChecks.ts` | Shared saved-record UUID, object and timestamp checks |
| `components/safety/useTrustedContacts.ts` | Contact loading, editing, deactivation, draft preservation and uncertain outcomes |
| `components/safety/useEmergencyAlerts.ts` | SOS confirmation, location/save lifecycle, recent history and uncertain outcomes |

The safety components render their controllers' state. There is no generic
repository, background tracker or shared vendor framework.

## Trusted contacts and SOS records

These are authenticated saved records, **not an emergency notification service**.
There is no contact-verification/invitation flow, SMS/email sender, dispatch worker
or recipient-sharing integration in these features. Saving an SOS stores one
location and optional note with status `pending`. A stored `sent` or `resolved`
status is not evidence that somebody received a message or provided help. The UI
states these limits before confirmation and after a successful save.

### API contracts

| Endpoint | Contract |
| --- | --- |
| `GET /api/trusted-contacts` | Active contacts belonging to the signed-in owner, newest first |
| `POST /api/trusted-contacts` | Name plus phone and/or email; inserts with authenticated ownership |
| `PATCH /api/trusted-contacts/:id` | Full contact form replacement, scoped to owner, ID and active state |
| `DELETE /api/trusted-contacts/:id` | Deactivates the owner's row; repeating deactivation is allowed. It does **not** erase the stored details |
| `GET /api/emergency-alerts` | Up to 10 newest records for the authenticated owner |
| `POST /api/emergency-alerts` | Numeric finite paired coordinates and optional note; only creates a `pending` record |
| `GET /api/emergency-alerts/:id` | One owner-scoped record; no public lookup or delivery-status polling worker |

Contact names are 1–120 trimmed characters. Optional phone/email/relationship
fields accept text or null, not numbers/objects that silently disappear. Phone
validation preserves the existing 7–32-character limit; it does not verify phone
ownership or dialability. Emails are trimmed, lowercased and syntax-checked;
relationships are at most 80 characters. At least one contact method is required.

New SOS notes remain limited to 500 characters. Reads allow the existing database's
1,000-character legacy limit without truncation. Coordinates no longer coerce
empty strings, booleans or arrays into zero. Actual numeric zero remains valid.
Record readers check UUIDs, timezone-qualified real dates, nullable fields and
allowed states, reject duplicate list IDs, and return only documented fields.
The existing database rule that a non-null `resolved_at` requires `resolved`
status is preserved; a resolved row with no timestamp is still readable.

Ownership always comes from authentication, never submitted `user_id`. Invalid
input/IDs return 400, unauthenticated requests 401, absent or non-owned individual
records 404, and query/contract failures a safe 500. A malformed list is not an
empty success. Saved responses must match the requested ID/state/details before
success is reported. Successful record responses use `Cache-Control: no-store`.
PATCH now excludes inactive contacts rather than reporting an invisible edit as
successful. The database schema and hosted policies were not changed in this slice.

### Browser lifecycle and recovery

- Both controllers serialize their own loading and mutation requests. Actions
  wait for a checked initial list, so a late GET cannot overwrite a new local
  record. Pending saves disable their form, preserving the submitted draft.
- Each API wait is bounded to 15 seconds. SOS first uses the existing explicit
  10-second geolocation helper. Opening the page or the confirmation does not
  request GPS; only confirming the save does. Cancelling confirmation does not
  write or request location.
- Leaving cancels waiting and ignores late results. In particular, late GPS after
  navigation cannot start an SOS POST. An already-dispatched write might still
  finish on the server; browser cancellation does not roll it back.
- Contact removal has confirm/cancel controls and checks the returned ID and
  inactive flag before removing the row from the view. It is deactivation, not
  data erasure or a notification to that person.
- Failed location acquisition preserves the SOS draft and permits a new explicit
  confirmation. Once a write has been sent, an error/malformed/lost response is
  treated conservatively as unconfirmed. The last known list is labeled stale,
  the draft stays, and further mutations require a successful refresh and an
  explicit acknowledgement that the user reviewed the returned records. Nothing
  automatically retries or re-submits after that acknowledgement.

**This is not durable idempotency or reconciliation.** The uncertainty guard lives
in the mounted component, not storage, and SOS history shows only the latest ten
records. A refresh can race an in-flight server write; an absent row does not prove
it was never saved. Reloads, concurrent tabs or a deliberate second save can create
duplicates. Owner-bound retry keys and authoritative recovery would be required
before claiming exactly-once creation. The current UI reduces accidental retries
without inventing a delivery system or silently changing the database contract.

Contacts, notes and coordinates stay in their existing account tables; no copy is
persisted in browser storage by these controllers. Retention, true erasure, consent,
hosted access controls, server logs and multi-session behavior remain release gates.

## Trip assistant

`POST /api/chat` remains public. `AI_CHATBOT_API_KEY` is server-only; an unset key
returns 503 rather than a fabricated reply. The adapter preserves the existing
`gemini-3.6-flash` model and makes one direct
[Gemini generateContent request](https://ai.google.dev/api/generate-content).
The removed legacy SDK was its only consumer; no replacement runtime dependency
was needed. Google's [library guidance](https://ai.google.dev/gemini-api/docs/libraries)
identifies the old JavaScript SDK as no longer actively maintained.

### Contracts and limits

- JSON body: at most 128 KiB of actual bytes read, not just the declared length.
- Conversation: up to 21 messages and 32,000 characters in total. User prompts are
  limited to 4,000 characters; assistant replies to 8,000.
- Turns alternate user/assistant and end with a user message. Legacy `model`
  answers and one opening greeting remain accepted. Client-supplied system/tool
  roles are rejected; no client message becomes the server's system instructions.
- The browser trims whole oldest turns when needed. It sends only completed
  exchanges plus the current prompt; failed/aborted replies are not inserted as
  assistant history. Closing a pending chat restores the unsent draft.
- The provider request uses a 20-second abort deadline and a 2,048 output-token
  cap; browser waiting is bounded to 25 seconds. No automatic paid retry occurs.
  Closing/clearing/unmounting aborts waiting and ignores late results. Cancellation
  cannot guarantee that provider computation or billing never occurred.
- Only a completed text candidate is shown. Missing, blocked, truncated, oversized
  or non-text replies fail visibly; provider errors, keys and raw diagnostics are
  not sent to the browser or logged by this adapter.

| HTTP status | Meaning |
| --- | --- |
| 400 | Invalid, malformed or oversized conversation |
| 408 | Caller cancelled the request |
| 429 | Provider rate limit |
| 502 | Unusable/incomplete provider reply |
| 503 | Missing configuration or unavailable provider |
| 504 | Provider timeout |

The server's instructions describe the booking prototype accurately and discourage
off-topic/unsupported claims. **A prompt is not an enforcement guarantee.** The
assistant has no database access or tools and cannot book, pay, refund, notify
contacts, verify safety or dispatch help. Factual accuracy and resistance to prompt
injection remain model-evaluation gates, not claims established by mocked tests.

### Privacy and rendering

The UI warns that submitted conversation text goes through this server to Google.
No location, booking or contact records are automatically attached. History lives
only in the mounted browser component, not app storage or a chat database; Clear
conversation resets it. This does not establish Google's retention policy or the
deployment's logging policy. Review both before collecting sensitive information.

Assistant Markdown does not render raw HTML or images. Links accept only explicit
HTTP(S) URLs and use a separate tab with `noopener noreferrer`; their destinations
are not independently verified. This prevents model-supplied images from issuing
automatic third-party requests. Escape closes the non-modal panel and restores
focus to its opener; failed requests preserve the input for retry.

The old `useSpeechRecognition` hook had no imports or call sites and was removed.
No working voice UI was removed, and no new microphone permission is requested.
Voice/translation support is not implemented. Any future voice feature needs its
own consent, supported-browser, lifecycle and provider tests.

## One-time location and sharing

Location is requested only after an explicit action. The browser helper has its
own 10-second deadline as well as the native geolocation timeout, validates returned
coordinates, distinguishes permission denial/unavailability, and ignores late
callbacks after cancellation. It does not start `watchPosition`. Browser sensor
requests cannot necessarily be physically cancelled once issued.

`POST /api/location-sharing` requires numeric paired coordinates and an explicit
boolean `sharing`. **Saving the first location with `false` stays false.** The old
server silently forced that case to true; it no longer does. Missing consent is a
400 response rather than an implied opt-in. PATCH continues to allow disabling
sharing without coordinates or renewed location permission.

Reads and writes use the authenticated owner. Responses are validated before the
UI reports success, including the requested sharing state and existing record ID.
The UI shows UNKNOWN before a successful load or after an uncertain dispatched
write, preserves the last returned record, and provides Refresh saved state. A
lost response is not proof that the server did not save; refreshing is required
before another action. Location API waits are bounded to 15 seconds.

This feature stores a latest location and a sharing choice. It does not continuously
track, send a contact notification or implement a recipient-sharing workflow.
Turning sharing off retains the stored location. Hosted RLS, recipient access,
retention/deletion policy and concurrent-session behavior still require acceptance.

## Nearby services

The authenticated search route validates coordinates, one of four existing service
categories, and a 250–5,000 metre radius (2,000 when omitted). Malformed radius text
is rejected instead of silently defaulted. It sends the requested coordinates to
the fixed Overpass endpoint; this is disclosed in the UI.

The adapter uses the existing OpenStreetMap amenity search with node coordinates
or way/relation centres; see [Overpass QL](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL).
The query has a 15-second provider runtime setting, the server request a 20-second
deadline, and the browser search a 25-second wait after geolocation. HTTP failures,
rate limits, malformed records and partial results carrying an error remark cannot
be mistaken for an empty successful search. Valid results are sorted by approximate
straight-line distance and limited to 50. This is not route distance or travel time.

Changing category clears old results; failed searches cannot leave results from a
previous category looking current. Response category/radius/record shapes must
match. Leaving the page cancels pending work and ignores late responses. Searches
are not saved by this feature, but server/proxy/provider logs need privacy review.

Listings may be missing or outdated. No opening hours, telephone ownership,
emergency-response availability or service quality is verified. Empty results do
not prove no services exist. Do not rely on this prototype instead of contacting
local emergency services directly.

## Verification and remaining work

Unit/API tests stub providers and authenticated query boundaries. Browser tests use
synthetic location/service/chat data and blocked external requests; no prompts,
device locations or safety records are sent to hosted services during those runs.

Before public use, verify actual model availability/quality, provider keys/quotas,
browser permission behavior on supported devices, auth/RLS, retention and logging.
The public chat endpoint still needs deployment-level rate limits, abuse protection,
request-duration controls and a cost budget. No hosted safety/payments or prompt
guardrail certification follows from these local checks. Contact/SOS contracts and
lifecycles have isolated regression coverage; durable write recovery, hosted
ownership/privacy acceptance and any future notification capability remain open.
