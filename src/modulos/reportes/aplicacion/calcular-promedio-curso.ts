import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { Asignacion } from "@/modulos/asignaciones/dominio/asignacion";
import { Nota } from "@/modulos/notas/dominio/nota";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface PromedioPorUnidad {
  unidadDidacticaId: string;
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

function promedio(valores: number[]): number | null {
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

    const unidades = await unidadDidacticaRepositorio.listarPorPeriodo(datos.periodoId);

    const promediosPorUnidad: PromedioPorUnidad[] = unidades.map((unidad) => {
      const notasUnidad = notasDelCurso.filter((n) => n.unidadDidacticaId === unidad.id);
      return { unidadDidacticaId: unidad.id, promedio: promedio(notasUnidad.map((n) => n.valor)) };
    });

    const promedioBimestral = promedio(
      promediosPorUnidad.map((p) => p.promedio).filter((v): v is number => v !== null)
    );

    return ok({ cursoId: datos.cursoId, promediosPorUnidad, promedioBimestral });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
