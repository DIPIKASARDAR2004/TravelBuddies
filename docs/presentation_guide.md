# JourneyPilot presentation guide

Describe this as a travel-planning prototype with account, safety-record and test-mode booking workflows—not an emergency service, verified safety system or regulated escrow product. The [README](../README.md) owns setup and current implementation status.

## Prepare a safe demo

Use the mocked browser journeys documented in the README, or an explicitly authorized disposable environment with synthetic data. A normal localhost server can use real configured services. Do not create real accounts, save private locations, contact emergency services or initiate provider payments just to demonstrate the UI. Never show environment files, keys or customer records on screen.

## Suggested walkthrough

1. **Planning:** show preferences, checked results and hotel/activity adjustments. Recommendation rules use catalog data and pure scoring; do not describe the planner as a generative-AI guarantee. Browser session persistence is not profile saving or sharing. See [planning contracts](planning.md).
2. **Map preview:** show selected places and the draft driving preview. Missing coordinates/provider failures remain visible. Explain the documented schedule assumptions and preview cap; this is neither an optimized itinerary nor a verified safe route. Do not promise offline maps or live tracking.
3. **Accounts:** show personal-account forms with synthetic fixtures. A signup may require email confirmation; corporate/host onboarding is not implemented. Do not expose credentials or claim that a local mock proves hosted sessions.
4. **Safety records:** show contact drafts, explicit location consent, Safe Stay records and failure/recovery states. SOS saves a record only: it sends no notification and dispatches no help. Catalog flags and nearby listings are not independent safety certification. See [assistance boundaries](assistance.md).
5. **Checkout:** use the fake payment SDK in the browser suite to show validation, uncertain outcomes and recovery. Local booking states do not prove capture/refund settlement; `RELEASED` is not a bank payout, `DISPUTED` does not freeze provider funds, and pending refunds are not completed refunds. See [payment limits](payments.md).
6. **Limitations and next decisions:** distinguish tested local behavior from open provider, auth/RLS, privacy, legal and deployment gates. Describe proposed features as proposals; do not turn IN REVIEW decisions into delivery commitments.

Show a failure as a failure. Do not dismiss an outage as cosmetic, fabricate a success or use an uncertain write as a reason to click again. Explain why the interface asks the user to review before retrying.

For acceptance rather than a presentation, follow the [manual checklist](testing_checklist.md) with the necessary authorization. Presentation rehearsal is not release certification.
