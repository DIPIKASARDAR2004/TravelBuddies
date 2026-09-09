# Map Implementation Workflow

## 1. Current Map Implementation
- The existing project uses **Leaflet** for basic mapping functionality.
- Leaflet will be removed after its files and dependencies are inspected, while the `/map` route and the navbar `Map` link remain active.

## 2. Planned Features
### Plan Trip → Trip Map Flow
- Once a trip is finalized, the user can click View Trip on Map.
- This map will display markers for both Hotels and Activities.
- **Note:** Hotels and activities currently do not have latitude and longitude

### Safety Page → Shared Safety Map Flow
- The Safety page will integrate a shared **Safety Map flow**.
- **Late-Night Travel Alerts:** Must use the calculated itinerary return time. Do not call travel segments "high-risk."
- **Safety-Aware Route Comparison:** This feature must remain disabled until Journey Pilot has verified transport/lighting data.
- **Critical Policy:** The app will *never* claim “Safest Route Guaranteed” to avoid liability and false assurance.

### UI Integration
- **Vlogger Mode:** Belongs strictly *after* the Smart Day-wise Guide, serving as an augmented visualization layer.

## 3. Current Next Implementation: Google Maps
- **Google Maps** is our current next implementation.
- **Maps JavaScript API:** Responsible for rendering the interactive map canvas, markers (Hotels/Activities), and custom UI overlays.
- **Routes API:** Responsible for calculating normal routes, distance, and estimated travel time. It does *not* calculate women’s safety.

## 4. Shared Files & Git Conflicts
When implementing these flows, be cautious of files shared with Safety and Payment teammates, which may cause Git conflicts:
- `frontend/package.json` (Dependency additions for maps)
- Zustand store files (State management for trips)
- Supabase schema files (`supabase/migrations/*`) and Supabase client definitions.
- The global layout/navbar components.

## 5. Step-by-Step Implementation & Verification Checklist
- [ ] 1. Audit current code
- [ ] 2. Add and populate coordinates
- [ ] 3. Configure Google Maps APIs
- [ ] 4. Remove Leaflet
- [ ] 5. Build Google Map
- [ ] 6. Connect finalized Plan Trip
- [ ] 7. Add markers
- [x] 8. Add route, distance and time
- [x] 9. Build Smart Day-wise Guide
- [x] 10. Add Late-Night Travel Alerts
- [ ] 11. Connect Safety Map
- [ ] 12. Add Vlogger Mode
- [ ] 13. Enable Safety-Aware Route Comparison only after a verified transport/lighting data source exists

-**Plan State Integration:** Verify that Zustand’s final customized plan contains `selectedHotel` and all `selectedActivities`, and remains available after navigating to `/map` or refreshing.

- **Data Source for Safety:** The specific API or database provider for verifying transport and lighting data for the Safety-Aware Route Comparison is currently undetermined.
