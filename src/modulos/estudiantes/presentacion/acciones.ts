"use server";

import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { listarEstudiantes } from "@/modulos/estudiantes/aplicacion/listar-estudiantes";
import { crearEstudiante, CrearEstudianteDTO } from "@/modulos/estudiantes/aplicacion/crear-estudiante";
import { actualizarEstudiante, ActualizarEstudianteDTO } from "@/modulos/estudiantes/aplicacion/actualizar-estudiante";
import { eliminarEstudiante } from "@/modulos/estudiantes/aplicacion/eliminar-estudiante";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarEstudiantes(): Promise<EstudianteProps[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  const repositorio = new EstudianteRepositorioMongo();
  const resultado = await listarEstudiantes(repositorio);
  if (!resultado.ok) return [];
  return resultado.value.map((e) => e.toPlainObject());
}

export async function accionCrearEstudiante(datos: CrearEstudianteDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new EstudianteRepositorioMongo();
  const resultado = await crearEstudiante(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Estudiante creado correctamente" };
}

export async function accionActualizarEstudiante(datos: ActualizarEstudianteDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new EstudianteRepositorioMongo();
  const resultado = await actualizarEstudiante(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Estudiante actualizado correctamente" };
}

export async function accionEliminarEstudiante(id: string): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new EstudianteRepositorioMongo();
  const resultado = await eliminarEstudiante(id, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Estudiante eliminado correctamente" };
}
