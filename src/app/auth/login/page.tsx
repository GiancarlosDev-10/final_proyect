import Image from "next/image";
import { LoginForm } from "@/modulos/auth/presentacion/login-form";
import fondoColegio from "@/assets/fondojv.jpg";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-1/2 md:block">
        <Image src={fondoColegio} alt="" fill priority className="object-cover" />
      </div>
      <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-muted/40 to-background p-4">
        <LoginForm />
      </div>
    </main>
  );
}
