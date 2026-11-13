import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Create an account"
      title="Start planning your next personal trip"
      description="Create a personal travel account. Depending on authentication settings, you may need to confirm your email before signing in."
      accent="rose"
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
