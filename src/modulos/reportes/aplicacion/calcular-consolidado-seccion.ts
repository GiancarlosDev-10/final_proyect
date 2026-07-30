import { IMatriculaRepositorio } from "@/modulos/matriculas/aplicacion/i-matricula-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { Nota } from "@/modulos/notas/dominio/nota";
import { TipoNota } from "@/config/constantes";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

/**
 * Pesos de cada tipo de evaluación sobre el promedio del curso. Si al alumno
 * le faltan notas de algún tipo en la unidad, los pesos de los tipos
 * presentes se re-normalizan entre sí (no se penaliza como si el tipo
 * faltante valiera 0).
 */
const PESOS_TIPO_NOTA: Record<TipoNota, number> = {
  EXAMEN: 0.4,
  TRABAJO: 0.3,
  PRACTICA: 0.2,
  PARTICIPACION: 0.1,
};

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
 * Promedio ponderado por tipo de evaluación, redondeado al entero más
 * cercano (0.5 a favor del alumno, ej. 15.5 → 16) — así el promedio ya
 * calculado, la letra EBR y el puntaje quedan consistentes con el número
 * entero que se muestra en los reportes.
 */
function promedioPonderado(notas: Nota[]): number | null {
  if (notas.length === 0) return null;

  const valoresPorTipo = new Map<TipoNota, number[]>();
  for (const nota of notas) {
    valoresPorTipo.set(nota.tipo, [...(valoresPorTipo.get(nota.tipo) ?? []), nota.valor]);
  }

  let sumaPonderada = 0;
  let sumaPesos = 0;
  for (const [tipo, valores] of valoresPorTipo) {
    const promedioTipo = valores.reduce((s, v) => s + v, 0) / valores.length;
    sumaPonderada += promedioTipo * PESOS_TIPO_NOTA[tipo];
    sumaPesos += PESOS_TIPO_NOTA[tipo];
  }

  return sumaPesos > 0 ? Math.round(sumaPonderada / sumaPesos) : null;
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
