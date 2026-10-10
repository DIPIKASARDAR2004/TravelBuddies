"use client";

import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { formatDateTime } from "@/lib/client/safetyClient";
import { SafetyPanel } from "./SafetyPanel";
import { useEmergencyAlerts } from "./useEmergencyAlerts";

export default function SOSButton() {
  const sos = useEmergencyAlerts();
  const locked = sos.busy || !sos.loaded || sos.uncertain;
  return (
    <SafetyPanel
      icon={FiAlertTriangle}
      title="Emergency SOS"
      description="Save a location-stamped record to your account. This prototype does not send emergency alerts."
      accent="rose"
    >
      <div className="mb-5">
        <StatusBanner
          tone="warning"
          title="Record only — no emergency response"
        >
          Saving here does not notify trusted contacts or emergency services,
          and does not dispatch help. For urgent help, contact local emergency
          services directly.
        </StatusBanner>
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <label className="block flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Optional message
          <textarea
            maxLength={500}
            value={sos.message}
            disabled={sos.busy}
            onChange={(event) => sos.updateMessage(event.target.value)}
            rows={4}
            placeholder="A short note for your own saved record."
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <div className="flex w-full flex-col gap-3 md:max-w-[240px]">
          <Button
            type="button"
            variant={sos.confirming ? "danger" : "primary"}
            size="lg"
            onClick={() =>
              sos.confirming ? void sos.createAlert() : sos.confirm()
            }
            disabled={locked}
            className="w-full"
          >
            {sos.submitting
              ? "Saving record..."
              : sos.confirming
                ? "Confirm save SOS record"
                : "Save SOS record"}
          </Button>
          {sos.confirming && (
            <Button type="button" variant="outline" onClick={sos.cancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      {sos.confirming && (
        <div className="mt-4">
          <StatusBanner tone="warning" title="Ready to save">
            Confirming requests your current location and stores it with this
            note in your account. It does not send a message to anyone.
          </StatusBanner>
        </div>
      )}
      {sos.error && (
        <div role="alert" className="mt-4">
          <StatusBanner tone="danger">{sos.error}</StatusBanner>
        </div>
      )}
      {sos.success && (
        <div role="status" className="mt-4">
          <StatusBanner tone="success">{sos.success}</StatusBanner>
        </div>
      )}
      {sos.uncertain && (
        <div className="mt-4">
          <StatusBanner tone="warning" title="Save outcome unknown">
            The record may already be saved. Refresh and inspect recent records
            before trying again. Another save can create a duplicate.
            {sos.loaded && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={sos.busy}
                onClick={sos.acknowledge}
              >
                I checked history
              </Button>
            )}
          </StatusBanner>
        </div>
      )}
      <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Recent SOS records
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sos.busy}
            onClick={() => void sos.load()}
          >
            Refresh SOS history
          </Button>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Up to 10 latest records. A stored status is not proof that anyone
          received an alert.
        </p>
        {sos.loading ? (
          <p role="status" className="mt-3 text-sm">
            Loading SOS history...
          </p>
        ) : !sos.loaded ? (
          <p className="mt-3 text-sm">
            Saved history could not be confirmed. Refresh before saving another
            record.
          </p>
        ) : sos.alerts.length === 0 ? (
          <div className="mt-3">
            <StatusBanner title="No SOS records yet">
              No SOS records were returned for this account.
            </StatusBanner>
          </div>
        ) : null}
        {sos.alerts.length > 0 && (
          <div className="mt-3 space-y-3">
            {!sos.loaded && (
              <p className="text-sm">
                Last confirmed records (may be out of date)
              </p>
            )}
            {sos.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Record status: {alert.status}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Created {formatDateTime(alert.created_at)}
                    </p>
                  </div>
                  {alert.message && (
                    <p className="min-w-0 break-words text-sm text-slate-600 dark:text-slate-300">
                      {alert.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SafetyPanel>
  );
}
