"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestJson } from "@/lib/client/requestJson";
import { requestCurrentPosition } from "@/lib/client/safetyClient";
import {
  ALERT_HISTORY_LIMIT,
  readEmergencyAlert,
  readEmergencyAlerts,
  validateEmergencyAlertInput,
  type EmergencyAlert,
} from "@/lib/services/emergencyAlerts";

export function useEmergencyAlerts() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setConfirming(false);
    setError(null);
    setSuccess(null);
    try {
      const result = readEmergencyAlerts(
        await requestJson("/api/emergency-alerts", {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        }),
      );
      if (!controller.signal.aborted) {
        setAlerts(result);
        setLoaded(true);
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setLoaded(false);
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to load SOS history.",
        );
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    void load();
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, [load]);

  const createAlert = async () => {
    if (active.current || !loaded || uncertain || !confirming) return;
    const controller = new AbortController();
    active.current = controller;
    setSubmitting(true);
    setConfirming(false);
    setError(null);
    setSuccess(null);
    let writeStarted = false;
    try {
      const position = await requestCurrentPosition(controller.signal);
      if (controller.signal.aborted) return;
      const validation = validateEmergencyAlertInput({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        message,
      });
      if (!validation.valid) throw new Error(validation.error);
      writeStarted = true;
      const alert = readEmergencyAlert(
        await requestJson("/api/emergency-alerts", {
          method: "POST",
          body: JSON.stringify(validation.value),
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        }),
        { created: validation.value },
      );
      if (controller.signal.aborted) return;
      if (alerts.some((item) => item.id === alert.id))
        throw new Error(
          "The server returned an existing SOS record for a new save.",
        );
      setAlerts((current) => [alert, ...current].slice(0, ALERT_HISTORY_LIMIT));
      setMessage("");
      setSuccess(
        "SOS record saved to your account. No one was notified and no help was dispatched.",
      );
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (writeStarted) {
          setLoaded(false);
          setUncertain(true);
        }
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to confirm the SOS record.",
        );
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setSubmitting(false);
      }
    }
  };
  return {
    alerts,
    message,
    loading,
    loaded,
    submitting,
    confirming,
    uncertain,
    error,
    success,
    busy: loading || submitting,
    load,
    createAlert,
    updateMessage: (value: string) => {
      if (!active.current) setMessage(value);
    },
    confirm: () => {
      if (!active.current && loaded && !uncertain) setConfirming(true);
    },
    cancel: () => setConfirming(false),
    acknowledge: () => {
      if (!active.current && loaded) setUncertain(false);
    },
  };
}
