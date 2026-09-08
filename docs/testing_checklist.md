# JourneyPilot Testing Checklist

This checklist provides a structured way to manually test the core features of the JourneyPilot application. Use this before a live presentation or after any major code merges.

## 1. Authentication System (`/login`, `/signup`)
- [ ] **Account Creation:** Fill out the signup form and ensure an account is successfully created via Supabase.
- [ ] **Login:** Test login using email and password. Verify it successfully redirects to `/lady` and sets the SSR session cookies correctly.
- [ ] **Protected Routes:** Visit `/lady` or trigger `/api/trusted-contacts` and verify you no longer receive `401 Unauthorized` errors.

## 2. Transport Booking System (`/train`, `/bus`)
- [ ] **UI Rendering:** Ensure the search form, offer cards, and footer render correctly in both light and dark mode.
- [ ] **Component Reusability:** Verify that the `TransportSearchForm` and `TransportFooter` appear identical across both the Train and Bus pages.
- [ ] **Swap Functionality:** Click the swap button (⇄) in the search form to ensure the 'From' and 'To' fields exchange values correctly.
- [ ] **Search Submission:** Submit the form and verify the alert pops up with the correct captured data.

## 2. Intelligent Trip Planner (`/plan/checkout/[id]`)
- [ ] **Recommendation Engine:** Verify that selecting Darjeeling with ₹15,000 for 2 travellers / 2 days returns valid plans (Best Value, Better Stay, More Experiences).
- [ ] **Calculation Integrity:** Ensure the total trip cost does not exceed the `tripSpendingLimit` (Budget minus 10% emergency reserve).
- [ ] **Quality Constraints:** Verify that no hotel or restaurant under a 3.5 rating is recommended.
- [ ] **Upgrades:** Check that "Slight Upgrade" or "Comfortable Upgrade" appear correctly and calculate the `extraNeeded` accurately if budget permits.

## 4. Protected Checkout & Escrow System (`/plan/checkout/[id]`)
- [ ] **Initial State:** Verify the booking summary loads correctly and the payment status is `PAYMENT_PENDING`.
- [ ] **Test Payment:** Attempt to pay without entering dates and verify the error appears. Enter Check-in/Check-out dates and click "Pay Securely" again; verify the error clears and the Razorpay modal processes the payment.
- [ ] **Post-Payment State:** Verify the status updates to `PROTECTED` and the User/Admin action buttons appear.
- [ ] **Action: Confirm Checkout (Simulate Release):** Click the button and verify the status updates to `RELEASED`.
- [ ] **Action: Cancel Booking:** Click the button and verify the status updates based on the tiered refund policy (e.g., `CANCELLED_BY_USER`).
- [ ] **Action: Dispute (Report Denied Entry):** Click the button and verify the status updates to `DISPUTED` without throwing a 500 error (now that the SQL migration is applied).
- [ ] **Admin Action:** Test the Hotel Cancellation (100% refund) and No-Show (1 night charge) buttons to ensure backend API handles the actions correctly.

## 5. Women Safety Planner (`/lady`)
- [ ] **Safe Stays Filter:** Verify that hotels listed have the `is_women_friendly` flag set to true.
- [ ] **SOS Button:** Click the SOS button and verify the simulated emergency alert triggers correctly.
- [ ] **Live Tracking:** Verify that the map loads (Leaflet) and plots the user's simulated location.


