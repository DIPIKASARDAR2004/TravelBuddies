# Operating-cost review

This is a measurement checklist, not a vendor quote or an implemented scaling architecture. The previous dollar/fee estimates were undated and are not maintained here. Verify each provider's current official pricing and the intended account's limits before making a budget or enabling services.

The [README](../README.md) describes the actual stack and configuration; [payments](payments.md), [planning](planning.md) and [assistance](assistance.md) describe provider boundaries and release gates.

## What to measure before estimating

- **Database/auth:** request volume, query latency, stored data, egress, connection use and auth/email activity. Local fixtures do not establish production capacity or hosted account limits.
- **Application hosting:** build frequency, request volume, compute duration, bandwidth and image delivery. Do not label the recommendation engine expensive without profiling it.
- **Maps and nearby services:** actual map loads, directions requests and nearby-search frequency, including retries and per-day preview requests. Google Maps and Overpass are current integrations, not hypothetical future Leaflet replacements.
- **AI chat:** submitted conversation sizes, requests, provider responses, timeouts and abuse exposure. The planner's catalog scoring is separate from the chat provider. Review public-route rate limits and cost controls before release.
- **Payments:** authorized test-account operations, retries, reconciliation and provider requirements. The current prototype does not implement merchant settlement or regulated escrow; do not budget or present it as an already operating escrow/Route product.

Use synthetic, approved workloads and record assumptions with any estimate. Do not capture customer content or credentials in performance logs. Caching or background jobs should follow a measured need and must preserve ownership, privacy, catalog freshness and payment correctness; they are not automatic maintenance tasks.

Provider quotas, pricing, availability and legal/commercial approval remain external checks. No load test, paid API operation, hosted change or purchase is authorized by this document.
