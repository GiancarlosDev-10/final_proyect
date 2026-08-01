import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { Asignacion } from "@/modulos/asignaciones/dominio/asignacion";
import { Nota } from "@/modulos/notas/dominio/nota";
import { promedioPonderado } from "@/modulos/notas/dominio/promedio-ponderado";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface PromedioPorUnidad {
  unidadDidacticaId: string;
  orden: number;
  promedio: number | null;
}

export interface PromedioCurso {
  cursoId: string;
  promediosPorUnidad: PromedioPorUnidad[];
  promedioBimestral: number | null;
}

export interface CalcularPromedioCursoDTO {
  estudianteId: string;
  cursoId: string;
  periodoId: string;
}

// Solo para combinar los 2 promedios de unidad ya ponderados en uno
// bimestral — el promedio DENTRO de cada unidad usa promedioPonderado
// (Examen 40% / Trabajo 30% / Práctica 20% / Participación 10%), igual que
// el consolidado del admin y el reporte del profesor. Antes este archivo
// promediaba nota.valor sin mirar el tipo, dando un número distinto al de
// esos otros dos reportes para el mismo alumno/curso.
function promedioSimple(valores: number[]): number | null {
  return valores.length ? valores.reduce((suma, v) => suma + v, 0) / valores.length : null;
}

export async function calcularPromedioCurso(
  datos: CalcularPromedioCursoDTO,
  notaRepositorio: INotaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio,
  unidadDidacticaRepositorio: IUnidadDidacticaRepositorio
): Promise<Result<PromedioCurso>> {
  try {
    const notas = await notaRepositorio.listarPorEstudiante(datos.estudianteId);

    const asignacionCache = new Map<string, Asignacion | null>();
    async function obtenerAsignacion(id: string): Promise<Asignacion | null> {
      if (!asignacionCache.has(id)) {
        asignacionCache.set(id, await asignacionRepositorio.buscarPorId(id));
      }
      return asignacionCache.get(id) ?? null;
    }

    const notasDelCurso: Nota[] = [];
    for (const nota of notas) {
      const asignacion = await obtenerAsignacion(nota.asignacionId);
      if (asignacion && asignacion.cursoId === datos.cursoId && asignacion.periodoId === datos.periodoId) {
        notasDelCurso.push(nota);
      }
    }

    const unidades = await unidadDidacticaRepositorio.listarPorCursoYPeriodo(datos.cursoId, datos.periodoId);

    const promediosPorUnidad: PromedioPorUnidad[] = unidades.map((unidad) => {
      const notasUnidad = notasDelCurso.filter((n) => n.unidadDidacticaId === unidad.id);
      return { unidadDidacticaId: unidad.id, orden: unidad.orden, promedio: promedioPonderado(notasUnidad) };
    });

    const promedioBimestral = promedioSimple(
      promediosPorUnidad.map((p) => p.promedio).filter((v): v is number => v !== null)
    );

    return ok({ cursoId: datos.cursoId, promediosPorUnidad, promedioBimestral });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
