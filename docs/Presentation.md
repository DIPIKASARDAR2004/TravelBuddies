# JourneyPilot: Project Presentation

## Problems Addressed
* **Fragmented Travel Planning:** Travelers currently have to juggle multiple apps to book tickets, plan daily itineraries, manage group expenses, and track locations.
* **Safety Concerns:** Solo travelers, particularly women, often feel unsafe in unfamiliar environments and lack immediate, integrated SOS tools during their journeys.
* **Time-Consuming Research:** Manually researching and organizing a day-by-day travel plan takes hours of sifting through scattered internet reviews.

## Our Solution
**JourneyPilot** is a unified travel ecosystem that acts as your booking agent, tour guide, accountant, and security guard all in one. It centralizes hotel/bus/train bookings, generates dynamic AI-powered itineraries, manages group budgets, and integrates a specialized safety module to ensure peace of mind.

## Innovation
* **Integrated Safety Ecosystem:** Unlike standard travel apps, we bake safety directly into the core experience. Our "Lady Module" features instant SOS broadcasting, offline-capable live tracking, and curated "Safe Stay" hotel filtering.
* **AI-Powered Dynamic Planning:** Instead of static packages, our system generates highly personalized, day-by-day smart itineraries in seconds based on budget and travel style.
* **All-in-One Consolidation:** We eliminate context switching by combining logistics (booking), finance (bill splitting/currency conversion), and mapping (Leaflet) into a single unified platform.

## Feasibility
* **Technical Readiness:** High. We utilize a robust, modern, and proven technology stack (Next.js 15, React 19, Next.js Server Actions, and Supabase). The codebase is highly modular and adheres to DRY and Separation of Concerns (SoC) principles.
* **Data Availability:** Mapping data (Leaflet) and generative AI APIs are readily accessible and easy to integrate into our existing decoupled architecture.

## Challenges
* **Offline Functionality:** Ensuring the safety module and maps work reliably even in areas with poor network connectivity.
* **Real-time Latency:** Processing and broadcasting SOS emergency alerts instantly without backend delays.
* **AI Generation Constraints:** Ensuring the AI planner generates accurate, physically possible itineraries without hallucinating non-existent locations.

## Strategies
* **Caching & PWA:** Implement progressive web app (PWA) strategies and aggressive local storage caching so core safety maps load without a network.
* **WebSockets/Real-time DB:** Utilize Supabase's real-time channels for instant SOS broadcasting rather than standard HTTP polling.
* **Strict Prompt Engineering:** Constrain the AI itinerary generation using strict schemas (like Pydantic/Zod) and cross-reference outputs with our own curated Supabase database of verified locations.
