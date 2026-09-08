# PROJECT OVERVIEW

Journey Pilot is a travel-planning platform built with Next.js App Router and Supabase. This is an existing partially implemented project, not a new project.

Its planned modules include:
- Intelligent budget-based trip planning
- Traveller/women-safety features
- A safety-aware map
- Protected booking/payment
- Travel assistant/chatbot

**Current Priority:** The current development priority is validating the Plan Trip recommendation engine. Frontend redesign, Safety, Map, protected payment, and chatbot work are NOT the current priority unless explicitly requested.

---

# DOCUMENT MAINTENANCE RULES

- `brain.md` is the main source of truth for confirmed Journey Pilot product decisions.
- Current implementation notes must be updated after relevant code changes.
- Only change IN REVIEW to LOCKED after explicit approval.
- Never silently resolve a conflict between the code and the approved behaviour. Report the conflict first.
- Update "Last Inspected" only when the related files were actually inspected.
- Never store Supabase keys, secrets, passwords, or `.env` values in `brain.md`.

---

# FILE PATHS

Verified paths relative to the repository root:
- **Backend Route:** `frontend/src/app/api/plan/route.ts`
- **Supabase Client:** `frontend/src/lib/supabaseClient.ts`

---

# TRIP PLAN VISION

The Trip Plan feature is NOT a cheapest-trip calculator.

Its purpose is:

“Given the user's destination, budget, number of travellers and number of days, recommend meaningful ways to plan the trip within the budget, and also show what meaningful improvements become possible if the user increases the budget.”

The user currently provides:
- Destination
- Total Budget
- Travellers
- Days

The planner uses:
- Hotels
- Restaurants
- Activities
- Local Transport

---

# BUDGET VALUES & FORMULAS

Documenting the distinction between budget variables shown to the user:

- `totalBudget`: The total amount the user is willing to spend.
- `emergencyReserve`: `totalBudget * 0.10` (Keep 10% as a reserve).
- `tripSpendingLimit`: `totalBudget - emergencyReserve` (The strict limit for within-budget plans).
- `tripCost`: The actual calculated total of Accommodation + Food + Activity + Transport.
- `remainingSpendableBudget`: `tripSpendingLimit - tripCost`.

**For Upgrades:**
- `recommendedBudget`: `ceil(tripCost / 0.90)`
- `extraNeeded`: `recommendedBudget - currentTotalBudget`
- `upgradeEmergencyReserve`: `recommendedBudget * 0.10`
- `upgradeTripSpendingLimit`: `recommendedBudget - upgradeEmergencyReserve`
- `upgradeRemainingSpendableBudget`: `upgradeTripSpendingLimit - tripCost`

Do NOT change these formulas.

Hotel + Food + Activity + Transport must stay within `tripSpendingLimit` for normal within-budget recommendations. The system should NOT force itself to spend every rupee, but it should NOT return an unnecessarily cheap plan if meaningful improvements are available within the budget.

---
---

# COST CALCULATIONS

**Accommodation Cost:**  
`price_per_night * ceil(travellers / 2) * days`

**Food Cost:**  
`cost_per_meal * 3 * travellers * days`

**Activity Cost:**  
`cost_per_person * travellers`

**Transport Cost:**  
`cost_per_person * travellers`

**Trip Cost:**  
`Accommodation + Food + Activity + Transport`

---

# MINIMUM QUALITY & DATA RULES

## Minimum-Quality Requirements (LOCKED)
- Hotels used in normal Trip Planning must have `rating >= 3.5`.
- Restaurants used in normal Trip Planning must have `rating >= 3.5`.
- Activities and Transport currently do not have rating fields.
- Higher price does NOT automatically mean higher quality.

## Unsupported-Claim Restrictions
Agents must not invent:
- Hotel star classifications
- Amenities
- VIP services
- Safety certifications
- Live pricing
- Quality claims unsupported by database fields

## Database / Edge-Case Rules
- Never invent missing Hotel, Restaurant, Activity, or Transport records.
- All recommendations must use actual Supabase records.
- If destination data is missing from a required category, return an INSUFFICIENT_DATA state.
- If valid destination data exists but no combination fits the trip-spending limit, return a BUDGET_TOO_LOW state.
- A free Activity with a cost of ₹0 is valid and must not be treated as missing data.
- Null, negative, or invalid price/rating records must not be used for recommendations.
- Do not force any upgrade category when no meaningful improvement exists.

## Prototype-Data Explanation
- Current prototype destinations include Digha, Darjeeling, and Jaipur.
- Darjeeling data is used for the Golden Test.
- The dataset intentionally contains combinations such as cheap and highly rated, mid-range and well-rated, expensive and lower-rated, and premium-priced and highly rated.
- This exists to test whether the engine avoids assuming that higher price always means better quality.
- Do not change or invent database records during documentation work. Only describe destinations and data patterns that are already verified in the project.

