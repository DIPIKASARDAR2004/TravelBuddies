"use client";

import { useState } from "react";
import { FiEdit2, FiTrash2, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { SafetyPanel } from "./SafetyPanel";
import { useTrustedContacts } from "./useTrustedContacts";

export default function TrustedContacts() {
  const contacts = useTrustedContacts();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const locked = contacts.busy || !contacts.loaded || contacts.uncertain;

  return (
    <SafetyPanel
      icon={FiUsers}
      title="Trusted contacts"
      description="Save contact details for reference. This app does not verify, invite or notify these people."
      accent="rose"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPendingDeleteId(null);
          void contacts.save();
        }}
      >
        <fieldset
          disabled={contacts.busy}
          className="mb-6 grid min-w-0 gap-4 md:grid-cols-2"
        >
          <Input
            label="Name"
            required
            maxLength={120}
            value={contacts.form.name}
            onChange={(event) =>
              contacts.updateField("name", event.target.value)
            }
            placeholder="Contact name"
          />
          <Input
            label="Relationship"
            maxLength={80}
            value={contacts.form.relationship}
            onChange={(event) =>
              contacts.updateField("relationship", event.target.value)
            }
            placeholder="Sibling, friend, coworker..."
          />
          <Input
            label="Phone"
            type="tel"
            maxLength={32}
            value={contacts.form.phone}
            onChange={(event) =>
              contacts.updateField("phone", event.target.value)
            }
            placeholder="+91 ..."
          />
          <Input
            label="Email"
            type="email"
            maxLength={320}
            value={contacts.form.email}
            onChange={(event) =>
              contacts.updateField("email", event.target.value)
            }
            placeholder="name@example.com"
          />
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="submit" disabled={locked}>
              {contacts.saving
                ? "Saving..."
                : contacts.editingId
                  ? "Update contact"
                  : "Add contact"}
            </Button>
            {contacts.editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={contacts.resetForm}
              >
                Cancel editing
              </Button>
            )}
          </div>
        </fieldset>
      </form>
      {contacts.error && (
        <div role="alert" className="mb-4">
          <StatusBanner tone="danger">{contacts.error}</StatusBanner>
        </div>
      )}
      {contacts.message && (
        <div role="status" className="mb-4">
          <StatusBanner tone="success">{contacts.message}</StatusBanner>
        </div>
      )}
      {contacts.uncertain && (
        <div className="mb-4">
          <StatusBanner tone="warning" title="Previous change not confirmed">
            The server may have saved the change. Refresh and check the list
            before another action; adding again could create a duplicate.
            {contacts.loaded && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={contacts.busy}
                onClick={contacts.acknowledge}
              >
                I reviewed saved contacts
              </Button>
            )}
          </StatusBanner>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={contacts.busy}
        onClick={() => {
          setPendingDeleteId(null);
          void contacts.load();
        }}
      >
        Refresh contacts
      </Button>
      {contacts.loading ? (
        <p role="status" className="mt-4 text-sm">
          Loading trusted contacts...
        </p>
      ) : !contacts.loaded ? (
        <p className="mt-4 text-sm">
          Saved contacts could not be confirmed. Refresh to check the current
          list.
        </p>
      ) : contacts.contacts.length === 0 ? (
        <div className="mt-4">
          <StatusBanner title="No contacts yet">
            Add a contact to keep their details in this account.
          </StatusBanner>
        </div>
      ) : null}
      {contacts.contacts.length > 0 && (
        <div className="mt-4 space-y-3">
          {!contacts.loaded && (
            <p className="text-sm">
              Last confirmed contacts (may be out of date)
            </p>
          )}
          {contacts.contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold text-slate-900 dark:text-white">
                    {contact.name}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                    {[contact.relationship, contact.phone, contact.email]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={locked}
                    aria-label={`Edit ${contact.name}`}
                    onClick={() => {
                      setPendingDeleteId(null);
                      contacts.startEditing(contact);
                    }}
                  >
                    <FiEdit2 className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={
                      pendingDeleteId === contact.id ? "danger" : "ghost"
                    }
                    size="sm"
                    disabled={locked}
                    aria-label={`${pendingDeleteId === contact.id ? "Confirm remove" : "Remove"} ${contact.name}`}
                    onClick={() => {
                      if (pendingDeleteId === contact.id) {
                        setPendingDeleteId(null);
                        void contacts.remove(contact.id);
                      } else setPendingDeleteId(contact.id);
                    }}
                  >
                    <FiTrash2 className="mr-2" />
                    {contacts.removingId === contact.id
                      ? "Removing..."
                      : pendingDeleteId === contact.id
                        ? "Confirm remove"
                        : "Remove"}
                  </Button>
                </div>
              </div>
              {pendingDeleteId === contact.id && (
                <div className="mt-3">
                  <StatusBanner tone="warning">
                    Remove this contact from the active list? This deactivates
                    the record; it does not erase stored details.
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setPendingDeleteId(null)}
                    >
                      Cancel removal
                    </Button>
                  </StatusBanner>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SafetyPanel>
  );
}
