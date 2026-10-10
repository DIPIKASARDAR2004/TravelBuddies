# Journey Pilot Booking & Refund Policy Prototype

This document records intended cancellation/refund rules and distinguishes them from the test-mode implementation. It is not a published customer guarantee or evidence of regulated escrow, real refunds or hotel payouts. See [the payment guide](payments.md) for setup, state transitions and operational limits.

## 1. Design goals, not current guarantees

- Resolve unprovided services fairly for the traveller.
- Compensate hotels for provided services and agreed late-cancellation rules.
- Prevent application-level release while a dispute is unresolved.

The current application records test states; it does not provide bank escrow, provider-side freezing, evidence review or merchant settlement.

## 2. Standard Cancellation & Refunds
If your plans change and you need to cancel your booking:

| When you cancel | Your Refund | Hotel Compensation |
| :--- | :--- | :--- |
| **3 Days (72+ hours) before check-in** | **100% Full Refund** | Hotel gets nothing |
| **24 hours to less than 72 hours before check-in** | **80% Refund** | Hotel gets 20% |
| **Less than 24 hours before check-in** | **50% Refund** | Hotel gets 50% |

Implemented test calculations use integer paise. Refund percentages round down to a whole paise. A 5% platform commission, rounded down, applies only to the hotel's gross entitlement; hotel net payout is that entitlement minus commission. Refund + commission + hotel net equals the original amount. These are ledger amounts, not actual hotel transfers.

The prototype uses **midnight UTC** on the saved check-in date because property-local check-in times are absent. This assumption must be reviewed before release; it is not a new approved product rule. The calculation is saved on the first accepted cancellation and does not change when a provider request is retried later.

## 3. If You Don't Show Up (No-Show)
If you miss your check-in without cancelling, your entire trip is **not** automatically lost.
- The hotel is compensated for the **first night** of your stay.
- The calculated refund covers the remaining unused nights. The simulator rejects no-show before the prototype check-in instant.

## 4. If the Hotel Cancels Your Booking
If the hotel cancels your confirmed booking for any reason:
- The test calculation requests a **100% refund**; it is not reported complete until the provider confirms processing.
- The hotel's calculated entitlement is zero. Reliability strikes are an intended feature, **not implemented**.

The current hotel-action endpoint is an owner-operated test simulator behind an explicit server flag, not authorization for real hotel staff. Pending, failed or unknown provider refunds stay `REFUND_PENDING`; the UI can refresh the same saved request. Do not promise immediate bank credit.

## 5. If the Hotel Denies You Check-In
If you arrive with a confirmed booking but the hotel refuses to let you check in (e.g., they are overbooked or claim they have no rooms):
1. The implemented test action records a local `DISPUTED` state and reason, preventing another ordinary release/cancellation action.
2. It does **not** freeze money at the provider.
3. Photo/video evidence upload, hotel response and review are intended workflow, **not implemented**.
4. A full refund for justified denied entry is intended policy, not an automated dispute-resolution outcome in this prototype.

## 6. Room Defect / Service Issue Policy — intended workflow

The following remains design guidance. There is no implemented room-issue evidence, partial settlement or dispute-review workflow. Do not present it as available functionality.

If the traveller finds a defect or serious problem in the hotel room after check-in:

- The traveller can report the issue through Report Room Problem.
- The traveller may upload photo/video evidence and a short description.
- The disputed part of the hotel settlement remains protected/on hold until the issue is resolved.

### Minor Problems

Examples:
- AC/fan not working
- TV/Wi-Fi issue
- Hot water unavailable
- Minor cleanliness problem

The hotel gets a reasonable chance to:
- repair the problem, or
- provide another equivalent room.

If resolved quickly → stay continues and normal payment applies.

### Major Problems

Examples:
- Broken door lock
- Severe hygiene issue
- Unsafe electrical fault
- Room materially different from booking
- Essential promised facility completely unavailable
- Serious privacy/security concern

If the hotel cannot fix the issue or provide a suitable replacement:
- Traveller may request room change, partial refund, or early checkout.
- Hotel receives payment only for the satisfactory service actually provided.
- Unused/affected stay amount may be refunded.
- Journey Pilot commission applies only to the amount finally released to the hotel.

### If Hotel and Customer Disagree

Issue Reported → Settlement Frozen → Customer Evidence → Hotel Response → Review → Full Refund / Partial Refund / Release to Hotel

> **Important rule:**
> A small defect should first be given a chance to be fixed, but a serious safety or service failure should not force the traveller to continue the stay.