## Recommendation Uniqueness
The engine should aim to provide up to three meaningfully distinct priority-based recommendations: Best Value, Better Stay, and More Experiences. Do not force a category when the available data cannot produce a meaningful difference.

Best Value, Better Stay, and More Experiences represent different traveller priorities. They do not necessarily need different items in every category, but each displayed plan must have a meaningful reason for being presented separately. If two plans are identical and provide no meaningful priority difference, do not present them as separate recommendations. 

*Exact uniqueness rules remain IN REVIEW.*

## Rating Reliability and Fake-Review Handling

### Current Prototype Behaviour
- The recommendation engine is not based only on rating.
- Budget, price, minimum-quality requirements, recommendation category, activities, and transport also influence recommendations.
- Hotels and Restaurants used in normal Trip Planning must currently satisfy `rating >= 3.5`.
- The exact scoring and selection method remains `IN REVIEW`.
- Current ratings are prototype data and must not be described as verified, fraud-free, or completely trustworthy.
- A high rating alone does not prove that an option is genuinely better.
- A rating based on very few reviews may be less reliable than a slightly lower rating based on many reviews.

**Example:**
- Hotel A: rating 4.9 from 3 reviews.
- Hotel B: rating 4.6 from 1,200 reviews.
- Hotel B may have stronger rating confidence because it has a much larger review count.

### Current Limitations
- The current database does not contain enough information to detect fake reviews or calculate rating confidence.
- Agents must not invent review counts, verified-review status, rating sources, or fraud claims.
- The platform must not promise that it can completely detect or eliminate fake ratings.
- The existing `rating >= 3.5` requirement remains valid for the prototype, but it is not a complete trust-verification system.

### Future Trust Data — FUTURE
In a later development stage, consider fields such as:
- `review_count`
- `rating_source`
- `verified_review_count`
- `last_verified_at`
- `is_verified`
- `rating_confidence`
- `fraud_warning`

These are proposed future fields only. Do not mark the exact schema or field names as `LOCKED`.

### Future Rating-Confidence System — FUTURE / IN REVIEW
A future system may:
- Give more weight to verified booking reviews.
- Give higher confidence to ratings supported by more reviews.
- Mark listings with very few reviews as `LOW_CONFIDENCE`.
- Reduce the influence of suspicious rating patterns.
- Compare ratings from multiple permitted and reliable sources.
- Use a confidence-adjusted or Bayesian rating instead of trusting the raw average rating alone.
- Periodically refresh rating information.
- Show the rating source and confidence level to users.

The exact formula, weights, minimum review count, fraud-detection method, and external data sources remain `IN REVIEW`.

### Priority
- This is not urgent for the current prototype.
- It becomes important before Journey Pilot recommends real businesses to real users.
- The current priority remains validating the core Plan Trip recommendation categories and budget calculations.

## Women-Friendly Rule
The Hotels table contains `is_women_friendly`. Normal Plan Trip must NOT use this field for ranking or filtering. This field is intended for the separate Safety/Women Travel feature. Also, `is_women_friendly = false` does NOT mean the hotel is unsafe.

## Transport Rule
The Plan Trip form currently does not ask the user's starting location/origin. Therefore the Transport table currently represents LOCAL transport inside the destination. Do not mix flights, trains, or intercity transport into this logic unless the form is redesigned first.

---

# ACTIVITY SCHEDULING & DURATION HANDLING

### Current Limitation
- The `Activities` table does not currently contain activity duration, opening time, closing time, or scheduling information.
- Therefore, the planner cannot confirm whether several selected activities realistically fit into the available trip days.
- The planner must not claim that an activity schedule is feasible or optimized until the required scheduling data exists.

### Temporary Prototype Rule — IN REVIEW
Use this temporary limit during recommendation design:
`maximumActivities = days * 2`

**Example:**
- A two-day trip can recommend a maximum of four activities.
- This is only a simple prototype safeguard.
- It is not a final scheduling algorithm.
- Do not mark this rule as `LOCKED` unless explicitly approved later.

### Future Improvement (FUTURE)
In a later development stage, consider adding fields such as:
- `duration_hours`
- `opening_time`
- `closing_time`

The future itinerary system may use these fields to arrange activities by day and check whether they fit within the available time. This work is clearly marked as `FUTURE` and is not urgent for the current recommendation-engine stage.

---

# WITHIN-BUDGET OPTIONS

These are NOT cheap / medium / expensive tiers.

