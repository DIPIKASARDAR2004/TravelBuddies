"use client";

import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TrustedContact, TrustedContactInput } from "@/lib/trustedContacts";

const emptyForm: TrustedContactInput = {
  name: "",
  phone: "",
  email: "",
  relationship: "",
};

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}

export default function TrustedContacts() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [form, setForm] = useState<TrustedContactInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
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
        if (active) {
          setContacts(body.contacts);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load trusted contacts.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(editingId ? `/api/trusted-contacts/${editingId}` : "/api/trusted-contacts", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to save trusted contact."));
      }

      const body = (await response.json()) as { contact: TrustedContact };
      setContacts((current) => {
        if (!editingId) {
          return [body.contact, ...current];
        }
        return current.map((contact) => (contact.id === body.contact.id ? body.contact : contact));
      });
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
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/trusted-contacts/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Unable to remove trusted contact."));
      }

      setContacts((current) => current.filter((contact) => contact.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setMessage("Trusted contact removed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove trusted contact.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-3 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
          <FiUsers className="text-2xl" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Trusted Contacts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add people you may want to contact during your trip.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 mb-6">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Name <span className="text-rose-500">*</span>
          <input required maxLength={120} value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Relationship
          <input maxLength={80} value={form.relationship} onChange={(event) => updateField("relationship", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Phone
          <input type="tel" maxLength={32} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
          <input type="email" maxLength={320} value={form.email} onChange={(event) => updateField("email", event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-rose-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </label>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Contact" : "Add Contact"}
          </Button>
          {editingId && <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>}
        </div>
      </form>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{message}</p>}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading trusted contacts...</p>
      ) : contacts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No trusted contacts added yet.
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div key={contact.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{contact.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {[contact.relationship, contact.phone, contact.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(contact.id); setForm({ name: contact.name, phone: contact.phone ?? "", email: contact.email ?? "", relationship: contact.relationship ?? "" }); setError(null); setMessage(null); }} disabled={saving || removingId !== null} aria-label={`Edit ${contact.name}`}>
                  <FiEdit2 className="mr-2" /> Edit
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void handleRemove(contact.id)} disabled={saving || removingId !== null} aria-label={`Remove ${contact.name}`}>
                  <FiTrash2 className="mr-2" /> {removingId === contact.id ? "Removing..." : "Remove"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
