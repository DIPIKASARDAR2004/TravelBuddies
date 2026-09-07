# Journey Pilot: Scalability and Operating Costs

As Journey Pilot scales from a prototype to a platform serving thousands of users, infrastructure and service costs will grow across three main pillars: Database/Backend (Supabase), Frontend Hosting (Next.js), and Payments (Razorpay Escrow).

## 1. Database & Backend Services (Supabase)

Supabase handles PostgreSQL database management, Auth, and Edge Functions.
- **Compute & Storage:** The free tier provides a shared database (500MB). Scaling to production will require at least the Pro plan ($25/mo), which gives 8GB storage and dedicated compute. At massive scale, dedicated enterprise compute instances range from $15 to $1,000+/mo.
- **Bandwidth (Egress):** Supabase charges for data leaving their servers. Heavy read operations—like loading thousands of hotel images, detailed map points, or running massive queries for the Trip Planner—will rapidly increase bandwidth usage if not heavily cached on the frontend.
- **Connection Pooling:** At scale, serverless edge functions can exhaust Postgres connection limits. Supabase provides PgBouncer/Supavisor to pool connections, which is necessary to handle traffic spikes.

## 2. Frontend Hosting (Next.js via Vercel or AWS)

- **Serverless Execution:** If hosted on Vercel, costs are driven by serverless function execution time (GB-hours). Complex server-side calculations (like the Journey Pilot Budget Recommendation Engine) are computationally heavy and will consume execution time quickly if run on every page load.
- **Cost-Optimization:** Moving heavy computation to background jobs, or heavily caching generic requests (e.g., caching the "Best Value" trip for "Darjeeling, 2-days, 2-travellers" route) will drastically cut serverless hosting costs.
- **Image Optimization:** Serving optimized images via Next/Image can incur costs after the base limits are exceeded on Vercel.

## 3. Payments & Escrow (Razorpay Route)

- **Standard Processing Fees:** Razorpay charges a standard processing fee for incoming customer payments, typically around **2% + GST** for domestic cards, UPI, and Netbanking.
- **Escrow / Route Pricing:** Since Journey Pilot operates a Protected Payment (Escrow) model, funds are collected, held, and then split to vendors (hotels). While standard routing may just incur flat transfer fees (₹2 to ₹10 per payout via NEFT/IMPS), a true compliance-heavy Escrow+ setup involving a trustee account requires a custom enterprise pricing plan negotiated directly with Razorpay sales.

## 4. Third-Party APIs (Future)

- **AI Chatbot (LLMs):** Generating itineraries or answering user questions via OpenAI, Anthropic, or Google APIs costs money per input/output token.
- **Maps:** If the platform shifts from free Leaflet/OSM to Google Maps or Mapbox for advanced routing or safety features, map loads and API calls will introduce significant costs at scale.
