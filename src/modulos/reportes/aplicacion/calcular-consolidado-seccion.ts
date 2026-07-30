import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { promedioPonderado } from "@/modulos/notas/dominio/promedio-ponderado";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface NotaCursoConsolidado {
  cursoId: string;
  promedio: number | null;
  letra: string | null;
}

export interface FilaConsolidado {
  estudianteId: string;
  notasPorCurso: NotaCursoConsolidado[];
  puntaje: number | null;
  ordenMerito: number | null;
}

export interface ConsolidadoSeccion {
  seccionId: string;
  periodoId: string;
  ordenUnidad: number;
  cursoIds: string[];
  filas: FilaConsolidado[];
}

export interface CalcularConsolidadoSeccionDTO {
  seccionId: string;
  periodoId: string;
  anio: number;
  ordenUnidad: number;
}

/**
 * Escala oficial EBR peruana: AD (18-20, logro destacado), A (14-17, logro
 * esperado), B (11-13, en proceso), C (0-10, en inicio).
 */
export function letraDeNota(valor: number | null): string | null {
  if (valor === null) return null;
  if (valor >= 18) return "AD";
  if (valor >= 14) return "A";
  if (valor >= 11) return "B";
  return "C";
}

export async function calcularConsolidadoSeccion(
  datos: CalcularConsolidadoSeccionDTO,
  deps: {
    matriculaRepositorio: IMatriculaRepositorio;
    asignacionRepositorio: IAsignacionRepositorio;
    unidadDidacticaRepositorio: IUnidadDidacticaRepositorio;
    notaRepositorio: INotaRepositorio;
  }
): Promise<Result<ConsolidadoSeccion>> {
  try {
    const matriculas = (await deps.matriculaRepositorio.listarPorSeccion(datos.seccionId)).filter(
      (m) => m.activo && m.anio === datos.anio
    );

    const todasAsignaciones = await deps.asignacionRepositorio.listar();
    const asignacionesSeccion = todasAsignaciones.filter(
      (a) => a.seccionId === datos.seccionId && a.periodoId === datos.periodoId && a.activo
    );
    const cursoIds = [...new Set(asignacionesSeccion.map((a) => a.cursoId))];

    const unidadIdPorCurso = new Map<string, string>();
    for (const cursoId of cursoIds) {
      const unidades = await deps.unidadDidacticaRepositorio.listarPorCursoYPeriodo(cursoId, datos.periodoId);
      const unidad = unidades.find((u) => u.orden === datos.ordenUnidad);
      if (unidad) unidadIdPorCurso.set(cursoId, unidad.id);
    }

    const notasPorAsignacion = new Map<string, Awaited<ReturnType<INotaRepositorio["listarPorAsignacion"]>>>();
    for (const asignacion of asignacionesSeccion) {
      notasPorAsignacion.set(asignacion.id, await deps.notaRepositorio.listarPorAsignacion(asignacion.id));
    }

    const filasSinOrden = matriculas.map((matricula) => {
      const notasPorCurso: NotaCursoConsolidado[] = cursoIds.map((cursoId) => {
        const asignacion = asignacionesSeccion.find((a) => a.cursoId === cursoId);
        const unidadId = unidadIdPorCurso.get(cursoId);
        if (!asignacion || !unidadId) return { cursoId, promedio: null, letra: null };

        const notasDelEstudiante = (notasPorAsignacion.get(asignacion.id) ?? []).filter(
          (n) => n.estudianteId === matricula.estudianteId && n.unidadDidacticaId === unidadId
        );
        const prom = promedioPonderado(notasDelEstudiante);
        return { cursoId, promedio: prom, letra: letraDeNota(prom) };
      });

      const promediosValidos = notasPorCurso.map((n) => n.promedio).filter((v): v is number => v !== null);
      const puntaje = promediosValidos.length > 0 ? promediosValidos.reduce((s, v) => s + v, 0) : null;

      return { estudianteId: matricula.estudianteId, notasPorCurso, puntaje };
    });

    const ordenadosPorPuntaje = [...filasSinOrden].sort((a, b) => (b.puntaje ?? -Infinity) - (a.puntaje ?? -Infinity));
    const filas: FilaConsolidado[] = filasSinOrden.map((fila) => ({
      ...fila,
      ordenMerito: fila.puntaje === null ? null : ordenadosPorPuntaje.findIndex((f) => f.estudianteId === fila.estudianteId) + 1,
    }));

    return ok({ seccionId: datos.seccionId, periodoId: datos.periodoId, ordenUnidad: datos.ordenUnidad, cursoIds, filas });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
