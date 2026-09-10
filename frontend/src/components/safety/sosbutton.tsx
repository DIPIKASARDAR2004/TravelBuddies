"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SafetyPanel } from "@/components/safety/SafetyPanel";
import {
  formatDateTime,
  getErrorMessage,
  requestCurrentPosition,
} from "@/lib/client/safetyClient";
import type { EmergencyAlert } from "@/lib/services/emergencyAlerts";

export default function SOSButton() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [message, setMessage] = useState("");
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
      try {
        const response = await fetch("/api/emergency-alerts");
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Unable to load emergency alerts."));
        }
        const body = (await response.json()) as { alerts: EmergencyAlert[] };
        if (active) setAlerts(body.alerts);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load emergency alerts.");
        }
      } finally {
        if (active) setLoadingAlerts(false);
      }
    }

    void loadAlerts();
    return () => {
      active = false;
    };
  }, []);

  const createAlert = async () => {
    setSubmitting(true);
    setConfirming(false);
    setError(null);
    setSuccess(null);

    try {
      const position = await requestCurrentPosition();
      const response = await fetch("/api/emergency-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to create emergency alert."));
      }

      const body = (await response.json()) as { alert: EmergencyAlert };
      setAlerts((current) => [body.alert, ...current]);
      setMessage("");
      setSuccess(`Emergency alert created with status: ${body.alert.status}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create emergency alert.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafetyPanel
      icon={FiAlertTriangle}
      title="Emergency SOS"
      description="Create one authenticated emergency alert with your current location. This is now a clearer two-step action instead of a browser confirm popup."
      accent="rose"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <label className="block flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Optional message
          <textarea
            maxLength={500}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Add a short note if someone should know what is happening."
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>

        <div className="flex w-full flex-col gap-3 md:max-w-[240px]">
          <Button
            type="button"
            variant={confirming ? "danger" : "primary"}
            size="lg"
            onClick={() => (confirming ? void createAlert() : setConfirming(true))}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? "Creating alert..." : confirming ? "Confirm SOS alert" : "Trigger SOS"}
          </Button>
          {confirming ? (
            <Button type="button" variant="outline" onClick={() => setConfirming(false)} disabled={submitting}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>

      {confirming ? (
        <div className="mt-4">
          <StatusBanner tone="warning" title="Ready to send">
            Confirming will request your current location and create an emergency alert tied to your account.
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

      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-white">Recent alerts</h3>
        {loadingAlerts ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading alert history...</p>
        ) : alerts.length === 0 ? (
          <div className="mt-3">
            <StatusBanner title="No alerts yet">
              No emergency alerts have been created from this account.
            </StatusBanner>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">
                      {alert.status}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Created {formatDateTime(alert.created_at)}
                    </p>
                  </div>
                  {alert.message ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SafetyPanel>
  );
}
