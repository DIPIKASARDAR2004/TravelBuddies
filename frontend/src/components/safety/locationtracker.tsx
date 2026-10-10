"use client";

import { FiMapPin } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SafetyPanel } from "@/components/safety/SafetyPanel";
import { formatDateTime } from "@/lib/client/safetyClient";
import { useLocationSharing } from "./useLocationSharing";

export default function LocationTracking() {
  const {
    locationShare,
    loading,
    loaded,
    submitting,
    error,
    success,
    load,
    saveLocation,
    disableSharing,
  } = useLocationSharing();

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
          Sharing: {!loaded ? "UNKNOWN" : locationShare?.sharing ? "ON" : "OFF"}
        </span>
        <Button
          type="button"
          variant={locationShare?.sharing ? "danger" : "primary"}
          onClick={() =>
            void (locationShare?.sharing
              ? disableSharing()
              : saveLocation(true))
          }
          disabled={loading || submitting || !loaded}
        >
          {submitting
            ? "Updating..."
            : locationShare?.sharing
              ? "Turn sharing off"
              : "Turn sharing on"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void saveLocation(locationShare?.sharing ?? false)}
          disabled={loading || submitting || !loaded}
        >
          Update latest location
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void load()}
          disabled={loading || submitting}
        >
          Refresh saved state
        </Button>
      </div>

      {locationShare?.updated_at ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Last updated: {formatDateTime(locationShare.updated_at)}
        </p>
      ) : null}
      {loading ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Loading location-sharing state...
        </p>
      ) : null}
      {loaded && !loading && !locationShare ? (
        <div className="mt-4">
          <StatusBanner title="Sharing not started">
            Save a one-time location with sharing on or off. Turning sharing off
            does not delete the stored location or notify contacts.
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
