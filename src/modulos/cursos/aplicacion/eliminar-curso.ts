import { ICursoRepositorio } from "@/modulos/cursos/aplicacion/i-curso-repositorio";
import { IUnidadDidacticaRepositorio } from "@/modulos/unidades-didacticas/aplicacion/i-unidad-didactica-repositorio";
import { IAsignacionRepositorio } from "@/modulos/asignaciones/aplicacion/i-asignacion-repositorio";
import { CursoNoEncontradoError, CursoEnUsoError } from "@/modulos/cursos/dominio/curso";
import { Result, ok, err } from "@/compartido/lib/result";

export async function eliminarCurso(
  id: string,
  repositorio: ICursoRepositorio,
  unidadDidacticaRepositorio: IUnidadDidacticaRepositorio,
  asignacionRepositorio: IAsignacionRepositorio
): Promise<Result<void>> {
  const curso = await repositorio.buscarPorId(id);
  if (!curso) return err(new CursoNoEncontradoError(id));

  // Ni Unidades Didácticas ni Asignaciones tienen un "eliminarPorCurso" en
  // cascada — borrar el curso dejaría esos registros huérfanos (cursoId sin
  // resolver). En vez de cascadear (arriesgaría notas/asistencia ya
  // registradas), bloqueamos el borrado, igual que ya se hace con el
  // periodo cuando tiene unidades abiertas.
  const [unidades, asignaciones] = await Promise.all([
    unidadDidacticaRepositorio.listar(),
    asignacionRepositorio.listar(),
  ]);
  const enUso =
    unidades.some((u) => u.cursoId === id) || asignaciones.some((a) => a.cursoId === id);
  if (enUso) return err(new CursoEnUsoError());

  await repositorio.eliminar(id);
  return ok(undefined);
}
