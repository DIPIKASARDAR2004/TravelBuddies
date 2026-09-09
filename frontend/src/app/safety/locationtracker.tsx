"use client";

import { useEffect, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { LocationShare } from "@/lib/locationShares";

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

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
        if (active) {
          setLocationShare(body.locationShare);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load location-sharing state.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLocationState();
    return () => {
      active = false;
    };
  }, []);

  const requestCurrentPosition = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is unavailable in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, () => {
      reject(new Error("Location permission was denied or the current position is unavailable."));
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  });

  const updateLocation = async (sharing: boolean) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const position = await requestCurrentPosition();
      const response = await fetch("/api/location-sharing", {
        method: locationShare ? "PATCH" : "POST",
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
      setSuccess(sharing ? "Location sharing is now on." : "Location sharing is now off.");
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

  const refreshLocation = () => {
    void updateLocation(locationShare?.sharing ?? false);
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <FiMapPin className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Location Sharing</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Store only your latest location and sharing choice. Location is requested only when you choose an action.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${locationShare?.sharing ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
          Sharing: {locationShare?.sharing ? "ON" : "OFF"}
        </span>
        <Button type="button" variant={locationShare?.sharing ? "danger" : "primary"} onClick={() => void (locationShare?.sharing ? disableSharing() : updateLocation(true))} disabled={loading || submitting}>
          {submitting ? "Updating..." : locationShare?.sharing ? "Turn Sharing Off" : "Turn Sharing On"}
        </Button>
        <Button type="button" variant="outline" onClick={refreshLocation} disabled={loading || submitting || !locationShare}>
          Update Location
        </Button>
      </div>

      {locationShare?.updated_at && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Last updated: {formatDate(locationShare.updated_at)}</p>
      )}
      {loading && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading location-sharing state...</p>}
      {!loading && !locationShare && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Location sharing has not been started yet.</p>}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {success && <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{success}</p>}
    </Card>
  );
}
