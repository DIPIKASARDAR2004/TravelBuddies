"use client";

import { useEffect, useState } from "react";
import { usePlanStore } from "@/store/usePlanStore";

export function usePlannerInitialization(isSafetyTrip: boolean) {
  const resetStore = usePlanStore((state) => state.resetStore);
  const setTripDetails = usePlanStore((state) => state.setTripDetails);
  const storedIsSafetyTrip = usePlanStore((state) => state.tripDetails.isSafetyTrip === true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isSafetyTrip) {
      if (!storedIsSafetyTrip) {
        resetStore();
      }
      setTripDetails({ isSafetyTrip: true });
    } else if (storedIsSafetyTrip) {
      resetStore();
    }

    setMounted(true);
  }, [isSafetyTrip, resetStore, setTripDetails, storedIsSafetyTrip]);

  return mounted;
}
