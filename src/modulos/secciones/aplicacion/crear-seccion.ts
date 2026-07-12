import { ISeccionRepositorio } from "@/modulos/secciones/aplicacion/i-seccion-repositorio";
import { Seccion } from "@/modulos/secciones/dominio/seccion";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface CrearSeccionDTO {
  nombre: string;
  grado: string;
  anio: number;
}

export async function crearSeccion(
  datos: CrearSeccionDTO,
  repositorio: ISeccionRepositorio
): Promise<Result<Seccion>> {
  try {
    const ahora = new Date().toISOString();

    const seccion = new Seccion({
      id: generarId("SEC"),
      nombre: datos.nombre,
      grado: datos.grado,
      anio: datos.anio,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(seccion);
    return ok(seccion);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}