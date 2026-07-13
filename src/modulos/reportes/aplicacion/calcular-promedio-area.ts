import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import {
  calcularPromedioCurso,
  PromedioCurso,
  PromedioPorUnidad,
} from "@/modulos/reportes/aplicacion/calcular-promedio-curso";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface PromedioArea {
  areaId: string;
  cursos: PromedioCurso[];
  promediosPorUnidad: PromedioPorUnidad[];
  promedioBimestral: number | null;
}

export interface CalcularPromedioAreaDTO {
  estudianteId: string;
  areaId: string;
  periodoId: string;
}

function promedio(valores: number[]): number | null {
  return valores.length ? valores.reduce((suma, v) => suma + v, 0) / valores.length : null;
}

export async function calcularPromedioArea(
  datos: CalcularPromedioAreaDTO,
  cursoRepositorio: ICursoRepositorio,
  notaRepositorio: INotaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio,
  unidadDidacticaRepositorio: IUnidadDidacticaRepositorio
): Promise<Result<PromedioArea>> {
  try {
    const cursosDelArea = await cursoRepositorio.listarPorArea(datos.areaId);

    const cursos: PromedioCurso[] = [];
    for (const curso of cursosDelArea) {
      const resultado = await calcularPromedioCurso(
        { estudianteId: datos.estudianteId, cursoId: curso.id, periodoId: datos.periodoId },
        notaRepositorio,
        asignacionRepositorio,
        unidadDidacticaRepositorio
      );
      if (resultado.ok) cursos.push(resultado.value);
    }

    const unidades = await unidadDidacticaRepositorio.listarPorPeriodo(datos.periodoId);

    const promediosPorUnidad: PromedioPorUnidad[] = unidades.map((unidad) => {
      const valoresDeLosCursos = cursos
        .map((c) => c.promediosPorUnidad.find((p) => p.unidadDidacticaId === unidad.id)?.promedio ?? null)
        .filter((v): v is number => v !== null);
      return { unidadDidacticaId: unidad.id, promedio: promedio(valoresDeLosCursos) };
    });

    const promedioBimestral = promedio(
      promediosPorUnidad.map((p) => p.promedio).filter((v): v is number => v !== null)
    );

    return ok({ areaId: datos.areaId, cursos, promediosPorUnidad, promedioBimestral });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
