import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ConectorCamara } from "@/app/asistencia/camara/conector-camara";

export default async function CamaraAsistenciaPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  return <ConectorCamara />;
}
