"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FiEdit2, FiHome, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SafetyPanel } from "@/components/safety/SafetyPanel";
import { getErrorMessage } from "@/lib/client/safetyClient";
import type { SafeStay, SafeStayStatus } from "@/lib/services/safeStays";

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
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
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
    return () => {
      active = false;
    };
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
    } catch {}

    setReminderStay(stay);

    if (typeof window.Notification === "undefined") return;

    try {
      let permission = window.Notification.permission;
      if (permission === "default") {
        permission = await window.Notification.requestPermission();
      }
      if (permission === "granted") {
        new window.Notification(reminderTitle, {
          body: "Take a moment to review locks, exits, valuables, and the room before settling in.",
        });
      }
    } catch {}
  };

  const clearCheckInReminder = (stayId: string) => {
    try {
      window.sessionStorage.removeItem(`safe-stay-reminder-shown:${stayId}`);
    } catch {}
  };

  const startEditing = (stay: SafeStay) => {
    setEditingId(stay.id);
    setForm({
      stay_name: stay.stay_name,
      address: stay.address ?? "",
      check_in: toInputDateTime(stay.check_in),
      check_out: toInputDateTime(stay.check_out),
      status: stay.status,
    });
    setError(null);
    setSuccess(null);
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
      const isExplicitCheckIn =
        body.stay.status === "active" && (!editingId || existingStay?.status !== "active");

      setStays((current) =>
        editingId
          ? current.map((stay) => (stay.id === body.stay.id ? body.stay : stay))
          : [body.stay, ...current],
      );
      resetForm();
      setSuccess(editingId ? "Safe stay updated." : "Safe stay started.");
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
    setDeletingId(id);
    setPendingDeleteId(null);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/safe-stays/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to delete Safe Stay."));
      }
      setStays((current) => current.filter((stay) => stay.id !== id));
      if (editingId === id) resetForm();
      setSuccess("Safe stay deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete Safe Stay.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafetyPanel
      icon={FiHome}
      title="Safe stay"
      description="Record your stay, mark it active or completed, and keep a calmer room-safety reminder inside the app."
      accent="emerald"
    >
      <form onSubmit={handleSubmit} className="mb-6 grid gap-4 md:grid-cols-2">
        <Input
          label="Stay or property name"
          required
          maxLength={160}
          value={form.stay_name}
          onChange={(event) => updateField("stay_name", event.target.value)}
          placeholder="The Grand Residency"
        />
        <Input
          label="Address"
          maxLength={300}
          value={form.address}
          onChange={(event) => updateField("address", event.target.value)}
          placeholder="Optional address details"
        />
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Check-in
          <input
            required
            type="datetime-local"
            value={form.check_in}
            onChange={(event) => updateField("check_in", event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Check-out
          <input
            required
            type="datetime-local"
            value={form.check_out}
            onChange={(event) => updateField("check_out", event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Status
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value as SafeStayStatus)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update stay" : "Start safe stay"}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {error ? (
        <div className="mb-4">
          <StatusBanner tone="danger">{error}</StatusBanner>
        </div>
      ) : null}
      {success ? (
        <div className="mb-4">
          <StatusBanner tone="success">{success}</StatusBanner>
        </div>
      ) : null}

      {reminderStay ? (
        <div className="mb-6">
          <StatusBanner tone="success" title={reminderTitle}>
            Review locks, windows, exits, smoke alarms where applicable, and keep valuables secure before settling in.
          </StatusBanner>
          <button
            type="button"
            onClick={() => setReminderStay(null)}
            className="mt-2 text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
          >
            Dismiss reminder
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading safe stays...</p>
      ) : stays.length === 0 ? (
        <StatusBanner title="No safe stay records">
          Start one when you check in so your current property and timing are easy to review.
        </StatusBanner>
      ) : (
        <div className="space-y-3">
          {stays.map((stay) => (
            <div
              key={stay.id}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{stay.stay_name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        stay.status === "active"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {stay.status}
                    </span>
                  </div>
                  {stay.address ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{stay.address}</p>
                  ) : null}
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(stay.check_in).toLocaleString()} to {new Date(stay.check_out).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(stay)}
                    disabled={saving || deletingId !== null}
                  >
                    <FiEdit2 className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={pendingDeleteId === stay.id ? "danger" : "ghost"}
                    size="sm"
                    onClick={() =>
                      pendingDeleteId === stay.id
                        ? void handleDelete(stay.id)
                        : setPendingDeleteId(stay.id)
                    }
                    disabled={saving || deletingId !== null}
                  >
                    <FiTrash2 className="mr-2" />
                    {deletingId === stay.id
                      ? "Deleting..."
                      : pendingDeleteId === stay.id
                        ? "Confirm delete"
                        : "Delete"}
                  </Button>
                </div>
              </div>
              {pendingDeleteId === stay.id ? (
                <div className="mt-3">
                  <StatusBanner tone="warning">
                    Delete this safe stay record? This only removes the saved stay entry.
                  </StatusBanner>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </SafetyPanel>
  );
}
