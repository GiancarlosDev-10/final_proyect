import { TablaEstudiantes } from "@/modulos/estudiantes/presentacion/tabla-estudiantes";
import { listarEstudiantesPorSeccion } from "@/modulos/estudiantes/aplicacion/listar-estudiantes-por-seccion";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { compararSecciones } from "@/modulos/secciones/dominio/orden-secciones";
import { NIVELES_EDUCATIVOS } from "@/config/constantes";

export default async function EstudiantesPage() {
  const todasLasSecciones = await new SeccionRepositorioMongo().listar();
  const secciones = todasLasSecciones.filter((s) => s.activo).map((s) => s.toPlainObject());

  const seccionesInicial = secciones.filter((s) => s.nivel === NIVELES_EDUCATIVOS.INICIAL).sort(compararSecciones);
  const seccionPorDefecto =
    seccionesInicial.find((s) => s.grado === "3 años" && s.nombre === "A") ?? seccionesInicial[0] ?? null;

  const estudiantesIniciales = seccionPorDefecto
    ? await listarEstudiantesPorSeccion(seccionPorDefecto.id, {
        matriculaRepo: new MatriculaRepositorioMongo(),
        estudianteRepo: new EstudianteRepositorioMongo(),
      })
    : [];

  return (
    <TablaEstudiantes
      secciones={secciones}
      seccionInicialId={seccionPorDefecto?.id ?? ""}
      estudiantesIniciales={estudiantesIniciales}
    />
  );
}
