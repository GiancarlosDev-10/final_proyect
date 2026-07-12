import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { Seccion, SeccionNoEncontradaError } from "@/modulos/secciones/dominio/seccion";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarSeccionDTO {
  id: string;
  nombre: string;
  grado: string;
  anio: number;
  activo: boolean;
}

export async function actualizarSeccion(
  datos: ActualizarSeccionDTO,
  repositorio: ISeccionRepositorio
): Promise<Result<Seccion>> {
  const seccion = await repositorio.buscarPorId(datos.id);
  if (!seccion) return err(new SeccionNoEncontradaError(datos.id));

  const ahora = new Date().toISOString();

  const seccionActualizada = new Seccion({
    id: seccion.id,
    nombre: datos.nombre,
    grado: datos.grado,
    anio: datos.anio,
    activo: datos.activo,
    creadoEn: seccion.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(seccionActualizada);
  return ok(seccionActualizada);
}