### 1. Best Value
**Tagline:** “The Perfect Balance”

**Meaning:**  
Give the user the strongest balanced overall trip for the available budget.

**Consider:**  
- Hotel quality/value
- Restaurant quality/value
- Activity
- Transport
- Total trip cost

**Rules:**  
- Do not simply choose the cheapest items.
- Do not simply choose the most expensive items.
- Do not start with maximum everything and randomly downgrade.
- Do not spend money only because budget remains.
- If a meaningful improvement is affordable, do not keep the plan unnecessarily cheap.

Best Value should answer:  
“What is the best balanced trip I can reasonably get with this budget?”

### 2. Better Stay
**Tagline:** “Comfort First”

**Meaning:**  
The user wants to prioritize accommodation.

**Rules:**  
- Give more importance to the Hotel.
- Hotel rating is currently the main supported quality signal.
- Higher price does NOT automatically mean a better hotel.
- Keep Food, Activity, and Transport reasonable so a better stay can fit inside the budget.

Better Stay should answer:  
“What if I care more about where I stay?”

### 3. More Experiences
**Tagline:** “Explorer Mode”

**Meaning:**  
The user prefers spending more on activities and local experiences.

**Typical approach:**  
- Affordable acceptable Hotel
- Reasonable Restaurant
- Better Activity options
- Better Local Transport where useful

More Experiences should answer:  
“What if I care more about what I do during the trip than having an expensive hotel?”

**Note on More Experiences Conflict:** The approved meaning is to prioritize Activities and useful Local Transport. If the current implementation fallback reduces Activities or Transport in a way that conflicts with Explorer Mode, treat it as an implementation issue to review. Do not treat that behaviour as approved product logic.

---

# UPGRADE SECTION

Below the within-budget recommendations, we want a separate section: “Want to Upgrade Your Trip?”

These plans may exceed the user's current budget. Upgrade prices must NEVER be hard-coded; they must come from actual selected database items.

### Slight Upgrade
**Meaning:**  
A small amount of extra money unlocks one meaningful improvement. A Slight Upgrade should only appear if the improvement is meaningful. 

**Threshold:** `extraNeeded <= 5% of the original total budget`.
*Note: The 5% maximum threshold is currently an intended constraint (IN REVIEW). The exact method for deciding whether an improvement is meaningful remains IN REVIEW. Do not force a Slight Upgrade when no meaningful improvement exists.*

### Comfortable Upgrade
**Meaning:**  
The user spends moderately more and gets a noticeable improvement in comfort. It should normally improve one or two meaningful parts of the Best Value trip. (e.g., Better Hotel + Better Restaurant).

Do NOT automatically upgrade every category. Comfortable Upgrade should feel like a sensible next step, not a massive jump to luxury.

### Premium Upgrade
**Meaning:**  
A genuinely high-end version of the trip based on available database options. Premium does NOT mean the most expensive everything. Hotels and Restaurants must still be quality-aware. 

### Upgrade Highlights
When showing an upgrade, explain what actually improved (e.g., “Hotel rating improves from 4.2★ to 4.8★”, “Higher-tier activity: Tiger Hill Sunrise Tour”). 

---

# GOLDEN TEST CASE

Use this as the main test case for future recommendation-engine work. The exact expected selections have not been approved yet.

**Destination:** Darjeeling  
**Total Budget:** ₹15,000  
**Travellers:** 2  
**Days:** 2  

### Expected Output Structure:

#### Best Value
- **Selected database records:** 
- **Cost breakdown:** 
- **Total trip cost:** 
- **Emergency reserve:** 
- **Remaining spendable budget:** 
- **Reason:** 

#### Better Stay
- **Selected database records:** 
- **Cost breakdown:** 
- **Total trip cost:** 
- **Emergency reserve:** 
- **Remaining spendable budget:** 
- **Reason:** 

#### More Experiences
- **Selected database records:** 
- **Cost breakdown:** 
- **Total trip cost:** 
- **Emergency reserve:** 
- **Remaining spendable budget:** 
- **Reason:** 
*(Note: If a previous example for a two-day trip contained five activities, it must be reconsidered under the temporary four-activity limit. Do not select replacement activities or modify the algorithm during documentation work.)*

#### Slight Upgrade (if meaningful)
- **Selected database records:** 
- **Cost breakdown:** 
- **Total trip cost:** 
- **Emergency reserve:** 
- **Remaining spendable budget:** 
- **Reason:** 

#### Comfortable Upgrade (if meaningful)
- **Selected database records:** 
- **Cost breakdown:** 
- **Total trip cost:** 
- **Emergency reserve:** 
- **Remaining spendable budget:** 
- **Reason:** 

