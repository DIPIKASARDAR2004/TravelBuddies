"use client";

import { useEffect, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SafetyPanel } from "@/components/safety/SafetyPanel";
import {
  formatDateTime,
  getErrorMessage,
  requestCurrentPosition,
} from "@/lib/client/safetyClient";
import type { LocationShare } from "@/lib/services/locationShares";

export default function LocationTracking() {
  const [locationShare, setLocationShare] = useState<LocationShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLocationState() {
      try {
        const response = await fetch("/api/location-sharing");
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Unable to load location-sharing state."));
        }
        const body = (await response.json()) as { locationShare: LocationShare | null };
        if (active) setLocationShare(body.locationShare);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load location-sharing state.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLocationState();
    return () => {
      active = false;
    };
  }, []);

  const saveLocation = async (sharing: boolean, forceRefresh = false) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const position = await requestCurrentPosition();
      const response = await fetch("/api/location-sharing", {
        method: locationShare && !forceRefresh ? "PATCH" : locationShare ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          sharing,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to update location-sharing state."));
      }

      const body = (await response.json()) as { locationShare: LocationShare };
      setLocationShare(body.locationShare);
      setSuccess(sharing ? "Location sharing is now on." : "Location updated while sharing remains off.");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update location-sharing state.");
    } finally {
      setSubmitting(false);
    }
  };

  const disableSharing = async () => {
    if (!locationShare) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/location-sharing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharing: false }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to turn off location sharing."));
      }

      const body = (await response.json()) as { locationShare: LocationShare };
      setLocationShare(body.locationShare);
      setSuccess("Location sharing is now off.");
    } catch (disableError) {
      setError(disableError instanceof Error ? disableError.message : "Unable to turn off location sharing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafetyPanel
      icon={FiMapPin}
      title="Location sharing"
      description="Store only your latest location and sharing choice. Location is requested only when you explicitly choose an action."
      accent="sky"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            locationShare?.sharing
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          Sharing: {locationShare?.sharing ? "ON" : "OFF"}
        </span>
        <Button
          type="button"
          variant={locationShare?.sharing ? "danger" : "primary"}
          onClick={() => void (locationShare?.sharing ? disableSharing() : saveLocation(true))}
          disabled={loading || submitting}
        >
          {submitting ? "Updating..." : locationShare?.sharing ? "Turn sharing off" : "Turn sharing on"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void saveLocation(locationShare?.sharing ?? false, true)}
          disabled={loading || submitting}
        >
          Update latest location
        </Button>
      </div>

      {locationShare?.updated_at ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Last updated: {formatDateTime(locationShare.updated_at)}
        </p>
      ) : null}
      {loading ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading location-sharing state...</p> : null}
      {!loading && !locationShare ? (
        <div className="mt-4">
          <StatusBanner title="Sharing not started">
            Turn sharing on when you want to save a live safety checkpoint.
          </StatusBanner>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <StatusBanner tone="danger">{error}</StatusBanner>
        </div>
      ) : null}
      {success ? (
        <div className="mt-4">
          <StatusBanner tone="success">{success}</StatusBanner>
        </div>
      ) : null}
    </SafetyPanel>
  );
}
