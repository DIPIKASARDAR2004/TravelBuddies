# Journey Pilot — Protected Booking & Payment Policy

**Status:** Draft / Prototype Business Policy

This document defines the intended return, refund, cancellation, and dispute rules for Journey Pilot's protected-booking flow. It is not a final legal policy and must be reviewed before production use.

## A. Target / Actual Journey Pilot Policy
*The intended real-product protected-booking policy.*

### 1. Core Principle
Journey Pilot aims to protect both travellers and hotels.
- A traveller should not pay for a verified service they did not receive.
- A hotel should receive fair compensation for genuine late cancellations and completed service.
- Journey Pilot earns commission only on the amount legitimately released to the hotel.
- Disputed money should not be released blindly to either party.
- Payment-gateway charges are separate from Journey Pilot's platform commission.

### 2. Journey Pilot Commission
**Proposed commission:** 5% of the amount actually released to the hotel.

**Example 1: Successful ₹4,000 Booking**
- Hotel gross entitlement: ₹4,000
- Journey Pilot commission: ₹200
- Hotel net payout: ₹3,800

**Example 2: Partial Refund**
If the customer receives a ₹2,000 refund and the hotel is entitled to ₹2,000:
- Customer refund: ₹2,000
- Hotel gross entitlement: ₹2,000
- Journey Pilot commission: ₹100
- Hotel net payout: ₹1,900

*Note: No Journey Pilot commission is charged on refunded money. The 5% rate is a proposed prototype/business assumption and is not yet a finalized commercial rate.*

### 3. Standard Customer Cancellation Policy
| Time Before Check-In | Customer Refund | Hotel Compensation | Journey Pilot Commission |
| :--- | :--- | :--- | :--- |
| **≥ 72 Hours** | 100% | 0% | ₹0 |
| **24–72 Hours** | 80% | 20% (gross) | 5% of hotel-earned portion |
| **< 24 Hours** | 50% | 50% (gross) | 5% of hotel-earned portion |

### 4. No-Show Policy
A no-show should not automatically make an entire multi-night booking non-refundable.

**Proposed rule:**
- Hotel receives compensation equivalent to the first night, subject to an appropriate cap.
- Remaining eligible unused nights may be refunded.
- Journey Pilot commission applies only to the amount awarded to the hotel.

### 5. Hotel Cancellation
If the hotel cancels a confirmed booking:
- Customer receives a **100% refund**
- Hotel receives **₹0**
- Journey Pilot commission is **₹0**
- The cancellation is recorded against the hotel's reliability history.

*Future actions may include warning, ranking reduction, temporary suspension, delisting after repeated violations, and alternative-stay recommendations.*

### 6. Hotel Denies Valid Check-In / Overbooking

If a traveller has a valid confirmed booking but the hotel refuses check-in due to overbooking, room unavailability, or hotel fault:

- The traveller can immediately report Denied Check-In through Journey Pilot.

- The hotel settlement is frozen immediately while the case is verified.

- The traveller may submit current location, timestamp, photo/video evidence, and a short description.
- The hotel receives a short response window to confirm or dispute the issue.
- If the hotel does not respond, the settlement remains frozen and the case moves to Priority Review.
- If the available evidence reasonably confirms that valid check-in was denied, the traveller receives a 100% refund.

- The hotel receives ₹0 for the failed service.

- Journey Pilot commission is ₹0.

- The incident is recorded against the hotel’s reliability history.
Repeated verified violations may lead to ranking reduction, suspension, or delisting.