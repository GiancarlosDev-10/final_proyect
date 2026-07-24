import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { IPeriodoRepositorio } from "@/modulos/periodos/aplicacion/i-periodo-repositorio";
import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { UnidadDidactica } from "@/modulos/unidades-didacticas/dominio/unidad-didactica";
import { PeriodoNoEncontradoError } from "@/modulos/periodos/dominio/periodo";
import { generarUnidadesDidacticas } from "@/modulos/unidades-didacticas/aplicacion/generar-unidades-didacticas";
import { Result, ok, err } from "@/compartido/lib/result";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface GenerarUnidadesDidacticasPeriodoDTO {
  periodoId: string;
}

/**
 * Genera Unidad 1 y Unidad 2 para TODOS los cursos activos en un periodo de
 * una sola vez, en vez de repetir "Generar para un curso" curso por curso.
 * Reusa generarUnidadesDidacticas (idempotente por curso+periodo), así que
 * correrlo de nuevo sobre un periodo ya generado solo completa lo que falte.
 */
export async function generarUnidadesDidacticasPeriodo(
  datos: GenerarUnidadesDidacticasPeriodoDTO,
  cursoRepositorio: ICursoRepositorio,
  unidadRepositorio: IUnidadDidacticaRepositorio,
  periodoRepositorio: IPeriodoRepositorio
): Promise<Result<UnidadDidactica[]>> {
  try {
    const periodo = await periodoRepositorio.buscarPorId(datos.periodoId);
    if (!periodo) return err(new PeriodoNoEncontradoError(datos.periodoId));

    const cursos = await cursoRepositorio.listar();
    const generadas: UnidadDidactica[] = [];

    for (const curso of cursos.filter((c) => c.activo)) {
      const resultado = await generarUnidadesDidacticas(
        { cursoId: curso.id, periodoId: datos.periodoId },
        unidadRepositorio,
        periodoRepositorio
      );
      if (!resultado.ok) return err(resultado.error);
      generadas.push(...resultado.value);
    }

    return ok(generadas);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
