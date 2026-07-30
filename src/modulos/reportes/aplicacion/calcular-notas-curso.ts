import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { AsignacionNoEncontradaError } from "@/modulos/asignaciones/dominio/asignacion";
import { promediosPorTipo, promedioPonderadoDesdeTipos } from "@/modulos/notas/dominio/promedio-ponderado";
import { letraDeNota } from "@/modulos/reportes/aplicacion/calcular-consolidado-seccion";
import { TipoNota } from "@/config/constantes";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface FilaNotasCurso {
  estudianteId: string;
  porTipo: Record<TipoNota, number | null>;
  promedio: number | null;
  letra: string | null;
}

export interface NotasCurso {
  asignacionId: string;
  cursoId: string;
  seccionId: string;
  periodoId: string;
  ordenUnidad: number;
  unidadDidacticaId: string | null;
  filas: FilaNotasCurso[];
}

export interface CalcularNotasCursoDTO {
  asignacionId: string;
  anio: number;
  ordenUnidad: number;
}

/**
 * Notas de UNA sola asignación (el curso puntual de un profesor), a
 * diferencia de calcularConsolidadoSeccion que junta todos los cursos de la
 * sección — eso es para el consolidado del admin, esto es para que el
 * profesor exporte solo lo suyo.
 */
export async function calcularNotasCurso(
  datos: CalcularNotasCursoDTO,
  deps: {
    matriculaRepositorio: IMatriculaRepositorio;
    asignacionRepositorio: IAsignacionRepositorio;
    unidadDidacticaRepositorio: IUnidadDidacticaRepositorio;
    notaRepositorio: INotaRepositorio;
  }
): Promise<Result<NotasCurso>> {
  try {
    const asignacion = await deps.asignacionRepositorio.buscarPorId(datos.asignacionId);
    if (!asignacion) return err(new AsignacionNoEncontradaError(datos.asignacionId));

    const unidades = await deps.unidadDidacticaRepositorio.listarPorCursoYPeriodo(asignacion.cursoId, asignacion.periodoId);
    const unidad = unidades.find((u) => u.orden === datos.ordenUnidad) ?? null;

    const matriculas = (await deps.matriculaRepositorio.listarPorSeccion(asignacion.seccionId)).filter(
      (m) => m.activo && m.anio === datos.anio
    );

    const notasAsignacion = unidad
      ? (await deps.notaRepositorio.listarPorAsignacion(asignacion.id)).filter((n) => n.unidadDidacticaId === unidad.id)
      : [];

    const filas: FilaNotasCurso[] = matriculas.map((matricula) => {
      const notasDelEstudiante = notasAsignacion.filter((n) => n.estudianteId === matricula.estudianteId);
      const porTipo = promediosPorTipo(notasDelEstudiante);
      const promedio = promedioPonderadoDesdeTipos(porTipo);
      return { estudianteId: matricula.estudianteId, porTipo, promedio, letra: letraDeNota(promedio) };
    });

    return ok({
      asignacionId: asignacion.id,
      cursoId: asignacion.cursoId,
      seccionId: asignacion.seccionId,
      periodoId: asignacion.periodoId,
      ordenUnidad: datos.ordenUnidad,
      unidadDidacticaId: unidad?.id ?? null,
      filas,
    });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
