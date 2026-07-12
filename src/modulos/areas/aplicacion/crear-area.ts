import { IAreaRepositorio } from "@/modulos/areas/aplicacion/i-area-repositorio";
import { Area } from "@/modulos/areas/dominio/area";
import { Result, ok, err } from "@/compartido/lib/result";
import { generarId } from "@/compartido/lib/uuid";
import { ErrorDominio } from "@/compartido/dominio/errores";

export interface CrearAreaDTO {
  nombre: string;
  descripcion?: string;
}

export async function crearArea(
  datos: CrearAreaDTO,
  repositorio: IAreaRepositorio
): Promise<Result<Area>> {
  try {
    const ahora = new Date().toISOString();

    const area = new Area({
      id: generarId("ARE"),
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      activo: true,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });

    await repositorio.crear(area);
    return ok(area);
  } catch (e) {
    return err(e as ErrorDominio);
  }
}
