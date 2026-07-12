import { accionListarMatriculas, accionListarEstudiantesParaMatricula, accionListarSeccionesParaMatricula } from "@/modulos/matriculas/presentacion/acciones";
import { TablaMatriculas } from "@/modulos/matriculas/presentacion/tabla-matriculas";

export default async function MatriculasPage() {
  const [matriculas, estudiantes, secciones] = await Promise.all([
    accionListarMatriculas(),
    accionListarEstudiantesParaMatricula(),
    accionListarSeccionesParaMatricula(),
  ]);

  return <TablaMatriculas matriculas={matriculas} estudiantes={estudiantes} secciones={secciones} />;
}