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
  | { valid: true; value: { name: string; phone: string | null; email: string | null; relationship: string | null } }
  | { valid: false; error: string };

export function validateTrustedContactInput(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Contact details are required." };
  }

  const data = input as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const relationship = typeof data.relationship === "string" ? data.relationship.trim() : "";

  if (name.length < 1 || name.length > 120) {
    return { valid: false, error: "Name must be between 1 and 120 characters." };
  }

  if (!phone && !email) {
    return { valid: false, error: "Add a phone number or email address." };
  }

  if (phone && (phone.length < 7 || phone.length > 32)) {
    return { valid: false, error: "Phone number must be between 7 and 32 characters." };
  }

  if (email && (email.length < 3 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { valid: false, error: "Enter a valid email address." };
  }

  if (relationship.length > 80) {
    return { valid: false, error: "Relationship must be 80 characters or fewer." };
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
