"use server";

import { EstudianteRepositorioMongo } from "@/modulos/estudiantes/infraestructura/estudiante-repositorio-mongo";
import { MatriculaRepositorioMongo } from "@/modulos/matriculas/infraestructura/matricula-repositorio-mongo";
import { listarEstudiantesPorSeccion, EstudianteResumen } from "@/modulos/estudiantes/aplicacion/listar-estudiantes-por-seccion";
import { crearEstudiante, CrearEstudianteDTO } from "@/modulos/estudiantes/aplicacion/crear-estudiante";
import { crearEstudianteEnSeccion, CrearEstudianteEnSeccionDTO } from "@/modulos/estudiantes/aplicacion/crear-estudiante-en-seccion";
import { actualizarEstudiante, ActualizarEstudianteDTO } from "@/modulos/estudiantes/aplicacion/actualizar-estudiante";
import { eliminarEstudiante } from "@/modulos/estudiantes/aplicacion/eliminar-estudiante";
import { EstudianteProps } from "@/modulos/estudiantes/dominio/estudiante";
import { requerirRol } from "@/compartido/lib/autorizacion";
import { ROLES } from "@/config/constantes";

export async function accionListarEstudiantesPorSeccion(seccionId: string): Promise<EstudianteResumen[]> {
  if (!(await requerirRol(ROLES.ADMIN))) return [];
  return listarEstudiantesPorSeccion(seccionId, {
    matriculaRepo: new MatriculaRepositorioMongo(),
    estudianteRepo: new EstudianteRepositorioMongo(),
  });
}

export async function accionObtenerEstudiante(id: string): Promise<EstudianteProps | null> {
  if (!(await requerirRol(ROLES.ADMIN))) return null;
  const repositorio = new EstudianteRepositorioMongo();
  const estudiante = await repositorio.buscarPorId(id);
  return estudiante ? estudiante.toPlainObject() : null;
}

export async function accionCrearEstudiante(datos: CrearEstudianteDTO): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const repositorio = new EstudianteRepositorioMongo();
  const resultado = await crearEstudiante(datos, repositorio);
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Estudiante creado correctamente" };
}

export async function accionCrearEstudianteEnSeccion(
  datos: CrearEstudianteEnSeccionDTO
): Promise<{ ok: boolean; mensaje: string }> {
  if (!(await requerirRol(ROLES.ADMIN))) return { ok: false, mensaje: "No autorizado" };
  const resultado = await crearEstudianteEnSeccion(datos, {
    estudianteRepo: new EstudianteRepositorioMongo(),
    matriculaRepo: new MatriculaRepositorioMongo(),
  });
  if (!resultado.ok) return { ok: false, mensaje: resultado.error.message };
  return { ok: true, mensaje: "Estudiante creado y matriculado correctamente" };
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
