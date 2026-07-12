import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const rol = (session.user as any)?.rol;

  if (rol === "ADMIN") {
    redirect("/admin/dashboard/usuarios");
  }

  if (rol === "PROFESOR") {
    redirect("/profesores/dashboard/notas");
  }

  redirect("/auth/login");
}