import { redirect } from "next/navigation";

/** Movida a /asistencia/camara para poder ser pantalla completa, sin el sidebar/header del dashboard. */
export default function CamaraAsistenciaPageRedirect() {
  redirect("/asistencia/camara");
}
