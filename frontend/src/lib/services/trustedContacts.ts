import { isRecord, isRecordId, isRecordTimestamp } from "./recordChecks";

export const CONTACT_FIELDS =
  "id, name, phone, email, relationship, is_active, created_at, updated_at";

export type TrustedContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TrustedContactInput = {
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
};

type ValidationResult =
  | {
      valid: true;
      value: {
        name: string;
        phone: string | null;
        email: string | null;
        relationship: string | null;
      };
    }
  | { valid: false; error: string };

export function validateTrustedContactInput(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return { valid: false, error: "Contact details are required." };
  }

  const data = input as Record<string, unknown>;
  for (const field of ["phone", "email", "relationship"] as const) {
    if (data[field] != null && typeof data[field] !== "string") {
      return { valid: false, error: `${field} must be text.` };
    }
  }
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const relationship =
    typeof data.relationship === "string" ? data.relationship.trim() : "";

  if (name.length < 1 || name.length > 120) {
    return {
      valid: false,
      error: "Name must be between 1 and 120 characters.",
    };
  }

  if (!phone && !email) {
    return { valid: false, error: "Add a phone number or email address." };
  }

  if (phone && (phone.length < 7 || phone.length > 32)) {
    return {
      valid: false,
      error: "Phone number must be between 7 and 32 characters.",
    };
  }

  if (
    email &&
    (email.length < 3 ||
      email.length > 320 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return { valid: false, error: "Enter a valid email address." };
  }

  if (relationship.length > 80) {
    return {
      valid: false,
      error: "Relationship must be 80 characters or fewer.",
    };
  }

  return {
    valid: true,
    value: {
      name,
      phone: phone || null,
      email: email || null,
      relationship: relationship || null,
    },
  };
}

type ContactExpectation = {
  id?: string;
  active?: boolean;
  details?: Pick<TrustedContact, "name" | "phone" | "email" | "relationship">;
};

export function readTrustedContact(
  value: unknown,
  expected: ContactExpectation = {},
): TrustedContact {
  const invalid = () =>
    new Error(
      "The server returned invalid trusted contact details. Refresh to check saved contacts.",
    );
  if (!isRecord(value) || !isRecord(value.contact)) throw invalid();
  const row = value.contact;
  if (
    !isRecordId(row.id) ||
    typeof row.is_active !== "boolean" ||
    !isRecordTimestamp(row.created_at) ||
    !isRecordTimestamp(row.updated_at) ||
    !["phone", "email", "relationship"].every(
      (field) => row[field] === null || typeof row[field] === "string",
    )
  )
    throw invalid();
  const validation = validateTrustedContactInput(row);
  if (
    !validation.valid ||
    (expected.id !== undefined && row.id !== expected.id) ||
    (expected.active !== undefined && row.is_active !== expected.active)
  )
    throw invalid();
  const details = validation.value;
  if (
    expected.details &&
    (Object.keys(details) as (keyof typeof details)[]).some(
      (field) => details[field] !== expected.details![field],
    )
  )
    throw invalid();
  return {
    id: row.id,
    ...details,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function readTrustedContacts(value: unknown): TrustedContact[] {
  if (!isRecord(value) || !Array.isArray(value.contacts)) {
    throw new Error("The server returned an invalid trusted contacts list.");
  }
  const contacts = value.contacts.map((contact) =>
    readTrustedContact({ contact }, { active: true }),
  );
  if (new Set(contacts.map((contact) => contact.id)).size !== contacts.length) {
    throw new Error("The server returned duplicate trusted contacts.");
  }
  return contacts;
}
