"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestJson } from "@/lib/client/requestJson";
import {
  readTrustedContact,
  readTrustedContacts,
  validateTrustedContactInput,
  type TrustedContact,
  type TrustedContactInput,
} from "@/lib/services/trustedContacts";

const emptyForm: TrustedContactInput = {
  name: "",
  phone: "",
  email: "",
  relationship: "",
};

export function useTrustedContacts() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const active = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = readTrustedContacts(
        await requestJson("/api/trusted-contacts", {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        }),
      );
      if (!controller.signal.aborted) {
        setContacts(result);
        setLoaded(true);
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setLoaded(false);
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to load trusted contacts.",
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

  const resetForm = () => {
    if (active.current) return;
    setForm(emptyForm);
    setEditingId(null);
  };
  const startEditing = (contact: TrustedContact) => {
    if (active.current || !loaded || uncertain) return;
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      relationship: contact.relationship ?? "",
    });
    setError(null);
    setMessage(null);
  };
  const updateField = (field: keyof TrustedContactInput, value: string) => {
    if (!active.current) setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    if (active.current || !loaded || uncertain) return;
    const validation = validateTrustedContactInput(form);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    if (editingId && !contacts.some((contact) => contact.id === editingId)) {
      setError(
        "This contact is no longer active. Cancel editing before adding a new contact.",
      );
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const contact = readTrustedContact(
        await requestJson(
          editingId
            ? `/api/trusted-contacts/${editingId}`
            : "/api/trusted-contacts",
          {
            method: editingId ? "PATCH" : "POST",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(15000),
            ]),
            body: JSON.stringify(validation.value),
          },
        ),
        { id: editingId ?? undefined, active: true, details: validation.value },
      );
      if (controller.signal.aborted) return;
      if (!editingId && contacts.some((item) => item.id === contact.id))
        throw new Error(
          "The server returned an existing contact for a new save.",
        );
      setContacts((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? contact : item))
          : [contact, ...current],
      );
      setForm(emptyForm);
      setEditingId(null);
      setMessage(
        editingId
          ? "Trusted contact updated."
          : "Trusted contact added. No notification was sent.",
      );
    } catch (failure) {
      if (!controller.signal.aborted) {
        setLoaded(false);
        setUncertain(true);
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to confirm the saved contact.",
        );
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setSaving(false);
      }
    }
  };

  const remove = async (id: string) => {
    if (
      active.current ||
      !loaded ||
      uncertain ||
      !contacts.some((contact) => contact.id === id)
    )
      return;
    const controller = new AbortController();
    active.current = controller;
    setRemovingId(id);
    setError(null);
    setMessage(null);
    try {
      readTrustedContact(
        await requestJson(`/api/trusted-contacts/${id}`, {
          method: "DELETE",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(15000),
          ]),
        }),
        { id, active: false },
      );
      if (controller.signal.aborted) return;
      setContacts((current) => current.filter((contact) => contact.id !== id));
      if (editingId === id) {
        setForm(emptyForm);
        setEditingId(null);
      }
      setMessage(
        "Contact removed from the active list. The stored record is retained.",
      );
    } catch (failure) {
      if (!controller.signal.aborted) {
        setLoaded(false);
        setUncertain(true);
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to confirm contact removal.",
        );
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setRemovingId(null);
      }
    }
  };

  return {
    contacts,
    form,
    editingId,
    loading,
    loaded,
    saving,
    removingId,
    uncertain,
    error,
    message,
    busy: loading || saving || removingId !== null,
    load,
    save,
    remove,
    resetForm,
    startEditing,
    updateField,
    acknowledge: () => {
      if (!active.current && loaded) setUncertain(false);
    },
  };
}
