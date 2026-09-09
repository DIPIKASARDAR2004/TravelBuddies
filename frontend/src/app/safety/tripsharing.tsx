"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FiEdit2, FiShare2, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Trip } from "@/lib/trips";

type TripForm = {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  sharing: boolean;
};

const emptyForm: TripForm = {
  title: "",
  destination: "",
  start_date: "",
  end_date: "",
  sharing: false,
};

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export default function TripSharing() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTrips() {
      try {
        const response = await fetch("/api/trips");
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Unable to load trips."));
        }
        const body = (await response.json()) as { trips: Trip[] };
        if (active) setTrips(body.trips);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load trips.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTrips();
    return () => { active = false; };
  }, []);

  const updateField = <K extends keyof TripForm>(field: K, value: TripForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(editingId ? `/api/trips/${editingId}` : "/api/trips", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to save trip."));
      }

      const body = (await response.json()) as { trip: Trip };
      setTrips((current) => editingId
        ? current.map((trip) => trip.id === body.trip.id ? body.trip : trip)
        : [body.trip, ...current]);
      resetForm();
      setSuccess(editingId ? "Trip updated." : "Trip created.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save trip.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this trip?")) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to delete trip."));
      }
      setTrips((current) => current.filter((trip) => trip.id !== id));
      if (editingId === id) resetForm();
      setSuccess("Trip deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete trip.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
          <FiShare2 className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trip Sharing</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Save trip details and explicitly mark them shareable. This does not share live location or contact information.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 mb-6">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Trip title
          <input required maxLength={120} value={form.title} onChange={(event) => updateField("title", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Destination
          <input required maxLength={160} value={form.destination} onChange={(event) => updateField("destination", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Start date
          <input required type="date" value={form.start_date} onChange={(event) => updateField("start_date", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          End date
          <input required type="date" value={form.end_date} onChange={(event) => updateField("end_date", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
          <input type="checkbox" checked={form.sharing} onChange={(event) => updateField("sharing", event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          Mark this trip as shareable for future authenticated sharing features
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Trip" : "Create Trip"}</Button>
          {editingId && <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>}
        </div>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{success}</p>}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading trips...</p>
      ) : trips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No trips created yet.</p>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{trip.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${trip.sharing ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {trip.sharing ? "Sharing ON" : "Sharing OFF"}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{trip.destination} · {trip.start_date} to {trip.end_date}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(trip.id); setForm({ title: trip.title, destination: trip.destination, start_date: trip.start_date, end_date: trip.end_date, sharing: trip.sharing }); setError(null); setSuccess(null); }} disabled={saving || deletingId !== null} aria-label={`Edit ${trip.title}`}>
                  <FiEdit2 className="mr-2" /> Edit
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(trip.id)} disabled={saving || deletingId !== null} aria-label={`Delete ${trip.title}`}>
                  <FiTrash2 className="mr-2" /> {deletingId === trip.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
