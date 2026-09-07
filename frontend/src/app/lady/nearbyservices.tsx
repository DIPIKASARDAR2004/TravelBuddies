"use client";

import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { NearbySafetyService, ServiceCategory } from "@/lib/nearbySafetyServices";

const categories: Array<{ value: ServiceCategory; label: string }> = [
  { value: "police", label: "Police stations" },
  { value: "hospital", label: "Hospitals" },
  { value: "pharmacy", label: "Pharmacies" },
  { value: "fire_station", label: "Fire stations" },
];

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

function formatDistance(distanceMeters: number) {
  return distanceMeters < 1000
    ? `${distanceMeters} m away`
    : `${(distanceMeters / 1000).toFixed(1)} km away`;
}

export default function NearbySafetyServices() {
  const [category, setCategory] = useState<ServiceCategory>("police");
  const [services, setServices] = useState<NearbySafetyService[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findServices = () => {
    setLoading(true);
    setError(null);
    setSearched(false);

    if (!navigator.geolocation) {
      setError("Location is unavailable in this browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const params = new URLSearchParams({
              latitude: String(position.coords.latitude),
              longitude: String(position.coords.longitude),
              type: category,
              radius: "2000",
            });
            const response = await fetch(`/api/nearby-safety-services?${params.toString()}`);
            if (!response.ok) {
              throw new Error(await getErrorMessage(response, "Unable to find nearby services."));
            }
            const body = (await response.json()) as { services: NearbySafetyService[] };
            setServices(body.services);
            setSearched(true);
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Unable to find nearby services.");
          } finally {
            setLoading(false);
          }
        })();
      },
      () => {
        setError("Location permission was denied or the current position is unavailable.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/40">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <FiSearch className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Nearby Safety Services</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Find nearby public safety services using a one-time current location search.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Service type
          <select value={category} onChange={(event) => setCategory(event.target.value as ServiceCategory)} disabled={loading} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <Button type="button" onClick={findServices} disabled={loading}>
          {loading ? "Searching..." : "Find Nearby Services"}
        </Button>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {!loading && searched && services.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No matching services were found within 2 km.</p>}
      {services.length > 0 && (
        <div className="mt-5 space-y-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{service.name}</h3>
                  <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{service.category.replace("_", " ")}</p>
                </div>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{formatDistance(service.distanceMeters)}</span>
              </div>
              {service.address && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{service.address}</p>}
              {service.phone && <a className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400" href={`tel:${service.phone}`}>{service.phone}</a>}
            </div>
          ))}
        </div>
      )}
      {searched && <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Service data © OpenStreetMap contributors.</p>}
    </Card>
  );
}
