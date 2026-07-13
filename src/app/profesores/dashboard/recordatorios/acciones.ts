"use server";

import { auth } from "@/auth";
import { RecordatorioRepositorioMongo } from "@/modulos/recordatorios/infraestructura/recordatorio-repositorio-mongo";
import { listarRecordatoriosPorProfesor } from "@/modulos/recordatorios/aplicacion/listar-recordatorios-por-profesor";
import { crearRecordatorio } from "@/modulos/recordatorios/aplicacion/crear-recordatorio";
import { actualizarRecordatorio } from "@/modulos/recordatorios/aplicacion/actualizar-recordatorio";
import { eliminarRecordatorio } from "@/modulos/recordatorios/aplicacion/eliminar-recordatorio";
import { moverRecordatorio } from "@/modulos/recordatorios/aplicacion/mover-recordatorio";
import { RecordatorioProps } from "@/modulos/recordatorios/dominio/recordatorio";
import { TipoRecordatorio } from "@/config/constantes";

export interface CrearRecordatorioInput {
  fecha: string;
  titulo: string;
  descripcion?: string;
  tipo: TipoRecordatorio;
}

export interface ActualizarRecordatorioInput extends CrearRecordatorioInput {
  id: string;
}

export interface MoverRecordatorioInput {
  id: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
}

export async function accionListarMisRecordatorios(): Promise<RecordatorioProps[]> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return [];
  const repositorio = new RecordatorioRepositorioMongo();
  const resultado = await listarRecordatoriosPorProfesor(profesorId, repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((r) => r.toPlainObject());
}

export async function accionCrearRecordatorio(datos: CrearRecordatorioInput): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new RecordatorioRepositorioMongo();
  const resultado = await crearRecordatorio({ ...datos, profesorId }, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Recordatorio creado correctamente" };
}

export async function accionActualizarRecordatorio(datos: ActualizarRecordatorioInput): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new RecordatorioRepositorioMongo();
  const resultado = await actualizarRecordatorio({ ...datos, profesorId }, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Recordatorio actualizado correctamente" };
}

export async function accionMoverRecordatorio(datos: MoverRecordatorioInput): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new RecordatorioRepositorioMongo();
  const resultado = await moverRecordatorio({ ...datos, profesorId }, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Recordatorio movido" };
}

export async function accionEliminarRecordatorio(id: string): Promise<{ ok: boolean; mensaje: string }> {
  const session = await auth();
  const profesorId = session?.user?.id;
  if (!profesorId) return { ok: false, mensaje: "No autorizado" };

  const repositorio = new RecordatorioRepositorioMongo();
  const resultado = await eliminarRecordatorio(id, profesorId, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Recordatorio eliminado correctamente" };
}
