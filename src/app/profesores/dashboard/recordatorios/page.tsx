import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { accionListarMisRecordatorios } from "@/app/profesores/dashboard/recordatorios/acciones";
import { MuroRecordatorios } from "@/app/profesores/dashboard/recordatorios/muro-recordatorios";

export default async function RecordatoriosProfesorPage() {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }

  const recordatorios = await accionListarMisRecordatorios();
  return <MuroRecordatorios recordatorios={recordatorios} />;
}
