"use client";
import { useEffect, useRef, useState } from "react";
import { requestCurrentPosition } from "@/lib/client/safetyClient";
import { requestJson } from "@/lib/client/requestJson";
import {
  DEFAULT_RADIUS_METERS,
  readNearbyServices,
  type NearbySafetyService,
  type ServiceCategory,
} from "@/lib/services/nearbySafetyServices";

export function useNearbyServices() {
  const [category, setCategory] = useState<ServiceCategory>("police");
  const [services, setServices] = useState<NearbySafetyService[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  const changeCategory = (value: ServiceCategory) => {
    if (!active.current) {
      setCategory(value);
      setServices([]);
      setSearched(false);
      setError(null);
    }
  };
  const findServices = async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    setSearched(false);
    setServices([]);
    try {
      const position = await requestCurrentPosition(controller.signal);
      if (controller.signal.aborted) return;
      const params = new URLSearchParams({
        latitude: String(position.coords.latitude),
        longitude: String(position.coords.longitude),
        type: category,
        radius: String(DEFAULT_RADIUS_METERS),
      });
      const services = readNearbyServices(
        await requestJson(`/api/nearby-safety-services?${params}`, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(25000),
          ]),
        }),
        category,
        DEFAULT_RADIUS_METERS,
      );
      if (!controller.signal.aborted) {
        setServices(services);
        setSearched(true);
      }
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(
          failure instanceof Error && failure.name === "TimeoutError"
            ? "Nearby-service search took too long. Please try again."
            : failure instanceof TypeError
              ? "Nearby services could not be reached. Check your connection."
              : failure instanceof Error
                ? failure.message
                : "Unable to find nearby services.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setLoading(false);
      }
    }
  };
  return {
    category,
    setCategory: changeCategory,
    services,
    searched,
    loading,
    error,
    findServices,
  };
}
