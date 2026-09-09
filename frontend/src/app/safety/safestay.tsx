"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FiEdit2, FiHome, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SafeStay, SafeStayStatus } from "@/lib/safeStays";

type StayForm = {
  stay_name: string;
  address: string;
  check_in: string;
  check_out: string;
  status: SafeStayStatus;
};

const emptyForm: StayForm = {
  stay_name: "",
  address: "",
  check_in: "",
  check_out: "",
  status: "active",
};

const reminderTitle = "Safe Stay check-in";
const reminderText = "Take a moment to review your room and bathroom for basic safety, confirm exits and locks, and keep important belongings secure.";

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

function toInputDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

export default function SafeStay() {
  const [stays, setStays] = useState<SafeStay[]>([]);
  const [form, setForm] = useState<StayForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reminderStay, setReminderStay] = useState<SafeStay | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStays() {
      try {
        const response = await fetch("/api/safe-stays");
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Unable to load Safe Stays."));
        }
        const body = (await response.json()) as { stays: SafeStay[] };
        if (active) setStays(body.stays);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load Safe Stays.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadStays();
    return () => { active = false; };
  }, []);

  const updateField = <K extends keyof StayForm>(field: K, value: StayForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const showCheckInReminder = async (stay: SafeStay) => {
    const storageKey = `safe-stay-reminder-shown:${stay.id}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // The in-app reminder still works when session storage is unavailable.
    }

    setReminderStay(stay);

    if (typeof window.Notification === "undefined") return;

    try {
      let permission = window.Notification.permission;
      if (permission === "default") {
        permission = await window.Notification.requestPermission();
      }
      if (permission === "granted") {
        new window.Notification(reminderTitle, { body: reminderText });
      }
    } catch {
      // Notification permission is optional; the in-app reminder remains visible.
    }
  };

  const clearCheckInReminder = (stayId: string) => {
    try {
      window.sessionStorage.removeItem(`safe-stay-reminder-shown:${stayId}`);
    } catch {
      // Session storage is optional and should not affect Safe Stay updates.
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(editingId ? `/api/safe-stays/${editingId}` : "/api/safe-stays", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stay_name: form.stay_name,
          address: form.address,
          check_in: toIsoDateTime(form.check_in),
          check_out: toIsoDateTime(form.check_out),
          status: form.status,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to save Safe Stay."));
      }

      const body = (await response.json()) as { stay: SafeStay };
      const existingStay = editingId ? stays.find((stay) => stay.id === editingId) : undefined;
      const isExplicitCheckIn = body.stay.status === "active" && (!editingId || existingStay?.status !== "active");
      setStays((current) => editingId
        ? current.map((stay) => stay.id === body.stay.id ? body.stay : stay)
        : [body.stay, ...current]);
      resetForm();
      setSuccess(editingId ? "Safe Stay updated." : "Safe Stay started.");
      if (body.stay.status === "completed") {
        clearCheckInReminder(body.stay.id);
      }
      if (isExplicitCheckIn) {
        await showCheckInReminder(body.stay);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save Safe Stay.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this Safe Stay record?")) return;
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/safe-stays/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to delete Safe Stay."));
      }
      setStays((current) => current.filter((stay) => stay.id !== id));
      if (editingId === id) resetForm();
      setSuccess("Safe Stay deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete Safe Stay.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <FiHome className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Safe Stay</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record your current stay and explicitly mark it active or completed. No location or notifications are collected.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 mb-6">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Stay or property name
          <input required maxLength={160} value={form.stay_name} onChange={(event) => updateField("stay_name", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Address (optional)
          <input maxLength={300} value={form.address} onChange={(event) => updateField("address", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Check-in
          <input required type="datetime-local" value={form.check_in} onChange={(event) => updateField("check_in", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Check-out
          <input required type="datetime-local" value={form.check_out} onChange={(event) => updateField("check_out", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Status
          <select value={form.status} onChange={(event) => updateField("status", event.target.value as SafeStayStatus)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Update Stay" : "Start Safe Stay"}</Button>
          {editingId && <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>}
        </div>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {success && <p role="status" className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{success}</p>}

      {reminderStay && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold">{reminderTitle}</h3>
              <p className="mt-1 text-sm">Take a calm moment to review this stay before settling in.</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                <li>Check that doors and windows can be secured.</li>
                <li>Locate the emergency exit or evacuation route.</li>
                <li>Confirm basic safety equipment, such as smoke alarms, is present where appropriate.</li>
                <li>Keep valuables and important belongings secure.</li>
                <li>Carefully inspect the room and bathroom for anything unusual or unsafe.</li>
                <li>Contact local staff or emergency services if you encounter a genuine safety concern.</li>
              </ul>
              {typeof window !== "undefined" && typeof window.Notification !== "undefined" && window.Notification.permission === "denied" && (
                <p className="mt-3 text-xs">Browser notifications are disabled, so this reminder is available here instead.</p>
              )}
            </div>
            <button type="button" onClick={() => setReminderStay(null)} className="text-sm font-semibold text-emerald-800 hover:underline dark:text-emerald-200">Dismiss</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading Safe Stays...</p>
      ) : stays.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No Safe Stay records yet.</p>
      ) : (
        <div className="space-y-3">
          {stays.map((stay) => (
            <div key={stay.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{stay.stay_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stay.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {stay.status}
                  </span>
                </div>
                {stay.address && <p className="text-sm text-slate-500 dark:text-slate-400">{stay.address}</p>}
                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(stay.check_in).toLocaleString()} to {new Date(stay.check_out).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(stay.id); setForm({ stay_name: stay.stay_name, address: stay.address ?? "", check_in: toInputDateTime(stay.check_in), check_out: toInputDateTime(stay.check_out), status: stay.status }); setError(null); setSuccess(null); }} disabled={saving || deletingId !== null} aria-label={`Edit ${stay.stay_name}`}>
                  <FiEdit2 className="mr-2" /> Edit
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(stay.id)} disabled={saving || deletingId !== null} aria-label={`Delete ${stay.stay_name}`}>
                  <FiTrash2 className="mr-2" /> {deletingId === stay.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
