"use server";

import { SeccionRepositorioMongo } from "@/modulos/secciones/infraestructura/seccion-repositorio-mongo";
import { listarSecciones } from "@/modulos/secciones/aplicacion/listar-secciones";
import { crearSeccion, CrearSeccionDTO } from "@/modulos/secciones/aplicacion/crear-seccion";
import { actualizarSeccion, ActualizarSeccionDTO } from "@/modulos/secciones/aplicacion/actualizar-seccion";
import { eliminarSeccion } from "@/modulos/secciones/aplicacion/eliminar-seccion";
import { SeccionProps } from "@/modulos/secciones/dominio/seccion";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarSecciones(): Promise<SeccionProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new SeccionRepositorioMongo();
  const resultado = await listarSecciones(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((s) => s.toPlainObject());
}

export async function accionCrearSeccion(datos: CrearSeccionDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new SeccionRepositorioMongo();
  const resultado = await crearSeccion(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Sección creada correctamente" };
}

export async function accionActualizarSeccion(datos: ActualizarSeccionDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new SeccionRepositorioMongo();
  const resultado = await actualizarSeccion(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Sección actualizada correctamente" };
}

export async function accionEliminarSeccion(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new SeccionRepositorioMongo();
  const resultado = await eliminarSeccion(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Sección eliminada correctamente" };
}
