"use server";

import { AreaRepositorioMongo } from "@/modulos/areas/infraestructura/area-repositorio-mongo";
import { listarAreas } from "@/modulos/areas/aplicacion/listar-areas";
import { crearArea, CrearAreaDTO } from "@/modulos/areas/aplicacion/crear-area";
import { actualizarArea, ActualizarAreaDTO } from "@/modulos/areas/aplicacion/actualizar-area";
import { eliminarArea } from "@/modulos/areas/aplicacion/eliminar-area";
import { AreaProps } from "@/modulos/areas/dominio/area";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarAreas(): Promise<AreaProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new AreaRepositorioMongo();
  const resultado = await listarAreas(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((a) => a.toPlainObject());
}

export async function accionCrearArea(datos: CrearAreaDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new AreaRepositorioMongo();
  const resultado = await crearArea(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Área creada correctamente" };
}

export async function accionActualizarArea(datos: ActualizarAreaDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new AreaRepositorioMongo();
  const resultado = await actualizarArea(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Área actualizada correctamente" };
}

export async function accionEliminarArea(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new AreaRepositorioMongo();
  const resultado = await eliminarArea(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Área eliminada correctamente" };
}
