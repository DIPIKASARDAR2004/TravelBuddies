"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { SafeStay, SafeStayStatus } from "@/lib/services/safeStays";
import {
  readSafeStayList,
  readSafeStayResponse,
  validateSafeStayInput,
} from "@/lib/services/safeStays";
import { requestJson } from "@/lib/client/requestJson";
import { toInputDateTime, toIsoDateTime } from "./stayDates";
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

export const reminderTitle = "Safe Stay check-in";

export function useSafeStays() {
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
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    async function loadStays() {
      try {
        const body = await requestJson("/api/safe-stays", {
          signal: controller.signal,
        });
        if (active) setStays(readSafeStayList(body));
      } catch (loadError) {
        if (active)
          setError(
            controller.signal.aborted
              ? "Loading Safe Stays timed out. Please reload and try again."
              : loadError instanceof Error
                ? loadError.message
                : "Unable to load Safe Stays.",
          );
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    }

    void loadStays();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const updateField = <K extends keyof StayForm>(
    field: K,
    value: StayForm[K],
  ) => {
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
      const existingStay = editingId
        ? stays.find((stay) => stay.id === editingId)
        : undefined;
      const validation = validateSafeStayInput({
        ...form,
        check_in: toIsoDateTime(form.check_in, existingStay?.check_in),
        check_out: toIsoDateTime(form.check_out, existingStay?.check_out),
      });
      if (!validation.valid) throw new Error(validation.error);
      const body = await requestJson(
        editingId ? `/api/safe-stays/${editingId}` : "/api/safe-stays",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validation.value),
        },
      );

      const savedStay = readSafeStayResponse(body, editingId ?? undefined);
      const isExplicitCheckIn =
        savedStay.status === "active" &&
        (!editingId || existingStay?.status !== "active");

      setStays((current) =>
        editingId
          ? current.map((stay) => (stay.id === savedStay.id ? savedStay : stay))
          : [savedStay, ...current],
      );
      resetForm();
      setSuccess(editingId ? "Safe stay updated." : "Safe stay started.");
      if (savedStay.status === "completed") {
        clearCheckInReminder(savedStay.id);
        setReminderStay((current) =>
          current?.id === savedStay.id ? null : current,
        );
      }
      if (isExplicitCheckIn) {
        await showCheckInReminder(savedStay);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save Safe Stay.",
      );
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
      const body = await requestJson(`/api/safe-stays/${id}`, {
        method: "DELETE",
      });
      if (
        !body ||
        typeof body !== "object" ||
        !("success" in body) ||
        body.success !== true
      ) {
        throw new Error("The server did not confirm the Safe Stay deletion.");
      }
      setStays((current) => current.filter((stay) => stay.id !== id));
      clearCheckInReminder(id);
      setReminderStay((current) => (current?.id === id ? null : current));
      if (editingId === id) resetForm();
      setSuccess("Safe stay deleted.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete Safe Stay.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return {
    stays,
    form,
    editingId,
    loading,
    saving,
    deletingId,
    pendingDeleteId,
    setPendingDeleteId,
    error,
    success,
    reminderStay,
    setReminderStay,
    updateField,
    resetForm,
    startEditing,
    handleSubmit,
    handleDelete,
  };
}
