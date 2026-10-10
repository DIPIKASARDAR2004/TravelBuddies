import type { StateStorage } from "zustand/middleware";
import type {
  PlannerApiResponse,
  PlannerPackage,
  PlannerView,
  TripDetails,
} from "@/types";
import { isDateOnly } from "@/lib/dateOnly";
import { readPlanRequest } from "./planRequest";
import { readPlannerPackage, readPlannerResponse } from "./planResponses";

// Storage is optional. Private-mode restrictions must not break in-memory actions.
export const plannerSessionStorage: StateStorage = {
  getItem(name) {
    try {
      return sessionStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    try {
      sessionStorage.setItem(name, value);
    } catch {}
  },
  removeItem(name) {
    try {
      sessionStorage.removeItem(name);
    } catch {}
  },
};

type PlanSnapshot = {
  view: PlannerView;
  tripDetails: TripDetails;
  apiResponse: PlannerApiResponse | null;
  customizedPlan: PlannerPackage | null;
};

/** Only restore known data fields, never methods or transient loading/modal state. */
export function readPlanSnapshot(value: unknown): PlanSnapshot | null {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const data = value as Record<string, unknown>;
    if (!["FORM", "TIERS", "CUSTOMIZE"].includes(data.view as string))
      return null;
    if (
      !data.tripDetails ||
      typeof data.tripDetails !== "object" ||
      Array.isArray(data.tripDetails)
    )
      return null;
    const trip = data.tripDetails as Record<string, unknown>;
    const request = readPlanRequest({
      ...trip,
      totalBudget: trip.budget,
      womenOnly: trip.isSafetyTrip,
    });
    let dates: TripDetails["dates"];
    if (trip.dates !== undefined) {
      if (!trip.dates || typeof trip.dates !== "object") return null;
      const saved = trip.dates as Record<string, unknown>;
      if (
        !isDateOnly(saved.startDate) ||
        !isDateOnly(saved.endDate) ||
        (Date.parse(saved.endDate) - Date.parse(saved.startDate)) / 86400000 !==
          request.days
      )
        return null;
      dates = { startDate: saved.startDate, endDate: saved.endDate };
    }
    const apiResponse =
      data.apiResponse === null ? null : readPlannerResponse(data.apiResponse);
    const customizedPlan =
      data.customizedPlan === null
        ? null
        : readPlannerPackage(data.customizedPlan);
    if (data.view !== "FORM" && !apiResponse?.isTripPossible) return null;
    if (data.view === "CUSTOMIZE" && !customizedPlan) return null;
    if (
      apiResponse &&
      (apiResponse.destination !== request.destination ||
        apiResponse.days !== request.days ||
        apiResponse.travellers !== request.travellers)
    )
      return null;
    return {
      view: data.view as PlannerView,
      tripDetails: {
        destination: request.destination,
        budget: request.totalBudget,
        travellers: request.travellers,
        days: request.days,
        isSafetyTrip: request.womenOnly,
        dates,
      },
      apiResponse,
      customizedPlan,
    };
  } catch {
    return null;
  }
}
