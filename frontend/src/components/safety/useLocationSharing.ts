"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestJson } from "@/lib/client/requestJson";
import { requestCurrentPosition } from "@/lib/client/safetyClient";
import {
  readLocationShare,
  type LocationShare,
} from "@/lib/services/locationShares";

export function useLocationSharing() {
  const [locationShare, setLocationShare] = useState<LocationShare | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = readLocationShare(
        await requestJson("/api/location-sharing", {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        }),
      );
      if (!controller.signal.aborted) {
        setLocationShare(result);
        setLoaded(true);
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setLoaded(false);
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to load location state.",
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

  const update = async (sharing: boolean, needsLocation: boolean) => {
    if (active.current || !loaded) return;
    const controller = new AbortController();
    active.current = controller;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    let writeStarted = false;
    try {
      const position = needsLocation
        ? await requestCurrentPosition(controller.signal)
        : null;
      if (controller.signal.aborted) return;
      writeStarted = true;
      const result = readLocationShare(
        await requestJson("/api/location-sharing", {
          method: locationShare ? "PATCH" : "POST",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
          body: JSON.stringify({
            sharing,
            ...(position
              ? {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }
              : {}),
          }),
        }),
        { id: locationShare?.id, sharing },
      );
      if (!controller.signal.aborted) {
        setLocationShare(result);
        setSuccess(
          sharing
            ? "Latest location and sharing choice saved. This is not continuous tracking."
            : "Sharing is off. The latest stored location is retained.",
        );
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        // A lost/malformed response cannot prove that a dispatched write failed.
        if (writeStarted) setLoaded(false);
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to confirm the saved location state. Refresh to check.",
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
    locationShare,
    loading,
    loaded,
    submitting,
    error,
    success,
    load,
    saveLocation: (sharing: boolean) => update(sharing, true),
    disableSharing: () => update(false, false),
  };
}
