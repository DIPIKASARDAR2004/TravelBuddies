"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import type { EnrichedItineraryDay, PlannerPackage } from "@/types";
import { readCoordinates } from "@/lib/itinerary/coordinates";
import { buildDayItinerary } from "@/lib/itinerary/buildDayItinerary";
import { unroutedPreview } from "@/lib/itinerary/routePreview";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { formatDuration } from "@/lib/utils";
import { useTripRoutes } from "./useTripRoutes";

const LIBRARIES = ["routes", "marker"];
const NOOP = () => {};
type ReadyHandler = (itinerary: EnrichedItineraryDay[]) => void;
interface Props {
  plan?: PlannerPackage | null;
  days?: number;
  onEnrichedItineraryReady?: ReadyHandler;
}

function TripDirections({
  plan,
  days,
  onReady,
}: {
  plan: PlannerPackage;
  days: number;
  onReady: ReadyHandler;
}) {
  const map = useMap();
  const library = useMapsLibrary("routes");
  const summary = useTripRoutes(map, library, plan, days, onReady);
  if (!summary || summary.distance === 0) return null;
  return (
    <div
      role="status"
      className="absolute left-4 top-4 z-10 rounded-xl border border-slate-200 bg-white/95 px-5 py-3 text-sm font-bold text-slate-800 shadow-lg dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100"
    >
      <p>Driving estimates for routed days</p>
      <p>
        {summary.distance.toFixed(1)} km • {formatDuration(summary.duration)}
      </p>
    </div>
  );
}

export default function GoogleTripMap({
  plan,
  days,
  onEnrichedItineraryReady = NOOP,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const hotel = readCoordinates(plan?.selectedHotel);
  const canLoad = Boolean(apiKey && plan && days && hotel);
  const [status, setStatus] = useState<
    "loading" | "ready" | "failed" | "timeout"
  >("loading");
  const onLoad = useCallback(
    () => setStatus((current) => (current === "loading" ? "ready" : current)),
    [],
  );
  const onError = useCallback(() => setStatus("failed"), []);

  useEffect(() => {
    if (!canLoad) return;
    const timer = setTimeout(
      () =>
        setStatus((current) => (current === "loading" ? "timeout" : current)),
      10000,
    );
    return () => clearTimeout(timer);
  }, [canLoad]);

  const unavailable = !apiKey
    ? "The map is not configured. Your selected activities are still shown below."
    : !hotel
      ? "The selected stay has no valid coordinates. Add catalog coordinates before requesting a route."
      : status === "failed"
        ? "The map could not load. Check the connection and map configuration, then refresh."
        : status === "timeout"
          ? "The map took too long to load. Refresh to try again; your plan is preserved."
          : null;

  useEffect(() => {
    if (unavailable || status === "loading")
      onEnrichedItineraryReady(
        unroutedPreview(plan, days, unavailable ?? "Loading the map…"),
      );
  }, [unavailable, status, plan, days, onEnrichedItineraryReady]);

  if (!plan || !days)
    return (
      <StatusBanner title="Map preview unavailable">
        Select a package in the trip planner first.
      </StatusBanner>
    );
  if (!canLoad)
    return (
      <StatusBanner tone="warning" title="Map preview unavailable">
        {unavailable}
      </StatusBanner>
    );

  const activities = buildDayItinerary(plan, days).flatMap(
    (day) => day.activities,
  );
  return (
    <div className="relative min-h-[500px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-lg dark:border-slate-800">
      <APIProvider
        apiKey={apiKey}
        libraries={LIBRARIES}
        onLoad={onLoad}
        onError={onError}
      >
        {status === "ready" ? (
          <Map
            defaultCenter={hotel!}
            defaultZoom={13}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            mapId="DEMO_MAP_ID"
            className="h-[500px]"
          >
            <AdvancedMarker position={hotel!} title={plan.selectedHotel?.name}>
              <Pin
                background="#0ea5e9"
                borderColor="#0284c7"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
            {activities.map((activity, index) => {
              const position = readCoordinates(activity);
              return position ? (
                <AdvancedMarker
                  key={`${activity.activity_name}-${index}`}
                  position={position}
                  title={activity.activity_name}
                >
                  <Pin
                    background="#f43f5e"
                    borderColor="#be123c"
                    glyphColor="#ffffff"
                  />
                </AdvancedMarker>
              ) : null;
            })}
            <TripDirections
              plan={plan}
              days={days}
              onReady={onEnrichedItineraryReady}
            />
          </Map>
        ) : (
          <div className="p-6" role="status">
            <StatusBanner
              tone={unavailable ? "warning" : "default"}
              title={unavailable ? "Map preview unavailable" : "Loading map"}
            >
              {unavailable ?? "Connecting to the map provider…"}
            </StatusBanner>
          </div>
        )}
      </APIProvider>
    </div>
  );
}
