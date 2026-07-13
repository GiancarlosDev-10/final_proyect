import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { accionObtenerMiPerfil } from "@/modulos/usuarios/presentacion/acciones-perfil";
import { MiPerfil } from "@/modulos/usuarios/presentacion/mi-perfil";

export default async function PerfilProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const perfil = await accionObtenerMiPerfil();
  if (!perfil) {
    redirect("/auth/login");
  }

  return <MiPerfil perfil={perfil} />;
}
