import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, Cake, GraduationCap, Phone, type LucideIcon } from "lucide-react";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { CursoRepositorioMongo } from "@/modulos/cursos/infraestructura/curso-repositorio-mongo";
import { PeriodoRepositorioMongo } from "@/modulos/periodos/infraestructura/periodo-repositorio-mongo";
import { NotaRepositorioMongo } from "@/modulos/notas/infraestructura/nota-repositorio-mongo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ETIQUETAS_TIPO_NOTA } from "@/config/constantes";
import { HistorialEvaluaciones, FilaEvaluacion } from "@/app/profesores/dashboard/estudiantes/[id]/historial-evaluaciones";

const NOTA_APROBATORIA = 11;

function iniciales(nombreCompleto: string): string {
  const partes = nombreCompleto.trim().split(/\s+/);
  return partes
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-");
  if (!anio || !mes || !dia) return fechaISO;
  return `${dia}/${mes}/${anio}`;
}

export default async function DetalleEstudiantePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.rol !== "PROFESOR") {
    redirect("/auth/login");
  }
  const { id } = await params;
  const profesorId = session.user.id;

  const estudianteRepo = new EstudianteRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const matriculaRepo = new MatriculaRepositorioMongo();
  const seccionRepo = new SeccionRepositorioMongo();

  const [estudiante, asignaciones] = await Promise.all([
    estudianteRepo.buscarPorId(id),
    asignacionRepo.listarPorProfesor(profesorId),
  ]);
  if (!estudiante) notFound();

  // Solo puede ver el detalle si el estudiante está matriculado en una de sus secciones.
  const seccionIds = [...new Set(asignaciones.map((a) => a.seccionId))];
  const matriculasDeSecciones = await matriculaRepo.listarPorSecciones(seccionIds);
  const matricula = matriculasDeSecciones
    .filter((m) => m.estudianteId === id)
    .sort((a, b) => b.anio - a.anio)[0];
  if (!matricula) notFound();

  const asignacionIds = new Set(asignaciones.map((a) => a.id));
  const [seccion, cursos, periodos, todasLasNotas] = await Promise.all([
    seccionRepo.buscarPorId(matricula.seccionId),
    new CursoRepositorioMongo().listar(),
    new PeriodoRepositorioMongo().listar(),
    new NotaRepositorioMongo().listarPorEstudiante(id),
  ]);
  const notas = todasLasNotas
    .filter((n) => asignacionIds.has(n.asignacionId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const nombreSeccion = seccion ? `${seccion.grado} ${seccion.nombre}` : "—";
  const promedio = notas.length > 0 ? notas.reduce((s, n) => s + n.valor, 0) / notas.length : null;

  function nombreCurso(asignacionId: string) {
    const a = asignaciones.find((a) => a.id === asignacionId);
    return (a && cursos.find((c) => c.id === a.cursoId)?.nombre) || "(curso eliminado)";
  }

  function nombrePeriodo(periodoId: string) {
    return periodos.find((p) => p.id === periodoId)?.nombre || "—";
  }

  const estadisticas: Array<{ etiqueta: string; valor: React.ReactNode; icono: LucideIcon }> = [
    { etiqueta: "Grado y Sección", valor: nombreSeccion, icono: GraduationCap },
    { etiqueta: "Fecha de nacimiento", valor: formatearFecha(estudiante.fechaNacimiento), icono: Cake },
    {
      etiqueta: `${estudiante.apoderado.nombre} (${estudiante.apoderado.parentesco})`,
      valor: (
        <a href={`tel:${estudiante.apoderado.telefono}`} className="hover:underline">
          {estudiante.apoderado.telefono}
        </a>
      ),
      icono: Phone,
    },
    { etiqueta: "Promedio general", valor: promedio !== null ? promedio.toFixed(1) : "—", icono: Award },
  ];

  const filasEvaluaciones: FilaEvaluacion[] = notas.map((n) => ({
    id: n.id,
    cursoNombre: nombreCurso(n.asignacionId),
    periodoNombre: nombrePeriodo(n.periodoId),
    tipoEtiqueta: ETIQUETAS_TIPO_NOTA[n.tipo],
    fecha: formatearFecha(n.fecha),
    valor: n.valor,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
      <div>
        <Link href="/profesores/dashboard/estudiantes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-3.5" />
          Volver a estudiantes
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
          {iniciales(estudiante.nombreCompleto)}
        </div>
        <div>
          <h1 className="font-heading text-2xl font-semibold">{estudiante.nombreCompleto}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>DNI {estudiante.documento}</span>
            <span aria-hidden>·</span>
            <span>Matrícula {matricula.anio}</span>
            {estudiante.activo ? (
              <StatusBadge variant="success">Activo</StatusBadge>
            ) : (
              <StatusBadge variant="neutral">Inactivo</StatusBadge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {estadisticas.map(({ etiqueta, valor, icono: Icono }) => (
          <Card key={etiqueta} className="p-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icono className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{etiqueta}</p>
                <p className="truncate text-lg font-semibold">{valor}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <HistorialEvaluaciones notas={filasEvaluaciones} notaAprobatoria={NOTA_APROBATORIA} />
    </div>
  );
}
