"use client";

import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SafetyPanel } from "@/components/safety/SafetyPanel";
import { getErrorMessage } from "@/lib/client/safetyClient";
import type { TrustedContact, TrustedContactInput } from "@/lib/services/trustedContacts";

const emptyForm: TrustedContactInput = {
  name: "",
  phone: "",
  email: "",
  relationship: "",
};

export default function TrustedContacts() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [form, setForm] = useState<TrustedContactInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadContacts() {
      try {
        const response = await fetch("/api/trusted-contacts");
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Unable to load trusted contacts."));
        }
        const body = (await response.json()) as { contacts: TrustedContact[] };
        if (active) setContacts(body.contacts);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load trusted contacts.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadContacts();
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field: keyof TrustedContactInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const startEditing = (contact: TrustedContact) => {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(
        editingId ? `/api/trusted-contacts/${editingId}` : "/api/trusted-contacts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to save trusted contact."));
      }

      const body = (await response.json()) as { contact: TrustedContact };
      setContacts((current) =>
        editingId
          ? current.map((contact) => (contact.id === body.contact.id ? body.contact : contact))
          : [body.contact, ...current],
      );
      resetForm();
      setMessage(editingId ? "Trusted contact updated." : "Trusted contact added.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save trusted contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    setPendingDeleteId(null);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/trusted-contacts/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to remove trusted contact."));
      }

      setContacts((current) => current.filter((contact) => contact.id !== id));
      if (editingId === id) resetForm();
      setMessage("Trusted contact removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove trusted contact.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SafetyPanel
      icon={FiUsers}
      title="Trusted contacts"
      description="Keep key people ready for your trip. Add, edit, or remove contacts without leaving the safety workspace."
      accent="rose"
    >
      <form onSubmit={handleSubmit} className="mb-6 grid gap-4 md:grid-cols-2">
        <Input
          label="Name"
          required
          maxLength={120}
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Priya Sharma"
        />
        <Input
          label="Relationship"
          maxLength={80}
          value={form.relationship}
          onChange={(event) => updateField("relationship", event.target.value)}
          placeholder="Sibling, friend, coworker..."
        />
        <Input
          label="Phone"
          type="tel"
          maxLength={32}
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          placeholder="+91 ..."
        />
        <Input
          label="Email"
          type="email"
          maxLength={320}
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="name@example.com"
        />
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update contact" : "Add contact"}
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
      {message ? (
        <div className="mb-4">
          <StatusBanner tone="success">{message}</StatusBanner>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading trusted contacts...</p>
      ) : contacts.length === 0 ? (
        <StatusBanner title="No contacts yet">
          Add at least one trusted contact so important details are easy to reach while traveling.
        </StatusBanner>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{contact.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {[contact.relationship, contact.phone, contact.email].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(contact)}
                    disabled={saving || removingId !== null}
                  >
                    <FiEdit2 className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={pendingDeleteId === contact.id ? "danger" : "ghost"}
                    size="sm"
                    onClick={() =>
                      pendingDeleteId === contact.id
                        ? void handleRemove(contact.id)
                        : setPendingDeleteId(contact.id)
                    }
                    disabled={saving || removingId !== null}
                  >
                    <FiTrash2 className="mr-2" />
                    {removingId === contact.id
                      ? "Removing..."
                      : pendingDeleteId === contact.id
                        ? "Confirm remove"
                        : "Remove"}
                  </Button>
                </div>
              </div>
              {pendingDeleteId === contact.id ? (
                <div className="mt-3">
                  <StatusBanner tone="warning">
                    Remove this contact from your safety list? This only deletes the saved record.
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
