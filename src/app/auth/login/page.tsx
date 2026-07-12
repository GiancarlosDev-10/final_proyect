import { LoginForm } from "@/modulos/auth/presentacion/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muted/40 to-background p-4">
      <LoginForm />
    </main>
  );
}
