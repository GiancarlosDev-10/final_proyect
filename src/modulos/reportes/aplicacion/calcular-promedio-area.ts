import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { INotaRepositorio } from "@/modulos/notas/aplicacion/i-nota-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { calcularPromedioCurso, PromedioCurso } from "@/modulos/reportes/aplicacion/calcular-promedio-curso";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

// Cada curso genera sus propias Unidad 1 / Unidad 2 (con su propio id), así
// que a nivel área no se puede agregar por unidadDidacticaId: se agrega por
// "orden" (1 y 2), que es el mismo para todos los cursos de un bimestre.
const ORDENES_DE_UNIDAD = [1, 2] as const;

export interface PromedioPorOrdenDeUnidad {
  orden: number;
  promedio: number | null;
}

export interface PromedioArea {
  areaId: string;
  cursos: PromedioCurso[];
  promediosPorUnidad: PromedioPorOrdenDeUnidad[];
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

    const promediosPorUnidad: PromedioPorOrdenDeUnidad[] = ORDENES_DE_UNIDAD.map((orden) => {
      const valoresDeLosCursos = cursos
        .map((c) => c.promediosPorUnidad.find((p) => p.orden === orden)?.promedio ?? null)
        .filter((v): v is number => v !== null);
      return { orden, promedio: promedio(valoresDeLosCursos) };
    });

    const promedioBimestral = promedio(
      promediosPorUnidad.map((p) => p.promedio).filter((v): v is number => v !== null)
    );

    return ok({ areaId: datos.areaId, cursos, promediosPorUnidad, promedioBimestral });
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
