import { AuthShell } from "@/components/auth/AuthShell";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Pick up your planning flow"
      description="Sign in to continue personal trip planning and access your account’s travel tools."
      accent="sky"
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
