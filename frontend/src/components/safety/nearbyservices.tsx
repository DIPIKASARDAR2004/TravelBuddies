"use client";

import { FiSearch } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SafetyPanel } from "@/components/safety/SafetyPanel";
import { useNearbyServices } from "./useNearbyServices";
import type { ServiceCategory } from "@/lib/services/nearbySafetyServices";

const categories: Array<{ value: ServiceCategory; label: string }> = [
  { value: "police", label: "Police stations" },
  { value: "hospital", label: "Hospitals" },
  { value: "pharmacy", label: "Pharmacies" },
  { value: "fire_station", label: "Fire stations" },
];

function formatDistance(distanceMeters: number) {
  return distanceMeters < 1000
    ? `${distanceMeters} m away`
    : `${(distanceMeters / 1000).toFixed(1)} km away`;
}

export default function NearbySafetyServices() {
  const {
    category,
    setCategory,
    services,
    searched,
    loading,
    error,
    findServices,
  } = useNearbyServices();

  return (
    <SafetyPanel
      icon={FiSearch}
      title="Nearby safety services"
      description="Search OpenStreetMap using a one-time location sent through this server to Overpass. Listings, opening hours and response availability are not verified."
      accent="sky"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Service type
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ServiceCategory)
            }
            disabled={loading}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {categories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          onClick={() => void findServices()}
          disabled={loading}
        >
          {loading ? "Searching..." : "Find nearby services"}
        </Button>
      </div>

      {error ? (
        <div className="mt-4">
          <StatusBanner tone="danger">{error}</StatusBanner>
        </div>
      ) : null}
      {!loading && searched && services.length === 0 ? (
        <div className="mt-5">
          <StatusBanner title="No matches nearby">
            No matching mapped listings were returned for this 2 km search. This
            does not establish that no services exist.
          </StatusBanner>
        </div>
      ) : null}
      {services.length > 0 ? (
        <div className="mt-5 space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-xs capitalize text-slate-500 dark:text-slate-400">
                    {service.category.replace("_", " ")}
                  </p>
                </div>
                <span className="text-sm font-medium text-sky-600 dark:text-sky-400">
                  {formatDistance(service.distanceMeters)}
                </span>
              </div>
              {service.address ? (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {service.address}
                </p>
              ) : null}
              {service.phone ? (
                <a
                  className="mt-2 inline-block text-sm text-sky-600 hover:underline dark:text-sky-400"
                  href={
                    /^[+\d\s().-]{3,40}$/.test(service.phone)
                      ? `tel:${service.phone}`
                      : undefined
                  }
                >
                  {service.phone}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
      {searched ? (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Service data © OpenStreetMap contributors. Distances are approximate
          straight-line distances, not travel times. Confirm details
          independently; this app does not dispatch help.
        </p>
      ) : null}
    </SafetyPanel>
  );
}
