import { IAreaRepositorio } from "@/modulos/areas/aplicacion/i-area-repositorio";
import { Area, AreaNoEncontradaError } from "@/modulos/areas/dominio/area";
import { Result, ok, err } from "@/compartido/lib/result";

export interface ActualizarAreaDTO {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export async function actualizarArea(
  datos: ActualizarAreaDTO,
  repositorio: IAreaRepositorio
): Promise<Result<Area>> {
  const area = await repositorio.buscarPorId(datos.id);
  if (!area) return err(new AreaNoEncontradaError(datos.id));

  const ahora = new Date().toISOString();

  const areaActualizada = new Area({
    id: area.id,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    activo: datos.activo,
    creadoEn: area.creadoEn,
    actualizadoEn: ahora,
  });

  await repositorio.actualizar(areaActualizada);
  return ok(areaActualizada);
}