#### Premium Upgrade (if meaningful)
- **Selected database records:** 
- **Cost breakdown:** 
- **Total trip cost:** 
- **Emergency reserve:** 
- **Remaining spendable budget:** 
- **Reason:** 

---

# CURRENT IMPLEMENTATION — OBSERVED CODE

*Last Inspected: 2026-09-08*  
*Backend Route: `frontend/src/app/api/plan/route.ts`*

This section describes ONLY what was actually verified in the code. It is not necessarily the approved product behavior.

- **Modular Architecture:** The codebase has been heavily refactored for better Separation of Concerns. 
  - `api/plan/route.ts` relies on `src/lib/recommendation/planService.ts` for logic.
  - **Authentication:** Fully migrated to Supabase SSR (Server-Side Rendering) Auth. API routes `/api/login` and `/api/signup` handle session creation, while components like `Navbar.tsx` dynamically render User Profile / Logout states based on active sessions.
  - Transport pages (`bus/page.tsx` and `train/page.tsx`) share DRY components (`TransportSearchForm` and `TransportFooter`).
  - Checkout pages (`plan/checkout/[id]/page.tsx`) use `useRazorpay` and modular UI components.
- **Within-Budget logic:** Observed in the inspected code: Best Value is calculated using `balanceScore` and combinatorial subsets. Better Stay shifts focus to hotel subsets. More Experiences prioritizes activities.
- **Upgrades:** The math for `recommendedBudget` and `extraNeeded` is in place. Upgrades now use `overallQuality` scoring on subsets rather than basic percentile filtering.
- **General Rules:** `is_women_friendly` is not used for Plan Trip ranking; Transport records are treated as local transport; the 10% reserve formula is present; and hotel/restaurant ratings are used instead of pure price.

---

# TARGET / APPROVED PRODUCT BEHAVIOUR

Use these labels to understand the status of product decisions:
- **LOCKED:** Confirmed decision.
- **IN REVIEW:** Still being designed/tested.
- **FUTURE:** Planned later.
- **NOT VERIFIED:** Information that cannot be verified.

### LOCKED
- Product meanings (Best Value vs Better Stay vs More Experiences).
- The 10% emergency reserve rule and budget formulas.
- Minimum quality requirements (Hotels/Restaurants >= 3.5).
- Higher price does not automatically mean better quality.
- Normal Plan Trip ignores `is_women_friendly`.
- Upgrade budget formula.
- Local transport rule.
- Golden Test Case parameters.
- No fake data / do not invent records.

### IN REVIEW
- Exact Best Value scoring and selection (the current 65/35 logic is NOT approved).
- Exact Better Stay hotel-priority selection.
- Exact More Experiences activity/transport-priority selection.
- Exact Slight Upgrade selection (including the exact method for deciding if it's meaningful, though the 5% threshold is the intended constraint).
- Exact Comfortable Upgrade selection (percentile logic is NOT approved).
- Exact Premium Upgrade selection (percentile logic is NOT approved).
- Exact uniqueness rules for recommendations.

### Development Workflow — LOCKED

For future Plan Trip recommendation-engine work:

1. Read `brain.md` completely.
2. Inspect the current implementation.
3. Inspect the actual Supabase records required for the test.
4. Manually define the sensible expected recommendation results.
5. Explain why each recommendation belongs to its category.
6. Convert the approved manual results into acceptance criteria.
7. Compare the current backend output with those acceptance criteria.
8. Report conflicts between the implementation and target behaviour.
9. Modify the backend only after the expected behaviour is approved.
10. Run the Darjeeling Golden Test again after implementation.
11. Fix and validate the backend before redesigning the frontend.
12. Never call the algorithm final until it passes the approved Golden Test.

---

# PROTECTED PAYMENT PROTOTYPE (LOCKED / UPCOMING)
- **Goal**: Simulate an escrow payment for Hotel bookings using Razorpay Test Mode.
- **Security**: The final accommodation cost is strictly recalculated on the backend API (ignoring browser inputs) to prevent tampering.
- **Database**: Payment lifecycle (Draft -> Protected -> Released/Refunded/Disputed) tracked in the `protected_bookings` Supabase table.
- **Architecture**: Implemented on an isolated route (`/plan/checkout/[id]`) to prevent interference with the core planner.
- **Return Policy**: The escrow cancellation rules, tiered refunds (100% / 80% / 50%), and 5% platform commission are defined in [Return Policy](file:///home/master_soojan/Linux_Workspaces/Projects_SW/TravelBuddies/docs/return_policy.md).
- **Constraint**: MUST NOT alter existing Budget Planner, swap logic, emergency reserves, or recommendations.
