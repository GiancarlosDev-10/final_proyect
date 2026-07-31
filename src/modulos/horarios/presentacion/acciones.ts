"use server";

import { requerirRol } from "@/compartido/lib/autorizacion";
import { BloqueHorarioRepositorioMongo } from "@/modulos/horarios/infraestructura/bloque-horario-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { crearBloqueHorario, CrearBloqueHorarioDTO } from "@/modulos/horarios/aplicacion/crear-bloque-horario";
import { eliminarBloqueHorario } from "@/modulos/horarios/aplicacion/eliminar-bloque-horario";
import { BloqueHorarioProps } from "@/modulos/horarios/dominio/bloque-horario";
import { ROLES } from "@/config/constantes";

export async function accionListarBloquesHorarioPorAsignaciones(asignacionIds: string[]): Promise<BloqueHorarioProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new BloqueHorarioRepositorioMongo();
  const bloques = await repositorio.listarPorAsignaciones(asignacionIds);
  return bloques.map((b) => b.toPlainObject());
}

export async function accionCrearBloqueHorarioAdmin(datos: CrearBloqueHorarioDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new BloqueHorarioRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const resultado = await crearBloqueHorario(datos, repositorio, asignacionRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Horario agregado correctamente" };
}

export async function accionEliminarBloqueHorarioAdmin(datos: { id: string; profesorId: string }): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new BloqueHorarioRepositorioMongo();
  const resultado = await eliminarBloqueHorario(datos.id, datos.profesorId, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Horario eliminado correctamente" };
}
