import { IBloqueHorarioRepositorio } from "@/modulos/horarios/aplicacion/i-bloque-horario-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { diaSemanaDeHoy } from "@/modulos/asistencia/dominio/tiempo";
import { NIVELES_EDUCATIVOS } from "@/config/constantes";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface BloqueDeHoy {
  bloqueHorarioId: string;
  seccionId: string;
  cursoNombre: string;
  seccionNombre: string;
  horaInicio: string;
  horaFin: string;
}

export async function listarBloquesDeHoy(
  profesorId: string,
  deps: {
    bloqueRepo: IBloqueHorarioRepositorio;
    asignacionRepo: IAsignacionRepositorio;
    seccionRepo: ISeccionRepositorio;
    cursoRepo: ICursoRepositorio;
  }
): Promise<Result<BloqueDeHoy[]>> {
  try {
    const hoy = diaSemanaDeHoy();
    if (!hoy) return ok([]);

    const [bloques, asignaciones, secciones, cursos] = await Promise.all([
      deps.bloqueRepo.listarPorProfesor(profesorId),
      deps.asignacionRepo.listarPorProfesor(profesorId),
      deps.seccionRepo.listar(),
      deps.cursoRepo.listar(),
    ]);

    const asignacionPorId = new Map(asignaciones.map((a) => [a.id, a]));
    const seccionPorId = new Map(secciones.map((s) => [s.id, s]));
    const cursoPorId = new Map(cursos.map((c) => [c.id, c]));

    const resultado: BloqueDeHoy[] = [];
    for (const bloque of bloques) {
      if (bloque.diaSemana !== hoy) continue;
      const asignacion = asignacionPorId.get(bloque.asignacionId);
      if (!asignacion) continue;
      const seccion = seccionPorId.get(asignacion.seccionId);
      if (!seccion || seccion.nivel === NIVELES_EDUCATIVOS.INICIAL) continue;
      const curso = cursoPorId.get(asignacion.cursoId);
      if (!curso) continue;

      resultado.push({
        bloqueHorarioId: bloque.id,
        seccionId: seccion.id,
        cursoNombre: curso.nombre,
        seccionNombre: `${seccion.grado} ${seccion.nombre}`,
        horaInicio: bloque.horaInicio,
        horaFin: bloque.horaFin,
      });
    }
    resultado.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    return ok(resultado);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
