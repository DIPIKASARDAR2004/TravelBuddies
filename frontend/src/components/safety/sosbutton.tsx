"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { EmergencyAlert } from '@/lib/services/emergencyAlerts';

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

export default function SOSButton() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [message, setMessage] = useState("");
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        if (active) {
          setAlerts(body.alerts);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load emergency alerts.");
        }
      } finally {
        if (active) {
          setLoadingAlerts(false);
        }
      }
    }

    void loadAlerts();
    return () => {
      active = false;
    };
  }, []);

  const createAlert = (latitude: number, longitude: number) => {
    void (async () => {
      try {
        const response = await fetch("/api/emergency-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, message }),
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
    })();
  };

  const handleSOS = () => {
    if (submitting) return;
    if (!window.confirm("Trigger an emergency alert with your current location?")) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!navigator.geolocation) {
      setError("Location is unavailable in this browser. No alert was created because the current alert record requires coordinates.");
      setSubmitting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => createAlert(position.coords.latitude, position.coords.longitude),
      () => {
        setError("Location permission was denied or unavailable. No alert was created because the current alert record requires coordinates.");
        setSubmitting(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/40">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <FiAlertTriangle className="text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Emergency SOS</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Creates one authenticated emergency alert using your current location.
              </p>
            </div>
          </div>
          <label className="block mt-5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Optional message
            <textarea
              maxLength={500}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="Add a short note if needed"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-red-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>
        </div>
        <Button type="button" variant="danger" size="lg" onClick={handleSOS} disabled={submitting} className="shrink-0">
          {submitting ? "Creating alert..." : "Trigger SOS"}
        </Button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {success && <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{success}</p>}

      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white">Recent alerts</h3>
        {loadingAlerts ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading alert history...</p>
        ) : alerts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No emergency alerts have been created.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex flex-col gap-1 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{alert.status}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Created {formatDate(alert.created_at)}</p>
                </div>
                {alert.message && <p className="text-sm text-slate-600 dark:text-slate-300">{alert.message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
