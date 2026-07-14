"use server";

import { requerirSesion } from "@/compartido/lib/autorizacion";
import { BloqueHorarioRepositorioMongo } from "@/modulos/horarios/infraestructura/bloque-horario-repositorio-mongo";
import { AsignacionRepositorioMongo } from "@/modulos/asignaciones/infraestructura/asignacion-repositorio-mongo";
import { listarBloquesHorarioPorProfesor } from "@/modulos/horarios/aplicacion/listar-bloques-horario-por-profesor";
import { crearBloqueHorario } from "@/modulos/horarios/aplicacion/crear-bloque-horario";
import { moverBloqueHorario } from "@/modulos/horarios/aplicacion/mover-bloque-horario";
import { eliminarBloqueHorario } from "@/modulos/horarios/aplicacion/eliminar-bloque-horario";
import { BloqueHorarioProps } from "@/modulos/horarios/dominio/bloque-horario";
import { DiaSemana } from "@/config/constantes";

export interface CrearBloqueHorarioInput {
  asignacionId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export interface MoverBloqueHorarioInput {
  id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export async function accionListarMiHorario(): Promise<BloqueHorarioProps[]> {
  const sesion = await requerirSesion();
  if (!sesion) return [];
  const profesorId = sesion.id;
  const repositorio = new BloqueHorarioRepositorioMongo();
  const resultado = await listarBloquesHorarioPorProfesor(profesorId, repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((b) => b.toPlainObject());
}

export async function accionCrearBloqueHorario(datos: CrearBloqueHorarioInput): Promise<{ ok: boolean; mensaje: string }> {
  const sesion = await requerirSesion();
  if (!sesion) return { ok: false, mensaje: "No autorizado" };
  const profesorId = sesion.id;

  const repositorio = new BloqueHorarioRepositorioMongo();
  const asignacionRepo = new AsignacionRepositorioMongo();
  const resultado = await crearBloqueHorario({ ...datos, profesorId }, repositorio, asignacionRepo);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Clase agregada al horario" };
}

export async function accionMoverBloqueHorario(datos: MoverBloqueHorarioInput): Promise<{ ok: boolean; mensaje: string }> {
  const sesion = await requerirSesion();
  if (!sesion) return { ok: false, mensaje: "No autorizado" };
  const profesorId = sesion.id;

  const repositorio = new BloqueHorarioRepositorioMongo();
  const resultado = await moverBloqueHorario({ ...datos, profesorId }, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Horario actualizado" };
}

export async function accionEliminarBloqueHorario(id: string): Promise<{ ok: boolean; mensaje: string }> {
  const sesion = await requerirSesion();
  if (!sesion) return { ok: false, mensaje: "No autorizado" };
  const profesorId = sesion.id;

  const repositorio = new BloqueHorarioRepositorioMongo();
  const resultado = await eliminarBloqueHorario(id, profesorId, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Clase quitada del horario" };
}
